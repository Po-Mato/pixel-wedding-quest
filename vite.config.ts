import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { DEFAULT_WEDDING_CONFIG } from './src/data/weddingConfig'

/**
 * index.html의 <title> / OpenGraph 메타 태그를 weddingConfig.ts 기본값에서 빌드 시점에 생성합니다.
 * (카카오톡·문자 링크 미리보기 크롤러는 JS를 실행하지 않으므로 정적 HTML에 이름이 들어가 있어야 합니다)
 */
function weddingMetaPlugin(): Plugin {
  const c = DEFAULT_WEDDING_CONFIG
  const date = `${c.wedding.year}. ${String(c.wedding.month).padStart(2, '0')}. ${String(c.wedding.day).padStart(2, '0')}`
  const couple = `${c.groom.fullName} ♥ ${c.bride.fullName}`
  const escape = (v: string) =>
    v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const values: Record<string, string> = {
    WEDDING_PAGE_TITLE: `${couple} 모바일 청첩장 | ${date}`,
    WEDDING_OG_TITLE: `${couple} 결혼합니다 | ${date}`,
    WEDDING_OG_DESCRIPTION: `${c.wedding.dateDisplay} ${c.wedding.timeDisplay} · ${c.wedding.venueName} ${c.wedding.hallName} | 소중한 분들을 초대합니다`,
  }
  return {
    name: 'wedding-meta',
    transformIndexHtml(html) {
      return html.replace(/%(WEDDING_[A-Z_]+)%/g, (m, key: string) =>
        key in values ? escape(values[key]) : m
      )
    },
  }
}

// 상대 경로('./')를 기본값으로 사용하여 어떤 GitHub Pages 서브패스(/pixel-wedding-quest/, /wedding/ 등)에서도
// 정적 에셋(JS/CSS) 경로가 깨지지 않고 동작하도록 설정합니다.
export default defineConfig({
  base: process.env.VITE_BASE_PATH || './',
  plugins: [react(), weddingMetaPlugin()],
  server: {
    port: 5177,
    host: true,
  },
})
