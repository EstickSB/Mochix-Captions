# MochixSub - Documentación Frontend

MochixSub es una aplicación de subtitulado automático con una interfaz de pantalla única, diseñada bajo principios de minimalismo premium y estética "Mochi" (sutilmente kawaii).

## 🚀 Tecnologías Utilizadas

- **React 19**: Biblioteca principal para la interfaz.
- **Tailwind CSS**: Framework de utilidades para el diseño visual y responsivo.
- **Lucide React**: Set de iconos minimalistas y consistentes.
- **Motion (Framer Motion)**: Biblioteca para animaciones y transiciones fluidas.
- **TypeScript**: Para garantizar la seguridad de tipos en toda la lógica.

---

## 🏗️ Estructura del Layout (Single-Screen)

La aplicación utiliza un contenedor de pantalla completa (`h-screen`, `w-screen`) con `overflow-hidden` para evitar el scroll vertical, aprovechando el espacio horizontal mediante un diseño de tres paneles.

### 1. Navbar (Barra Superior)
- **Logo**: Tipografía en negrita con un icono de dango (🍡) encerrado en un contenedor oscuro redondeado.
- **Navegación**: Enlaces rápidos a "Historial" y "Ajustes" con iconos lineales.
- **Perfil**: Avatar circular minimalista para la gestión de cuenta.

### 2. Panel Izquierdo (Entrada de Datos)
- **Card de Entrada**: Contenedor con fondo gris claro (`#F9FAFB`).
- **Drag & Drop**: Área con borde punteado que cambia de estado al detectar un archivo. Soporta formatos de video y audio.
- **Botón de Acción**: Botón principal con efecto de brillo (`Sparkles`) que inicia la simulación de procesamiento.

### 3. Panel Central (Previsualización y Estado)
- **Indicador de Progreso**: Barra de progreso animada que muestra el porcentaje real de la simulación (0-100%).
- **Badge de Estado**: Etiqueta dinámica que cambia de color según el proceso (En espera, Analizando, Generado).
- **Reproductor Mock**: Un rectángulo oscuro (`#1a1a1a`) que simula un reproductor de video.
  - **Overlay de Subtítulos**: Muestra una previsualización de cómo se verían los subtítulos sobre el video una vez terminados.
  - **Controles**: Barra de controles inferior que aparece al hacer hover, simulando Play, Volumen y Pantalla Completa.

### 4. Panel Derecho (Resultados y Edición)
- **Editor SRT**: Un área de texto (`textarea`) con fondo oscuro y fuente monoespaciada (`JetBrains Mono`).
  - **Scroll Interno**: Único elemento con scroll permitido para navegar por archivos SRT largos.
  - **Estética de Código**: Cabecera que simula una pestaña de archivo con botones de control decorativos.
- **Botón de Descarga**: Permite exportar el resultado final como un archivo `.srt` físico.

---

## 🧠 Lógica de Funcionamiento

### Gestión de Estados
Se utiliza un tipo `AppState` para manejar el flujo de la aplicación:
- `idle`: Estado inicial, esperando archivo.
- `processing`: Durante la simulación de análisis de IA.
- `done`: Cuando el resultado está listo para previsualizar y descargar.

### Simulación de Procesamiento
- **Progreso**: Un `setInterval` incrementa el porcentaje de progreso cada 100ms hasta llegar a 100.
- **Generación**: Un `setTimeout` de 2.5 segundos simula la latencia de una API real, generando un contenido SRT dinámico basado en el nombre del archivo subido.

### Descarga de Archivos
- Se utiliza la API de **Blobs** de JavaScript para crear un objeto de datos en memoria a partir del string del SRT.
- Se genera un enlace temporal (`URL.createObjectURL`) y se dispara un clic programático para iniciar la descarga en el navegador del usuario.

---

## 🎨 Detalles de Diseño
- **Bordes**: Uso extensivo de `rounded-2xl` y `rounded-xl` para una sensación suave y moderna.
- **Sombras**: `shadow-sm` y `shadow-lg` sutiles para dar profundidad sin sobrecargar.
- **Colores**: Fondo blanco puro (`#FFFFFF`) para máxima limpieza, contrastado con grises de la escala Tailwind (`gray-50` a `gray-900`).
