import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../public_build',  // ← pasta fora do trafficdesk, na raiz do repo
    emptyOutDir: true,
    minify: false,
    sourcemap: false,
  },
})
