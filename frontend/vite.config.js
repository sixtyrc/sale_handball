import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'child_process'

// Obtencion dinamica de version y rama
let version = '1.8'
let branch = 'unknown'

try {
  branch = execSync('git branch --show-current').toString().trim() || 'unknown'
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '')
  version = `V1.8.${date}-${branch.toUpperCase()}`
} catch (e) {
  console.error('No se pudo obtener la rama de git:', e)
}

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8002',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://localhost:8002',
        changeOrigin: true,
      }
    }
  },
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __GIT_BRANCH__: JSON.stringify(branch),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      manifest: {
        name: 'Salesianos Handball',
        short_name: 'Salesianos',
        description: 'Gestión Deportiva y Administrativa para Clubes de Handball',
        theme_color: '#1e293b',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'logo_pwa.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo_pwa.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'logo_pwa.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ]
})
