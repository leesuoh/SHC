import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    host: true,      // 0.0.0.0 — 같은 Wi-Fi 기기에서 접속 가능
    port: 5174,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'SHC — 시화카 정비소',
        short_name: 'SHC',
        description: '시화카 정비소 스마트 정비 관리 시스템',
        theme_color: '#007aff',
        background_color: '#f2f2f7',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icons.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // 오프라인: 앱 shell 캐싱
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // API 요청은 캐시 안 함 (항상 네트워크)
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/localhost:8080\/api\//,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
})
