import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Renderer-only Vite config. El proceso Electron (main/preload) se compila
// aparte con tsc plano (ver tsconfig.electron.json), igual que en
// gastos-mensuales, para mantener el mismo patron entre proyectos.
//
// Puerto 5174 (no 5173) a proposito: gastos-mensuales usa 5173 y es otro
// proyecto Electron independiente — si algun dia se corren los dos `npm run
// dev` al mismo tiempo, no se pisan.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
  },
})
