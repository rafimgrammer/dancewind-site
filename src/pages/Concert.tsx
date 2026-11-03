// src/pages/Concert.tsx
//
// 2026 춤바람 정기공연 「輪舞 윤무」 홍보 페이지 (/2026concert)
// - QR코드로 들어오는 관객이 대부분이라 "모바일 화면"을 기준으로 디자인하고, PC(md 이상)에서 넓게 펼쳐지도록 했어요.
// - 사이드바/상단바 없이 전체 화면을 써요. (Layout.tsx 의 FULLSCREEN_PATHS)
// - 문구/팀/경품/스폰서 같은 내용은 전부 src/data/concert2026.ts 에 모아뒀어요.
// - 애니메이션 정의는 ./concert2026.css 에 있어요.

import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { shareToKakao } from "../lib/kakaoShare";
import { CONCERT_2026 as C, type ConcertTeam } from "../data/concert2026";
import { BRUSH_END, BRUSH_SPRITE, BRUSH_STROKES, BRUSH_VIEWBOX } from "../data/concert2026Strokes";

/** 서예를 다 쓴 시각 기준으로 뒤따르는 문구들의 등장 시각 */
const afterBrush = (dt: number) => `${(BRUSH_END + dt).toFixed(2)}s`;
import "./concert2026.css";

const SITE_URL = "https://hallymdancewind.com";
const PAGE_URL = `${SITE_URL}/${C.slug}`;
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

