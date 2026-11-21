# 🎟️ LotoControl PWA (`Loterias-PWA`)

**LotoControl PWA** es una Aplicación Web Progresiva (PWA) para llevar el control de boletos y participaciones de juegos de azar del **ONLAE / SELAE**, **ONCE** y **otros sorteos**.

Permite almacenar boletos físicos mediante fotografía, clasificarlos por organización y tipo de juego, aplicar filtros temporales (incluido **semanal**) y consultar simultáneamente estadísticas de **gasto**, **premios** y **balance neto** (retorno frente a gasto), con una interfaz en **tonos azules predominantes** y colores de contraste semánticos.

---

## 🌟 Características Principales

### 📸 1. Almacenamiento de Boletos con Foto y OCR
- **Captura directa desde la cámara** del móvil o selección desde galería.
- **Recorte y optimización** de imagen con `vue-advanced-cropper` y compresión automática.
- **Reconocimiento OCR local** (`tesseract.js`) para detectar organización, juego, fecha del sorteo, números e importe.
- **Almacenamiento 100% local y offline** en **IndexedDB**, con visor a pantalla completa y descarga de foto.

### 🏛️ 2. Tipos de Loterías (ONLAE, ONCE y Otros)
- **ONLAE / SELAE**: Bonoloto, La Primitiva (+ Joker), Euromillones (+ El Millón), Lotería Nacional, Navidad / El Niño, El Gordo de la Primitiva, EuroDreams, La Quiniela, El Quinigol y Lototurf / Quíntuple Plus.
- **ONCE**: Cupón Diario, Cuponazo, Sueldazo Fin de Semana, Eurojackpot, Triplex, Mi Día, Super Once, Rascas y Sorteos Extraordinarios.
- **Otros**: Loto Catalunya (La Grossa, 6/49), Rifas y Cestas, Peñas y Participaciones, Loterías Internacionales y juegos personalizados.

### ⏳ 3. Filtros por Juego y Periodo Temporal
- **Semanal** (semana ISO actual, semana pasada o selector de semanas).
- **Mensual**, **Anual**, **Histórico completo** y **Rango personalizado** (desde / hasta).
- Filtros combinables por **organización**, **tipo de juego**, **estado** (Pendiente, Premiado, Reintegro, No premiado) y **búsqueda por texto o número**.

### 💰 4. Estadísticas de Gasto, Premios y Balance Simultáneo
- **Gasto total (€)**, **Premios totales (€)**, **Balance neto (`Premios - Gasto`)** y **Retorno (ROI %)** actualizados al instante según los filtros activos.
- **Comparativa visual** Gasto vs Premios y evolución semanal de las últimas 6 semanas.
- **Desglose por organización** (ONLAE, ONCE, Otros) y **ranking de rentabilidad por juego**.

### 🎨 5. Diseño Azul y Modo Offline (PWA)
- Paleta predominante en **gamas de azul** (zafiro, cobalto, marino y azul noche) con acentos semánticos (dorado, esmeralda, púrpura y rosa) y soporte de **modo claro / oscuro**.
- Instalable como PWA en móvil y escritorio, con copias de seguridad en **JSON**.

---

## 🛠️ Stack Técnico

- **Nuxt 4** / **Vue 3** / **TypeScript**
- **Nuxt UI 4** + **Tailwind CSS 4**
- **Pinia** + **IndexedDB**
- **@vite-pwa/nuxt** (Workbox)
- **vue-advanced-cropper**, **browser-image-compression**, **tesseract.js**
- **Vitest** + **ESLint**

---

## 🚀 Desarrollo y Compilación

```bash
# Instalar dependencias
npm install

# Ejecutar en local
npm run dev

# Comprobaciones de calidad
npm run lint
npm run typecheck
npm test

# Generar sitio estático (GitHub Pages)
npm run generate
```
