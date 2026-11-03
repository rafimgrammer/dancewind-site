import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * 링크 미리보기(카톡·인스타 등)를 주소별로 다르게 보여주는 플러그인.
 *
 * 이 사이트는 SPA라 모든 주소가 index.html 하나를 같이 써서, 카톡이 어떤 링크를 읽어가도
 * "한림대학교 춤바람" 미리보기만 떠요. (카톡 미리보기는 JS 를 실행하지 않고 HTML 만 읽거든요)
 * 그래서 빌드가 끝나면 dist/index.html 을 복사해서 미리보기 정보(og 태그)만 바꾼
 * 페이지 전용 HTML(예: dist/2026concert.html)을 하나 더 만들어요.
 * Netlify 는 /2026concert 요청에 이 파일을 먼저 내주고, 화면은 똑같이 React 앱이 그려요.
 */
interface OgPage {
  file: string
  title: string
  description: string
  url: string
  image: string
}

const OG_PAGES: OgPage[] = [
  {
    file: '2026concert.html',
    title: '2026 춤바람 정기공연 「輪舞 윤무」',
    description: '2026. 12. 01 (화) 18:30 · 한림대학교 일송아트홀 | 원을 그리며 하나되는 우리의 궤적',
    url: 'https://hallymdancewind.com/2026concert',
    image: 'https://hallymdancewind.com/share/concert2026-share.jpg?v=3',
  },
]

function pageOgPlugin(): Plugin {
  return {
    name: 'page-og-html',
    apply: 'build',
    closeBundle() {
      const dist = resolve(__dirname, 'dist')
      const base = readFileSync(resolve(dist, 'index.html'), 'utf-8')
      const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

      for (const page of OG_PAGES) {
        const setMeta = (html: string, attr: 'property' | 'name', key: string, value: string) =>
          html.replace(
            new RegExp(`<meta ${attr}="${key}" content="[^"]*"\\s*/?>`),
            `<meta ${attr}="${key}" content="${esc(value)}" />`,
          )

        let html = base
        html = setMeta(html, 'property', 'og:title', page.title)
        html = setMeta(html, 'property', 'og:description', page.description)
        html = setMeta(html, 'property', 'og:url', page.url)
        html = setMeta(html, 'property', 'og:image', page.image)
        html = setMeta(html, 'name', 'description', page.description)
        html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(page.title)}</title>`)
        // 카톡이 이미지 비율을 미리 알 수 있게 크기 정보 추가 (1200x600)
        html = html.replace(
          /(<meta property="og:image" content="[^"]*" \/>)/,
          '$1\n    <meta property="og:image:width" content="1200" />\n    <meta property="og:image:height" content="600" />',
        )

        writeFileSync(resolve(dist, page.file), html)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), pageOgPlugin()],
})