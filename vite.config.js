import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/pag/',
  build: {
    // Optimera build för bättre prestanda
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
        },
        // Optimera chunk-namn för bättre caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Minska chunk-storlekar
    chunkSizeWarningLimit: 1000,
    // Aktivera minification (esbuild är standard och snabbare än terser)
    minify: 'esbuild',
    // Aktivera source maps för production debugging (valfritt)
    sourcemap: false,
    // Optimera CSS
    cssCodeSplit: true,
    cssMinify: true,
  },
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
