// src/utils/text.ts

// HTML 태그를 제거해서 순수 텍스트만 남겨요 (미리보기, 검색 등에 사용).
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}