/** 섹션 머리말 — 한자 숫자 + 큰 한자 워터마크 + 한글 제목 */
function SectionHead({ num, hanja, eyebrow, title }: { num: string; hanja: string; eyebrow: string; title: string }) {
  return (
    <Rise className="relative mb-8 md:mb-0">
      <span
        aria-hidden="true"
        className="c26-serif pointer-events-none absolute -top-6 right-0 select-none text-[88px] leading-none text-white/[0.05] md:static md:block md:text-[120px] md:text-white/[0.07]"
      >
        {hanja}
      </span>
      <p className="c26-serif flex items-center gap-3 text-[13px] tracking-[0.3em] text-[#7cc4ee]">
        <span>{num}</span>
        <span className="h-px w-6 bg-[#7cc4ee]/50" />
        <span className="font-mono text-[11px] tracking-[0.25em]">{eyebrow}</span>
      </p>
      <h2 className="c26-serif mt-3 text-[26px] font-bold leading-snug text-[#f2f4f6] md:text-3xl">{title}</h2>
    </Rise>
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

const panel = "rounded-2xl border border-white/10 bg-white/[0.035] backdrop-blur-[2px]";

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
  cd.phase === "before" ? (cd.dDay <= 0 ? "D-DAY" : `D-${cd.dDay}`) : cd.phase === "live" ? "LIVE" : "END";

/** 바뀐 자리의 숫자만 굴러 내려오는 숫자 표시 */
function RollingNumber({ value, pad = 2 }: { value: number; pad?: number }) {
  const digits = String(value).padStart(pad, "0").split("");
  return (
    <span className="inline-flex overflow-hidden tabular-nums">
      {digits.map((d, i) => (
        // key 에 숫자를 넣어서, 값이 바뀐 자리만 다시 그려지며 애니메이션이 돌아요.
        <span key={`${digits.length - i}-${d}`} className="c26-roll">
          {d}
        </span>
      ))}
    </span>
  );
}

function Countdown() {
  const cd = useCountdown();

  if (cd.phase === "live") {
    return (
      <div className="inline-flex items-center gap-3 rounded-2xl border border-[#ff5a5a]/40 bg-[#ff5a5a]/10 px-5 py-3.5 backdrop-blur-md">
        <span className="c26-live-dot h-2.5 w-2.5 rounded-full bg-[#ff5a5a]" />
        <span className="c26-serif text-lg font-bold text-white">지금 공연 중이에요</span>
      </div>
    );
  }

  if (cd.phase === "after") {
    return (
      <div className="inline-flex rounded-2xl border border-white/15 bg-white/[0.04] px-5 py-3.5 backdrop-blur-md">
        <span className="c26-serif text-[15px] text-white/85">공연이 막을 내렸어요. 함께해 주셔서 감사합니다.</span>
      </div>
    );
  }

  const units = [
    { value: cd.days, label: "일" },
    { value: cd.hours, label: "시간" },
    { value: cd.minutes, label: "분" },
    { value: cd.seconds, label: "초" },
  ];

  return (
    <div
      className="inline-flex items-stretch overflow-hidden rounded-2xl border border-white/15 bg-white/[0.05] shadow-[0_8px_40px_rgba(0,0,0,0.5)] backdrop-blur-md"
      role="timer"
      aria-label={`공연까지 ${cd.days}일 ${cd.hours}시간 ${cd.minutes}분 남음`}
    >
      {/* D-28 */}
      <div className="flex flex-col items-center justify-center border-r border-white/10 bg-[#7cc4ee]/[0.12] px-4 py-2.5">
        <span className="text-[9px] tracking-[0.2em] text-[#9fd3f3]">공연까지</span>
        <span className="c26-serif c26-dday-glow mt-0.5 text-[28px] font-black leading-none text-white md:text-[32px]">
          {dDayLabel(cd)}
        </span>
      </div>
      {/* 27일 04:12:33 */}
      <div className="flex items-center gap-2.5 px-3.5 md:gap-3 md:px-4">
        {units.map((u, i) => (
          <div key={u.label} className="flex items-center gap-2.5 md:gap-3">
            {i > 0 && <span className="h-5 w-px bg-white/10" aria-hidden="true" />}
            <div className="flex flex-col items-center">
              <span className="text-[19px] font-semibold leading-none text-white md:text-[22px]">
                <RollingNumber value={u.value} />
              </span>
              <span className="mt-1 text-[9px] text-white/45">{u.label}</span>
            </div>
          </div>
        ))}
      </div>
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

function BrushWriting() {
  const uid = useId().replace(/:/g, "");
  const [ready, setReady] = useState(false);

  // 스프라이트 이미지를 다 받은 뒤에 쓰기 시작 (느린 데이터에서도 빈 획이 그려지지 않게)
  useEffect(() => {
    const img = new Image();
    const go = () => setReady(true);
    img.onload = go;
    img.onerror = go;
    img.src = BRUSH_SPRITE.src;
    const fallback = window.setTimeout(go, 3000);
    return () => window.clearTimeout(fallback);
  }, []);

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
        className="c26-brush-final relative z-20 w-full"
        style={{ animationDelay: `${BRUSH_END}s` }}
      />
      {/* 쓰는 중인 획들 */}
      <svg
        viewBox={`0 0 ${BRUSH_VIEWBOX.width} ${BRUSH_VIEWBOX.height}`}
        className="absolute inset-0 z-10 h-full w-full"
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
    </div>
  );
}

/* =========================================================================
 * 인트로 (안개 → 서예 등장)
 * ========================================================================= */

function Intro() {
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
      <div className="relative z-10 mx-auto flex h-[100svh] min-h-[560px] w-full items-center justify-center px-6 md:h-full md:max-w-[1100px] md:justify-start md:px-10">
        <div className="relative w-[min(66vw,360px)] md:w-[min(34vw,460px)]">
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


          {/* 모바일: 서예 바로 아래 부제 (위치용 div 와 애니메이션 p 를 나눠야 transform 이 안 겹쳐요) */}
          <div className="absolute inset-x-[-20vw] top-full mt-12 text-center md:hidden [@media(max-height:760px)]:mt-7">
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
      </div>

      {/* 문구 */}
      <div id="info" className="relative z-10 scroll-mt-8 px-6 pb-6 text-center md:absolute md:right-[max(40px,calc(50%-510px))] md:top-1/2 md:max-w-sm md:-translate-y-1/2 md:p-0 md:text-left">
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
          <a
            href={C.applyUrl}
            target="_blank"
            rel="noreferrer"
            className="c26-shine rounded-full bg-[#e9eef2] px-6 py-3 text-sm font-semibold text-black transition-transform active:scale-95 md:hover:-translate-y-0.5"
          >
            사전 신청하기
          </a>
          <a
            href="#teams"
            className="rounded-full border border-white/25 px-6 py-3 text-sm text-white/85 transition-colors hover:border-white/60"
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

function TeamSheet({ team, index, onClose }: { team: ConcertTeam; index: number; onClose: () => void }) {
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
    };
  }, [onClose]);

  // body 에 바로 붙여야(포털) 부모의 transform 영향 없이 화면 기준으로 뜸
  return createPortal(
    <div
      className="c26-sheet-backdrop fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm md:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${team.name} 무대 정보`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="c26-sheet relative max-h-[85svh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-[#0b0e11] px-6 pb-[calc(env(safe-area-inset-bottom)+28px)] pt-3 md:max-w-lg md:rounded-3xl md:pb-8 md:pt-8"
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20 md:hidden" />
        <InkBlot seed={index + 5} className="pointer-events-none absolute -right-16 -top-16 w-56 opacity-60" />

        <div className="relative">
          <p className="c26-serif text-sm text-[#7cc4ee]">
            第 {String(index + 1).padStart(2, "0")} 舞臺
          </p>
          <h3 className="c26-serif mt-1 text-3xl font-bold text-white">{team.name}</h3>
          <span className="mt-3 inline-block rounded-full border border-[#7cc4ee]/40 px-3 py-1 font-mono text-[11px] tracking-widest text-[#9fd3f3]">
            {team.genre}
          </span>

          <div className="mt-7">
            <p className="text-xs tracking-[0.2em] text-white/45">SONG</p>
            <ul className="mt-3 space-y-2.5">
              {team.songs.map((s) => (
                <li key={s.artist + s.title} className="flex items-baseline gap-3 border-b border-white/[0.07] pb-2.5">
                  <span className="text-white/30">♪</span>
                  <span className="text-[15px] text-white">{s.title}</span>
                  <span className="ml-auto shrink-0 text-xs text-white/50">{s.artist}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-7">
            <p className="text-xs tracking-[0.2em] text-white/45">
              MEMBERS <span className="ml-1 text-white/30">{team.members.length}</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {/* 팀장은 맨 앞 + 파란 포인트 */}
              {[...team.members]
                .sort((a, b) => Number(b === team.leader) - Number(a === team.leader))
                .map((m) =>
                  m === team.leader ? (
                    <span
                      key={m}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#7cc4ee]/60 bg-[#7cc4ee]/15 py-1.5 pl-2 pr-3.5 text-sm font-semibold text-[#cfeafb] shadow-[0_0_16px_rgba(124,196,238,0.25)]"
                    >
                      <span className="rounded-full bg-[#7cc4ee] px-1.5 py-px text-[10px] font-bold text-black">팀장</span>
                      {m}
                    </span>
                  ) : (
                    <span key={m} className="rounded-full bg-white/[0.07] px-3.5 py-1.5 text-sm text-white/90">
                      {m}
                    </span>
                  )
                )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="mt-8 w-full rounded-full border border-white/20 py-3 text-sm text-white/80 transition-colors hover:border-white/50"
          >
            닫기
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* =========================================================================
 * 카카오맵
 * ========================================================================= */

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
        new window.kakao.maps.Marker({ position }).setMap(map);
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
 * 페이지
 * ========================================================================= */

export default function Concert() {
  const [openTeam, setOpenTeam] = useState<number | null>(null);
  // useCallback 으로 고정해야 TeamSheet 의 스크롤 잠금 effect 가 매 렌더마다 다시 돌지 않아요.
  const closeTeam = useCallback(() => setOpenTeam(null), []);
  const [openQna, setOpenQna] = useState<number | null>(0);
  const [toast, setToast] = useState("");
  const [shareError, setShareError] = useState("");
  const [showDock, setShowDock] = useState(false);
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
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
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
          image_url: `${SITE_URL}/share/concert2026-share.jpg`,
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
        await navigator.share({ title: `${C.titleHanja} ${C.titleKorean}`, text: C.edition, url: PAGE_URL });
      } catch {
        /* 사용자가 공유 창을 닫은 경우 — 따로 알릴 필요 없음 */
      }
    } else {
      copyText(PAGE_URL, "링크를 복사했어요.");
    }
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
          <Rise delay={150}>
            <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10">
              {C.description.facts.map((f) => (
                <div key={f.label} className="bg-black px-4 py-4">
                  <dt className="text-[11px] tracking-[0.2em] text-[#7cc4ee]">{f.label}</dt>
                  <dd className="mt-1.5 break-keep text-[14px] text-white">{f.value}</dd>
                </div>
              ))}
            </dl>
          </Rise>
        </Section>

        <RingDivider />

        {/* ③ Q&A */}
        <Section id="qna" head={{ num: "參", hanja: "問答", eyebrow: "Q & A", title: "자주 묻는 질문" }}>
          <div className="space-y-2.5">
            {C.qna.map((item, i) => {
              const open = openQna === i;
              return (
                <Rise key={item.q} delay={i * 60}>
                  <div className={`${panel} overflow-hidden transition-colors ${open ? "border-[#7cc4ee]/40" : ""}`}>
                    <button
                      onClick={() => setOpenQna(open ? null : i)}
                      className="flex w-full items-center gap-3 px-5 py-4 text-left"
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
                        <div className="flex gap-3 px-5 pb-5">
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
          <Rise>
            <div ref={applyRef} className={`${panel} relative overflow-hidden px-6 py-10 text-center md:py-14`}>
              <InkBlot seed={21} className="pointer-events-none absolute -left-20 -top-24 w-72 opacity-50" />
              <InkBlot seed={8} className="pointer-events-none absolute -bottom-28 -right-16 w-72 opacity-40" />
              <div className="relative">
                <p className="break-keep text-[15px] leading-relaxed text-white/75">
                  사전 신청하시면 <b className="text-white">우선 입장</b>과
                  <br />
                  <b className="text-white">경품 추첨 자동 응모</b> 혜택을 드려요.
                </p>
                <a
                  href={C.applyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="c26-shine c26-serif mt-7 inline-flex items-center gap-3 rounded-full bg-[#e9eef2] px-9 py-4 text-base font-bold text-black shadow-[0_0_40px_rgba(124,196,238,0.25)] transition-transform active:scale-95 md:hover:-translate-y-0.5"
                >
                  사전 신청 바로가기
                  <span aria-hidden="true">→</span>
                </a>
                <p className="mt-4 text-xs text-white/45">{C.applyDeadlineText}</p>
              </div>
            </div>
          </Rise>
        </Section>

        <RingDivider />

        {/* ⑤ 팀 / 라인업 */}
        <Section id="teams" head={{ num: "伍", hanja: "舞臺", eyebrow: "LINE-UP", title: "무대 순서" }}>
          <Rise>
            <p className="mb-5 text-sm text-white/50">팀을 누르면 곡과 출연진을 볼 수 있어요.</p>
          </Rise>
          <ol className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {C.teams.map((team, i) => (
              <li key={team.id}>
                <Rise delay={(i % 4) * 70}>
                  <button
                    onClick={() => setOpenTeam(i)}
                    className={`${panel} group relative flex h-full min-h-[132px] w-full flex-col overflow-hidden p-4 text-left transition-all duration-300 active:scale-[0.97] md:hover:-translate-y-1 md:hover:border-[#7cc4ee]/50`}
                  >
                    <span className="c26-serif absolute -right-1 -top-3 text-[64px] font-black leading-none text-white/[0.05] transition-colors group-hover:text-[#7cc4ee]/10">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="c26-serif text-xs text-[#7cc4ee]">第{i + 1}幕</span>
                    <span className="c26-serif mt-2 break-keep text-lg font-bold leading-tight text-white">
                      {team.name}
                    </span>
                    <span className="mt-auto pt-3 font-mono text-[10px] tracking-[0.15em] text-white/45">
                      {team.genre}
                    </span>
                    <span className="absolute bottom-4 right-4 text-xs text-white/30 transition-colors group-hover:text-white/70">
                      ＋
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
          <ul className="space-y-2.5">
            {C.prizes.map((p, i) => (
              <li key={p.rank}>
                <Rise delay={i * 80}>
                  <div className={`${panel} flex items-center gap-4 px-4 py-4`}>
                    <span
                      className={`c26-serif flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${
                        i === 0
                          ? "border-[#7cc4ee] bg-[#7cc4ee]/15 text-[#bfe5fb]"
                          : "border-white/20 text-white/80"
                      }`}
                    >
                      {p.rank}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="break-keep text-[15px] font-medium text-white">{p.item}</p>
                    </div>
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
            <div className="flex flex-col gap-2.5 sm:flex-row">
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
                onClick={handleNativeShare}
                className="flex-1 rounded-full border border-white/25 py-3.5 text-[15px] text-white/85 transition-colors hover:border-white/60"
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
          <Rise>
            <p className="mb-5 break-keep text-sm text-white/55">
              공연 당일 사전 신청 화면을 보여주시면 아래 혜택을 받을 수 있어요.
            </p>
          </Rise>
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {C.sponsors.map((s, i) => (
              <li key={s.name}>
                <Rise delay={(i % 3) * 70}>
                  <div className={`${panel} flex h-full flex-col p-4`}>
                    <span className="font-mono text-[10px] tracking-[0.2em] text-[#7cc4ee]">{s.category}</span>
                    <span className="c26-serif mt-2 break-keep text-[17px] font-bold text-white">{s.name}</span>
                    <span className="mt-2 break-keep text-[13px] leading-snug text-white/60">{s.benefit}</span>
                  </div>
                </Rise>
              </li>
            ))}
          </ul>
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
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => copyText(C.location.address, "주소를 복사했어요.")}
                  className="flex-1 rounded-full border border-white/20 py-3 text-sm text-white/85 transition-colors hover:border-white/50"
                >
                  주소 복사
                </button>
                <a
                  href={`https://map.kakao.com/link/to/${encodeURIComponent(C.location.venueName)},${C.location.lat},${C.location.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 rounded-full bg-[#e9eef2] py-3 text-center text-sm font-semibold text-black"
                >
                  길찾기
                </a>
              </div>
            </div>
          </Rise>
          <Rise delay={150}>
            <dl className="mt-6 space-y-3">
              {C.location.directions.map((d) => (
                <div key={d.label} className="flex gap-4 border-t border-white/[0.08] pt-3">
                  <dt className="w-10 shrink-0 text-xs tracking-widest text-[#7cc4ee]">{d.label}</dt>
                  <dd className="break-keep text-sm text-white/70">{d.text}</dd>
                </div>
              ))}
            </dl>
          </Rise>
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
        <div className="mt-8">
          <Link to="/" className="text-xs text-white/45 underline-offset-4 hover:text-white/80 hover:underline">
            춤바람 동아리 홈페이지 →
          </Link>
        </div>
      </footer>

      {/* 하단 고정 사전신청 버튼 (주로 모바일용) */}
      <div
        className={`c26-dock fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom)+14px)] pt-6 md:hidden ${
          showDock ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
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

      {openTeam !== null && (
        <TeamSheet team={C.teams[openTeam]} index={openTeam} onClose={closeTeam} />
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-[70] -translate-x-1/2 rounded-full border border-white/15 bg-[#111519] px-5 py-2.5 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}