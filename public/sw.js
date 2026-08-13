// public/sw.js
// PWA 설치 요건을 충족시키기 위한 최소한의 서비스워커예요.
// Supabase API/실시간(웹소켓) 요청은 절대 가로채지 않고,
// "페이지 이동" 요청에 대해서만 오프라인일 때 캐시된 화면을 보여주는 정도만 해요.

const CACHE_NAME = "chumbaram-shell-v1";
const APP_SHELL = ["/", "/index.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // 페이지 이동 요청이 아니면 아무것도 안 해요 (기본 동작 그대로).
  if (event.request.mode !== "navigate") return;

  event.respondWith(fetch(event.request).catch(() => caches.match("/index.html")));
});