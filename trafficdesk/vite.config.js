import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    // Disable esbuild minification — fixes TDZ const ordering issues
    // in large single-file components
    minify: false,
    // Keep readable output for debugging
    sourcemap: false,
  },
})
