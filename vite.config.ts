import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { host: true, port: 5173 },
  build: {
    target: 'es2020',
    assetsInlineLimit: 2048,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Keep the WebGL payload in its own chunk so the marketing shell can
        // paint (and rank) without waiting on three.js.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('three') || id.includes('postprocessing')) return 'three'
          if (id.includes('gsap')) return 'gsap'
          if (id.includes('react')) return 'react'
        },
      },
    },
  },
})
