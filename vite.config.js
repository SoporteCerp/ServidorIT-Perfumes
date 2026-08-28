import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Perfumeria - Las mejores fragancias',
        short_name: 'Perfumeria',
        description: 'Venta de perfumes premium',
        start_url: '/',
        display: 'standalone',
        background_color: '#F9FAFB',
        theme_color: '#6D28D9',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: { globPatterns: ['**/*.{js,css,html,ico,png,svg}'] }
    })
  ],
  server: { host: true, port: 5173 }
})
