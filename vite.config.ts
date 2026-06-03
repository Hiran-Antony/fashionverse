import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    proxy: {
      // Proxy all Kolors Virtual Try-On space requests through Vite
      // This bypasses the "Forbidden embedding" 403 by making requests appear
      // to come from localhost instead of the browser origin
      '/api/tryon': {
        target: 'https://kwai-kolors-kolors-virtual-try-on.hf.space',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tryon/, ''),
        secure: true,
        ws: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Referer', 'https://kwai-kolors-kolors-virtual-try-on.hf.space/');
            proxyReq.setHeader('Origin', 'https://kwai-kolors-kolors-virtual-try-on.hf.space');
          });
          proxy.on('error', (err) => {
            console.warn('[proxy error]', err.message);
          });
        },
        timeout: 0,          // disable proxy timeout for SSE streams
        proxyTimeout: 0,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            if (id.includes('zustand') || id.includes('@tanstack')) {
              return 'vendor-state';
            }
            if (id.includes('framer-motion') || id.includes('lucide-react')) {
              return 'vendor-ui';
            }
          }
        },
      },
    },
  },
})


