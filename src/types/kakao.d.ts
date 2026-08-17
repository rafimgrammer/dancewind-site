// src/types/kakao.d.ts
interface Window {
  /** 카카오맵 SDK — Location.tsx 전용, appkey를 URL 파라미터로 직접 넘기는 방식 */
  kakao: any;
  /** 카카오 JS SDK(공유/로그인 등) — Kakao.init() 으로 초기화하는 방식, 지도와는 별개 전역 객체 */
  Kakao: any;
}