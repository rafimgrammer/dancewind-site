// src/pages/Concert.tsx
//
// 2026 춤바람 정기공연 「輪舞 윤무」 홍보 페이지 (/2026concert)
// - QR코드로 들어오는 관객이 대부분이라 "모바일 화면"을 기준으로 디자인하고, PC(md 이상)에서 넓게 펼쳐지도록 했어요.
// - 사이드바/상단바 없이 전체 화면을 써요. (Layout.tsx 의 FULLSCREEN_PATHS)
// - 문구/팀/경품/스폰서 같은 내용은 전부 src/data/concert2026.ts 에 모아뒀어요.
// - 애니메이션 정의는 ./concert2026.css 에 있어요.

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { shareToKakao } from "../lib/kakaoShare";
import { CONCERT_2026 as C, type ConcertSponsor, type ConcertTeam } from "../data/concert2026";
import { BRUSH_END, BRUSH_SPRITE, BRUSH_STROKES, BRUSH_VIEWBOX } from "../data/concert2026Strokes";

/** 서예를 다 쓴 시각 기준으로 뒤따르는 문구들의 등장 시각 */
const afterBrush = (dt: number) => `${(BRUSH_END + dt).toFixed(2)}s`;
import "./concert2026.css";

const SITE_URL = "https://hallymdancewind.com";
const PAGE_URL = `${SITE_URL}/${C.slug}`;
const STORY_IMAGE_URL = "/share/concert2026-story.jpg"; // 인스타 스토리용 1080×1920 이미지
const KAKAO_MAP_KEY = import.meta.env.VITE_KAKAO_MAP_KEY;

/* =========================================================================
 * 작은 부품들
 * ========================================================================= */

