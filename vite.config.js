import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import compression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Gzip - większość hostingów/CDN i tak to obsłuży, ale generujemy z wyprzedzeniem
    compression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240,
      deleteOriginFile: false,
    }),
    // Brotli - lepsza kompresja, wspierana przez wszystkie nowoczesne przeglądarki
    compression({
      algorithm: 'brotli',
      ext: '.br',
      threshold: 10240,
      deleteOriginFile: false,
    }),
  ],
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Code splitting - osobne chunki dla dużych zależności = lepszy caching
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-router')) return 'router-vendor';
            if (id.includes('react')) return 'react-vendor';
            if (id.includes('firebase')) return 'firebase-vendor';
            if (id.includes('i18next')) return 'i18n-vendor';
            return 'vendor';
          }
        },
      },
    },
  },
  server: {
    // WAŻNE: bez tego proxy wywołania /api w trybie dev (npm run dev) nie trafią do backendu
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
})
