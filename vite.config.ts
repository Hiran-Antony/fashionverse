import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vite.dev/config/
export default defineConfig({
  envPrefix: ['VITE_'],
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'icons/driver-192.png',
        'icons/driver-512.png'
      ],
      manifest: {
        name: 'FashionVerse Delivery Hub',
        short_name: 'FV Driver',
        description: 'Multi-courier delivery hub for FashionVerse',
        theme_color: '#00C853',
        background_color: '#0a0a0a',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/driver',
        scope: '/driver',
        icons: [
          {
            src: '/icons/driver-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/driver-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 5
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.basemaps\.cartocdn\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles-cache',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 7
              }
            }
          }
        ]
      }
    }),
    visualizer({
      filename: 'dist/stats.html',
      title: 'FashionVerse Bundle Analyzer Report',
      template: 'treemap',
      gzipSize: true,
      brotliSize: true,
      open: false // Do not auto open in terminal mode
    })
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    proxy: {
      '/api/payments': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
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
    minify: false,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 300,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('react-router-dom') ||
              id.includes('react-dom') ||
              id.includes('react/')
            ) {
              return 'vendor';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'query';
            }
            if (id.includes('framer-motion')) {
              return 'motion';
            }
            if (id.includes('@supabase/supabase-js') || id.includes('@supabase/')) {
              return 'supabase';
            }
            if (id.includes('three') || id.includes('@react-three')) {
              return 'three';
            }
          }
        }
      }
    }
  }
});
