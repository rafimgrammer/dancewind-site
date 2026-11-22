// src/lib/concertTrack.ts
//
// 2026 정기공연 페이지(/2026concert) 방문 기록.
//   - Supabase 의 concert_events 테이블에 "행 추가"만 해요. (읽기는 비밀번호가 있는 통계 함수로만)
//   - 사이트 속도에 영향이 없게: await 하지 않고, 한가할 때(requestIdleCallback) 조용히 보내고, 실패해도 무시해요.
//   - supabase-js 대신 fetch 를 직접 써요. keepalive 옵션을 줄 수 있어서
//     "신청 버튼 누르고 바로 구글 폼으로 넘어가는" 순간에도 기록이 끊기지 않고 전송돼요.
//
// 기록하지 않는 경우
//   - 실제 사이트(hallymdancewind.com)가 아닌 곳: localhost, netlify 미리보기 주소 등
//   - 자동화된 브라우저(navigator.webdriver = 봇·크롤러)
//   - 통계 페이지에 비밀번호로 한 번이라도 들어간 기기 (회장단 본인 방문은 빼려고)

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export type ConcertEvent =
  | "page_view"
  | "section_view"
  | "apply_click"
  | "share_kakao"
  | "share_insta"
  | "team_open"
  | "calendar_save"
  | "map_click"
  | "lang_switch"
  | "ping";

const VISITOR_KEY = "c26-vid"; // localStorage — 기기마다 하나
const SESSION_KEY = "c26-sid"; // sessionStorage — 탭마다 하나
const SRC_KEY = "c26-src"; // sessionStorage — 이번 방문의 유입 경로
const ONCE_KEY = "c26-once"; // sessionStorage — 세션당 한 번만 보내는 이벤트들
/** 통계 페이지에 들어간 기기 표시 (대시보드가 남겨요). 이 표시가 있으면 기록 안 함 */
export const STATS_OWNER_KEY = "c26-stats-owner";

