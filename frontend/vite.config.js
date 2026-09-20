import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Forward /api/* → backend at :8000 (same-origin in browser, no CORS)
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      // Forward /simulation/* → backend (legacy unversioned paths)
      '/simulation': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      // Forward /health → backend
      '/health': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
