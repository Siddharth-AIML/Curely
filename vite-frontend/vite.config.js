import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
   build: {
    outDir: 'dist', // ensures proper Vercel output
  },
  server: {
    // FIX: Proxy to route BBN API calls to Python backend (port 5000)
    proxy: {
      '/bbn-api': {
        target: 'http://127.0.0.1:5000', 
        changeOrigin: true, 
        rewrite: (path) => path.replace(/^\/bbn-api/, ''), 
      },
    },
  },
})
