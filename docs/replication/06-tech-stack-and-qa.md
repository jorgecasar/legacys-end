# 06 - Stack Tecnológico y Calidad

## 1. Núcleo Tecnológico
- **Runtime**: Node.js v24+ (ESM nativo).
- **UI Engine**: [Lit](https://lit.dev/).
- **Component Library**: [Web Awesome](https://webawesome.com/) (Botones, inputs, wa-grid, wa-icon).
- **Build Tool**: [Vite](https://vitejs.dev/) configurado para bundles modernos (es2022+).

## 2. Estrategia de Calidad (Testing)
El proyecto debe implementarse siguiendo estrictamente **TDD** o **BDD**.

### 2.1 Niveles de Validación
- **Unit Testing (Vitest)**: 100% de cobertura en la capa de Casos de Uso y Dominio.
- **E2E Testing (Playwright)**: Validación obligatoria en **navegadores reales** (Chromium, Firefox, WebKit).
- **Visual Regression**: Captura de snapshots para asegurar que los cambios de background y vestimenta del héroe se mantienen consistentes.

## 3. Optimización de Bundle
- **Tree-shaking**: Eliminación agresiva de código muerto.
- **Code Splitting**: Carga diferida (`import()`) de los datos de cada misión.
- **Compresión**: Servir archivos comprimidos con **Brotli** o Gzip para una latencia mínima.

## 4. Gestión de Activos (Assets)
- **Pixel Art**: Sprites de 32x32px renderizados con `image-rendering: pixelated;`.
- **Audio**: Formatos WebP/MP3 optimizados para carga rápida.