/* ---------- 저장소 (사생활 보호 모드 등에서 막혀 있어도 터지지 않게 전부 try) ---------- */
function getStore(kind: "local" | "session"): Storage | null {
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}
function readKey(kind: "local" | "session", key: string): string | null {
  try {
    return getStore(kind)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}
function writeKey(kind: "local" | "session", key: string, value: string) {
  try {
    getStore(kind)?.setItem(key, value);
  } catch {
    /* 저장이 막혀도 이번 화면에서는 메모리 값으로 계속 써요 */
  }
}

function randomId(): string {
  try {
    if (crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* 아주 오래된 브라우저 */
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

// 저장이 막힌 브라우저에서도 한 화면 안에서는 같은 값을 쓰도록 메모리에도 들고 있어요
let memVisitor: string | null = null;
let memSession: string | null = null;
function visitorId() {
  if (memVisitor) return memVisitor;
  memVisitor = readKey("local", VISITOR_KEY) || randomId();
  writeKey("local", VISITOR_KEY, memVisitor);
  return memVisitor;
}
function sessionId() {
  if (memSession) return memSession;
  memSession = readKey("session", SESSION_KEY) || randomId();
  writeKey("session", SESSION_KEY, memSession);
  return memSession;
}

/* ---------- 기록해도 되는 환경인지 ---------- */
function trackingEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  // 실제 도메인에서만. localhost · *.netlify.app(미리보기) 등은 전부 제외
  if (host !== "hallymdancewind.com" && host !== "www.hallymdancewind.com") return false;
  if (navigator.webdriver) return false;
  if (readKey("local", STATS_OWNER_KEY)) return false;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return false;
  return true;
}
/** 개발 중(npm run dev)엔 보내지 않고 콘솔에만 찍어서, 어떤 이벤트가 언제 나가는지 확인할 수 있게 */
const DEBUG = import.meta.env.DEV;

/* ---------- 기기 · 브라우저 (userAgent 로 대충) ---------- */
function detectDevice(ua: string): string {
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  // 아이패드는 요즘 "Macintosh" 로 나오는데, 터치가 되면 아이패드로 봐요
  if (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return "ios";
  if (/Android/i.test(ua)) return "android";
  if (/Windows|Macintosh|Linux|CrOS/i.test(ua)) return "pc";
  return "etc";
}
function detectBrowser(ua: string): string {
  // 인앱 브라우저를 먼저 — 카톡/인스타 안에서 열면 UA 에 사파리·크롬도 같이 들어 있어서 순서가 중요해요
  if (/KAKAOTALK/i.test(ua)) return "kakao";
  if (/Instagram/i.test(ua)) return "instagram";
  if (/FBAN|FBAV/i.test(ua)) return "facebook";
  if (/NAVER\(inapp|NAVER/i.test(ua)) return "naver";
  if (/SamsungBrowser/i.test(ua)) return "samsung";
  if (/Edg\//i.test(ua)) return "edge";
  if (/Firefox|FxiOS/i.test(ua)) return "firefox";
  if (/Chrome|CriOS/i.test(ua)) return "chrome";
  if (/Safari/i.test(ua)) return "safari";
  return "etc";
}

/* ---------- 유입 경로 (src) ----------
 * 1) 주소의 ?src= (insta, kakao, qr, notice ...) — 처음 들어올 때 읽어서 이번 방문 내내 같이 보내요
 * 2) 없으면 이전 페이지 주소(referrer)나 인앱 브라우저로 추정
 * 3) 그것도 없으면 "direct"
 * 읽은 뒤에는 주소창에서 ?src= 를 지워요. 그 주소를 복사해서 다른 데 공유하면 경로가 잘못 잡히니까요.
 */
const cleanSrc = (v: string) => v.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 30);

function resolveSrc(): string {
  const saved = readKey("session", SRC_KEY);
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get("src");
  if (fromUrl !== null) {
    params.delete("src");
    const rest = params.toString();
    try {
      window.history.replaceState(window.history.state, "", window.location.pathname + (rest ? `?${rest}` : "") + window.location.hash);
    } catch {
      /* 무시 */
    }
  }
  if (saved) return saved; // 같은 탭에서는 처음 잡힌 경로를 유지
  let src = fromUrl ? cleanSrc(fromUrl) : "";
  if (!src) {
    const ref = document.referrer.toLowerCase();
    const ua = navigator.userAgent;
    if (ref.includes("instagram") || /Instagram/i.test(ua)) src = "insta";
    else if (ref.includes("kakao") || /KAKAOTALK/i.test(ua)) src = "kakao";
    else if (ref && !ref.includes(window.location.hostname)) src = "other";
    else src = "direct";
  }
  writeKey("session", SRC_KEY, src);
  return src;
}

let currentSrc: string | null = null;
let currentLang = "ko";
/** 공연 페이지가 언어를 바꿀 때 알려줘요 (이후 이벤트에 같이 실려요) */
export function setTrackLang(lang: string) {
  currentLang = lang;
}

/* ---------- 보내기 ---------- */
interface Row {
  visitor_id: string;
  session_id: string;
  event: ConcertEvent;
  src: string;
  detail: string | null;
  lang: string;
  device: string;
  browser: string;
  screen_w: number;
  referrer: string | null;
}

function buildRow(event: ConcertEvent, detail?: string | null): Row {
  const ua = navigator.userAgent;
  currentSrc ??= resolveSrc();
  return {
    visitor_id: visitorId(),
    session_id: sessionId(),
    event,
    src: currentSrc,
    detail: detail ? String(detail).slice(0, 200) : null,
    lang: currentLang,
    device: detectDevice(ua),
    browser: detectBrowser(ua),
    screen_w: Math.min(10000, Math.round(window.screen?.width || window.innerWidth || 0)),
    // 처음 보기(page_view)에만 이전 페이지 주소를 실어요. 쿼리(?...)는 개인정보가 섞일 수 있어서 떼요
    referrer: event === "page_view" && document.referrer ? document.referrer.split("?")[0].slice(0, 200) : null,
  };
}

function send(row: Row) {
  if (DEBUG) {
    console.debug("[concert-track]", row.event, row.detail ?? "", row);
    return;
  }
  try {
    void fetch(`${SUPABASE_URL}/rest/v1/concert_events`, {
      method: "POST",
      keepalive: true, // 페이지를 떠나는 중이어도 끝까지 보내요
      headers: {
        apikey: SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        // 결과를 돌려받지 않아요 — 애초에 읽기 권한이 없어서 돌려달라고 하면 거절돼요
        Prefer: "return=minimal",
      },
      body: JSON.stringify(row),
    }).catch(() => {});
  } catch {
    /* 기록 실패는 조용히 무시 — 방문자 화면에는 아무 영향 없게 */
  }
}

type IdleWindow = Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number };

/**
 * 이벤트 기록. 화면을 그리는 일을 방해하지 않게 브라우저가 한가할 때 보내요.
 * urgent: 바로 페이지를 떠나는 경우(구글 폼으로 이동 등)라 미루지 않고 곧바로 보낼 때
 */
export function track(event: ConcertEvent, detail?: string | null, urgent = false) {
  try {
    if (!trackingEnabled() && !DEBUG) return;
    // 행은 지금 만들어요 (언어 · 경로가 "누른 순간" 기준이 되게). 보내는 것만 미뤄요.
    const row = buildRow(event, detail);
    if (urgent) return send(row);
    const w = window as IdleWindow;
    if (w.requestIdleCallback) w.requestIdleCallback(() => send(row), { timeout: 3000 });
    else window.setTimeout(() => send(row), 0);
  } catch {
    /* 무시 */
  }
}

/** 세션(탭)당 한 번만 보내는 이벤트 — page_view, section_view:about 같은 것 */
export function trackOnce(event: ConcertEvent, detail?: string | null, urgent = false) {
  // page_view 는 detail(redirect 등)과 상관없이 탭당 한 번만
  const key = event === "page_view" ? event : `${event}:${detail ?? ""}`;
  let done: string[] = [];
  try {
    done = JSON.parse(readKey("session", ONCE_KEY) || "[]");
  } catch {
    done = [];
  }
  if (done.includes(key)) return;
  done.push(key);
  writeKey("session", ONCE_KEY, JSON.stringify(done));
  track(event, detail, urgent);
}

/**
 * "지금 보는 사람" 계산용 ping — 탭이 화면에 보이는 동안만 45초마다.
 * 탭을 숨기면 멈추고, 다시 보이면 바로 한 번 보낸 뒤 이어가요. 돌려주는 함수로 멈춰요.
 */
export function startPresence(): () => void {
  if (!trackingEnabled() && !DEBUG) return () => {};
  let timer = 0;
  const stop = () => {
    window.clearInterval(timer);
    timer = 0;
  };
  const begin = () => {
    stop();
    timer = window.setInterval(() => track("ping"), 45_000);
  };
  const onVis = () => {
    if (document.visibilityState === "visible") {
      track("ping");
      begin();
    } else stop();
  };
  if (document.visibilityState === "visible") begin();
  document.addEventListener("visibilitychange", onVis);
  return () => {
    stop();
    document.removeEventListener("visibilitychange", onVis);
  };
}

/** 공유 링크에 꼬리표(?src=) 붙이기 — 이미 ?lang=en, ?go=apply 가 있어도 & 로 이어 붙어요 */
export function withSrc(url: string, src: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set("src", src);
    return u.toString();
  } catch {
    return url + (url.includes("?") ? "&" : "?") + `src=${encodeURIComponent(src)}`;
  }
}

/** 통계 페이지가 비밀번호 확인 후 부르면, 이 기기는 앞으로 기록에서 빠져요 */
export function markStatsOwner() {
  writeKey("local", STATS_OWNER_KEY, "1");
}
