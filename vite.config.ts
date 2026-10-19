import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 상대 경로('./')를 기본값으로 사용하여 어떤 GitHub Pages 서브패스(/pixel-wedding-quest/, /wedding/ 등)에서도
// 정적 에셋(JS/CSS) 경로가 깨지지 않고 동작하도록 설정합니다.
export default defineConfig({
  base: process.env.VITE_BASE_PATH || './',
  plugins: [react()],
  server: {
    port: 5177,
    host: true,
  },
})
