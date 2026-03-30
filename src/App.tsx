/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Download, 
  FileVideo, 
  FileAudio, 
  CheckCircle2, 
  Loader2, 
  Sparkles, 
  User, 
  Settings, 
  History,
  Play,
  Maximize2,
  Volume2
} from 'lucide-react';

type AppState = 'idle' | 'processing' | 'done';

interface SrtBlock {
  id: number;
  start: string;
  end: string;
  text: string;
  durationMs: number;
}

export default function App() {
  const [state, setState] = useState<AppState>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [result, setResult] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('Esperando archivo...');
  const [previewText, setPreviewText] = useState('Sube tu archivo y deja que MochixSub haga el resto 🍡');
  const [blocks, setBlocks] = useState<SrtBlock[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);

  // Clean up media URL when file changes
  useEffect(() => {
    return () => {
      if (mediaUrl) URL.revokeObjectURL(mediaUrl);
    };
  }, [mediaUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      const url = URL.createObjectURL(selectedFile);
      setMediaUrl(url);
      
      setState('idle');
      setProgress(0);
      setResult('');
      setBlocks([]);
      setPreviewText('Archivo cargado. ¡Listos para transcribir! 🍡');
    }
  };

  const processFile = async () => {
    if (!file) return;
    
    setState('processing');
    setProgress(10);
    setPhase("Subiendo archivo...");
    setPreviewText("MochixSub está escuchando cada detalle... 🍡");

    const formData = new FormData();
    formData.append('file', file);

    try {
        // Simulated progress while waiting for backend
        const progInterval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 90) return prev;
            return prev + (90 - prev) * 0.1;
          });
        }, 1000);

        const response = await fetch('http://localhost:3005/transcribe', {
            method: 'POST',
            body: formData,
        });

        clearInterval(progInterval);

        if (!response.ok) throw new Error('Error en el servidor');

        const data = await response.json();
        
        // Parse Whisper format: [00:00:01.000 -> 00:00:04.000]  text
        const parsedBlocks: SrtBlock[] = (data.lines || []).map((line: string, i: number) => {
          // Whisper often outputs lines with timestamps
          const match = line.match(/\[(\d{2}:\d{2}:\d{2}\.\d{3})\s*->\s*(\d{2}:\d{2}:\d{2}\.\d{3})\]\s+(.*)/);
          if (match) {
            const [_, startStr, endStr, text] = match;
            // Convert whisper dot to srt comma: 00:00:01.000 -> 00:00:01,000
            const srtStart = startStr.replace('.', ',');
            const srtEnd = endStr.replace('.', ',');
            
            // Calculate duration in ms
            const [sh, sm, ss] = startStr.split(':').map(val => parseFloat(val));
            const [eh, em, es] = endStr.split(':').map(val => parseFloat(val));
            const startSecs = (sh * 3600) + (sm * 60) + ss;
            const endSecs = (eh * 3600) + (em * 60) + es;

            return {
              id: i + 1,
              start: srtStart,
              end: srtEnd,
              text: text.trim(),
              durationMs: Math.max(100, (endSecs - startSecs) * 1000)
            };
          }
          // Fallback if no timestamp found
          return {
            id: i + 1,
            start: "00:00:00,000",
            end: "00:00:03,000",
            text: line.trim(),
            durationMs: 3000
          };
        });

        setResult(data.text || "");
        setBlocks(parsedBlocks);
        setProgress(100);
        setState('done');
        setPhase("¡Transcripción completada!");
        setPreviewText(data.text?.substring(0, 100) + "...");

    } catch (error) {
        console.error(error);
        setState('idle');
        alert("El backend no respondió. Asegúrate de que esté corriendo en el puerto 3005.");
    }
  };

  const togglePlay = () => {
    if (!mediaRef.current) return;
    if (isPlaying) {
      mediaRef.current.pause();
    } else {
      mediaRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (mediaRef.current) {
      setCurrentTime(mediaRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (mediaRef.current) {
      setDuration(mediaRef.current.duration);
    }
  };

  const downloadSrt = () => {
    if (!result) return;
    const srtContent = blocks.length > 0 
      ? blocks.map(b => `${b.id}\n${b.start} --> ${b.end}\n${b.text}\n`).join('\n')
      : `1\n00:00:00,000 --> 00:00:30,000\n${result}`;
      
    const blob = new Blob([srtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = file ? file.name.split('.')[0] : 'transcription';
    a.download = `${filename}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      setFile(selectedFile);
      setMediaUrl(URL.createObjectURL(selectedFile));
      setState('idle');
    }
  };

  return (
    <div className="h-screen w-screen bg-[#0a0a0c] text-[#f3f4f6] font-sans flex flex-col overflow-hidden">
      {/* Navbar Premium */}
      <nav className="h-16 w-full border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between px-8 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-xl">🍡</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">MochixSub</h1>
            <span className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase">Premium Edition</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <button className="text-sm font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-2">
            <History className="w-4 h-4" />
            Historial
          </button>
          <button className="text-sm font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Config
          </button>
          <div className="h-10 w-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors">
            <User className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex w-full p-6 gap-6 overflow-hidden">
        
        {/* Panel Izquierdo: Entrada */}
        <aside className="w-[340px] flex flex-col gap-6 shrink-0">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl flex-1 flex flex-col backdrop-blur-md">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-6">Archivo Origen</h2>
            
            <div
              onDragOver={onDragOver}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-500
                ${file ? 'border-indigo-500 bg-indigo-500/5 shadow-[inset_0_0_20px_rgba(99,102,241,0.1)]' : 'border-white/10 hover:border-white/30 hover:bg-white/5 bg-black/20'}
              `}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden" 
                accept="video/*,audio/*"
              />
              
              <motion.div 
                animate={file ? { scale: 1.1, rotate: [0, -5, 5, 0] } : { scale: 1 }}
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-xl ${file ? 'bg-indigo-500 text-white' : 'bg-white/5 text-gray-500'}`}
              >
                {file ? (
                  file.type.startsWith('video') ? <FileVideo className="w-8 h-8" /> : <FileAudio className="w-8 h-8" />
                ) : (
                  <Upload className="w-8 h-8" />
                )}
              </motion.div>
              
              <div className="space-y-2">
                <p className="text-sm font-bold text-white break-all leading-tight px-4 text-balance">
                  {file ? file.name : "Suelta tus archivos aquí"}
                </p>
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">
                  {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : "Video o Audio Local"}
                </p>
              </div>
            </div>

            <button
              onClick={processFile}
              disabled={!file || state === 'processing'}
              className={`
                mt-6 w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 active:scale-95
                ${!file || state === 'processing' 
                  ? 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5' 
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] shadow-xl'}
              `}
            >
              {state === 'processing' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Transcribiendo...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Procesar con IA</span>
                </>
              )}
            </button>
          </div>
        </aside>

        {/* Panel Central: Previsualización Real */}
        <section className="flex-1 flex flex-col gap-6 overflow-hidden">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-1 shadow-2xl flex-1 flex flex-col overflow-hidden relative group">
            
            {/* Overlay de Estado */}
            <div className="absolute top-6 left-8 right-8 flex items-center justify-between z-20 pointer-events-none">
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${state === 'done' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : state === 'processing' ? 'bg-amber-500 animate-pulse' : 'bg-white/20'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">
                            {state === 'idle' ? 'Listo' : state === 'processing' ? 'Escuchando' : 'Completado'}
                        </span>
                    </div>
                </div>

                {state === 'processing' && (
                  <div className="flex items-center gap-4 px-5 py-2 bg-indigo-500/20 backdrop-blur-md rounded-full border border-indigo-500/30">
                    <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-indigo-400 to-purple-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-black text-indigo-300 tabular-nums">{Math.round(progress)}%</span>
                  </div>
                )}
            </div>

            {/* Area de Visualización */}
            <div className="flex-1 bg-black rounded-[2.5rem] relative overflow-hidden flex items-center justify-center border border-white/5">
              
              {mediaUrl ? (
                <>
                  {file?.type.startsWith('video') ? (
                    <video 
                      ref={mediaRef as React.RefObject<HTMLVideoElement>}
                      src={mediaUrl}
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      className="w-full h-full object-contain"
                      onClick={togglePlay}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-8">
                       <audio 
                         ref={mediaRef as React.RefObject<HTMLAudioElement>}
                         src={mediaUrl}
                         onTimeUpdate={handleTimeUpdate}
                         onLoadedMetadata={handleLoadedMetadata}
                         className="hidden"
                       />
                       <div className="w-48 h-48 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/20 relative">
                            <div className="absolute inset-0 bg-indigo-500/5 rounded-full animate-ping" />
                            <FileAudio className="w-20 h-20 text-indigo-500" />
                       </div>
                       <div className="space-y-2 text-center">
                            <p className="text-xl font-bold text-white">Modo Audio</p>
                            <p className="text-sm text-gray-500 font-medium">Visualización simplificada activa</p>
                       </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center gap-6 opacity-30">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                        <Upload className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-sm font-bold uppercase tracking-[0.3em] text-white">Nessuna Sorgente</p>
                </div>
              )}

              {/* Subtitles Overlay */}
              {state === 'done' && result && (
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-4/5 text-center pointer-events-none z-30">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-black/80 backdrop-blur-xl px-8 py-4 rounded-2xl border border-white/10 shadow-2xl"
                  >
                    <p className="text-xl font-bold text-white line-clamp-2 leading-snug">
                       {result.length > 150 ? result.substring(0, 150) + "..." : result}
                    </p>
                  </motion.div>
                </div>
              )}

              {/* Custom Controls Bar */}
              <div className="absolute bottom-6 left-6 right-6 h-16 bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 flex items-center justify-between px-6 z-40 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <div className="flex items-center gap-6 w-full">
                  <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform">
                    {isPlaying ? <div className="w-3 h-3 bg-black flex gap-0.5"><div className="w-1 h-3 bg-black" /><div className="w-1 h-3 bg-black" /></div> : <Play size={18} fill="black" className="ml-1" />}
                  </button>
                  
                  <div className="flex-1 flex flex-col gap-1">
                      <div className="flex justify-between text-[10px] font-bold text-gray-400 tabular-nums">
                        <span>{new Date(currentTime * 1000).toISOString().substr(14, 5)}</span>
                        <span>{new Date(duration * 1000).toISOString().substr(14, 5)}</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full relative overflow-hidden group/bar cursor-pointer">
                        <div 
                           className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                           style={{ width: `${(currentTime / duration) * 100}%` }}
                        />
                      </div>
                  </div>

                  <div className="flex items-center gap-4 ml-2">
                    <Volume2 className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
                    <Maximize2 className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Panel Derecho: Editor SRT */}
        <aside className="w-[380px] flex flex-col gap-6 shrink-0">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl flex-1 flex flex-col overflow-hidden backdrop-blur-md">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-6">Transcripción Final</h2>
            
            <div className={`
              flex-1 bg-black/40 rounded-2xl border overflow-hidden flex flex-col transition-all duration-500 shadow-inner
              ${state === 'done' ? 'border-indigo-500/30' : 'border-white/5'}
            `}>
              <div className="h-10 border-b border-white/5 px-4 flex items-center justify-between shrink-0 bg-white/5">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Editor de texto</span>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/20" />
                </div>
              </div>
              
              <textarea
                value={result || (state === 'processing' ? `Analizando audio "${file?.name}"...\n\nPor favor espera mientras nuestra IA\nprocesa el contenido localmente.` : '')}
                onChange={(e) => setResult(e.target.value)}
                placeholder="// La transcripción aparecerá aquí..."
                className={`
                  flex-1 w-full bg-transparent p-6 text-sm font-medium leading-relaxed text-gray-300 focus:outline-none resize-none scrollbar-thin scrollbar-thumb-white/10
                  ${!result ? 'opacity-30' : 'opacity-100'}
                `}
              />
            </div>

            <button
              onClick={downloadSrt}
              disabled={!result}
              className={`
                mt-6 w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 active:scale-95
                ${!result 
                  ? 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5' 
                  : 'bg-white text-black hover:bg-gray-200 shadow-xl'}
              `}
            >
              <Download className="w-5 h-5" />
              <span>Exportar Subtítulos</span>
            </button>
          </div>
        </aside>

      </main>

      {/* Glossy Footer */}
      <footer className="h-10 w-full flex items-center justify-center border-t border-white/5 bg-black/20 shrink-0">
        <p className="text-[10px] text-gray-400/40 font-black uppercase tracking-[0.5em]">
          Powered by local whisper engine • MochixSub 🐾
        </p>
      </footer>
    </div>
  );
}
