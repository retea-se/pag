import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/pag/',
  server: {
    proxy: {
      '/api/ticketmaster': {
        target: 'https://app.ticketmaster.com/discovery/v2',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ticketmaster/, ''),
        secure: true
      },
      '/api/avicii': {
        target: 'https://aviciiarena.se',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/avicii/, ''),
        secure: true
      },
      '/api/3arena': {
        target: 'https://3arena.se',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/3arena/, ''),
        secure: true
      },
      '/api/hovet': {
        target: 'https://hovetarena.se',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/hovet/, ''),
        secure: true
      },
      '/api/annexet': {
        target: 'https://annexet.se',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/annexet/, ''),
        secure: true
      }
    }
  }
})
