import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    host: true,          // 0.0.0.0 — 같은 Wi-Fi 기기에서 접속 가능
    port: 5174,
    strictPort: true,    // 포트가 바뀌면 CORS 설정이 깨지므로 고정
    allowedHosts: ['.trycloudflare.com'],   // Cloudflare Tunnel 접속 허용

    // 백엔드/OCR을 같은 주소로 프록시 → CORS·혼합콘텐츠 문제 원천 제거
    //
    // Origin 헤더를 제거하는 이유:
    // 브라우저는 POST에 Origin 헤더를 붙이는데, 프록시가 이를 그대로 전달하면
    // 백엔드가 "허용되지 않은 출처"로 보고 거부한다(Invalid CORS request).
    // 프록시는 서버 간 통신이라 CORS 검사가 불필요하므로 헤더를 떼어낸다.
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'))
        },
      },
      '/ocr': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'))
        },
      },
      // 차종별 오일 사양 추천 — OCR과 같은 AI 서비스에 있다
      '/spec': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'))
        },
      },
    },
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
            urlPattern: /\/(api|ocr|spec)\//,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
})
