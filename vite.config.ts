import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
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
        navigateFallback: '/driver',
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
    })
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


