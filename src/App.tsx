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
  const [result, setResult] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('Esperando archivo...');
  const [previewText, setPreviewText] = useState('Sube tu archivo y deja que MochixSub haga el resto 🍡');
  const [blocks, setBlocks] = useState<SrtBlock[]>([]);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const subtitleInterval = useRef<NodeJS.Timeout | null>(null);

  // --- LÓGICA DE GENERACIÓN SRT REALISTA ---
  const generateSRT = (filename: string): { content: string, blocks: SrtBlock[] } => {
    const rawFrases = [
      "Iniciando el motor de reconocimiento acústico...",
      "Detectando patrones de voz y entonación...",
      `Procesando metadatos para: ${filename}`,
      "Analizando el espectro de audio en alta fidelidad...",
      "Sincronizando marcas de tiempo con precisión de milisegundos...",
      "Traduciendo vibraciones sonoras en texto estructurado...",
      "Aplicando corrección léxica y gramatical mediante IA...",
      "Finalizando la estructura del archivo SRT premium...",
      "Generación completada con éxito. Listo para exportar.",
      "MochixSub: Experiencia de subtitulado superior finalizada."
    ];

    const generateId = (i: number) => i + 1;
    const formatTime = (ms: number) => {
      const date = new Date(ms);
      const hh = String(date.getUTCHours()).padStart(2, '0');
      const mm = String(date.getUTCMinutes()).padStart(2, '0');
      const ss = String(date.getUTCSeconds()).padStart(2, '0');
      const msPart = String(date.getUTCMilliseconds()).padStart(3, '0');
      return `${hh}:${mm}:${ss},${msPart}`;
    };

    let currentTime = 500; // Iniciar a los 500ms
    const generatedBlocks: SrtBlock[] = [];
    let content = "";

    rawFrases.forEach((text, i) => {
      const duration = Math.floor(Math.random() * 1500) + 2000; // Entre 2s y 3.5s
      const start = formatTime(currentTime);
      const end = formatTime(currentTime + duration);
      
      const block: SrtBlock = {
        id: generateId(i),
        start,
        end,
        text,
        durationMs: duration
      };

      generatedBlocks.push(block);
      content += `${block.id}\n${block.start} --> ${block.end}\n${block.text}\n\n`;
      
      currentTime += duration + 500; // Pausa de medio segundo entre bloques
    });

    return { content: content.trim(), blocks: generatedBlocks };
  };

  // --- SIMULACIÓN DE PROGRESO NO LINEAL ---
  const startSimulation = () => {
    if (!file) return;
    
    setState('processing');
    setProgress(0);
    setResult('');
    setBlocks([]);
    setCurrentBlockIndex(0);

    const phases = [
      { max: 20, text: "Cargando archivo..." },
      { max: 50, text: "Analizando audio..." },
      { max: 80, text: "Generando subtítulos..." },
      { max: 100, text: "Finalizando..." }
    ];

    if (progressInterval.current) clearInterval(progressInterval.current);
    
    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          if (progressInterval.current) clearInterval(progressInterval.current);
          handleProcessDone();
          return 100;
        }

        // Incremento variable (más realista)
        const step = Math.random() * 3 + 0.5;
        const next = Math.min(prev + step, 100);

        // Actualizar fase según porcentaje
        const currentPhase = phases.find(p => next <= p.max) || phases[phases.length - 1];
        setPhase(currentPhase.text);

        return next;
      });
    }, 100);
  };

  const handleProcessDone = () => {
    const { content, blocks } = generateSRT(file?.name || "archivo");
    setResult(content);
    setBlocks(blocks);
    setState('done');
    setPhase("Listo 🍡 subtítulos generados");
  };

  // --- DINÁMICA DE PREVIEW (CAPTIONS) ---
  useEffect(() => {
    if (state === 'processing') {
      const texts = [
        "Escuchando el sonido...",
        "Calculando tiempos...",
        "Escribiendo líneas...",
        "MochixSub está trabajando para ti 🍡"
      ];
      let i = 0;
      const t = setInterval(() => {
        setPreviewText(texts[i % texts.length]);
        i++;
      }, 1500);
      return () => clearInterval(t);
    }

    if (state === 'done' && blocks.length > 0) {
      // Loop de subtítulos en el preview una vez terminado
      let index = 0;
      const showNext = () => {
        const block = blocks[index];
        setPreviewText(block.text);
        setCurrentBlockIndex(index);
        
        setTimeout(() => {
          index = (index + 1) % blocks.length;
          showNext();
        }, block.durationMs + 500);
      };

      showNext();
      return () => {}; // Cleanup complejo aquí se manejaría con refs si fuera necesario abortar
    }
    
    if (state === 'idle') {
      setPreviewText('Sube tu archivo y deja que MochixSub haga el resto 🍡');
    }
  }, [state, blocks]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setState('idle');
      setProgress(0);
      setResult('');
    }
  };

  const downloadSrt = () => {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = file ? file.name.split('.')[0] : 'subtitles';
    a.download = `subtitles-${filename}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setState('idle');
    }
  };

  return (
    <div className="h-screen w-screen bg-white text-[#111827] font-sans flex flex-col overflow-hidden">
      {/* Navbar */}
      <nav className="h-16 w-full border-b border-[#E5E7EB] flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#111827] rounded-lg flex items-center justify-center">
            <span className="text-white text-lg">🍡</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">MochixSub</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <button className="text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors flex items-center gap-2">
            <History className="w-4 h-4" />
            Historial
          </button>
          <button className="text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Ajustes
          </button>
          <div className="h-8 w-8 rounded-full bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center cursor-pointer hover:bg-[#E5E7EB] transition-colors">
            <User className="w-4 h-4 text-[#6B7280]" />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex w-full p-6 gap-6 overflow-hidden">
        
        {/* Panel Izquierdo: Entrada */}
        <aside className="w-[320px] flex flex-col gap-6 shrink-0">
          <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl p-6 shadow-sm flex-1 flex flex-col">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#6B7280] mb-4">Entrada</h2>
            
            <div
              onDragOver={onDragOver}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-300
                ${file ? 'border-[#111827] bg-white ring-4 ring-[#111827]/5' : 'border-[#E5E7EB] hover:border-[#6B7280] hover:bg-white bg-white/50'}
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
                animate={file ? { scale: 1.1 } : { scale: 1 }}
                className="w-12 h-12 bg-[#F3F4F6] rounded-full flex items-center justify-center mb-4 shadow-inner"
              >
                {file ? (
                  file.type.startsWith('video') ? <FileVideo className="w-6 h-6 text-[#111827]" /> : <FileAudio className="w-6 h-6 text-[#111827]" />
                ) : (
                  <Upload className="w-6 h-6 text-[#6B7280]" />
                )}
              </motion.div>
              
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[#111827] break-all px-2">
                  {file ? file.name : "Arrastra o selecciona un archivo"}
                </p>
                <p className="text-xs text-[#6B7280]">
                  {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : "MP4, MOV, MP3, WAV"}
                </p>
              </div>
            </div>

            <button
              onClick={startSimulation}
              disabled={!file || state === 'processing'}
              className={`
                mt-6 w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2
                ${!file || state === 'processing' 
                  ? 'bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed' 
                  : 'bg-[#111827] text-white hover:bg-[#1f2937] shadow-lg shadow-black/5 active:scale-95'}
              `}
            >
              {state === 'processing' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generar subtítulos
                </>
              )}
            </button>
          </div>
        </aside>

        {/* Panel Central: Previsualización */}
        <section className="flex-1 flex flex-col gap-6 overflow-hidden">
          <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl p-6 shadow-sm flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#6B7280]">Vista Previa</h2>
              
              <div className="flex items-center gap-3">
                {state === 'processing' && (
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-[#111827]"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-[#6B7280] tabular-nums">{Math.round(progress)}%</span>
                  </div>
                )}
                
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={state}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex items-center gap-2 px-3 py-1 bg-white border border-[#E5E7EB] rounded-full shadow-sm"
                  >
                    <div className={`w-2 h-2 rounded-full ${state === 'done' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : state === 'processing' ? 'bg-amber-500 animate-pulse' : 'bg-gray-300'}`} />
                    <span className="text-[10px] font-bold text-[#111827] uppercase tracking-tight">
                      {state === 'idle' ? 'En espera' : state === 'processing' ? 'Analizando' : 'Generado'}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="flex-1 bg-[#1a1a1a] rounded-xl relative overflow-hidden flex items-center justify-center group border border-[#2a2a2a] shadow-inner">
              {/* Mock Video Player Content */}
              <AnimatePresence mode="wait">
                <motion.div 
                  key={previewText}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="flex flex-col items-center gap-6 text-center px-12"
                >
                  {state === 'idle' && (
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-white/10 mb-2">
                      <FileVideo className="w-8 h-8 text-white/20" />
                    </div>
                  )}

                  {state === 'processing' && (
                    <Loader2 className="w-10 h-10 text-white/40 animate-spin mb-4" />
                  )}

                  {state === 'done' && (
                    <motion.div 
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="absolute top-8 bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full flex items-center gap-2 shadow-2xl"
                    >
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span className="text-xs font-medium text-white/90">Listo 🍡 subtítulos generados</span>
                    </motion.div>
                  )}

                  {/* Caption Display */}
                  <div className={`
                    ${state === 'done' ? 'mt-0' : 'space-y-2'}
                  `}>
                    <p className={`
                      text-white leading-relaxed font-medium transition-all duration-500
                      ${state === 'done' ? 'text-lg bg-black/60 px-6 py-3 rounded-lg backdrop-blur-sm border border-white/10' : 'text-lg text-white/80'}
                    `}>
                      {previewText}
                    </p>
                    {state === 'processing' && (
                      <p className="text-white/30 text-xs font-bold tracking-[0.2em] uppercase">{phase}</p>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Video Controls Overlay */}
              <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between px-6 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <div className="flex items-center gap-5">
                  <Play className="w-5 h-5 text-white fill-white cursor-pointer hover:scale-110 transition-transform" />
                  <Volume2 className="w-5 h-5 text-white cursor-pointer hover:scale-110 transition-transform" />
                  <div className="w-40 h-1.5 bg-white/20 rounded-full relative cursor-pointer overflow-hidden">
                    <motion.div 
                      className="absolute left-0 top-0 h-full bg-white rounded-full" 
                      initial={{ width: '0%' }}
                      animate={{ width: state === 'done' ? `${((currentBlockIndex + 1) / blocks.length) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
                <Maximize2 className="w-5 h-5 text-white cursor-pointer hover:scale-110 transition-transform" />
              </div>
            </div>
          </div>
        </section>

        {/* Panel Derecho: Resultados */}
        <aside className="w-[360px] flex flex-col gap-6 shrink-0">
          <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl p-6 shadow-sm flex-1 flex flex-col overflow-hidden">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#6B7280] mb-4">Editor SRT</h2>
            
            <div className={`
              flex-1 bg-[#1a1a1a] rounded-xl border overflow-hidden flex flex-col transition-all duration-500 shadow-xl
              ${state === 'done' ? 'border-green-500/30 ring-4 ring-green-500/5' : 'border-[#2a2a2a]'}
            `}>
              <div className="h-8 bg-[#2a2a2a] flex items-center px-4 justify-between shrink-0">
                <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">
                  {file ? `${file.name.split('.')[0]}.srt` : 'subtitles.srt'}
                </span>
                <div className="flex gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#f87171]/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#34d399]/20" />
                </div>
              </div>
              
              <textarea
                readOnly
                placeholder="// Esperando archivo para procesar..."
                value={result || (state === 'processing' ? `// FASE: ${phase.toUpperCase()}\n// PROGRESO: ${Math.round(progress)}%\n// GENERANDO CONTENIDO...` : '')}
                className={`
                  flex-1 w-full bg-transparent p-4 text-xs font-mono text-gray-300 focus:outline-none resize-none scrollbar-thin scrollbar-thumb-[#3a3a3a]
                  ${!result ? 'opacity-30' : 'opacity-100'}
                `}
              />
            </div>

            <button
              onClick={downloadSrt}
              disabled={!result}
              className={`
                mt-6 w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2
                ${!result 
                  ? 'bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed border border-[#E5E7EB]' 
                  : 'bg-white text-[#111827] border border-[#E5E7EB] hover:bg-[#F9FAFB] shadow-sm active:scale-95'}
              `}
            >
              <Download className="w-5 h-5" />
              Descargar paquete .srt
            </button>
          </div>
        </aside>

      </main>

      {/* Footer Decoration */}
      <div className="h-8 w-full flex items-center justify-center px-8 shrink-0">
        <p className="text-[10px] text-[#9CA3AF] uppercase tracking-[0.3em] font-medium">
          MochixSub Premium Subtitling Experience 🐾
        </p>
      </div>
    </div>
  );
}