/** 화면에 들어오면 아래에서 떠오르는 래퍼 */
function Rise({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>(0.12);
  return (
    <div
      ref={ref}
      className={`transition-all duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${className} ${
        visible ? "translate-y-0 opacity-100 blur-0" : "translate-y-8 opacity-0 blur-[4px]"
      }`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

/** 포스터의 파란 먹물 번짐 — SVG 노이즈 필터로 가장자리를 거칠게 만들어요 */
function InkBlot({ className = "", style, seed = 3 }: { className?: string; style?: CSSProperties; seed?: number }) {
  // useId 값에는 ":"가 들어 있어서 url(#...) 에서 깨지므로 제거
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 200 200" className={className} style={style} aria-hidden="true">
      <defs>
        <radialGradient id={`g${id}`}>
          <stop offset="0%" stopColor="#14638f" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#0d4566" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#082c42" stopOpacity="0" />
        </radialGradient>
        <filter id={`f${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.028" numOctaves="4" seed={seed} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="42" result="d" />
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed + 7} result="grain" />
          <feColorMatrix
            in="grain"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.25"
            result="ga"
          />
          <feComposite in="d" in2="ga" operator="in" />
        </filter>
      </defs>
      <circle cx="100" cy="100" r="78" fill={`url(#g${id})`} filter={`url(#f${id})`} />
    </svg>
  );
}

/** 섹션 사이의 작은 원 장식 (輪) */
function RingDivider() {
  const { ref, visible } = useScrollReveal<HTMLDivElement>(0.6);
  return (
    <div ref={ref} className="flex justify-center py-14 md:py-20" aria-hidden="true">
      <svg viewBox="0 0 60 60" className={`c26-ring h-10 w-10 ${visible ? "is-visible" : ""}`}>
        <circle
          cx="30"
          cy="30"
          r="24"
          fill="none"
          stroke="rgba(200,210,220,0.45)"
          strokeWidth="1"
          pathLength={160}
          transform="rotate(-80 30 30)"
        />
      </svg>
    </div>
  );
}

/** 섹션 머리말 — 큰 한자 번호 + 한자·영문 눈썹 + 한 글자씩 먹처럼 떠오르는 제목 */
function SectionHead({ num, hanja, eyebrow, title }: { num: string; hanja: string; eyebrow: string; title: string }) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>(0.35);
  const chars = Array.from(title);
  return (
    <div ref={ref} className="relative mb-10 md:mb-0">
      {/* 잡지처럼 크게 깔리는 한자 번호 */}
      <span
        aria-hidden="true"
        className={`c26-plx c26-serif pointer-events-none absolute -top-10 right-0 select-none text-[124px] font-black leading-none text-white/[0.07] transition-[opacity,translate] duration-[1400ms] ease-out will-change-transform md:static md:mb-2 md:block md:text-[160px] ${
          visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        {num}
      </span>
      <p
        className={`c26-serif flex items-center gap-3 text-[13px] tracking-[0.3em] text-[#7cc4ee] transition-opacity duration-700 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <span>{hanja}</span>
        <span className="h-px w-6 bg-[#7cc4ee]/50" />
        <span className="font-mono text-[11px] tracking-[0.25em]">{eyebrow}</span>
      </p>
      {/* 제목: 한 글자씩 흐릿한 먹이 번지듯 떠오름 */}
      <h2
        aria-label={title}
        className="c26-serif mt-3 flex flex-wrap text-[32px] font-black leading-tight text-white md:text-[40px]"
      >
        {chars.map((ch, i) => (
          <span
            key={i}
            aria-hidden="true"
            className="c26-char"
            data-on={visible}
            style={{ transitionDelay: visible ? `${150 + i * 90}ms` : "0ms" }}
          >
            {ch === " " ? "\u00A0" : ch}
          </span>
        ))}
      </h2>
    </div>
  );
}

/** PC에서는 왼쪽에 제목(고정), 오른쪽에 내용 — 모바일에선 위아래로 쌓임 */
function Section({
  id,
  head,
  children,
}: {
  id: string;
  head: { num: string; hanja: string; eyebrow: string; title: string };
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6 md:grid md:grid-cols-[260px_1fr] md:gap-14">
      <div className="md:sticky md:top-16 md:self-start">
        <SectionHead {...head} />
      </div>
      <div>{children}</div>
    </section>
  );
}

/* =========================================================================
 * 카운트다운 (D-day + 남은 시간)
 * ========================================================================= */

const DAY_MS = 86_400_000;
const KST_OFFSET_MS = 9 * 3_600_000;
const EVENT_MS = new Date(C.eventAt).getTime();
const EVENT_END_MS = EVENT_MS + C.runtimeMinutes * 60_000;

/** 한국 날짜 기준 "몇 번째 날"인지 — D-day 는 시간이 아니라 날짜 차이로 세는 게 일반적이라서 */
const kstDayIndex = (ms: number) => Math.floor((ms + KST_OFFSET_MS) / DAY_MS);

type CountdownState =
  | { phase: "before"; dDay: number; days: number; hours: number; minutes: number; seconds: number }
  | { phase: "live" }
  | { phase: "after" };

function useCountdown(): CountdownState {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (now >= EVENT_END_MS) return { phase: "after" };
  if (now >= EVENT_MS) return { phase: "live" };
  const left = EVENT_MS - now;
  return {
    phase: "before",
    dDay: kstDayIndex(EVENT_MS) - kstDayIndex(now),
    days: Math.floor(left / DAY_MS),
    hours: Math.floor((left / 3_600_000) % 24),
    minutes: Math.floor((left / 60_000) % 60),
    seconds: Math.floor((left / 1000) % 60),
  };
}

const dDayLabel = (cd: CountdownState) =>
  cd.phase === "before" ? (cd.dDay <= 0 ? "D-DAY" : `D-${cd.dDay}`) : cd.phase === "live" ? "ON STAGE" : "END";

/* ---------- 넘어가는 숫자판 (먹 타일) ----------
 * 판 한 칸 = 위 반쪽 + 아래 반쪽 + 접히는 날개(fold).
 *   글자가 바뀌면: 위 반쪽에는 "새 글자", 아래 반쪽에는 잠깐 "이전 글자"를 두고,
 *   이전 글자의 위 반쪽이 그려진 날개를 아래로 접어 넘긴 뒤 아래 반쪽도 새 글자로 바꿔요.
 *   영문(ON STAGE / THANK YOU)은 공항 출발 안내판처럼 알파벳을 몇 장 촤르륵 거쳐서 도착해요.
 */
const FLAP_CHARS = " ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function FlipCell({ char, word = false, large = false }: { char: string; word?: boolean; large?: boolean }) {
  // 영문은 빈칸에서부터 넘겨 들어오게, 숫자는 처음엔 바로 보이게
  const initial = /[A-Z]/.test(char) ? " " : char;
  const [shown, setShown] = useState(initial);
  const [flip, setFlip] = useState<{ from: string; to: string; dur: number; id: number } | null>(null);
  // 타이머 안에서 "지금 판에 적힌 글자"를 읽어야 해서 state 와 별도로 ref 에도 들고 있어요.
  const shownRef = useRef(initial);

  useEffect(() => {
    let timer = 0;
    let cancelled = false;
    const step = () => {
      const cur = shownRef.current;
      if (cancelled || cur === char) return;
      let next = char;
      let dur = 420;
      const i = FLAP_CHARS.indexOf(cur);
      const j = FLAP_CHARS.indexOf(char);
      if (i >= 0 && j >= 0) {
        // 알파벳 사이는 대여섯 장만 빠르게 거쳐 가요 (전부 넘기면 너무 오래 걸려서)
        const dist = (j - i + FLAP_CHARS.length) % FLAP_CHARS.length;
        const jump = Math.max(1, Math.ceil(dist / 5));
        if (dist > jump) next = FLAP_CHARS[(i + jump) % FLAP_CHARS.length];
        dur = 90;
      }
      shownRef.current = next;
      setFlip({ from: cur, to: next, dur, id: Math.random() });
      timer = window.setTimeout(() => {
        setShown(next);
        setFlip(null);
        step();
      }, dur);
    };
    step();
    return () => {
      // 넘기는 도중에 값이 또 바뀌면, 반쯤 넘어간 상태로 멈추지 않게 지금 글자로 정리해요.
      cancelled = true;
      window.clearTimeout(timer);
      setShown(shownRef.current);
      setFlip(null);
    };
  }, [char]);

  const top = flip ? flip.to : shown;
  const bottom = flip ? flip.from : shown;
  return (
    <span className={`c26-flip${word ? " c26-flip-word" : ""}${large ? " c26-flip-lg" : ""}`} aria-hidden="true">
      <span className="c26-flip-half c26-flip-top">
        <span>{top.trim()}</span>
      </span>
      <span className="c26-flip-half c26-flip-bot">
        <span>{bottom.trim()}</span>
      </span>
      {flip && (
        <span
          key={flip.id}
          className="c26-flip-fold"
          style={{ animationDuration: `${flip.dur}ms` }}
        >
          <span>{flip.from.trim()}</span>
        </span>
      )}
    </span>
  );
}

/** 두 칸짜리 숫자 묶음 + 아래 작은 단위 글씨 */
function FlipGroup({ value, label }: { value: number; label: string }) {
  const digits = String(value).padStart(2, "0").split("");
  return (
    <span className="flex flex-col items-center">
      <span className="flex gap-[3px]">
        {digits.map((d, i) => (
          // 자리(i)를 key 로 써야 같은 칸이 유지되면서 글자만 넘어가요.
          <FlipCell key={digits.length - i} char={d} />
        ))}
      </span>
      <span className="mt-1.5 text-[8px] tracking-[0.25em] text-white/45 md:text-[9px]">{label}</span>
    </span>
  );
}

const FlipColon = () => (
  <span className="c26-serif pb-[26px] text-base leading-none text-white/35 md:pb-[30px] md:text-lg" aria-hidden="true">
    :
  </span>
);

function Countdown() {
  const cd = useCountdown();
  const isToday = cd.phase === "before" && cd.dDay <= 0;
  const minutesIn = Math.max(0, Math.floor((Date.now() - EVENT_MS) / 60_000));

  let label: ReactNode;
  let board: ReactNode;
  let note: ReactNode = null;
  let aria: string;

  if (cd.phase === "before") {
    const hoursLeft = cd.days * 24 + cd.hours; // 당일엔 일 단위가 없으니 시간으로 합쳐서
    label = isToday ? "TODAY · D-DAY" : `공연까지 ${dDayLabel(cd)}`;
    board = (
      <>
        {!isToday && (
          <>
            <FlipGroup value={Math.min(99, cd.days)} label="DAYS" />
            <FlipColon />
          </>
        )}
        <FlipGroup value={isToday ? hoursLeft : cd.hours} label="HRS" />
        <FlipColon />
        <FlipGroup value={cd.minutes} label="MIN" />
        <FlipColon />
        <FlipGroup value={cd.seconds} label="SEC" />
      </>
    );
    if (isToday) note = `오늘 18:30 · ${C.location.venueName}`;
    aria = `공연까지 ${cd.days}일 ${cd.hours}시간 ${cd.minutes}분 남음`;
  } else {
    // 두 단어 모두 9칸이라 판 크기가 그대로 유지돼요 (" ON STAGE" / "THANK YOU")
    const word = cd.phase === "live" ? " ON STAGE" : "THANK YOU";
    label =
      cd.phase === "live" ? (
        <>
          <span className="c26-live-dot h-1.5 w-1.5 rounded-full bg-[#ff5a5a]" />
          NOW
        </>
      ) : (
        `${C.titleHanja} · 2026`
      );
    board = (
      <span className="flex gap-[3px]">
        {word.split("").map((ch, i) => (
          <FlipCell key={i} char={ch} word />
        ))}
      </span>
    );
    note =
      cd.phase === "live"
        ? `지금 공연 중 · ${minutesIn < 1 ? "방금 막이 올랐어요" : `${minutesIn}분째`}`
        : `함께해 주셔서 감사합니다 · ${C.instagram.handle}`;
    aria = cd.phase === "live" ? "지금 공연 중" : "공연이 끝났습니다. 함께해 주셔서 감사합니다";
  }

  return (
    <div
      className={`c26-board inline-flex flex-col items-center md:items-start ${cd.phase === "live" ? "is-live" : ""}`}
      role="timer"
      aria-label={aria}
    >
      <p
        className={`c26-serif mb-3 flex items-center gap-2 pl-[0.25em] text-[13px] tracking-[0.25em] md:text-sm ${
          cd.phase === "live" ? "text-[#ffb3b3]" : "text-[#7cc4ee]"
        }`}
      >
        {label}
      </p>
      <div className="flex items-end gap-[5px]">{board}</div>
      {note && <p className="mt-3 text-[11px] leading-relaxed text-white/60 md:text-xs">{note}</p>}
    </div>
  );
}

/* =========================================================================
 * 輪舞 서예 — 한 획씩 써지는 애니메이션
 *   - 서예 이미지를 획 31개로 나눈 조각(스프라이트 한 장)을 깔아두고
 *   - 각 조각을 "붓 중심선을 따라 그려지는 굵은 선" 마스크로 가렸다가 순서대로 드러내요.
 *   - 다 쓰면 원본 이미지(brush.png)로 살짝 교체해서 가장자리까지 깔끔하게 마무리.
 * ========================================================================= */

/* =========================================================================
 * 흰 잉크 번짐 (ink spill) — 서예를 쓰는 사이사이, 흰 잉크 방울이 떨어져 종이에 확 퍼져요.
 *   x, y = 서예 영역 기준 위치(%), size = 크기(서예 폭 대비 %), t = 떨어지는 시각(초),
 *   o = 다 퍼진 뒤 남는 진하기 (글씨를 가리지 않게 반투명), rot = 회전
 * ========================================================================= */

const SPILLS = [
  { x: 9, y: 7, size: 48, img: 3, rot: 120, t: 1.0, o: 0.32 },
  { x: 80, y: 14, size: 92, img: 1, rot: 0, t: 1.3, o: 0.36 },
  { x: 12, y: 66, size: 86, img: 2, rot: 200, t: 1.95, o: 0.34 },
  { x: 88, y: 84, size: 78, img: 3, rot: 40, t: 2.6, o: 0.36 },
];

function InkSpills() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {SPILLS.map((sp, i) => (
        <div
          key={i}
          className="absolute aspect-square -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${sp.x}%`, top: `${sp.y}%`, width: `${sp.size}%` }}
        >
          {/* 떨어지는 잉크 방울 */}
          <span
            className="c26-drop absolute left-1/2 top-1/2 block h-[6%] w-[3.2%] rounded-full bg-[#f7f7f7] shadow-[0_0_6px_rgba(255,255,255,0.6)]"
            style={{ animationDelay: `${sp.t - 0.34}s` }}
          />
          {/* 닿는 순간 가운데에서 바깥으로 퍼지는 잉크 자국 */}
          <div className="absolute inset-0" style={{ transform: `rotate(${sp.rot}deg)` }}>
            <img
              src={`/concert2026/spill${sp.img}.png`}
              alt=""
              draggable={false}
              className="c26-spill h-full w-full"
              style={{ animationDelay: `${sp.t}s`, ["--c26-o" as string]: sp.o } as CSSProperties}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- 느린 폰 대비 (가벼운 모드) ----------
 * 기본은 모든 폰에서 서예를 한 획씩 써요.
 * 처음엔 CPU 코어 수 · 메모리로 "느린 폰"을 미리 골라냈는데, 멀쩡한 폰(특히 아이폰)까지 걸려서 뺐어요.
 * 대신 실제로 쓰는 동안 화면이 심하게 끊길 때(1초에 20장도 못 그릴 때)만 그 자리에서 가볍게 바꿔요.
 *   → 남은 획은 건너뛰고 완성본을 바로 보여주고, <html> 에 c26-lite 를 붙여 무거운 효과를 빼요.
 */
let liteMode = false;
function enableLite() {
  liteMode = true;
  document.documentElement.classList.add("c26-lite");
}

function BrushWriting() {
  const uid = useId().replace(/:/g, "");
  const [ready, setReady] = useState(false);
  // "skip": 쓰다가 심하게 끊겨서 완성본으로 건너뜀 / null: 기본(획 하나씩 쓰기)
  const [lite, setLite] = useState<"skip" | null>(null);

  useEffect(() => {
    return () => document.documentElement.classList.remove("c26-lite");
  }, []);

  // 스프라이트 이미지를 다 받은 뒤에 쓰기 시작 (느린 데이터에서도 빈 획이 그려지지 않게)
  useEffect(() => {
    const img = new Image();
    const go = () => setReady(true);
    img.onload = go;
    img.onerror = go;
    img.src = BRUSH_SPRITE.src;
    const fallback = window.setTimeout(go, 3000);
    return () => window.clearTimeout(fallback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 쓰기 시작 후 1.5초 동안 프레임 수를 세서, 심하게 끊길 때만 가벼운 모드로
  useEffect(() => {
    if (!ready || lite) return;
    let frames = 0;
    let raf = 0;
    let start = 0;
    const tick = (t: number) => {
      if (!start) start = t;
      frames++;
      if (t - start < 1500) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const fps = (frames * 1000) / (t - start);
      if (fps < 20) {
        enableLite();
        setLite("skip");
      }
    };
    // 서예가 실제로 움직이기 시작하는 시점(첫 획)쯤부터 재요
    const timer = window.setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, 900);
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [ready, lite]);

  const finalClass = lite === "skip" ? "c26-brush-skip" : "c26-brush-final";

  return (
    <div
      className={`relative w-full ${ready ? "" : "c26-wait"}`}
      role="img"
      aria-label={`${C.titleHanja} ${C.titleKorean}`}
    >
      {/* 흰 잉크 번짐 — 글씨 뒤에 깔려서 글씨를 가리지 않아요 */}
      <InkSpills />
      {/* 완성본 — 자리(크기)를 잡아주고, 다 쓴 뒤 쓰던 획들 위로 살짝 덮이며 마무리 */}
      <img
        src="/concert2026/brush.png"
        alt=""
        aria-hidden="true"
        draggable={false}
        className={`${finalClass} relative z-20 w-full`}
        style={lite ? undefined : { animationDelay: `${BRUSH_END}s` }}
      />
      {/* 쓰는 중인 획들 — 가벼운 모드에선 아예 그리지 않아요 (마스크 31개가 가장 무거운 부분) */}
      {!lite && (
        <svg
          viewBox={`0 0 ${BRUSH_VIEWBOX.width} ${BRUSH_VIEWBOX.height}`}
          className="c26-brush-live absolute inset-0 z-10 h-full w-full"
          style={{ animationDelay: `${BRUSH_END + 0.8}s` }}
          aria-hidden="true"
        >
          <defs>
            {BRUSH_STROKES.map((st, i) => (
              <mask
                key={i}
                id={`${uid}m${i}`}
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width={BRUSH_VIEWBOX.width}
                height={BRUSH_VIEWBOX.height}
              >
                <path
                  d={st.d}
                  fill="none"
                  stroke="#fff"
                  strokeWidth={st.w}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                  className="c26-stroke"
                  style={{ animationDelay: `${st.delay}s`, animationDuration: `${st.dur}s` }}
                />
              </mask>
            ))}
          </defs>
          {BRUSH_STROKES.map((st, i) => (
            <g key={i} mask={`url(#${uid}m${i})`}>
              {/* 스프라이트에서 이 획 조각만 잘라서 제자리에 */}
              <svg x={st.x} y={st.y} width={st.bw} height={st.bh} viewBox={`${st.sx} ${st.sy} ${st.bw} ${st.bh}`}>
                <image href={BRUSH_SPRITE.src} width={BRUSH_SPRITE.width} height={BRUSH_SPRITE.height} />
              </svg>
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}

/* =========================================================================
 * 인트로 (안개 → 서예 등장)
 * ========================================================================= */

/** 스크롤하면 서예가 작아지고 흐려지며 뒤로 물러나는 깊이감 (손가락 움직임에 맞춰서만 움직임) */
/* ---------- 스크롤 효과 다시 맞추기 ----------
 * 첫 화면 깊이 효과 · 한자 번호 시차는 "스크롤할 때" 다시 계산해요.
 * 그런데 아이폰 사파리는 다른 사이트(유튜브 등)에 갔다가 돌아오거나, 앱 전환 · 화면 회전 · 덮개 화면을 닫을 때
 * 스크롤 위치를 바꾸면서도 스크롤 신호를 안 보내는 경우가 있어요.
 * → 효과가 "아래로 내린 상태" 그대로 남아서 서예가 흐리게 밀리고 카운트다운이 겹쳐 보였어요.
 * 그래서 스크롤 말고도 이런 순간들에 한 번씩 다시 계산하게 묶어 둬요.
 */
function listenScrollLike(cb: () => void) {
  const onVisible = () => {
    if (document.visibilityState === "visible") cb();
  };
  // 돌아온 직후엔 브라우저가 스크롤 위치를 한두 프레임 늦게 되돌려 놓기도 해서, 조금 뒤에 한 번 더
  const onReturn = () => {
    cb();
    window.setTimeout(cb, 120);
    window.setTimeout(cb, 400);
  };
  window.addEventListener("scroll", cb, { passive: true });
  window.addEventListener("resize", cb);
  window.addEventListener("pageshow", onReturn);
  window.addEventListener("focus", onReturn);
  document.addEventListener("visibilitychange", onVisible);
  return () => {
    window.removeEventListener("scroll", cb);
    window.removeEventListener("resize", cb);
    window.removeEventListener("pageshow", onReturn);
    window.removeEventListener("focus", onReturn);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

/** 덮개 화면(팀 페이지 · 혜택 창)을 닫은 뒤 스크롤 효과를 다시 맞추라고 알려줘요 */
function refreshScrollEffects() {
  requestAnimationFrame(() => requestAnimationFrame(() => window.dispatchEvent(new Event("scroll"))));
}

function useHeroDepth() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const apply = () => {
      raf = 0;
      // 첫 화면 높이의 70% 만큼 내려갈 동안 0 → 1
      const p = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.7)));
      el.style.transform = `translate3d(0, ${-p * 14}%, 0) scale(${1 - p * 0.26})`;
      // 흐림은 느린 폰에선 빼요 (스크롤마다 첫 화면 전체를 다시 흐리게 계산해야 해서 가장 무거움)
      el.style.filter = !liteMode && p > 0.01 ? `blur(${(p * 5).toFixed(2)}px)` : "";
      el.style.opacity = String(1 - p * 0.72);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    apply();
    const stop = listenScrollLike(onScroll);
    return () => {
      stop();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return ref;
}

function Intro() {
  const depthRef = useHeroDepth();
  const { closed: applyClosed } = useApplyDeadline(); // 마감 후엔 첫 화면의 "사전 신청하기" 버튼도 숨겨요
  // 모바일: 첫 화면(100svh) 정중앙에 서예, 날짜·카운트다운·버튼은 그 바로 아래로 이어짐
  // PC: 한 화면 안에 왼쪽 서예 + 오른쪽 문구
  return (
    <section className="relative overflow-hidden md:h-[100svh] md:min-h-[620px]">
      {/* 배경 연기 (포스터 오른쪽 부분) */}
      <img
        src="/concert2026/smoke.jpg"
        alt=""
        aria-hidden="true"
        className="c26-smoke absolute inset-0 h-full w-full object-cover object-[70%_center] opacity-60 md:left-auto md:w-[66%] md:opacity-75 md:[mask-image:linear-gradient(to_right,transparent,#000_45%)]"
      />
      {/* 연기 이미지 왼쪽/아래를 검게 눌러서 글씨가 잘 보이게 */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/10 md:via-black/60" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent" />

      {/* 계속 흐르는 은은한 연기 */}
      <div className="c26-wisp left-[-20%] top-[10%] h-[50%] w-[90%]" />
      <div className="c26-wisp bottom-[5%] right-[-25%] h-[45%] w-[85%]" style={{ animationDelay: "-12s" }} />

      {/* 서예 + 먹물 + 원 */}
      {/* PC: 가운데 1100px 폭 안에서 왼쪽 서예 · 오른쪽 문구 (큰 모니터에서도 양끝으로 벌어지지 않게) */}
      {/* 모바일: 서예 → 부제 → 카운트다운을 세로로 "실제 자리를 차지하며" 쌓고, 묶음 전체를 화면 가운데에.
          (예전엔 부제·카운트다운이 서예 아래에 떠 있어서(absolute), 화면이 짧은 폰에서 아래 날짜와 겹쳤어요)
          화면 높이를 꽉 채우지 않고 내용만큼만 차지해서, 날짜 · 버튼이 카운트다운 바로 아래에 붙어 나와요.
          위 여백(pt)은 "서예 한가운데가 화면 정중앙에 오도록" 계산해요:
            화면 높이의 절반 − 서예 높이의 절반 (서예 높이 = 폭 × 1.242, brush.png 가 900×1118 이라서)
          아주 짧은 화면에서도 위 제목과 안 겹치게 최소 56px 은 남겨요. */}
      <div className="relative z-10 mx-auto flex w-full flex-col items-center px-6 pt-[max(56px,calc(50svh_-_min(66vw,360px)_*_0.621))] md:h-full md:max-w-[1100px] md:flex-row md:justify-start md:px-10 md:py-0">
        <div className="relative w-[min(66vw,360px)] md:w-[min(34vw,460px)]">
          {/* 스크롤 깊이감이 걸리는 묶음: 먹물 · 원 · 서예 · 윤무 (아래 부제·카운트다운은 제외) */}
          <div ref={depthRef} className="relative origin-center will-change-transform">
          {/* 먹물 번짐 */}
          <InkBlot
            seed={3}
            className="c26-ink absolute -right-[18%] top-[2%] w-[78%]"
            style={{ animationDelay: "0.9s" }}
          />
          <InkBlot
            seed={11}
            className="c26-ink absolute -left-[22%] bottom-[-14%] w-[70%]"
            style={{ animationDelay: "1.2s" }}
          />

          {/* 엔소(원) */}
          <svg
            viewBox="0 0 400 400"
            className="c26-enso-spin pointer-events-none absolute left-1/2 top-1/2 w-[135%] -translate-x-1/2 -translate-y-1/2"
            aria-hidden="true"
          >
            <circle
              className="c26-enso-draw"
              cx="200"
              cy="200"
              r="180"
              fill="none"
              stroke="rgba(215,225,235,0.35)"
              strokeWidth="1.2"
              strokeLinecap="round"
              pathLength={1000}
              strokeDasharray="930 70"
            />
            <circle
              className="c26-enso-draw"
              cx="200"
              cy="200"
              r="192"
              fill="none"
              stroke="rgba(124,196,238,0.25)"
              strokeWidth="0.6"
              pathLength={1000}
              style={{ animationDelay: "2.6s" }}
            />
          </svg>

          {/* 한글 읽기 「윤무」 — 서예 오른쪽에 작게 세로로 (서예·잉크 그림을 방해하지 않게) */}
          <div
            aria-hidden="true"
            className="c26-rise pointer-events-none absolute -right-[4%] top-[5%] z-30 flex flex-col items-center gap-2 md:-right-[6%] md:top-[7%]"
            style={{ animationDelay: afterBrush(-0.3) }}
          >
            <span className="h-6 w-px bg-white/40 md:h-8" />
            <span className="c26-serif text-[clamp(15px,4.2vw,24px)] font-bold tracking-[0.45em] text-white/80 [writing-mode:vertical-rl] [text-shadow:0_0_12px_rgba(0,0,0,0.8)]">
              윤무
            </span>
          </div>

          {/* 輪舞 서예 — 한 획씩 써지는 애니메이션 */}
          <BrushWriting />


          </div>

        </div>

        {/* 모바일: 서예 바로 아래 부제 (위치용 div 와 애니메이션 p 를 나눠야 transform 이 안 겹쳐요) */}
        <div className="mt-12 w-full text-center md:hidden [@media(max-height:760px)]:mt-7">
          <p className="c26-rise c26-serif text-[15px] text-white/75" style={{ animationDelay: afterBrush(-0.2) }}>
            : {C.subtitle}
          </p>
          {/* 스크롤 안내 — 부제와 카운트다운 사이, 작고 옅게 */}
          <a
            href="#info"
            className="c26-rise mt-5 inline-flex flex-col items-center gap-1.5 text-white/40 [@media(max-height:760px)]:mt-3"
            style={{ animationDelay: afterBrush(0.2) }}
            aria-label="아래로 스크롤해서 더 보기"
          >
            <span className="font-mono text-[9px] tracking-[0.35em]">SCROLL</span>
            <span className="relative block h-6 w-px overflow-hidden bg-white/10">
              <span className="c26-scroll-line absolute inset-0 bg-white/70" />
            </span>
          </a>
          <div className="c26-rise mt-4" style={{ animationDelay: afterBrush(0.1) }}>
            <Countdown />
          </div>
        </div>
      </div>

      {/* 문구 */}
      <div id="info" className="relative z-10 mt-10 scroll-mt-8 px-6 pb-16 text-center md:absolute md:mt-0 md:right-[max(40px,calc(50%-510px))] md:top-1/2 md:max-w-sm md:-translate-y-1/2 md:p-0 md:text-left">
        <p className="c26-rise c26-serif mb-4 hidden text-lg text-white/75 md:block" style={{ animationDelay: afterBrush(-0.2) }}>
          : {C.subtitle}
        </p>
        <div className="c26-rise space-y-1" style={{ animationDelay: afterBrush(0) }}>
          <p className="c26-serif text-xl font-bold text-white md:text-2xl">{C.dateText}</p>
          <p className="break-keep text-sm leading-relaxed text-white/65">
            {C.timeText}
            {/* 좁은 폰에서는 장소를 다음 줄로 내려서 "홀" 한 글자만 떨어지는 걸 막아요 */}
            <span className="hidden sm:inline md:hidden lg:inline"> · </span>
            <br className="sm:hidden md:inline lg:hidden" />
            {C.location.venueName}
          </p>
        </div>
        {/* 모바일은 서예 바로 아래에 카운트다운이 있어서 PC 에서만 */}
        <div className="c26-rise mt-4 hidden md:block" style={{ animationDelay: afterBrush(0.15) }}>
          <Countdown />
        </div>
        <div
          className="c26-rise mt-5 flex justify-center gap-2.5 md:justify-start"
          style={{ animationDelay: afterBrush(0.3) }}
        >
          {!applyClosed && (
            <a
              href={C.applyUrl}
              target="_blank"
              rel="noreferrer"
              className="c26-shine rounded-full bg-[#e9eef2] px-6 py-3 text-sm font-semibold text-black transition-transform active:scale-95 md:hover:-translate-y-0.5"
            >
              사전 신청하기
            </a>
          )}
          <a
            href="#teams"
            {...inkHandlers}
            className="c26-inkbtn rounded-full border border-white/25 px-6 py-3 text-sm text-white/85 transition-colors hover:border-white/60"
          >
            라인업 보기
          </a>
        </div>
      </div>

      {/* ── 맨 위에 덮여 있다가 걷히는 안개 ── */}
      <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden" aria-hidden="true">
        <div className="c26-veil absolute inset-0" />
        <div className="c26-fog c26-fog-l left-[-30%] top-[-10%] h-[70%] w-[110%]" />
        <div className="c26-fog c26-fog-r right-[-30%] top-[20%] h-[70%] w-[110%]" />
        <div className="c26-fog c26-fog-l bottom-[-15%] left-[-20%] h-[60%] w-[90%]" style={{ animationDelay: "0.3s" }} />
        <div className="c26-fog c26-fog-r bottom-[-10%] right-[-20%] h-[55%] w-[90%]" style={{ animationDelay: "0.2s" }} />
        <div className="c26-fog c26-fog-u left-[10%] top-[25%] h-[50%] w-[80%]" style={{ animationDelay: "0.4s" }} />
      </div>
    </section>
  );
}

/* ---------- 사전 신청 마감까지 남은 날 ----------
 * 공연 카운트다운과 같은 숫자판(FlipCell)을 크게 써요.
 *   마감 전날까지: "신청 마감까지 23 일"
 *   마감 당일:     "TODAY"  (오늘 23:59 마감)
 *   마감 후:       "CLOSED" + 신청 버튼 대신 "현장 입장은 가능해요" 안내
 * 날짜 차이는 시간이 아니라 "한국 날짜" 기준으로 세서, 밤 11시에 봐도 내일이 마감이면 1일로 보여요.
 */
const APPLY_DEADLINE_MS = new Date(C.applyDeadlineAt).getTime();

function useApplyDeadline() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    // 날짜 단위라 1초마다 볼 필요는 없어서 30초 간격 (마감 순간도 최대 30초 안에 반영돼요)
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const closed = now > APPLY_DEADLINE_MS;
  const daysLeft = kstDayIndex(APPLY_DEADLINE_MS) - kstDayIndex(now);
  return { closed, daysLeft };
}

function ApplyDeadline() {
  const { closed, daysLeft } = useApplyDeadline();
  const isToday = !closed && daysLeft <= 0;

  let label: string;
  let cells: ReactNode;
  let aria: string;
  if (closed) {
    label = "신청";
    cells = "CLOSED".split("").map((ch, i) => <FlipCell key={i} char={ch} large />);
    aria = "사전 신청이 마감되었습니다";
  } else if (isToday) {
    label = "신청 마감";
    cells = "TODAY".split("").map((ch, i) => <FlipCell key={i} char={ch} large />);
    aria = "오늘 사전 신청이 마감됩니다";
  } else {
    label = "신청 마감까지";
    const digits = String(Math.min(99, daysLeft)).padStart(2, "0").split("");
    cells = (
      <>
        {digits.map((d, i) => (
          <FlipCell key={digits.length - i} char={d} large />
        ))}
        <span className="c26-serif mb-2 ml-1.5 text-base text-white/70 md:text-lg">일</span>
      </>
    );
    aria = `사전 신청 마감까지 ${daysLeft}일 남음`;
  }

  return (
    <div className="text-center" role="timer" aria-label={aria}>
      <p className="c26-serif text-[10px] tracking-[0.4em] text-[#7cc4ee] md:text-[11px]">{label}</p>
      <div className="mt-3 mb-2.5 flex items-end justify-center gap-1">{cells}</div>
      <p className="text-xs text-white/50">
        {closed ? "사전 신청이 마감되었어요" : isToday ? "오늘 23:59까지 신청할 수 있어요" : C.applyDeadlineText}
      </p>
    </div>
  );
}

/** 하단 고정 버튼 문구 — "D-28 · 사전 신청하기" */
function DockLabel() {
  const cd = useCountdown();
  if (cd.phase !== "before") return <>사전 신청하기</>;
  return (
    <>
      <span className="mr-2 rounded-full bg-black px-2.5 py-0.5 text-[12px] text-white">{dDayLabel(cd)}</span>
      사전 신청하기
    </>
  );
}

/* =========================================================================
 * 팀 상세 시트 (모바일: 아래에서 올라오는 시트 / PC: 가운데 모달)
 * ========================================================================= */

/** 협찬처 혜택 창 — body 에 포털로 붙이고, 열려 있는 동안 뒤 스크롤을 막아요 */
const SPONSOR_CATEGORY: Record<string, string> = {
  CAFE: "카페",
  FOOD: "식당",
  PUB: "술집",
  BEAUTY: "뷰티",
  PHOTO: "사진",
  PLAY: "놀거리",
  FITNESS: "운동",
  ETC: "기타",
};

function SponsorSheet({ sponsor, onClose }: { sponsor: ConcertSponsor; onClose: () => void }) {
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      refreshScrollEffects();
    };
  }, [onClose]);

  return createPortal(
    <div
      className="c26-sheet-backdrop fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm md:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${sponsor.name} 혜택`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="c26-sheet relative w-full rounded-t-3xl border border-white/10 bg-[#0b0e11] px-6 pb-[calc(env(safe-area-inset-bottom)+28px)] pt-3 md:max-w-md md:rounded-3xl md:pb-8 md:pt-8"
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20 md:hidden" />
        <p className="font-mono text-[10px] tracking-[0.2em] text-[#7cc4ee]">
          {sponsor.category} · {SPONSOR_CATEGORY[sponsor.category] ?? sponsor.category}
        </p>
        <h3 className="c26-serif mt-2 break-keep text-2xl font-bold text-white">{sponsor.name}</h3>
        <p className="mt-4 break-keep text-[15px] leading-relaxed text-white/80">
          {sponsor.benefit || "혜택은 곧 안내돼요."}
        </p>
        <p className="mt-5 text-xs text-white/40">공연 당일 사전 신청 화면을 보여주세요.</p>
        {sponsor.url && (
          <a
            href={sponsor.url}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-block text-sm text-[#9fd3f3] underline underline-offset-4"
          >
            매장 정보 보기 →
          </a>
        )}
        <button
          onClick={onClose}
          className="mt-7 w-full rounded-full border border-white/20 py-3 text-sm text-white/80 transition-colors hover:border-white/50"
        >
          닫기
        </button>
      </div>
    </div>,
    document.body
  );
}

/* =========================================================================
 * 인스타 스토리 — 표지 / 오늘의 D-day 고르기
 * ========================================================================= */

/** 오늘 기준 D-day 숫자 (당일 0, 지나면 음수) */
const storyDday = () => kstDayIndex(EVENT_MS) - kstDayIndex(Date.now());

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * 오늘의 D-day 스토리 이미지를 그 자리에서 그려요 (1080×1920, 인스타 스토리 크기).
 * 연기 배경 + 輪舞 서예 + "공연까지 D-24" + 날짜 · 장소 · 주소.
 * 서버에 미리 만들어 둘 필요 없이, 들어온 날짜에 맞는 숫자로 매일 새로 만들어져요.
 */
async function makeDdayStory(): Promise<File | null> {
  try {
    const W = 1080;
    const H = 1920;
    const d = storyDday();
    const [smoke, brush] = await Promise.all([loadImage("/concert2026/smoke.jpg"), loadImage("/concert2026/brush.png")]);
    // 명조체가 다 받아진 뒤에 그려야 글씨가 기본 글꼴로 안 나와요
    await Promise.all([
      document.fonts.load('900 300px "Noto Serif KR"'),
      document.fonts.load('700 52px "Noto Serif KR"'),
    ]).catch(() => {});

    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
    // 연기 배경 — 화면을 꽉 채우게(cover) 맞추고 반투명하게
    const sc = Math.max(W / smoke.width, H / smoke.height);
    ctx.globalAlpha = 0.55;
    ctx.drawImage(smoke, (W - smoke.width * sc) / 2, (H - smoke.height * sc) / 2, smoke.width * sc, smoke.height * sc);
    ctx.globalAlpha = 1;
    const g = ctx.createLinearGradient(0, H * 0.42, 0, H);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.92)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "500 30px ui-monospace, Menlo, monospace";
    ctx.fillText("2 0 2 6   A N N U A L   C O N C E R T", W / 2, 190);

    const bw = 640;
    const bh = (brush.height * bw) / brush.width;
    ctx.drawImage(brush, (W - bw) / 2, 270, bw, bh);

    const serif = '"Noto Serif KR", serif';
    ctx.fillStyle = "#7cc4ee";
    ctx.font = `700 52px ${serif}`;
    ctx.fillText(d > 0 ? "공연까지" : "바로 오늘이에요", W / 2, 1230);
    ctx.fillStyle = "#fff";
    ctx.font = `900 ${d > 0 ? 300 : 230}px ${serif}`;
    ctx.fillText(d > 0 ? `D-${d}` : "D-DAY", W / 2, 1530);
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.font = `700 54px ${serif}`;
    ctx.fillText(`${C.dateText} 18:30`, W / 2, 1660);
    ctx.fillStyle = "rgba(255,255,255,0.62)";
    ctx.font = "44px Pretendard, sans-serif";
    ctx.fillText(`${C.location.venueName} · 전석 무료`, W / 2, 1740);
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "30px ui-monospace, Menlo, monospace";
    ctx.fillText(PAGE_URL.replace(/^https?:\/\//, ""), W / 2, 1850);

    const blob = await new Promise<Blob | null>((r) => cv.toBlob(r, "image/jpeg", 0.9));
    if (!blob) return null;
    return new File([blob], `2026concert-D${d > 0 ? d : "DAY"}.jpg`, { type: "image/jpeg" });
  } catch {
    return null;
  }
}

function StoryPicker({
  onClose,
  onPick,
  coverFile,
  coverMissing,
}: {
  onClose: () => void;
  onPick: (file: File | null, fallbackHref: string | null) => void;
  coverFile: File | null;
  coverMissing: boolean;
}) {
  const d = storyDday();
  const showDday = d >= 0; // 공연이 지나면 D-day 이미지는 안 보여줘요
  const [ddayFile, setDdayFile] = useState<File | null>(null);
  const [ddayUrl, setDdayUrl] = useState<string | null>(null);

  // 창이 열리자마자 D-day 이미지를 그려 둬요.
  // (아이폰은 누른 "직후"에만 공유 창을 열 수 있어서, 누른 뒤에 그리기 시작하면 공유 창이 안 떠요)
  useEffect(() => {
    if (!showDday) return;
    let url: string | null = null;
    let alive = true;
    makeDdayStory().then((f) => {
      if (!alive || !f) return;
      url = URL.createObjectURL(f);
      setDdayFile(f);
      setDdayUrl(url);
    });
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [showDday]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      refreshScrollEffects();
    };
  }, [onClose]);

  const Option = ({
    label,
    sub,
    src,
    ready,
    onClick,
  }: {
    label: string;
    sub: string;
    src: string | null;
    ready: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      disabled={!ready}
      className="group flex flex-1 flex-col items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.03] p-3 transition-colors hover:border-white/35 disabled:opacity-60"
    >
      <span className="block aspect-[9/16] w-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
        {src ? (
          <img src={src} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full w-full place-items-center text-[11px] text-white/40">만드는 중…</span>
        )}
      </span>
      <span className="text-center">
        <span className="c26-serif block text-[15px] font-bold text-white">{label}</span>
        <span className="mt-0.5 block text-[11px] text-white/50">{sub}</span>
      </span>
    </button>
  );

  return createPortal(
    <div
      className="c26-sheet-backdrop fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm md:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="인스타 스토리 이미지 고르기"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="c26-sheet relative w-full rounded-t-3xl border border-white/10 bg-[#0b0e11] px-5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-3 md:max-w-md md:rounded-3xl md:pb-7 md:pt-7"
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20 md:hidden" />
        <h3 className="c26-serif text-center text-lg font-bold text-white">어떤 이미지로 올릴까요?</h3>
        <p className="mt-1 text-center text-xs text-white/50">링크는 복사해 뒀어요 · 스토리의 링크 스티커에 붙여넣기</p>
        <div className="mt-5 flex gap-3">
          <Option
            label="표지"
            sub="輪舞 포스터"
            src={coverMissing ? null : STORY_IMAGE_URL}
            ready={!coverMissing}
            onClick={() => onPick(coverFile, coverFile ? null : STORY_IMAGE_URL)}
          />
          {showDday && (
            <Option
              label={d > 0 ? `오늘의 D-${d}` : "오늘은 D-DAY"}
              sub="매일 숫자가 바뀌어요"
              src={ddayUrl}
              ready={!!ddayFile}
              onClick={() => onPick(ddayFile, null)}
            />
          )}
        </div>
        <button onClick={onClose} className="mt-4 w-full py-2.5 text-xs text-white/45 underline underline-offset-4">
          닫기
        </button>
      </div>
    </div>,
    document.body
  );
}

/* =========================================================================
 * 팀 상세 — 프로그램북 한 장
 * 주소가 /2026concert/{팀 id} 일 때 공연 페이지 위에 전체 화면으로 덮여요.
 * 공연 페이지는 밑에 그대로 남아 있어서, 뒤로가기 하면 보던 스크롤 위치(무대 순서)로 돌아가요.
 * ========================================================================= */

/** 곡 유튜브 주소 — 따로 안 적었으면 "가수 곡제목" 유튜브 검색으로 */
function songUrl(song: ConcertTeam["songs"][number]) {
  return song.youtube || `https://www.youtube.com/results?search_query=${encodeURIComponent(`${song.artist} ${song.title}`)}`;
}

function TeamPage({
  index,
  onBack,
  onGo,
  onShare,
}: {
  index: number;
  onBack: () => void;
  onGo: (i: number) => void;
  onShare: (team: ConcertTeam) => void;
}) {
  const team = C.teams[index];
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const prev = C.teams[index - 1];
  const next = C.teams[index + 1];
  const members = [...team.members].sort((a, b) => Number(b === team.leader) - Number(a === team.leader));

  // 멤버 이름이 두 줄로 넘어가면, 둘째 줄 맨 앞에 오는 " · " 는 숨겨요.
  // (줄이 어디서 바뀌는지는 화면 너비에 따라 달라서, 그려진 뒤 위치를 재서 판단해요)
  const membersRef = useRef<HTMLUListElement>(null);
  useLayoutEffect(() => {
    const ul = membersRef.current;
    if (!ul) return;
    const fix = () => {
      const items = Array.from(ul.children) as HTMLElement[];
      // 먼저 모두 보이게 한 뒤 줄 위치를 재요 (숨긴 상태로 재면 줄바꿈 위치가 달라져요)
      items.forEach((li) => {
        const sep = li.querySelector<HTMLElement>("[data-sep]");
        if (sep) {
          sep.style.display = "";
          sep.style.visibility = "";
        }
      });
      // 앞에서부터 차례로: 줄 맨 앞이면 점을 빼요.
      // 점을 빼서 이름이 좁아지면 윗줄로 다시 올라갈 수도 있는데, 그땐 점 자리만 비워 두고(보이지만 않게) 그 줄에 남겨요.
      items.forEach((li, i) => {
        const sep = li.querySelector<HTMLElement>("[data-sep]");
        if (!sep || i === 0) return;
        if (li.offsetTop <= items[i - 1].offsetTop + 2) return;
        sep.style.display = "none";
        if (li.offsetTop <= items[i - 1].offsetTop + 2) {
          sep.style.display = "";
          sep.style.visibility = "hidden";
        }
      });
    };
    fix();
    const ro = new ResizeObserver(fix);
    ro.observe(ul);
    return () => ro.disconnect();
  }, [index]);

  // 열려 있는 동안 뒤 페이지 스크롤 잠금 + ESC 로 닫기
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      refreshScrollEffects();
    };
  }, [onBack]);

  // 이전/다음 무대로 넘어가면 맨 위부터 + 탭 제목도 팀 이름으로
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    const prevTitle = document.title;
    document.title = `${team.name} · ${C.titleHanja} ${C.titleKorean}`;
    return () => {
      document.title = prevTitle;
    };
  }, [index, team.name]);

  return createPortal(
    <div
      ref={scrollRef}
      onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 120)}
      className="c26-page-in fixed inset-0 z-[60] overflow-y-auto bg-black text-[#d6dbe0]"
      role="dialog"
      aria-modal="true"
      aria-label={`${team.name} 무대 정보`}
    >
      {/* 상단 바 — 스크롤하면 가운데에 팀 이름이 나타나요 */}
      <div className="sticky top-0 z-10 flex h-[calc(env(safe-area-inset-top)+56px)] items-end justify-between bg-gradient-to-b from-black via-black/90 to-transparent px-4 pb-2">
        <button
          onClick={onBack}
          aria-label="무대 순서로 돌아가기"
          className="grid h-10 w-10 place-items-center rounded-full bg-white/[0.08] text-lg text-white transition-colors hover:bg-white/15"
        >
          ←
        </button>
        <span
          className={`c26-serif text-xs tracking-[0.2em] text-white/55 transition-opacity duration-300 ${scrolled ? "opacity-100" : "opacity-0"}`}
        >
          第{index + 1}幕 · {team.name}
        </span>
        <button
          onClick={() => onShare(team)}
          aria-label="이 무대 공유하기"
          className="grid h-10 w-10 place-items-center rounded-full bg-white/[0.08] text-base text-white transition-colors hover:bg-white/15"
        >
          ↗
        </button>
      </div>

      <div className="mx-auto max-w-[520px] px-[18px] pb-[calc(env(safe-area-inset-bottom)+36px)] pt-2">
        {/* 프로그램북 한 장 — 이중 테두리 */}
        <article key={team.id} className="c26-rise rounded-[3px] border border-white/20 p-1.5">
          <div className="border border-white/10 px-5 pb-7 pt-8 text-center md:px-8">
            {/* 자간(tracking)은 마지막 글자 뒤에도 붙어서 글씨가 왼쪽으로 쏠려 보여요 → 왼쪽에 같은 만큼 여백(pl)을 줘서 정확히 가운데로 */}
            <p className="pl-[0.4em] font-mono text-[9px] tracking-[0.4em] text-[#7cc4ee]">
              第{index + 1}幕 · PROGRAMME
            </p>
            <h1 className="c26-serif mt-3 break-keep text-[34px] font-black leading-tight text-white md:text-[40px]">
              {team.name}
            </h1>
            <hr className="mx-auto my-6 w-8 border-white/15" />

            {/* 곡 — 줄 전체가 유튜브 링크. 빨간 재생 버튼으로 "누르면 유튜브"가 한눈에 보이게 */}
            <p className="pl-[0.3em] text-[10px] tracking-[0.3em] text-white/45">SONG</p>
            <p className="mt-1.5 text-[11px] text-white/40">곡을 누르면 유튜브에서 들을 수 있어요</p>
            <ul className="mt-3 text-left">
              {team.songs.map((song) => (
                <li key={song.artist + song.title}>
                  <a
                    href={songUrl(song)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${song.artist} - ${song.title} 유튜브에서 듣기`}
                    className="group flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-white/[0.05] active:bg-white/[0.08]"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-2">
                        <span className="break-keep text-[15px] font-semibold text-white underline decoration-white/25 underline-offset-4 group-hover:decoration-white/70">
                          {song.title}
                        </span>
                        <span className="h-px flex-1 translate-y-[-3px] border-b border-dotted border-white/25" aria-hidden="true" />
                      </span>
                      <span className="mt-1 block text-xs text-white/55">{song.artist}</span>
                    </span>
                    {/* 재생 버튼 — 빨간색은 페이지에서 혼자 튀어서, 페이지 톤(흰 테두리 + 하늘색 ▶)으로.
                        누르거나 마우스를 올리면 흰 바탕으로 채워져요 */}
                    <span
                      className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/25 bg-white/[0.06] py-1.5 pl-2 pr-2.5 text-[11px] font-semibold text-white/85 transition-all group-hover:border-[#e9eef2] group-hover:bg-[#e9eef2] group-hover:text-black group-active:scale-95 [&>svg]:text-[#7cc4ee] group-hover:[&>svg]:text-black"
                      aria-hidden="true"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5.5v13a1 1 0 0 0 1.52.85l10.4-6.5a1 1 0 0 0 0-1.7L9.52 4.65A1 1 0 0 0 8 5.5Z" />
                      </svg>
                      YouTube
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            {/* 멤버 — 이름을 " · " 로 이어 적고 팀장은 하늘색.
                이름 하나하나를 칸으로 나눠 flex-wrap 으로 놓아야, 화면이 좁으면 이름 단위로 다음 줄로 넘어가요.
                (예전엔 이름 사이에 띄어쓰기 없이 붙어 있어서 줄을 못 바꾸고 화면 밖으로 넘쳤어요) */}
            <p className="mt-8 pl-[0.3em] text-[10px] tracking-[0.3em] text-white/45">
              MEMBERS <span className="ml-1 text-white/30">{team.members.length}</span>
            </p>
            <ul
              ref={membersRef}
              className="c26-serif mt-3 flex flex-wrap items-center justify-center gap-y-1.5 text-[15px] leading-relaxed text-white"
            >
              {members.map((m, mi) => (
                <li key={m} className="flex items-center whitespace-nowrap">
                  {mi > 0 && (
                    <span data-sep className="mx-2 text-white/30" aria-hidden="true">
                      ·
                    </span>
                  )}
                  {m === team.leader ? (
                    <span className="flex items-center gap-1 font-bold text-[#9fd3f3]">
                      {m}
                      <span className="rounded-full bg-[#7cc4ee] px-1.5 py-px font-sans text-[9px] font-bold leading-[1.5] text-black">
                        팀장
                      </span>
                    </span>
                  ) : (
                    m
                  )}
                </li>
              ))}
            </ul>
          </div>
        </article>

        {/* 이전 · 다음 무대 */}
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            onClick={() => prev && onGo(index - 1)}
            disabled={!prev}
            className="rounded-2xl border border-white/12 px-3.5 py-3 text-left transition-colors hover:border-white/35 disabled:opacity-25"
          >
            <span className="block text-[10px] tracking-[0.15em] text-white/45">← 이전 무대</span>
            <span className="c26-serif mt-1 block truncate text-sm font-bold text-white">{prev ? prev.name : "—"}</span>
          </button>
          <button
            onClick={() => next && onGo(index + 1)}
            disabled={!next}
            className="rounded-2xl border border-white/12 px-3.5 py-3 text-right transition-colors hover:border-white/35 disabled:opacity-25"
          >
            <span className="block text-[10px] tracking-[0.15em] text-white/45">다음 무대 →</span>
            <span className="c26-serif mt-1 block truncate text-sm font-bold text-white">{next ? next.name : "—"}</span>
          </button>
        </div>
        <button
          onClick={() => onShare(team)}
          className="mt-2.5 w-full rounded-full border border-white/20 py-3 text-sm text-white/85 transition-colors hover:border-white/50"
        >
          이 무대 공유하기
        </button>
        <button onClick={onBack} className="mt-2 w-full py-3 text-xs text-white/45 underline underline-offset-4">
          무대 순서로 돌아가기
        </button>
      </div>
    </div>,
    document.body
  );
}

/* =========================================================================
 * 카카오맵
 * ========================================================================= */

/* ---------- 지도 앱 고르기 ----------
 * 카카오맵: 웹 주소라 앱이 있으면 앱으로, 없으면 웹 지도로 열려요.
 * 네이버지도 · 티맵: 앱 전용 주소(nmap:// · tmap://)를 먼저 열어 보고,
 *   1.5초 안에 앱으로 안 넘어가면(앱이 없으면) 웹 페이지로 보내요.
 */
type MapApp = { name: string; letter: string; bg: string; fg: string; app?: string; web: string };
const { lat: VLAT, lng: VLNG, venueName: VNAME } = C.location;
const MAP_APPS: MapApp[] = [
  {
    name: "카카오맵",
    letter: "K",
    bg: "#FEE500",
    fg: "#191919",
    web: `https://map.kakao.com/link/to/${encodeURIComponent(VNAME)},${VLAT},${VLNG}`,
  },
  {
    name: "네이버지도",
    letter: "N",
    bg: "#03C75A",
    fg: "#fff",
    app: `nmap://route/public?dlat=${VLAT}&dlng=${VLNG}&dname=${encodeURIComponent(VNAME)}&appname=hallymdancewind.com`,
    web: `https://map.naver.com/p/search/${encodeURIComponent(VNAME)}`,
  },
  {
    name: "티맵",
    letter: "T",
    bg: "linear-gradient(135deg,#5b2be0,#e8336d)",
    fg: "#fff",
    app: `tmap://route?goalname=${encodeURIComponent(VNAME)}&goalx=${VLNG}&goaly=${VLAT}`,
    web: "https://www.tmap.co.kr/",
  },
];

function openMapApp(app: MapApp) {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (!app.app || !isMobile) {
    window.open(app.web, "_blank", "noopener");
    return;
  }
  const fallback = window.setTimeout(() => {
    if (!document.hidden) window.location.href = app.web;
  }, 1500);
  // 앱으로 넘어가면 페이지가 가려지면서(hidden) 대체 이동은 취소돼요
  const cancel = () => {
    if (document.hidden) window.clearTimeout(fallback);
  };
  document.addEventListener("visibilitychange", cancel, { once: true });
  window.location.href = app.app;
}

/** 마지막 마무리 인사 — "12월 1일, 일송아트홀에서 만나요" */
function ClosingNote() {
  const { ref, visible } = useScrollReveal<HTMLDivElement>(0.4);
  return (
    <div ref={ref} className="mt-14 border-t border-white/10 pt-10 text-center">
      <svg viewBox="0 0 52 52" className="mx-auto mb-5 h-[52px] w-[52px]" aria-hidden="true">
        <circle
          cx="26"
          cy="26"
          r="23"
          pathLength={1}
          transform="rotate(-90 26 26)"
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="1.2"
          strokeDasharray="1"
          style={{
            strokeDashoffset: visible ? 0 : 1,
            transition: "stroke-dashoffset 1.6s cubic-bezier(0.65,0,0.35,1) 0.2s",
          }}
        />
      </svg>
      <div
        className="transition-all duration-1000 ease-out"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "none" : "translateY(12px)",
          transitionDelay: visible ? "0.9s" : "0s",
        }}
      >
        <p className="c26-serif text-2xl font-black leading-snug text-white md:text-3xl">
          12월 1일,
          <br />
          <span className="text-[#7cc4ee]">일송아트홀</span>에서 만나요
        </p>
        <p className="mt-3 text-xs text-white/50">18:30 · 전석 무료</p>
      </div>
    </div>
  );
}

function ConcertMap() {
  const { ref: wrapRef, visible } = useScrollReveal<HTMLDivElement>(0.05);
  const mapRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const { lat, lng, venueName } = C.location;

  // 지도는 화면에 보이기 시작할 때 SDK 를 불러와요. (QR로 들어온 모바일 사용자 데이터 절약)
  useEffect(() => {
    if (!visible) return;
    const scriptId = "kakao-map-sdk";

    function initMap() {
      if (!mapRef.current || !window.kakao?.maps) {
        setFailed(true);
        return;
      }
      window.kakao.maps.load(() => {
        if (!mapRef.current) return;
        const position = new window.kakao.maps.LatLng(lat, lng);
        const map = new window.kakao.maps.Map(mapRef.current, { center: position, level: 3 });
        // 기본 빨간 핀 대신, 하늘색 점에서 파동이 퍼지는 핀을 HTML 로 직접 얹어요 (CustomOverlay)
        const pin = document.createElement("div");
        pin.className = "c26-map-pin";
        pin.innerHTML = '<span class="c26-map-pulse"></span><span class="c26-map-pulse" style="animation-delay:1s"></span><span class="c26-map-dot"></span>';
        new window.kakao.maps.CustomOverlay({ position, content: pin, yAnchor: 0.5, xAnchor: 0.5, zIndex: 3 }).setMap(map);
        // 모바일에서 페이지 스크롤하다 지도에 손가락이 걸려 멈추는 걸 막기 위해 드래그는 끄고 줌 버튼만 둬요.
        map.setDraggable(false);
        map.setZoomable(false);
        map.addControl(new window.kakao.maps.ZoomControl(), window.kakao.maps.ControlPosition.RIGHT);
      });
    }

    if (window.kakao && window.kakao.maps) {
      initMap();
      return;
    }

    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_KEY}&autoload=false`;
      script.async = true;
      document.head.appendChild(script);
    }
    const onError = () => setFailed(true);
    script.addEventListener("load", initMap);
    script.addEventListener("error", onError);
    return () => {
      script?.removeEventListener("load", initMap);
      script?.removeEventListener("error", onError);
    };
  }, [visible, lat, lng]);

  return (
    <div ref={wrapRef} className="relative h-64 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] md:h-80">
      <div ref={mapRef} className="h-full w-full" />
      {failed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-sm text-white/60">
          <p>지도를 불러오지 못했어요.</p>
          <a
            href={`https://map.kakao.com/link/map/${encodeURIComponent(venueName)},${lat},${lng}`}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4"
          >
            카카오맵에서 열기
          </a>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
 * 먹이 차오르는 버튼 — 누른(PC는 올린) 자리에서부터 흰 먹이 원으로 번지며 채워져요.
 *   className 에 c26-inkbtn 을 주고 {...inkHandlers} 를 붙이면 돼요.
 * ========================================================================= */

function setInkOrigin(el: HTMLElement, e: ReactPointerEvent) {
  const r = el.getBoundingClientRect();
  el.style.setProperty("--ink-x", `${e.clientX - r.left}px`);
  el.style.setProperty("--ink-y", `${e.clientY - r.top}px`);
}

const inkHandlers = {
  onPointerEnter: (e: ReactPointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    setInkOrigin(e.currentTarget, e);
    e.currentTarget.classList.add("is-inked");
  },
  onPointerLeave: (e: ReactPointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    setInkOrigin(e.currentTarget, e);
    e.currentTarget.classList.remove("is-inked");
  },
  onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
    const el = e.currentTarget;
    setInkOrigin(el, e);
    el.classList.add("is-inked");
    // 터치는 손을 떼고 잠깐 뒤에 원래대로
    if (e.pointerType !== "mouse") window.setTimeout(() => el.classList.remove("is-inked"), 650);
  },
};

/* =========================================================================
 * 스크롤 디테일 두 가지 (페이지 전체에 한 번만 걸어요)
 *   1) data-lines 가 붙은 목록이 화면에 들어오면 가로선이 왼쪽→오른쪽으로 그어짐
 *   2) 섹션 뒤 큰 한자 번호(.c26-plx)가 글보다 느리게 움직이는 시차
 * ========================================================================= */

function useScrollDetails() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // 1) 가로선
    const lists = Array.from(document.querySelectorAll<HTMLElement>("[data-lines]"));
    if (reduce) {
      lists.forEach((el) => el.classList.add("c26-drawn"));
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("c26-drawn");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    if (!reduce) lists.forEach((el) => io.observe(el));

    // 2) 시차
    const nums = Array.from(document.querySelectorAll<HTMLElement>(".c26-plx"));
    let raf = 0;
    const apply = () => {
      raf = 0;
      const vh = window.innerHeight;
      nums.forEach((el) => {
        const host = el.parentElement;
        if (!host) return;
        const r = host.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        // 화면 40% 지점을 기준으로 위/아래로 벗어난 만큼 반대로 살짝 밀어서 "느리게" 보이게
        const off = r.top - vh * 0.4;
        el.style.transform = `translate3d(0, ${(-off * 0.22).toFixed(1)}px, 0)`;
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    let stop = () => {};
    if (!reduce) {
      apply();
      stop = listenScrollLike(onScroll);
    }
    return () => {
      io.disconnect();
      stop();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
}

/* ---------- 오른쪽 한자 목차 ----------
 * 화면 오른쪽 끝에 壹~玖 를 아주 작게 세로로. 지금 보고 있는 섹션만 하늘색으로 살짝 커져요.
 * 누르면 그 섹션으로 부드럽게 이동. 첫 화면(서예)과 맨 아래(푸터)에선 숨겨서 방해하지 않게 해요.
 * 지금 섹션은 IntersectionObserver 로 판단: 화면 가운데 띠(위 40% ~ 아래 55% 를 뺀 부분)에 걸친 섹션.
 */
const SECTION_INDEX = [
  { id: "greeting", num: "壹", label: "인사말" },
  { id: "about", num: "貳", label: "공연 소개" },
  { id: "qna", num: "參", label: "자주 묻는 질문" },
  { id: "apply", num: "肆", label: "사전 신청" },
  { id: "teams", num: "伍", label: "무대 순서" },
  { id: "prizes", num: "陸", label: "경품 안내" },
  { id: "share", num: "柒", label: "함께 보러 가요" },
  { id: "sponsors", num: "捌", label: "함께해 주신 곳" },
  { id: "location", num: "玖", label: "찾아오시는 길" },
];

function SectionIndex() {
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    const els = SECTION_INDEX.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setCurrent(e.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    els.forEach((el) => io.observe(el));

    // 첫 섹션보다 위(서예 화면)거나 마지막 섹션을 지나면(푸터) 숨김
    const first = els[0];
    const last = els[els.length - 1];
    const onScroll = () => {
      const mid = window.innerHeight * 0.5;
      if (first && first.getBoundingClientRect().top > mid) setCurrent(null);
      else if (last && last.getBoundingClientRect().bottom < mid) setCurrent(null);
    };
    onScroll();
    const stop = listenScrollLike(onScroll);
    return () => {
      io.disconnect();
      stop();
    };
  }, []);

  const go = (id: string) => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  return (
    <nav
      aria-label="섹션 목차"
      className={`fixed right-0.5 top-1/2 z-40 -translate-y-1/2 transition-opacity duration-500 md:right-4 ${
        current ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <ul className="flex flex-col items-center">
        {SECTION_INDEX.map((s) => {
          const on = current === s.id;
          return (
            <li key={s.id}>
              {/* 글씨는 아주 작게. 폭은 20px 로 좁혀서 본문 좌우 여백(24px) 안에만 들어가게 — 본문을 가리지 않아요.
                  누르는 영역은 세로 28px 로 손가락에 맞게 */}
              <button
                onClick={() => go(s.id)}
                aria-label={`${s.label}로 이동`}
                aria-current={on ? "true" : undefined}
                className={`c26-serif grid h-7 w-5 place-items-center font-black leading-none transition-all duration-300 md:w-7 ${
                  on ? "scale-125 text-[11px] text-[#7cc4ee]" : "text-[9px] text-white/25 hover:text-white/60"
                }`}
              >
                {s.num}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* =========================================================================
 * 페이지
 * ========================================================================= */

export default function Concert() {
  useScrollDetails();
  // 주소 /2026concert/{팀 id} → 그 팀 프로그램북 화면을 띄움
  const navigate = useNavigate();
  const teamId = useParams()["*"] || "";
  const openTeam = teamId ? C.teams.findIndex((t) => t.id === teamId) : -1;
  // useCallback 으로 고정해야 팀 화면 · 혜택 창의 스크롤 잠금 effect 가 매 렌더마다 다시 돌지 않아요.
  // 사이트 안에서 들어왔으면 뒤로가기(스크롤 위치 그대로), 링크로 바로 들어왔으면 공연 페이지로
  const closeTeam = useCallback(() => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate("/2026concert", { replace: true });
  }, [navigate]);
  // 이전/다음 무대는 기록을 쌓지 않고 바꿔치기 → 뒤로가기 한 번이면 무대 순서로 돌아가요
  const goTeam = useCallback((i: number) => navigate(`/2026concert/${C.teams[i].id}`, { replace: true }), [navigate]);
  const shareTeam = useCallback(async (team: ConcertTeam) => {
    const url = `${PAGE_URL}/${team.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ url });
      } catch {
        /* 공유 창을 닫은 경우 */
      }
      return;
    }
    navigator.clipboard
      ?.writeText(url)
      .then(() => setToast("이 무대 링크를 복사했어요."))
      .catch(() => setToast("복사에 실패했어요."));
  }, []);

  // 없는 팀 주소면 공연 페이지로
  useEffect(() => {
    if (teamId && openTeam < 0) navigate("/2026concert", { replace: true });
  }, [teamId, openTeam, navigate]);
  const [openSponsor, setOpenSponsor] = useState<number | null>(null);
  const closeSponsor = useCallback(() => setOpenSponsor(null), []);
  const [openQna, setOpenQna] = useState<number | null>(0);
  const [toast, setToast] = useState("");
  const [shareError, setShareError] = useState("");
  const [showDock, setShowDock] = useState(false);
  const { closed: applyClosed } = useApplyDeadline();
  const applyRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);

  // 이 페이지 전용 붓글씨 계열 웹폰트 (다른 페이지엔 필요 없어서 여기서만 불러와요)
  useEffect(() => {
    const id = "c26-font";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700;900&display=swap";
    document.head.appendChild(link);
  }, []);

  // 탭 제목 + 페이지 배경색
  useEffect(() => {
    const prevTitle = document.title;
    const prevBg = document.body.style.backgroundColor;
    document.title = `${C.titleHanja} ${C.titleKorean} | ${C.edition}`;
    document.body.style.backgroundColor = "#000";
    return () => {
      document.title = prevTitle;
      document.body.style.backgroundColor = prevBg;
    };
  }, []);

  // 첫 화면을 지나면 하단 고정 "사전 신청" 버튼 표시 (신청 섹션·푸터가 보일 땐 숨김)
  useEffect(() => {
    const onScroll = () => {
      const pastHero = window.scrollY > window.innerHeight * 0.85;
      const vh = window.innerHeight;
      const applyRect = applyRef.current?.getBoundingClientRect();
      const footerRect = footerRef.current?.getBoundingClientRect();
      const applyVisible = !!applyRect && applyRect.top < vh && applyRect.bottom > 0;
      const footerVisible = !!footerRect && footerRect.top < vh;
      setShowDock(pastHero && !applyVisible && !footerVisible);
    };
    onScroll();
    return listenScrollLike(onScroll);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(""), 2000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const copyText = async (text: string, done: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast(done);
    } catch {
      setToast("복사에 실패했어요. 길게 눌러 직접 복사해주세요.");
    }
  };

  const handleKakaoShare = async () => {
    setShareError("");
    try {
      await shareToKakao({
        templateArgs: {
          title: `${C.titleHanja} ${C.titleKorean} — ${C.edition}`,
          description: `${C.dateText} ${C.timeText} · ${C.location.venueName}`,
          image_url: `${SITE_URL}/share/concert2026-share.jpg?v=3`,
          button_title: "공연 보러 가기",
          link_url: PAGE_URL,
        },
      });
    } catch {
      setShareError("카카오톡 공유를 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        // 링크만 보내요. (text 를 넣으면 카톡 등에서 링크 앞에 문구가 같이 붙어서 가요)
        await navigator.share({ url: PAGE_URL });
      } catch {
        /* 사용자가 공유 창을 닫은 경우 — 따로 알릴 필요 없음 */
      }
    } else {
      copyText(PAGE_URL, "링크를 복사했어요.");
    }
  };

  /* 인스타 스토리 공유
   * 인스타는 웹에서 "스토리에 바로 올리기"를 열어주지 않아서, 휴대폰 공유 창에 세로 이미지를 실어 보내요.
   *   → 공유 창에서 Instagram 을 고르면 스토리 편집 화면으로 이미지가 들어가요.
   * 동시에 링크를 복사해 둬서, 스토리에서 "링크 스티커"에 바로 붙여넣을 수 있게 해요.
   * 이미지는 미리 받아 둬요: 아이폰 사파리는 버튼을 누른 "직후"에만 공유 창을 열 수 있어서,
   * 누른 뒤에 이미지를 내려받기 시작하면 그 사이 권한이 사라져 공유 창이 안 떠요.
   *
   * ⚠️ 이미지 파일(public/share/concert2026-story.jpg)이 없으면 서버가 대신 웹페이지(HTML)를 돌려줘요.
   *    그걸 사진인 척 인스타에 넘기면 "현재 콘텐츠를 볼 수 없습니다"가 떠서,
   *    받은 게 진짜 이미지일 때만 공유 창에 싣도록 확인해요.
   */
  const storyFileRef = useRef<File | null>(null);
  const storyMissingRef = useRef(false); // 이미지 파일이 서버에 없다고 확인되면 true
  useEffect(() => {
    let cancelled = false;
    // 첫 화면 로딩을 방해하지 않게 조금 늦게 받아요
    const timer = window.setTimeout(() => {
      fetch(STORY_IMAGE_URL)
        .then((res) => (res.ok ? res.blob() : Promise.reject(new Error(String(res.status)))))
        .then((blob) => {
          if (cancelled) return;
          if (!blob.type.startsWith("image/")) {
            storyMissingRef.current = true; // 이미지가 아니면(파일 없음 → HTML) 쓰지 않음
            return;
          }
          storyFileRef.current = new File([blob], "2026concert-story.jpg", { type: blob.type });
        })
        .catch(() => {
          /* 못 받아도 버튼을 누르면 아래 대체 방법(이미지 저장)으로 가요 */
        });
    }, 2500);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  // 인스타 버튼 → 표지 / 오늘의 D-day 중 고르는 창
  const [storyPickOpen, setStoryPickOpen] = useState(false);
  const closeStoryPick = useCallback(() => setStoryPickOpen(false), []);

  const handleStoryShare = () => {
    // 링크 스티커용 주소 복사 (고르는 창을 띄우는 이 순간에 미리)
    navigator.clipboard?.writeText(PAGE_URL).catch(() => {});
    setStoryPickOpen(true);
  };

  /** 고른 이미지로 공유 창 열기. 공유 창에 이미지를 못 싣는 환경(PC 등)이면 저장해 줘요. */
  const shareStoryFile = async (file: File | null, fallbackHref: string | null) => {
    if (file && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        setStoryPickOpen(false);
        setToast("링크가 복사됐어요. 스토리에서 링크 스티커에 붙여넣어 주세요.");
      } catch {
        /* 공유 창을 닫은 경우 — 고르는 창은 그대로 둬요 */
      }
      return;
    }
    const href = fallbackHref ?? (file ? URL.createObjectURL(file) : null);
    if (!href) {
      setToast("스토리 이미지를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
      return;
    }
    const a = document.createElement("a");
    a.href = href;
    a.download = file?.name ?? "2026concert-story.jpg";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setStoryPickOpen(false);
    setToast("스토리 이미지를 저장했어요. 링크도 복사됐으니 인스타 스토리에 올려 주세요.");
  };

  return (
    <div className="relative min-h-screen overflow-x-clip bg-black text-[#d6dbe0] selection:bg-[#7cc4ee] selection:text-black">
      {/* 페이지 전체에 깔리는 아주 옅은 연기 */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="c26-wisp left-[-30%] top-[30%] h-[40%] w-[90%]" style={{ animationDelay: "-5s" }} />
        <div className="c26-wisp bottom-[-10%] right-[-30%] h-[50%] w-[100%]" style={{ animationDelay: "-17s" }} />
      </div>

      {/* 상단 바 */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center px-5 pt-[calc(env(safe-area-inset-top)+18px)]">
        <span className="font-mono text-[10px] tracking-[0.3em] text-white/50">2026 ANNUAL CONCERT</span>
      </header>

      <Intro />

      <main className="relative z-10 mx-auto max-w-5xl px-6 pt-16 md:px-10 md:pt-32">
        {/* ① 인사말 */}
        <Section id="greeting" head={{ num: "壹", hanja: "序", eyebrow: "GREETING", title: "인사말" }}>
          <Rise>
            <p className="c26-serif text-[22px] font-bold leading-snug text-white md:text-[28px]">
              {C.greeting.heading}
            </p>
          </Rise>
          <div className="mt-6 space-y-4">
            {C.greeting.body.map((line, i) => (
              <Rise key={i} delay={i * 120}>
                <p className="break-keep text-[15px] leading-[1.9] text-white/75 md:text-base">{line}</p>
              </Rise>
            ))}
          </div>
          <Rise delay={400}>
            <p className="c26-serif mt-8 text-right text-sm text-white/55">{C.greeting.sign}</p>
          </Rise>
        </Section>

        <RingDivider />

        {/* ② 설명글 */}
        <Section id="about" head={{ num: "貳", hanja: "輪舞", eyebrow: "ABOUT", title: "공연 소개" }}>
          <Rise>
            <div className="relative overflow-hidden rounded-2xl">
              <img src="/concert2026/poster.jpg" alt={`${C.titleHanja} 공연 포스터`} className="w-full" loading="lazy" />
            </div>
          </Rise>
          <Rise delay={100}>
            <p className="c26-serif mt-8 text-[20px] font-bold leading-snug text-white md:text-2xl">
              {C.description.heading}
            </p>
          </Rise>
          <div className="mt-5 space-y-4">
            {C.description.body.map((line, i) => (
              <Rise key={i} delay={i * 120}>
                <p className="break-keep text-[15px] leading-[1.9] text-white/75 md:text-base">{line}</p>
              </Rise>
            ))}
          </div>
          {/* 정보 카드 2×2 — 구석의 옅은 한자는 섹션 번호(貳)의 큰 한자와 같은 톤이에요 */}
          <dl className="mt-10 grid grid-cols-2 gap-2 md:gap-3">
            {C.description.facts.map((f, fi) => (
              <Rise key={f.label} delay={fi * 90} className="h-full">
                <div className="relative h-full min-h-[108px] overflow-hidden rounded-xl border border-white/[0.12] px-3.5 pb-4 pt-4 md:min-h-[128px] md:px-5 md:pt-5">
                  <span
                    className="c26-serif pointer-events-none absolute -bottom-3 right-1.5 select-none text-[54px] font-black leading-none text-white/[0.06] md:text-[64px]"
                    aria-hidden="true"
                  >
                    {f.hanja}
                  </span>
                  <dt className="relative text-[11px] tracking-[0.3em] text-[#7cc4ee] md:text-xs">{f.label}</dt>
                  <dd className="c26-serif relative mt-2.5 whitespace-pre-line break-keep text-[16.5px] font-bold leading-snug text-white md:text-[19px]">
                    {f.value}
                  </dd>
                </div>
              </Rise>
            ))}
          </dl>
        </Section>

        <RingDivider />

        {/* ③ Q&A */}
        <Section id="qna" head={{ num: "參", hanja: "問答", eyebrow: "Q & A", title: "자주 묻는 질문" }}>
          <div data-lines className="c26-rule-t">
            {C.qna.map((item, i) => {
              const open = openQna === i;
              return (
                <Rise key={item.q} delay={i * 60}>
                  <div className="c26-rule-b" style={{ "--i": i } as CSSProperties}>
                    <button
                      onClick={() => setOpenQna(open ? null : i)}
                      className="flex w-full items-center gap-4 py-5 text-left"
                      aria-expanded={open}
                    >
                      <span className="c26-serif text-lg font-bold text-[#7cc4ee]">問</span>
                      <span className="flex-1 break-keep text-[15px] font-medium text-white">{item.q}</span>
                      <span
                        className={`text-white/40 transition-transform duration-300 ${open ? "rotate-45" : ""}`}
                        aria-hidden="true"
                      >
                        +
                      </span>
                    </button>
                    <div
                      className={`grid transition-[grid-template-rows] duration-400 ease-out ${
                        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="flex gap-4 pb-6">
                          <span className="c26-serif text-lg font-bold text-white/35">答</span>
                          <p className="break-keep pt-0.5 text-[14px] leading-relaxed text-white/70">{item.a}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Rise>
              );
            })}
          </div>
        </Section>

        <RingDivider />

        {/* ④ 사전 신청 */}
        <Section id="apply" head={{ num: "肆", hanja: "申請", eyebrow: "RESERVATION", title: "사전 신청" }}>
          <div ref={applyRef}>
            <Rise>
              <div data-lines className="c26-rule-y py-9 md:py-11">
                <ApplyDeadline />
              </div>
            </Rise>
            <Rise delay={120}>
              <div className="mt-8 text-center">
                {applyClosed ? (
                  // 마감 후엔 신청 버튼을 없애고, 그래도 올 수 있다는 걸 알려줘요
                  <p className="break-keep text-[15px] leading-relaxed text-white/75">
                    사전 신청은 마감되었지만,
                    <br />
                    <b className="text-white">현장 입장</b>은 누구나 가능해요.
                  </p>
                ) : (
                  <>
                    <p className="break-keep text-[15px] leading-relaxed text-white/75">
                      사전 신청하시면 공연 당일
                      <br />
                      <b className="text-white">우선 입장</b>할 수 있어요.
                    </p>
                    <a
                      href={C.applyUrl}
                      target="_blank"
                      rel="noreferrer"
                      {...inkHandlers}
                      className="c26-inkbtn c26-serif mt-7 inline-flex items-center gap-3 rounded-full border border-white/60 px-9 py-4 text-base font-bold text-white shadow-[0_0_40px_rgba(124,196,238,0.18)]"
                    >
                      사전 신청 바로가기
                      <span aria-hidden="true">→</span>
                    </a>
                  </>
                )}
              </div>
            </Rise>
          </div>
        </Section>

        <RingDivider />

        {/* ⑤ 팀 / 라인업 */}
        <Section id="teams" head={{ num: "伍", hanja: "舞臺", eyebrow: "LINE-UP", title: "무대 순서" }}>
          <Rise>
            <p className="mb-5 text-sm text-white/50">팀을 누르면 곡과 출연진을 볼 수 있어요.</p>
          </Rise>
          <ol data-lines className="c26-rule-t">
            {C.teams.map((team, i) => (
              <li key={team.id}>
                <Rise delay={(i % 4) * 60}>
                  <button
                    onClick={() => navigate(`/2026concert/${team.id}`)}
                    className="c26-rule-b group flex w-full items-center gap-4 py-5 text-left transition-colors active:bg-white/[0.04] md:gap-6 md:py-6"
                    style={{ "--i": i } as CSSProperties}
                  >
                    <span className="c26-serif w-11 shrink-0 text-[13px] text-[#7cc4ee] md:w-14">第{i + 1}幕</span>
                    <span className="min-w-0 flex-1 transition-transform duration-300 md:group-hover:translate-x-1.5">
                      <span className="c26-serif block break-keep text-[21px] font-black leading-tight text-white md:text-2xl">
                        {team.name}
                      </span>
                    </span>
                    <span className="text-lg text-white/35 transition-all group-hover:translate-x-0.5 group-hover:text-white/80" aria-hidden="true">
                      →
                    </span>
                  </button>
                </Rise>
              </li>
            ))}
          </ol>
        </Section>

        <RingDivider />

        {/* ⑥ 경품 */}
        <Section id="prizes" head={{ num: "陸", hanja: "景品", eyebrow: "GIFTS", title: "경품 안내" }}>
          <Rise>
            <p className="mb-5 break-keep text-sm leading-relaxed text-white/60">{C.prizeHowTo}</p>
          </Rise>
          <ul data-lines className="c26-rule-t">
            {C.prizes.map((p, i) => (
              <li key={p.rank}>
                <Rise delay={i * 80}>
                  <div className="c26-rule-b flex items-baseline gap-4 py-5" style={{ "--i": i } as CSSProperties}>
                    <span
                      className={`c26-serif w-16 shrink-0 text-[20px] font-black ${i === 0 ? "text-[#9fd3f3]" : "text-white/80"}`}
                    >
                      {p.rank}
                    </span>
                    <p className="min-w-0 flex-1 break-keep text-[15px] font-medium text-white">{p.item}</p>
                    <span className="shrink-0 text-xs text-white/50">{p.count}</span>
                  </div>
                </Rise>
              </li>
            ))}
          </ul>
        </Section>

        <RingDivider />

        {/* ⑦ 공유하기 */}
        <Section id="share" head={{ num: "柒", hanja: "共有", eyebrow: "SHARE", title: "함께 보러 가요" }}>
          <Rise>
            <p className="mb-6 break-keep text-[15px] leading-relaxed text-white/70">
              같이 보고 싶은 사람에게 공연 소식을 전해주세요.
            </p>
            {/* 폰: 세로로 세 줄 / PC: 가로 한 줄 */}
            <div className="flex flex-col gap-2.5 md:flex-row">
              <button
                onClick={handleKakaoShare}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#FEE500] py-3.5 text-[15px] font-semibold text-[#191919] transition-transform active:scale-95"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M12 3C6.48 3 2 6.58 2 11c0 2.8 1.83 5.26 4.6 6.7-.2.75-.73 2.73-.84 3.15-.13.52.19.51.4.37.16-.11 2.6-1.77 3.66-2.49.7.1 1.42.16 2.18.16 5.52 0 10-3.58 10-8 0-4.42-4.48-8-10-8Z"
                    fill="currentColor"
                  />
                </svg>
                카카오톡으로 공유하기
              </button>
              <button
                onClick={handleStoryShare}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[linear-gradient(90deg,#f9a034,#ee2a7b_50%,#6228d7)] py-3.5 text-[15px] font-semibold text-white transition-transform active:scale-95"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
                인스타 스토리에 올리기
              </button>
              <button
                onClick={handleNativeShare}
                {...inkHandlers}
                className="c26-inkbtn flex-1 rounded-full border border-white/25 py-3.5 text-[15px] text-white/85 transition-colors hover:border-white/60"
              >
                다른 앱으로 공유 · 링크 복사
              </button>
            </div>
            {shareError && <p className="mt-3 text-xs text-red-300">{shareError}</p>}
          </Rise>
        </Section>

        <RingDivider />

        {/* ⑧ 스폰서 */}
        <Section id="sponsors" head={{ num: "捌", hanja: "協贊", eyebrow: "SPONSORS", title: "함께해 주신 곳" }}>
          {/* 크레딧 문단 — 30곳이 넘어도 한 화면 안팎에 들어가게, 이름만 " · " 로 이어 가운데 정렬해요.
              이름을 누르면 아래에서 혜택 창이 올라와요. */}
          <Rise>
            <div className="mx-auto max-w-[640px] text-center">
              <p className="c26-serif break-keep text-sm leading-relaxed text-white/55">
                이 무대를 함께 만들어 주신 분들
                <br />
                공연 당일 사전 신청 화면을 보여주시면 혜택을 받을 수 있어요.
              </p>
              <p className="c26-serif mt-6 break-keep text-[15px] font-bold leading-[2.1] text-white md:text-[17px]">
                {C.sponsors.map((s, i) => (
                  <span key={s.name}>
                    {i > 0 && (
                      <span className="mx-[7px] text-[#7cc4ee]/50" aria-hidden="true">
                        ·
                      </span>
                    )}
                    <button
                      onClick={() => setOpenSponsor(i)}
                      className="whitespace-nowrap underline decoration-white/15 underline-offset-[5px] transition-colors hover:text-[#cfeafb] hover:decoration-[#7cc4ee]/60"
                    >
                      {s.name}
                    </button>
                  </span>
                ))}
              </p>
              <p className="mt-4 text-[11.5px] text-white/40">이름을 누르면 혜택이 보여요</p>
            </div>
          </Rise>
        </Section>

        <RingDivider />

        {/* ⑨ 오시는 길 */}
        <Section id="location" head={{ num: "玖", hanja: "道", eyebrow: "LOCATION", title: "찾아오시는 길" }}>
          <Rise>
            <ConcertMap />
          </Rise>
          <Rise delay={100}>
            <div className="mt-5">
              <p className="c26-serif text-xl font-bold text-white">{C.location.venueName}</p>
              <p className="mt-1 text-sm text-white/60">{C.location.address}</p>
              {/* 평소 쓰는 지도 앱으로 바로 길찾기 */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                {MAP_APPS.map((app) => (
                  <button
                    key={app.name}
                    onClick={() => openMapApp(app)}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.03] px-1 pb-3 pt-3.5 text-xs text-white transition-colors hover:border-white/40 active:scale-95"
                  >
                    <span
                      className="grid h-9 w-9 place-items-center rounded-[10px] text-[13px] font-extrabold"
                      style={{ background: app.bg, color: app.fg }}
                      aria-hidden="true"
                    >
                      {app.letter}
                    </span>
                    {app.name}
                  </button>
                ))}
              </div>
              <button
                onClick={() => copyText(C.location.address, "주소를 복사했어요.")}
                {...inkHandlers}
                className="c26-inkbtn mt-2 w-full rounded-full border border-white/20 py-3 text-sm text-white/85 transition-colors hover:border-white/50"
              >
                주소 복사
              </button>
            </div>
          </Rise>
          <Rise delay={150}>
            <dl data-lines className="mt-6 space-y-3">
              {C.location.directions.map((d, di) => (
                <div key={d.label} className="c26-rule-t flex gap-4 pt-3" style={{ "--i": di } as CSSProperties}>
                  <dt className="w-10 shrink-0 text-xs tracking-widest text-[#7cc4ee]">{d.label}</dt>
                  <dd className="break-keep text-sm text-white/70">{d.text}</dd>
                </div>
              ))}
            </dl>
          </Rise>
          {/* 페이지 마무리 인사 — 원이 한 바퀴 그려진 뒤 한 줄 */}
          <ClosingNote />
        </Section>
      </main>

      {/* 푸터 */}
      <footer
        ref={footerRef}
        className="relative z-10 mt-24 border-t border-white/10 px-6 pb-[calc(env(safe-area-inset-bottom)+40px)] pt-14 text-center"
      >
        <img src="/concert2026/brush.png" alt="" className="mx-auto w-20 opacity-80" />
        <p className="c26-serif mt-5 text-sm text-white/70">{C.edition}</p>
        <a
          href={C.instagram.url}
          target="_blank"
          rel="noreferrer"
          className="c26-serif mt-4 inline-block border-l border-white/40 pl-3 text-left text-sm leading-relaxed text-white/80 transition-colors hover:text-white"
        >
          Instagram
          <br />
          {C.instagram.handle}
        </a>
      </footer>

      {/* 오른쪽 한자 목차 */}
      <SectionIndex />

      {/* 하단 고정 사전신청 버튼 (주로 모바일용) */}
      <div
        className={`c26-dock fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom)+14px)] pt-6 md:hidden ${
          showDock && !applyClosed ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
        }`}
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.92) 55%, transparent)" }}
      >
        <a
          href={C.applyUrl}
          target="_blank"
          rel="noreferrer"
          className="c26-shine c26-serif flex w-full items-center justify-center rounded-full bg-[#e9eef2] py-3.5 text-[15px] font-bold text-black"
        >
          <DockLabel />
        </a>
      </div>

      {openTeam >= 0 && <TeamPage index={openTeam} onBack={closeTeam} onGo={goTeam} onShare={shareTeam} />}
      {openSponsor !== null && (
        <SponsorSheet sponsor={C.sponsors[openSponsor]} onClose={closeSponsor} />
      )}
      {storyPickOpen && (
        <StoryPicker
          onClose={closeStoryPick}
          onPick={(file, fallbackHref) => shareStoryFile(file, fallbackHref)}
          coverFile={storyFileRef.current}
          coverMissing={storyMissingRef.current}
        />
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-[70] -translate-x-1/2 rounded-full border border-white/15 bg-[#111519] px-5 py-2.5 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}