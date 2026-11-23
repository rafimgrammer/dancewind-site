// src/pages/ConcertStats.tsx
//
// 2026 정기공연 방문 통계 — 회장단 전용 비밀 페이지 (/2026concert-stats)
//   - 사이트 어디에도 링크가 없고, 검색엔진에도 안 잡히게 noindex 를 걸어요.
//   - App.tsx 에서 React.lazy 로 따로 불러와서, 공연 페이지 방문자는 이 코드를 내려받지 않아요.
//   - 비밀번호 확인은 전부 서버(Supabase 함수)에서 해요. 이 파일에는 비밀번호가 없어요.
//     (프론트 코드는 누구나 열어볼 수 있어서, 여기 넣으면 공개하는 것과 같아요)
//   - 디자인 · 배치는 docs/stats-mockup.html 시안 그대로. 차트는 무거운 라이브러리 없이 SVG 로 직접 그려요.

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type PointerEvent as RPointerEvent, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { markStatsOwner } from "../lib/concertTrack";
import { CONCERT_2026 as KO } from "../data/concert2026";
import "./concertStats.css";

/* =========================================================================
 * 기본 값 · 날짜 도우미 (전부 한국 시간 기준)
 * ========================================================================= */

const PW_KEY = "c26-stats-pw"; // sessionStorage — 탭을 닫으면 다시 물어봐요
const OPEN_DAY = "2026-11-23"; // 공연 페이지 정식 오픈일 = "전체" 기간의 시작
const KST = 9 * 3_600_000;
const DAY = 86_400_000;
const EVENT_MS = new Date(KO.eventAt).getTime();
const EVENT_END_MS = EVENT_MS + KO.runtimeMinutes * 60_000;
const DEADLINE_MS = new Date(KO.applyDeadlineAt).getTime();
const OPEN_MS = new Date(`${OPEN_DAY}T00:00:00+09:00`).getTime();

const kstToday = () => new Date(Date.now() + KST).toISOString().slice(0, 10);
const addDays = (d: string, n: number) => new Date(new Date(`${d}T00:00:00Z`).getTime() + n * DAY).toISOString().slice(0, 10);
const kstDayIndex = (ms: number) => Math.floor((ms + KST) / DAY);
const WD = ["일", "월", "화", "수", "목", "금", "토"];
const wd = (d: string) => WD[new Date(`${d}T00:00:00Z`).getUTCDay()];
const md = (d: string) => `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}`;
const fmt = (n: number) => n.toLocaleString("ko-KR");
const pct = (a: number, b: number) => (b > 0 ? (a / b) * 100 : 0);
const pct1 = (a: number, b: number) => (b > 0 ? `${pct(a, b).toFixed(1)}%` : "—");

type Period = "today" | "7d" | "all";
function rangeOf(p: Period) {
  const to = kstToday();
  if (p === "today") return { from: to, to };
  if (p === "7d") return { from: addDays(to, -6), to };
  // 오픈 전날(테스트할 때)에도 오늘이 보이게
  return { from: to < OPEN_DAY ? to : OPEN_DAY, to };
}

/* ---------- 유입 경로 · 기기 · 브라우저 이름 ---------- */
const SRC_META: Record<string, { label: string; color: string; short: string }> = {
  insta: { label: "인스타 스토리", color: "var(--s1)", short: "인스타" },
  kakao: { label: "카톡 공유", color: "var(--s2)", short: "카톡" },
  qr: { label: "포스터 QR", color: "var(--s3)", short: "QR" },
  notice: { label: "단톡 공지", color: "var(--s4)", short: "공지" },
  direct: { label: "직접·검색", color: "var(--s5)", short: "직접" },
  other: { label: "다른 사이트", color: "#7d8793", short: "기타" },
};
const EXTRA_COLORS = ["#5b6a78", "#8a7a5c", "#6c5b7b", "#4f7a6e", "#7a5c5c"];
const srcMeta = (s: string) => SRC_META[s] ?? { label: s, color: EXTRA_COLORS[s.length % EXTRA_COLORS.length], short: s };
const DEVICE_NAME: Record<string, string> = { ios: "아이폰", android: "안드로이드", pc: "PC", etc: "기타" };
const BROWSER_NAME: Record<string, string> = {
  kakao: "카톡 안", instagram: "인스타 안", safari: "사파리", chrome: "크롬", samsung: "삼성 인터넷",
  naver: "네이버 앱", facebook: "페이스북 안", edge: "엣지", firefox: "파이어폭스", etc: "기타",
};
const teamName = (id: string) => KO.teams.find((t) => t.id === id)?.name ?? `팀 ${id}`;

/* =========================================================================
 * 서버에서 오는 모양
 * ========================================================================= */
interface DailyRow { day: string; visitors: number; sessions: number; clickers: number; en: number; share_visitors: number; shares: number; new: number; top_src: string | null }
interface Stats {
  today: string; from: string; to: string;
  daily: DailyRow[];
  day_src: { day: string; src: string; visitors: number }[];
  totals: { visitors: number; sessions: number; clickers: number; shares_kakao: number; shares_insta: number; kakao_visitors: number; insta_visitors: number; returning: number };
  sources: { src: string; visitors: number; clickers: number }[];
  funnel: { visitors: number; about: number; lineup: number; apply: number; click: number };
  devices: { device: string; visitors: number; clickers: number }[];
  browsers: { browser: string; visitors: number }[];
  langs: { lang: string; visitors: number }[];
  heat: { dow: number; hour: number; visitors: number }[];
  teams: { id: string; opens: number }[];
  today_hours: { hour: number; visitors: number }[];
  today_visitors: number; yesterday_visitors: number;
  all_visitors: number; all_en_visitors: number;
  notes: { id: string; day: string; memo: string }[];
  manual: Record<string, number>;
}
interface Live { live: number; recent: { t: string; event: string; src: string; detail: string | null; device: string | null }[] }
interface VisitFlags {
  about: boolean; lineup: boolean; apply: boolean; team_open: number; apply_click: boolean;
  share_kakao: boolean; share_insta: boolean; calendar_save: boolean; map_click: boolean; lang_switch: boolean;
}
interface Visit {
  code: string; started_at: string; ended_at: string; duration_sec: number; src: string;
  device: string; browser: string; lang: string; visit_no: number;
  result: "clicked" | "browsed" | "bounced"; flags: VisitFlags;
}
interface VisitEvent { t: string; event: string; detail: string | null }
interface VisitorsPage { total: number; visits: Visit[] }
interface VisitDetail { events: VisitEvent[] }

/** 비밀번호가 틀리면 서버가 28P01 을 돌려줘요 */
const isAuthError = (e: { code?: string; message?: string } | null) => !!e && (e.code === "28P01" || /invalid password/.test(e.message ?? ""));

/* =========================================================================
 * 툴팁 — 화면에 하나만 두고, 차트는 show/hide 만 불러요
 * ========================================================================= */
let tipApi: { show: (x: number, y: number, c: ReactNode) => void; hide: () => void } | null = null;
function TipLayer() {
  const [tip, setTip] = useState<{ x: number; y: number; c: ReactNode } | null>(null);
  useEffect(() => {
    tipApi = { show: (x, y, c) => setTip({ x, y, c }), hide: () => setTip(null) };
    const hide = () => setTip(null);
    window.addEventListener("scroll", hide, { passive: true });
    return () => {
      tipApi = null;
      window.removeEventListener("scroll", hide);
    };
  }, []);
  if (!tip) return null;
  return (
    <div className="tt" style={{ left: Math.max(8, Math.min(tip.x + 14, window.innerWidth - 220)), top: tip.y - 12 }}>
      {tip.c}
    </div>
  );
}
/** 마우스를 올리거나 손가락으로 누르면 숫자 툴팁 */
const tipOn = (c: ReactNode) => ({
  onPointerMove: (e: RPointerEvent) => tipApi?.show(e.clientX, e.clientY, c),
  onPointerDown: (e: RPointerEvent) => tipApi?.show(e.clientX, e.clientY, c),
  onPointerLeave: () => tipApi?.hide(),
});

/** 폰 화면인지 — 넓은 차트(760폭)를 폰에서 그대로 줄이면 글씨가 4~5px 까지 작아져서,
 *  폰에서는 좁은 폭(440)으로 다시 그려 글씨가 덜 줄어들게 해요 */
function useNarrow() {
  const q = "(max-width: 700px)";
  const [narrow, setNarrow] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setNarrow(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return narrow;
}

/* =========================================================================
 * SVG 차트 (시안의 그리기 함수를 React 로 옮김)
 * ========================================================================= */
const GRID = "rgba(255,255,255,.07)";
const AXIS = "rgba(255,255,255,.42)";

/** 눈금이 정수로 딱 떨어지는 최댓값 (4칸) */
function niceMax(v: number, ticks = 4) {
  const raw = Math.max(v * 1.1, ticks) / ticks;
  const p = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * p).find((s) => s >= raw && Number.isInteger(s)) ?? Math.ceil(raw);
  return step * ticks;
}

function Axis({ l, t, W, H, max, ticks = 4, f = (v: number) => fmt(v) }: { l: number; t: number; W: number; H: number; max: number; ticks?: number; f?: (v: number) => string }) {
  return (
    <>
      {Array.from({ length: ticks + 1 }, (_, i) => {
        const v = (max * i) / ticks;
        const y = t + H - (H * i) / ticks;
        return (
          <g key={i}>
            <line x1={l} x2={l + W} y1={y} y2={y} stroke={GRID} />
            <text x={l - 8} y={y + 3} textAnchor="end" fontSize={10} fill={AXIS}>
              {f(Math.round(v))}
            </text>
          </g>
        );
      })}
    </>
  );
}

/** 위쪽만 둥근 막대 */
function RBar({ x, y, w, h, fill, r = 4 }: { x: number; y: number; w: number; h: number; fill: string; r?: number }) {
  if (h <= 0 || w <= 0) return null;
  r = Math.min(r, h, w / 2);
  return <path d={`M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`} fill={fill} />;
}

function Empty({ children = "아직 기록이 없어요" }: { children?: ReactNode }) {
  return <div className="empty">{children}</div>;
}

function LineChart({
  labels, data, name, unit, ann = [], w = 760, h = 330,
}: { labels: string[]; data: number[]; name: string; unit: string; ann?: { i: number; text: string }[]; w?: number; h?: number }) {
  const l = 44, t = ann.length ? 44 : 14, b = 30, W = w - l - 16, H = h - t - b;
  const max = niceMax(Math.max(0, ...data));
  const n = labels.length;
  const X = (i: number) => (n === 1 ? l + W / 2 : l + (W * i) / (n - 1));
  const Y = (v: number) => t + H - (H * v) / max;
  const pts = data.map((v, i) => [X(i), Y(v)] as const);
  const line = "M" + pts.map((p) => p.join(",")).join(" L");
  // 라벨이 많으면(전체 기간이 길어지면) 겹치지 않게 건너뛰며 표시
  const every = Math.ceil(n / 10);
  const gid = "cs-line-grad";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%">
      <defs>
        <linearGradient id={gid} x1={0} x2={0} y1={0} y2={1}>
          <stop offset={0} stopColor="#7cc4ee" stopOpacity={0.25} />
          <stop offset={1} stopColor="#7cc4ee" stopOpacity={0} />
        </linearGradient>
      </defs>
      <Axis l={l} t={t} W={W} H={H} max={max} />
      {labels.map((lb, i) =>
        i % every === 0 || i === n - 1 ? (
          <text key={i} x={X(i)} y={t + H + 17} textAnchor="middle" fontSize={10.5} fill={AXIS}>
            {lb}
          </text>
        ) : null,
      )}
      {n > 1 && <path d={`${line} L${pts[n - 1][0]},${t + H} L${pts[0][0]},${t + H} Z`} fill={`url(#${gid})`} />}
      <path d={line} fill="none" stroke="#7cc4ee" strokeWidth={2} />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={n > 20 ? 3 : 4.5} fill="#7cc4ee" stroke="#0f1215" strokeWidth={2} />
      ))}
      {/* 홍보한 날 = 금색 점 + 메모 (위아래 두 줄로 번갈아 놓아 겹치지 않게) */}
      {ann.map(({ i, text }, k) => {
        const ly = k % 2 ? t - 14 : t - 30;
        const right = X(i) > l + W * 0.7;
        return (
          <g key={k} {...tipOn(<><div className="m">{labels[i]} 홍보</div><b>{text}</b></>)}>
            <line x1={X(i)} x2={X(i)} y1={ly + 4} y2={Y(data[i])} stroke="rgba(243,201,139,.4)" strokeDasharray="2 3" />
            <circle cx={X(i)} cy={ly} r={4} fill="#f3c98b" />
            <text x={X(i) + (right ? -8 : 8)} y={ly + 3.5} fontSize={11} fill="rgba(255,255,255,.85)" textAnchor={right ? "end" : "start"}>
              {text.length > 22 ? text.slice(0, 21) + "…" : text}
            </text>
          </g>
        );
      })}
      {labels.map((lb, i) => {
        const cw = n === 1 ? W : W / (n - 1);
        return (
          <rect key={i} x={X(i) - cw / 2} y={t} width={cw} height={H} fill="transparent"
            {...tipOn(<><div className="m">{lb}</div><span style={{ color: "#7cc4ee" }}>●</span> {name} <b>{fmt(data[i])}{unit}</b></>)} />
        );
      })}
    </svg>
  );
}

function BarChart({
  data, labels, sub, hl = -1, unit = "명", w = 440, h = 170, color = "var(--blue)", tipLabels,
}: { data: number[]; labels: string[]; sub?: string[]; hl?: number; unit?: string; w?: number; h?: number; color?: string; tipLabels?: string[] }) {
  const l = 40, t = 14, b = sub ? 40 : 28, W = w - l - 10, H = h - t - b;
  const max = niceMax(Math.max(0, ...data));
  const bw = W / Math.max(1, data.length);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%">
      <Axis l={l} t={t} W={W} H={H} max={max} />
      {data.map((v, i) => {
        const bh = (H * v) / max, ww = Math.min(bw * 0.62, 46), x = l + i * bw + (bw - ww) / 2;
        return (
          <g key={i}>
            <RBar x={x} y={t + H - bh} w={ww} h={bh} fill={i === hl ? "var(--gold)" : color} />
            <text x={x + ww / 2} y={t + H + 15} textAnchor="middle" fontSize={10.5} fill={AXIS}>{labels[i]}</text>
            {sub && <text x={x + ww / 2} y={t + H + 28} textAnchor="middle" fontSize={9.5} fill="rgba(255,255,255,.3)">{sub[i]}</text>}
            <rect x={l + i * bw} y={t} width={bw} height={H} fill="transparent"
              {...tipOn(<><div className="m">{tipLabels?.[i] ?? labels[i]}</div><b>{fmt(v)}{unit}</b></>)} />
          </g>
        );
      })}
    </svg>
  );
}

function HBars({
  items, unit = "명", max, w = 440, lw = 96, digits = 0,
}: { items: { name: string; color: string; value: number }[]; unit?: string; max?: number; w?: number; lw?: number; digits?: number }) {
  const h = items.length * 38 + 6;
  const m = max ?? Math.max(1, ...items.map((i) => i.value));
  const W = w - lw - 70;
  const show = (v: number) => (digits ? v.toFixed(digits) : fmt(v)) + unit;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%">
      {items.map(({ name, color, value }, i) => {
        const y = 6 + i * 38, bw = Math.max(0, (W * Math.min(value, m)) / m);
        return (
          <g key={name} {...tipOn(<><b>{name}</b> {show(value)}</>)}>
            <text x={lw - 10} y={y + 15} textAnchor="end" fontSize={12} fill="rgba(255,255,255,.8)">{name.length > 9 ? name.slice(0, 8) + "…" : name}</text>
            {bw > 0 && (
              <path d={`M${lw},${y} H${lw + Math.max(0, bw - 4)} Q${lw + bw},${y} ${lw + bw},${y + 4} V${y + 18} Q${lw + bw},${y + 22} ${lw + Math.max(0, bw - 4)},${y + 22} H${lw} Z`} fill={color} />
            )}
            <text x={lw + bw + 8} y={y + 16} fontSize={12} fill="#fff">{show(value)}</text>
            <rect x={0} y={y - 4} width={w} height={32} fill="transparent" />
          </g>
        );
      })}
    </svg>
  );
}

function Stacked({
  days, srcs, values, pctMode, w = 760, h = 300,
}: { days: string[]; srcs: string[]; values: Record<string, Record<string, number>>; pctMode: boolean; w?: number; h?: number }) {
  const l = 40, t = 14, b = 28, W = w - l - 10, H = h - t - b;
  const totals = days.map((d) => srcs.reduce((s, k) => s + (values[d]?.[k] ?? 0), 0));
  const max = pctMode ? 100 : niceMax(Math.max(0, ...totals));
  const bw = W / Math.max(1, days.length);
  const every = Math.ceil(days.length / 10);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%">
      <Axis l={l} t={t} W={W} H={H} max={max} f={(v) => (pctMode ? `${v}%` : fmt(v))} />
      {days.map((d, i) => {
        const tot = totals[i];
        const ww = Math.min(bw * 0.62, 46), x = l + i * bw + (bw - ww) / 2;
        let acc = 0;
        const parts = srcs.map((k) => {
          const raw = values[d]?.[k] ?? 0;
          const val = pctMode ? (tot ? (raw / tot) * 100 : 0) : raw;
          const hh = (H * val) / max;
          const y = t + H - (H * (acc + val)) / max;
          acc += val;
          return hh > 0 ? <rect key={k} x={x} y={y} width={ww} height={Math.max(0, hh - 2)} fill={srcMeta(k).color} /> : null;
        });
        return (
          <g key={d}>
            {parts}
            {(i % every === 0 || i === days.length - 1) && (
              <text x={x + ww / 2} y={t + H + 16} textAnchor="middle" fontSize={10.5} fill={AXIS}>{md(d)}</text>
            )}
            <rect x={l + i * bw} y={t} width={bw} height={H} fill="transparent"
              {...tipOn(
                <>
                  <div className="m">{md(d)} · 총 {fmt(tot)}명</div>
                  {srcs.filter((k) => values[d]?.[k]).map((k) => (
                    <div key={k}><span style={{ color: srcMeta(k).color }}>■</span> {srcMeta(k).label} <b>{pctMode ? `${Math.round(((values[d][k] ?? 0) / (tot || 1)) * 100)}%` : `${values[d][k]}명`}</b></div>
                  ))}
                </>,
              )} />
          </g>
        );
      })}
    </svg>
  );
}

const HEAT_DOW = ["월", "화", "수", "목", "금", "토", "일"]; // isodow 1~7
function Heat({ cells, w = 760, cell = 30 }: { cells: Map<string, number>; w?: number; cell?: number }) {
  const l = 30, t = 8;
  const cw = (w - l) / 24;
  const max = Math.max(1, ...cells.values());
  return (
    <svg viewBox={`0 0 ${w} ${t + 7 * cell + 26}`} width="100%">
      {HEAT_DOW.map((d, i) => (
        <g key={d}>
          <text x={l - 10} y={t + i * cell + cell / 2 + 4} textAnchor="end" fontSize={11} fill={AXIS}>{d}</text>
          {Array.from({ length: 24 }, (_, hh) => {
            const v = cells.get(`${i + 1}-${hh}`) ?? 0;
            return (
              <rect key={hh} x={l + hh * cw + 1} y={t + i * cell + 1} width={cw - 2} height={cell - 2} rx={4} fill="#7cc4ee"
                fillOpacity={(0.06 + (v / max) * 0.94).toFixed(2)}
                {...tipOn(<><div className="m">{d}요일 {hh}시</div><b>{fmt(v)}명</b></>)} />
            );
          })}
        </g>
      ))}
      {Array.from({ length: 8 }, (_, k) => k * 3).map((hh) => (
        <text key={hh} x={l + hh * cw + cw / 2} y={t + 7 * cell + 16} textAnchor="middle" fontSize={10} fill={AXIS}>{hh}시</text>
      ))}
    </svg>
  );
}

function Spark({ data, color = "#7cc4ee" }: { data: number[]; color?: string }) {
  if (data.length < 2) return <div style={{ height: 34, marginTop: 6 }} />;
  const w = 160, h = 40;
  const max = Math.max(...data), min = Math.min(...data);
  const X = (i: number) => 2 + ((w - 4) * i) / (data.length - 1);
  const Y = (v: number) => h - 4 - ((h - 8) * (v - min)) / (max - min || 1);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ marginTop: 6, width: "100%", height: 34 }} preserveAspectRatio="none">
      <path d={"M" + data.map((v, i) => `${X(i)},${Y(v)}`).join(" L")} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" />
      <circle cx={X(data.length - 1)} cy={Y(data[data.length - 1])} r={3} fill={color} />
    </svg>
  );
}

function Funnel({ steps }: { steps: { name: string; value: number; gold?: boolean }[] }) {
  const top = Math.max(1, steps[0]?.value ?? 1);
  return (
    <svg viewBox={`0 0 640 ${steps.length * 58 + 4}`} width="100%">
      {steps.map(({ name, value, gold }, i) => {
        const y = 6 + i * 58, w = Math.max(40, (600 * value) / top), x = 20 + (600 - w) / 2;
        const prev = i ? steps[i - 1].value : value;
        return (
          <g key={name} {...tipOn(<><b>{name}</b> {fmt(value)}명</>)}>
            <rect x={x} y={y} width={w} height={34} rx={8} fill={gold ? "#f3c98b" : "#7cc4ee"} fillOpacity={gold ? 1 : 1 - i * 0.15} />
            <text x={320} y={y + 22} textAnchor="middle" fontSize={13} fontWeight={700} fill="#0b0e11">{fmt(value)}명</text>
            <text x={320} y={y + 50} textAnchor="middle" fontSize={11.5} fill="rgba(255,255,255,.62)">
              {name}{i ? ` · ${pct(value, top).toFixed(1)}%  (−${fmt(Math.max(0, prev - value))})` : ""}
            </text>
            <rect x={0} y={y} width={640} height={54} fill="transparent" />
          </g>
        );
      })}
    </svg>
  );
}

/** 한 줄 100% 쌓은 막대 (기기 비율) */
function ShareBar({ title, items }: { title: string; items: { name: string; value: number }[] }) {
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  let x = 0;
  return (
    <svg viewBox="0 0 440 34" width="100%" style={{ marginTop: 6 }}>
      <text x={0} y={10} fontSize={11} fill={AXIS}>{title}</text>
      {items.map(({ name, value }, i) => {
        const w = (440 * value) / total;
        const p = Math.round((value / total) * 100);
        const node = (
          <g key={name} {...tipOn(<><b>{name}</b> {p}% ({fmt(value)}명)</>)}>
            <rect x={x + (i ? 1 : 0)} y={14} width={Math.max(0, w - (i ? 2 : 0))} height={20} rx={4} fill="#7cc4ee" fillOpacity={Math.max(0.25, 1 - i * 0.3)} />
            {w > 70 && <text x={x + 8} y={28} fontSize={11} fill="#0b0e11" fontWeight={700}>{name} {p}%</text>}
          </g>
        );
        x += w;
        return node;
      })}
    </svg>
  );
}

/* =========================================================================
 * 확인 모달
 * ========================================================================= */
function Confirm({ title, sub, onYes, onNo, busy }: { title: string; sub?: string; onYes: () => void; onNo: () => void; busy?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onNo();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onNo]);
  return (
    <div className="modal-bg" onClick={onNo}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <p>{title}</p>
        {sub && <div className="sub">{sub}</div>}
        <div className="acts">
          <button className="btn g" onClick={onNo} disabled={busy}>취소</button>
          <button className="btn" onClick={onYes} disabled={busy} autoFocus>{busy ? "처리 중…" : "확인"}</button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
 * 비밀번호 화면
 * ========================================================================= */
function Gate({ onOk }: { onOk: (pw: string) => void }) {
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(0);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!pw || busy) return;
    setBusy(true);
    setMsg("");
    // 비밀번호는 서버 함수가 해시와 비교해요. 브라우저는 맞다/틀리다만 알아요.
    const { error } = await supabase.rpc("concert_stats_login", { p_password: pw });
    setBusy(false);
    if (error) {
      setMsg(isAuthError(error) ? "비밀번호가 틀렸어요" : "연결에 실패했어요. 잠시 후 다시 해 주세요.");
      setShake((n) => n + 1);
      return;
    }
    onOk(pw);
  };
  return (
    <div className="gate">
      <form key={shake} className={shake ? "shake" : ""} onSubmit={submit}>
        <div className="brand">
          輪舞 STATS
          <small>회장단 전용 · 2026 정기공연 방문 기록</small>
        </div>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="비밀번호" autoFocus autoComplete="current-password" aria-label="비밀번호" />
        <button className="btn" type="submit" disabled={busy || !pw}>{busy ? "확인 중…" : "들어가기"}</button>
        <div className="msg" role="alert">{msg}</div>
      </form>
    </div>
  );
}

/* =========================================================================
 * 대시보드
 * ========================================================================= */
const EVENT_TEXT = (e: Live["recent"][number]) => {
  switch (e.event) {
    case "page_view": return e.detail === "redirect" ? "카톡에서 바로 신청 폼으로" : "새 방문";
    case "apply_click": return "사전 신청 버튼 클릭";
    case "team_open": return `${e.detail ? teamName(e.detail) : "팀"} 팀 열람`;
    case "share_kakao": return "카톡으로 공유";
    case "share_insta": return "인스타 스토리 공유";
    case "lang_switch": return e.detail === "en" ? "영어 버전으로 전환" : "한국어로 전환";
    case "map_click": return "오시는 길 클릭";
    case "calendar_save": return "캘린더에 저장";
    default: return e.event;
  }
};
const hhmm = (iso: string) => new Date(new Date(iso).getTime() + KST).toISOString().slice(11, 16);
const visitKey = (v: Pick<Visit, "code" | "started_at">) => `${v.code}:${v.started_at}`;
const visitDuration = (sec: number) => sec < 60 ? `${sec}초` : `${Math.floor(sec / 60)}분${sec % 60 ? ` ${sec % 60}초` : ""}`;
const visitStamp = (iso: string) => new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
}).format(new Date(iso));
const visitResultText = (result: Visit["result"]) => result === "clicked" ? "신청 클릭" : result === "browsed" ? "둘러봄" : "첫 화면만";
const visitEventText = (event: VisitEvent) => {
  switch (event.event) {
    case "page_view": return "👋 들어왔어요";
    case "section_view":
      if (event.detail === "about") return "📖 공연 소개를 봤어요";
      if (event.detail === "lineup") return "🎭 무대 순서까지 내려왔어요";
      if (event.detail === "apply") return "📝 사전 신청 섹션까지 왔어요";
      return "📖 섹션을 봤어요";
    case "team_open": return `⭐ ${event.detail ? teamName(event.detail) : "팀"} 팀 상세를 열었어요`;
    case "apply_click": return "✅ 사전 신청 버튼을 눌렀어요";
    case "share_kakao": return "💬 카톡으로 공유했어요";
    case "share_insta": return "📸 인스타 스토리로 공유했어요";
    case "calendar_save": return "📅 캘린더에 저장했어요";
    case "map_click": return "📍 오시는 길을 눌렀어요";
    case "lang_switch": return "🌏 영어로 바꿨어요";
    default: return event.event;
  }
};
const hourWords = (h: number) => {
  const part = h < 6 ? "새벽" : h < 12 ? "오전" : h < 18 ? "오후" : "밤";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const n12 = (h + 1) % 12 === 0 ? 12 : (h + 1) % 12;
  return `${part} ${h12}~${n12}시`;
};

function Dashboard({ pw, onAuthFail }: { pw: string; onAuthFail: () => void }) {
  const [period, setPeriod] = useState<Period>("all");
  const [data, setData] = useState<Stats | null>(null);
  const [live, setLive] = useState<Live | null>(null);
  const [visitorPreview, setVisitorPreview] = useState<Visit[]>([]);
  const [visitorPreviewError, setVisitorPreviewError] = useState("");
  const [visitorPreviewLoaded, setVisitorPreviewLoaded] = useState(false);
  const [visitorsOpen, setVisitorsOpen] = useState(false);
  const [visitorRows, setVisitorRows] = useState<Visit[]>([]);
  const [visitorTotal, setVisitorTotal] = useState(0);
  const [visitorListLoading, setVisitorListLoading] = useState(false);
  const [visitorListError, setVisitorListError] = useState("");
  const [visitorFilter, setVisitorFilter] = useState("all");
  const [visitorSearch, setVisitorSearch] = useState("");
  const [visitorSearchQuery, setVisitorSearchQuery] = useState("");
  const [visitorAnchor, setVisitorAnchor] = useState("");
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [visitDetails, setVisitDetails] = useState<Record<string, VisitDetail>>({});
  const [visitDetailLoading, setVisitDetailLoading] = useState(false);
  const [visitDetailError, setVisitDetailError] = useState("");
  const [visitDetailRetry, setVisitDetailRetry] = useState(0);
  const visitorPreviewRequest = useRef(0);
  const visitorListRequest = useRef(0);
  const [err, setErr] = useState("");
  const [mainKey, setMainKey] = useState<"visitors" | "sessions" | "clickers">("visitors");
  const [stackPct, setStackPct] = useState(false);
  const narrow = useNarrow();
  const [rankOpen, setRankOpen] = useState(false);
  const [confirm, setConfirm] = useState<null | { title: string; sub?: string; run: () => Promise<void> }>(null);
  const [busy, setBusy] = useState(false);
  // 1분마다 도는 타이머가 "지금 고른 기간"을 읽을 수 있게 ref 에도 들고 있어요 (아래 load 보다 먼저 맞춰요)
  const periodRef = useRef(period);
  useEffect(() => {
    periodRef.current = period;
  }, [period]);

  /* ---------- 불러오기 (1분마다) ---------- */
  const load = useCallback(async () => {
    const p = periodRef.current;
    const r = rangeOf(p);
    const { data: d, error } = await supabase.rpc("get_concert_stats", { p_password: pw, p_from: r.from, p_to: r.to });
    if (periodRef.current !== p) return; // 그사이 기간을 바꿨으면 버려요
    if (error) {
      if (isAuthError(error)) onAuthFail();
      else setErr("통계를 불러오지 못했어요. 잠시 후 자동으로 다시 시도해요.");
      return;
    }
    setErr("");
    setData(d as Stats);
  }, [pw, onAuthFail]);

  const loadLive = useCallback(async () => {
    const { data: d, error } = await supabase.rpc("get_concert_live", { p_password: pw });
    if (error) {
      if (isAuthError(error)) onAuthFail();
      return;
    }
    setLive(d as Live);
  }, [pw, onAuthFail]);

  const loadVisitorPreview = useCallback(async () => {
    const request = ++visitorPreviewRequest.current;
    const r = rangeOf(period);
    setVisitorPreviewLoaded(false);
    const response = await Promise.resolve(supabase.rpc("get_concert_visitors", {
      p_password: pw, p_from: r.from, p_to: r.to, p_filter: "all", p_offset: 0, p_limit: 10,
    })).catch(() => null);
    if (request !== visitorPreviewRequest.current) return;
    if (!response) {
      setVisitorPreviewError("방문자 기록을 불러오지 못했어요.");
      setVisitorPreviewLoaded(true);
      return;
    }
    const { data, error } = response;
    if (error) {
      if (isAuthError(error)) onAuthFail();
      else setVisitorPreviewError("방문자 기록을 불러오지 못했어요.");
      setVisitorPreviewLoaded(true);
      return;
    }
    const result = data as VisitorsPage;
    setVisitorPreview(result.visits.slice(0, 10));
    setVisitorPreviewError("");
    setVisitorPreviewLoaded(true);
  }, [pw, onAuthFail, period]);

  const loadVisitorPage = useCallback(async (offset: number, filter: string, append: boolean) => {
    const request = ++visitorListRequest.current;
    const r = rangeOf(period);
    setVisitorListLoading(true);
    setVisitorListError("");
    if (!append) {
      setVisitorRows([]);
      setVisitorTotal(0);
    }
    const response = await Promise.resolve(supabase.rpc("get_concert_visitors", {
      p_password: pw, p_from: r.from, p_to: r.to, p_filter: filter, p_offset: offset, p_limit: 30,
    })).catch(() => null);
    if (request !== visitorListRequest.current) return;
    setVisitorListLoading(false);
    if (!response) {
      setVisitorListError("방문자 목록을 불러오지 못했어요.");
      return;
    }
    const { data, error } = response;
    if (error) {
      if (isAuthError(error)) onAuthFail();
      else setVisitorListError("방문자 목록을 불러오지 못했어요.");
      return;
    }
    const result = data as VisitorsPage;
    setVisitorTotal(result.total);
    if (append) setVisitorRows((rows) => [...rows, ...result.visits]);
    else {
      setVisitorRows(result.visits);
      setVisitorAnchor(result.visits[0]?.started_at ?? "");
      setSelectedVisit(result.visits[0] ?? null);
    }
  }, [period, pw, onAuthFail]);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisitorSearchQuery(visitorSearch.trim().toUpperCase()), 250);
    return () => window.clearTimeout(timer);
  }, [visitorSearch]);
  const activeVisitorFilter = visitorSearchQuery || visitorFilter;
  useEffect(() => {
    if (visitorsOpen) void loadVisitorPage(0, activeVisitorFilter, false);
  }, [visitorsOpen, period, activeVisitorFilter, loadVisitorPage]);
  useEffect(() => {
    void loadVisitorPreview();
  }, [loadVisitorPreview]);
  useEffect(() => {
    if (!visitorsOpen || !selectedVisit) return;
    const key = visitKey(selectedVisit);
    if (visitDetails[key]) return;
    let active = true;
    setVisitDetailLoading(true);
    setVisitDetailError("");
    void Promise.resolve(supabase.rpc("get_concert_visit_detail", {
      p_password: pw, p_code: selectedVisit.code, p_started_at: selectedVisit.started_at,
    })).then(({ data: response, error }) => {
      if (!active) return;
      setVisitDetailLoading(false);
      if (error) {
        if (isAuthError(error)) onAuthFail();
        else setVisitDetailError("방문 상세를 불러오지 못했어요.");
        return;
      }
      setVisitDetails((cache) => ({ ...cache, [key]: response as VisitDetail }));
    }).catch(() => {
      if (!active) return;
      setVisitDetailLoading(false);
      setVisitDetailError("방문 상세를 불러오지 못했어요.");
    });
    return () => { active = false; };
  }, [visitorsOpen, selectedVisit, visitDetails, visitDetailRetry, pw, onAuthFail]);
  useEffect(() => {
    if (!visitorsOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setVisitorsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [visitorsOpen]);

  useEffect(() => {
    void load();
  }, [period, load]);
  useEffect(() => {
    void loadLive();
    // 탭을 안 보고 있을 땐 건너뛰어요 (서버 부담 · 배터리)
    const a = window.setInterval(() => !document.hidden && void load(), 60_000);
    const b = window.setInterval(() => !document.hidden && void loadLive(), 30_000);
    const c = window.setInterval(() => !document.hidden && void loadVisitorPreview(), 60_000);
    const onVis = () => {
      if (!document.hidden) {
        void load();
        void loadLive();
        void loadVisitorPreview();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(a);
      window.clearInterval(b);
      window.clearInterval(c);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [load, loadLive, loadVisitorPreview]);

  /* ---------- 저장 (홍보 기록 · 수동 숫자) ---------- */
  const rpcWrite = async (fn: string, args: Record<string, unknown>) => {
    const { error } = await supabase.rpc(fn, { p_password: pw, ...args });
    if (error) {
      if (isAuthError(error)) onAuthFail();
      else setErr("저장하지 못했어요. 다시 시도해 주세요.");
      return false;
    }
    return true;
  };
  const ask = (title: string, run: () => Promise<void>, sub?: string) => setConfirm({ title, sub, run });
  const runConfirm = async () => {
    if (!confirm) return;
    setBusy(true);
    await confirm.run();
    setBusy(false);
    setConfirm(null);
    void load();
  };
  const setManual = async (key: string, value: number) => {
    if (await rpcWrite("concert_set_manual", { p_key: key, p_value: Math.max(0, Math.round(value)) })) void load();
  };

  /* ---------- 계산 ---------- */
  const view = useMemo(() => (data ? compute(data) : null), [data]);
  const r = rangeOf(period);
  const previewNewCount = visitorsOpen && visitorAnchor
    ? visitorPreview.filter((v) => v.started_at > visitorAnchor).length
    : 0;

  return (
    <div className="app1">
      <div className="hdr">
        <div className="brand">
          輪舞 STATS
          <small>회장단 전용 · 2026 정기공연 방문 기록</small>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span className="livechip" title="최근 90초 안에 페이지를 보고 있던 기기 수">
            <span className={`dot ${live?.live ? "" : "idle"}`} />
            지금 <b style={{ color: "#fff" }}>{live ? fmt(live.live) : "–"}</b>명 보는 중
          </span>
          <div className="seg" role="tablist" aria-label="기간">
            {([["today", "오늘"], ["7d", "최근 7일"], ["all", "전체 (11/23~)"]] as const).map(([k, lb]) => (
              <button key={k} className={period === k ? "on" : ""} onClick={() => setPeriod(k)} role="tab" aria-selected={period === k}>{lb}</button>
            ))}
          </div>
        </div>
      </div>

      {err && <div className="err">{err}</div>}
      {!view || !data ? (
        <p className="note" style={{ marginTop: 30 }}>불러오는 중…</p>
      ) : (
        <>
          <Kpis d={data} v={view} period={period} onSetSubmissions={(n) => setManual("form_submissions", n)} />

          {/* ── 01 방문 흐름 ── */}
          <div className="sec-t"><b>01</b><span>방문 흐름</span></div>
          <div className="row c11">
            <div className="card">
              <div className="headrow">
                <div><h3>일별 방문자 + 홍보한 날</h3><div className="s">금색 점 = 홍보 · 마우스를 올리면 그날 숫자</div></div>
                <div className="seg">
                  {([["visitors", "방문자"], ["sessions", "방문 수"], ["clickers", "신청 클릭"]] as const).map(([k, lb]) => (
                    <button key={k} className={mainKey === k ? "on" : ""} onClick={() => setMainKey(k)}>{lb}</button>
                  ))}
                </div>
              </div>
              <div className="empty-box">
                <LineChart w={narrow ? 440 : 760} h={narrow ? 300 : 330}
                  labels={data.daily.map((x) => `${md(x.day)} ${wd(x.day)}`)}
                  data={data.daily.map((x) => x[mainKey])}
                  name={mainKey === "visitors" ? "방문자" : mainKey === "sessions" ? "방문 수" : "신청 클릭"}
                  unit={mainKey === "sessions" ? "회" : "명"}
                  ann={view.ann}
                />
                {data.totals.visitors === 0 && <Empty>아직 방문 기록이 없어요 · 공연 페이지가 열리면 여기에 쌓여요</Empty>}
              </div>
            </div>
            <div className="col">
              <GoalCard d={data} onSave={setManual} />
              <div className="card" style={{ flex: 1 }}>
                <h3>방금 일어난 일</h3>
                <div className="feed" style={{ height: 190, marginTop: 8 }}>
                  {live && live.recent.length === 0 && <p className="note">아직 아무 일도 없어요</p>}
                  {live?.recent.map((e) => (
                    <div key={e.t + e.event + (e.detail ?? "")}>
                      <span className="t">{hhmm(e.t)}</span>
                      <span className="pill" style={{ background: srcMeta(e.src).color }}>{srcMeta(e.src).short}</span>
                      <span>{EVENT_TEXT(e)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card cs-vis-preview">
                <div className="headrow">
                  <h3>방문자별 기록</h3>
                  <button className="link" onClick={() => {
                    setVisitorFilter("all");
                    setVisitorSearch("");
                    setVisitorSearchQuery("");
                    setVisitorAnchor(visitorPreview[0]?.started_at ?? "");
                    setVisitorsOpen(true);
                  }}>자세히 보기 ⤢</button>
                </div>
                {visitorPreviewError ? (
                  <div className="cs-vis-status">
                    <span>{visitorPreviewError}</span>
                    <button className="link" onClick={() => void loadVisitorPreview()}>다시 시도</button>
                  </div>
                ) : visitorPreview.length ? (
                  <div className="cs-vis-preview-list">
                    {visitorPreview.slice(0, 3).map((visit) => (
                      <div className="cs-vis-preview-row" key={visitKey(visit)}>
                        <span className="cs-vis-time">{hhmm(visit.started_at)}</span>
                        <b className="mono">#{visit.code}</b>
                        <span className="pill" style={{ background: srcMeta(visit.src).color }}>{srcMeta(visit.src).short}</span>
                        <span className={`cs-vis-result cs-vis-${visit.result}`}>{visitResultText(visit.result)}</span>
                        <span className="cs-vis-duration">{visitDuration(visit.duration_sec)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="cs-vis-status">{visitorPreviewLoaded ? "아직 다녀간 사람이 없어요" : "방문 기록을 불러오는 중…"}</p>
                )}
              </div>
            </div>
          </div>
          <div className="row c3">
            <div className="card call"><div className="s">오늘의 한 줄</div><div className="big">{view.oneLiner}</div></div>
            <div className="card">
              <h3>가장 효과 있던 홍보</h3>
              {view.bestPromos.length ? (
                <table>
                  <tbody>
                    {view.bestPromos.map((p) => (
                      <tr key={p.id}>
                        <td className="wrap">{md(p.day)} {p.memo}</td>
                        <td className={`r ${p.diff >= 0 ? "up" : "down"}`}>{p.diff >= 0 ? "+" : "−"}{fmt(Math.abs(p.diff))}명</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="note">홍보 기록을 남기면, 그날 방문자가 전날보다 얼마나 늘었는지 보여줘요.</p>
              )}
            </div>
            <PromoCard notes={data.notes} today={data.today}
              onAdd={(day, memo) => ask("추가하시겠습니까?", async () => { await rpcWrite("concert_add_note", { p_day: day, p_memo: memo }); }, `${md(day)} · ${memo}`)}
              onDelete={(n) => ask("삭제하시겠습니까?", async () => { await rpcWrite("concert_delete_note", { p_id: n.id }); }, `${md(n.day)} · ${n.memo}`)} />
          </div>

          {/* ── 02 어디서 ── */}
          <div className="sec-t"><b>02</b><span>어디서 들어왔나</span></div>
          <div className="row c12">
            <div className="card">
              <h3>경로별 방문자</h3><div className="s">{period === "all" ? "전체 기간" : period === "7d" ? "최근 7일" : "오늘"}</div>
              <div className="empty-box">
                {data.sources.length ? (
                  <HBars items={data.sources.map((s) => ({ name: srcMeta(s.src).label, color: srcMeta(s.src).color, value: s.visitors }))} />
                ) : <Empty />}
              </div>
              <h3 style={{ marginTop: 16 }}>경로별 사전 신청 클릭률</h3>
              <div className="s">그 경로로 온 사람 중 신청 버튼을 누른 비율</div>
              <div className="empty-box">
                {data.sources.length ? (
                  <HBars unit="%" digits={1} max={Math.max(10, ...data.sources.map((s) => pct(s.clickers, s.visitors)))}
                    items={[...data.sources].sort((a, b) => pct(b.clickers, b.visitors) - pct(a.clickers, a.visitors))
                      .map((s) => ({ name: srcMeta(s.src).label, color: srcMeta(s.src).color, value: pct(s.clickers, s.visitors) }))} />
                ) : <Empty />}
              </div>
            </div>
            <div className="card">
              <div className="headrow">
                <div><h3>날짜별 유입 경로</h3><div className="s">매일 어떤 경로가 많았는지</div></div>
                <div className="seg">
                  <button className={!stackPct ? "on" : ""} onClick={() => setStackPct(false)}>명</button>
                  <button className={stackPct ? "on" : ""} onClick={() => setStackPct(true)}>비율 %</button>
                </div>
              </div>
              <div className="empty-box">
                <Stacked days={data.daily.map((x) => x.day)} srcs={view.srcOrder} values={view.srcByDay} pctMode={stackPct} w={narrow ? 440 : 760} h={narrow ? 260 : 300} />
                {data.totals.visitors === 0 && <Empty />}
              </div>
              <div className="legend">
                {view.srcOrder.map((k) => <span key={k}><i style={{ background: srcMeta(k).color }} />{srcMeta(k).label}</span>)}
              </div>
              <details style={{ marginTop: 14 }}>
                <summary className="more">꼬리표 주소 보기 ▾</summary>
                <table>
                  <thead><tr><th>경로</th><th>링크 뒤에 붙이기</th><th>쓰는 곳</th></tr></thead>
                  <tbody>
                    {[["insta", "스토리 공유 버튼 (자동)"], ["kakao", "카톡 공유 버튼 (자동)"], ["qr", "새로 뽑는 포스터·현수막"], ["notice", "공지에 붙여넣기"]].map(([k, where]) => (
                      <tr key={k}>
                        <td><span className="pill" style={{ background: srcMeta(k).color }}>{srcMeta(k).label}</span></td>
                        <td><b>?src={k}</b></td>
                        <td>{where}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="note">예: hallymdancewind.com/2026concert<b style={{ color: "#fff" }}>?src=qr</b> · 새 경로가 필요하면 영어 소문자로 아무 이름이나 붙여도 따로 집계돼요.</p>
              </details>
            </div>
          </div>

          {/* ── 03 신청까지 ── */}
          <div className="sec-t"><b>03</b><span>사전 신청까지</span></div>
          <div className="row c11">
            <div className="card">
              <h3>단계별 남은 사람</h3><div className="s">들어온 사람이 어디서 빠져나가나</div>
              <div className="empty-box">
                {data.funnel.visitors ? <Funnel steps={view.funnelSteps} /> : <Empty />}
              </div>
              {period !== "all" && <p className="note">※ 구글 폼 제출 수는 직접 입력한 전체 기간 숫자예요.</p>}
            </div>
            <div className="col">
              <div className="card call">
                <div className="s">전환율 (폼 제출 ÷ 방문자)</div>
                <div className="big" style={{ fontSize: 40 }}>{data.manual.form_submissions ? pct1(data.manual.form_submissions, data.funnel.visitors) : "—"}</div>
                <div className="note" style={{ color: "var(--ink2)" }}>{view.funnelAdvice}</div>
              </div>
              <div className="card">
                <h3>기기별 신청 클릭률</h3>
                <div className="empty-box">
                  {data.devices.length ? (
                    <HBars unit="%" digits={1} lw={86} max={Math.max(10, ...data.devices.map((x) => pct(x.clickers, x.visitors)))}
                      items={data.devices.map((x) => ({ name: DEVICE_NAME[x.device] ?? x.device, color: "#7cc4ee", value: pct(x.clickers, x.visitors) }))} />
                  ) : <Empty />}
                </div>
              </div>
            </div>
          </div>

          {/* ── 04 언제 ── */}
          <div className="sec-t"><b>04</b><span>언제 들어오나</span></div>
          <div className="row c11">
            <div className="card">
              <h3>요일 × 시간대</h3><div className="s">진할수록 많이 들어온 시간 (한국 시간)</div>
              <div className="empty-box">
                <Heat cells={view.heat} w={narrow ? 440 : 760} cell={narrow ? 24 : 30} />
                {!data.heat.length && <Empty />}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, fontSize: 11, color: "var(--ink3)" }}>
                적음<span style={{ width: 120, height: 8, borderRadius: 4, background: "linear-gradient(90deg,rgba(124,196,238,.06),#7cc4ee)" }} />많음
              </div>
            </div>
            <div className="col">
              <div className="card">
                <h3>오늘 시간대별</h3><div className="s">금색 = 지금</div>
                <div className="empty-box">
                  <BarChart data={view.todayHours} labels={view.todayHours.map((_, i) => (i % 6 ? "" : `${i}시`))} tipLabels={view.todayHours.map((_, i) => `오늘 ${i}시`)} hl={view.nowHour} />
                  {data.today_visitors === 0 && <Empty>오늘은 아직 방문이 없어요</Empty>}
                </div>
              </div>
              <div className="card call">
                <div className="s">추천 홍보 시간 (방문 많은 시간 TOP 3)</div>
                <div className="big">
                  {view.topHours.length ? view.topHours.map((h, i) => <div key={i}>{["🥇", "🥈", "🥉"][i]} {h}</div>) : "기록이 쌓이면 알려줄게요"}
                </div>
              </div>
            </div>
          </div>

          {/* ── 05 팀 · 공유 · 기기 ── */}
          <div className="sec-t"><b>05</b><span>팀 · 공유 · 기기</span></div>
          <div className="row c3">
            <div className="card">
              <h3>팀 페이지 인기 순위</h3><div className="s">상세 페이지를 연 횟수</div>
              {data.teams.length ? (
                <>
                  <ul className="rank" style={{ marginTop: 6 }}>
                    {view.teamRank.slice(0, rankOpen ? undefined : 8).map((t, i) => (
                      <li key={t.id} {...tipOn(<><b>{t.name}</b> {fmt(t.opens)}회</>)}>
                        <span className="n">{String(i + 1).padStart(2, "0")}</span>
                        <span className="nm">{t.name}</span>
                        <span className="bar" style={{ width: `${(t.opens / view.teamMax) * 100}%`, opacity: i < 3 ? 1 : 0.55 }} />
                        <span className="c">{fmt(t.opens)}</span>
                      </li>
                    ))}
                  </ul>
                  <button className="more" onClick={() => setRankOpen((v) => !v)}>{rankOpen ? "접기 ▴" : `${KO.teams.length}팀 모두 보기 ▾`}</button>
                </>
              ) : <div className="empty-box"><Empty>아직 팀 페이지를 연 사람이 없어요</Empty></div>}
            </div>
            <div className="card">
              <h3>공유 효과</h3><div className="s">버튼 1번이 몇 명을 데려왔나</div>
              <div className="row c2" style={{ gap: 8, marginTop: 10 }}>
                <div className="card kpi" style={{ padding: 12 }}>
                  <div className="k">카톡 {fmt(data.totals.shares_kakao)}회</div>
                  <div className="v" style={{ fontSize: 24 }}>{data.totals.shares_kakao ? (data.totals.kakao_visitors / data.totals.shares_kakao).toFixed(1) : "—"}<small>명/회</small></div>
                  <div className="d">카톡으로 온 사람 {fmt(data.totals.kakao_visitors)}명</div>
                </div>
                <div className="card kpi" style={{ padding: 12 }}>
                  <div className="k">스토리 {fmt(data.totals.shares_insta)}회</div>
                  <div className="v" style={{ fontSize: 24 }}>{data.totals.shares_insta ? (data.totals.insta_visitors / data.totals.shares_insta).toFixed(1) : "—"}<small>명/회</small></div>
                  <div className="d">인스타로 온 사람 {fmt(data.totals.insta_visitors)}명</div>
                </div>
              </div>
              <h3 style={{ marginTop: 14, fontSize: 13 }}>날짜별 공유로 들어온 사람</h3>
              <div className="empty-box">
                <BarChart data={data.daily.map((x) => x.share_visitors)} labels={view.shortLabels} tipLabels={data.daily.map((x) => md(x.day))} h={180} />
                {data.totals.kakao_visitors + data.totals.insta_visitors === 0 && <Empty />}
              </div>
            </div>
            <div className="card">
              <h3>기기 · 브라우저 · 언어</h3>
              {data.devices.length ? (
                <>
                  <ShareBar title="기기" items={data.devices.map((x) => ({ name: DEVICE_NAME[x.device] ?? x.device, value: x.visitors }))} />
                  <ShareBar title="언어" items={data.langs.map((x) => ({ name: x.lang === "en" ? "영어" : "한국어", value: x.visitors }))} />
                  <h3 style={{ marginTop: 12, fontSize: 13 }}>어디서 열었나</h3>
                  <HBars unit="%" lw={78} max={Math.max(10, ...view.browserPct.map((b) => b.value))} items={view.browserPct} />
                </>
              ) : <div className="empty-box"><Empty /></div>}
              <h3 style={{ marginTop: 12, fontSize: 13 }}>영어 버전 사용자 (매일)</h3>
              <BarChart data={data.daily.map((x) => x.en)} labels={view.shortLabels} tipLabels={data.daily.map((x) => md(x.day))} h={160} />
            </div>
          </div>

          {/* ── 06 날짜별 상세 ── */}
          <div className="sec-t"><b>06</b><span>날짜별 상세</span></div>
          <div className="row">
            <div className="card" style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr><th>날짜</th><th className="r">방문자</th><th className="r">방문 수</th><th className="r">새로 온 사람</th><th className="r">신청 클릭</th><th className="r">클릭률</th><th>1등 경로</th><th>홍보</th></tr>
                </thead>
                <tbody>
                  {data.daily.map((x) => (
                    <tr key={x.day}>
                      <td><b>{md(x.day)}</b> {wd(x.day)}</td>
                      <td className="r"><b>{fmt(x.visitors)}</b></td>
                      <td className="r">{fmt(x.sessions)}</td>
                      <td className="r">{fmt(x.new)}</td>
                      <td className="r">{fmt(x.clickers)}</td>
                      <td className="r">{pct1(x.clickers, x.visitors)}</td>
                      <td>{x.top_src ? <span className="pill" style={{ background: srcMeta(x.top_src).color }}>{srcMeta(x.top_src).label}</span> : <span style={{ color: "var(--ink3)" }}>—</span>}</td>
                      <td className="wrap" style={{ color: "var(--ink3)" }}>{data.notes.filter((n) => n.day === x.day).map((n) => n.memo).join(" · ")}</td>
                    </tr>
                  ))}
                  <tr>
                    <td><b>합계</b></td>
                    <td className="r"><b>{fmt(data.totals.visitors)}</b></td>
                    <td className="r"><b>{fmt(data.totals.sessions)}</b></td>
                    <td className="r">{fmt(data.daily.reduce((s, x) => s + x.new, 0))}</td>
                    <td className="r"><b>{fmt(data.totals.clickers)}</b></td>
                    <td className="r"><b>{pct1(data.totals.clickers, data.totals.visitors)}</b></td>
                    <td colSpan={2} style={{ color: "var(--ink3)" }}>같은 사람은 기간 전체에서 1명으로 세요</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <p className="note" style={{ marginTop: 18 }}>
            {r.from === r.to ? md(r.from) : `${md(r.from)} ~ ${md(r.to)}`} · 1분마다 자동으로 새로고침 · 이 기기는 방문 기록에서 빠져 있어요
          </p>
        </>
      )}

      {visitorsOpen && (
        <div className="cs-vis-overlay" onMouseDown={(e) => {
          if (e.target === e.currentTarget) setVisitorsOpen(false);
        }}>
          <section className="cs-vis-modal" role="dialog" aria-modal="true" aria-labelledby="cs-vis-title">
            <header className="cs-vis-modal-head">
              <div>
                <h2 id="cs-vis-title">방문자별 기록</h2>
                <p>{period === "today" ? "오늘" : period === "7d" ? "최근 7일" : "전체 기간"} 방문 흐름을 살펴봐요</p>
              </div>
              {previewNewCount > 0 && (
                <button className="cs-vis-new" onClick={() => void loadVisitorPage(0, activeVisitorFilter, false)}>
                  새 방문 {previewNewCount}명 ↻
                </button>
              )}
              <button className="cs-vis-close" aria-label="닫기" onClick={() => setVisitorsOpen(false)}>×</button>
            </header>
            <div className="cs-vis-columns">
              <section className="cs-vis-list-pane" aria-label="방문 목록">
                <div className="cs-vis-list-tools">
                  <input
                    className="sel cs-vis-search"
                    value={visitorSearch}
                    onChange={(e) => setVisitorSearch(e.target.value.replace(/[^0-9a-f]/gi, "").slice(0, 4))}
                    placeholder="코드 검색 (예: A3F2)"
                    aria-label="방문 코드 검색"
                    maxLength={4}
                  />
                  <button className="btn g" disabled={visitorListLoading} onClick={() => void loadVisitorPage(0, activeVisitorFilter, false)}>↻ 새로고침</button>
                </div>
                <div className="cs-vis-filters">
                  {([
                    ["all", "전체"], ["clicked", "신청 클릭"], ["browsed", "둘러봄"], ["bounced", "첫 화면만"],
                    ["insta", "인스타"], ["kakao", "카톡"], ["qr", "QR"],
                  ] as const).map(([key, label]) => (
                    <button key={key} className={!visitorSearchQuery && visitorFilter === key ? "on" : ""}
                      onClick={() => { setVisitorSearch(""); setVisitorSearchQuery(""); setVisitorFilter(key); }}>{label}</button>
                  ))}
                </div>
                <div className="cs-vis-list" aria-live="polite">
                  {visitorListError ? (
                    <div className="cs-vis-empty">
                      <p>{visitorListError}</p>
                      <button className="btn g" onClick={() => void loadVisitorPage(0, activeVisitorFilter, false)}>다시 시도</button>
                    </div>
                  ) : visitorListLoading && !visitorRows.length ? (
                    <div className="cs-vis-empty">방문 기록을 불러오는 중…</div>
                  ) : visitorRows.length ? visitorRows.map((visit) => (
                    <button key={visitKey(visit)} className={`cs-vis-row ${selectedVisit && visitKey(selectedVisit) === visitKey(visit) ? "selected" : ""}`}
                      onClick={() => setSelectedVisit(visit)}>
                      <span className="cs-vis-row-top">
                        <b className="mono">#{visit.code}</b>
                        <span className="cs-vis-time">{visitStamp(visit.started_at)}</span>
                      </span>
                      <span className="cs-vis-row-bottom">
                        <span className="pill" style={{ background: srcMeta(visit.src).color }}>{srcMeta(visit.src).short}</span>
                        <span className={`cs-vis-result cs-vis-${visit.result}`}>{visitResultText(visit.result)}</span>
                        <span className="cs-vis-duration">{visitDuration(visit.duration_sec)}</span>
                      </span>
                    </button>
                  )) : !visitorListLoading ? (
                    <div className="cs-vis-empty">아직 다녀간 사람이 없어요</div>
                  ) : null}
                </div>
                <div className="cs-vis-list-foot">
                  <span>{fmt(visitorTotal)}명</span>
                  {visitorRows.length < visitorTotal && (
                    <button className="btn g" disabled={visitorListLoading} onClick={() => void loadVisitorPage(visitorRows.length, activeVisitorFilter, true)}>
                      {visitorListLoading ? "불러오는 중…" : "더 보기"}
                    </button>
                  )}
                  {visitorListLoading && visitorRows.length > 0 && <span className="cs-vis-loading">불러오는 중…</span>}
                </div>
              </section>

              <section className="cs-vis-detail-pane" aria-label="선택 방문 상세">
                {!selectedVisit ? (
                  <div className="cs-vis-empty">방문자를 선택해 주세요</div>
                ) : (
                  <>
                    <div className="cs-vis-detail-heading">
                      <div>
                        <b className="cs-vis-code mono">#{selectedVisit.code}</b>
                        <span className={`cs-vis-result cs-vis-${selectedVisit.result}`}>{visitResultText(selectedVisit.result)}</span>
                      </div>
                      <span className="cs-vis-started">{visitStamp(selectedVisit.started_at)}에 들어왔어요</span>
                    </div>
                    <div className="cs-vis-facts">
                      <div><small>들어온 경로</small><b>{srcMeta(selectedVisit.src).label}</b></div>
                      <div><small>기기</small><b>{DEVICE_NAME[selectedVisit.device] ?? selectedVisit.device} · {BROWSER_NAME[selectedVisit.browser] ?? selectedVisit.browser}</b></div>
                      <div><small>머문 시간</small><b>{visitDuration(selectedVisit.duration_sec)}</b></div>
                      <div><small>몇 번째 방문</small><b>{selectedVisit.visit_no === 1 ? "처음 방문" : `${selectedVisit.visit_no}번째 방문`}</b></div>
                    </div>
                    <h3 className="cs-vis-timeline-title">한 일</h3>
                    <div className="cs-vis-timeline">
                      {visitDetailLoading && <div className="cs-vis-empty">상세 기록을 불러오는 중…</div>}
                      {visitDetailError && (
                        <div className="cs-vis-empty">
                          <p>{visitDetailError}</p>
                          <button className="btn g" onClick={() => setVisitDetailRetry((n) => n + 1)}>다시 시도</button>
                        </div>
                      )}
                      {(visitDetails[visitKey(selectedVisit)]?.events ?? []).map((event, index, events) => {
                        const gap = index ? Math.floor((new Date(event.t).getTime() - new Date(events[index - 1].t).getTime()) / 1000) : 0;
                        return (
                          <div key={`${event.t}-${event.event}-${index}`}>
                            {gap > 20 && <div className="cs-vis-gap">· {gap}초 뒤</div>}
                            <div className={`cs-vis-timeline-event ${event.event === "apply_click" ? "gold" : ""}`}>
                              <span className="cs-vis-timeline-dot" />
                              <span>{visitEventText(event)}</span>
                              <time>{hhmm(event.t)}</time>
                            </div>
                          </div>
                        );
                      })}
                      {visitDetails[visitKey(selectedVisit)]?.events.length ? (
                        <div className="cs-vis-timeline-event exit">
                          <span className="cs-vis-timeline-dot" />
                          <span>🚪 나갔어요</span>
                          <time>{hhmm(selectedVisit.ended_at)}</time>
                        </div>
                      ) : null}
                    </div>
                  </>
                )}
              </section>
            </div>
          </section>
        </div>
      )}
      {confirm && <Confirm title={confirm.title} sub={confirm.sub} busy={busy} onYes={runConfirm} onNo={() => !busy && setConfirm(null)} />}
    </div>
  );
}

/* ---------- 핵심 숫자 6개 ---------- */
function Kpis({ d, v, period, onSetSubmissions }: { d: Stats; v: View; period: Period; onSetSubmissions: (n: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState("");
  const diff = d.today_visitors - d.yesterday_visitors;
  const subs = d.manual.form_submissions ?? 0;
  const shares = d.totals.shares_kakao + d.totals.shares_insta;
  const shareVisitors = d.totals.kakao_visitors + d.totals.insta_visitors;
  const now = Date.now();
  const dDay = kstDayIndex(EVENT_MS) - kstDayIndex(now);
  const dText = now >= EVENT_END_MS ? "끝" : now >= EVENT_MS ? "공연 중" : dDay <= 0 ? "D-DAY" : `D-${dDay}`;
  const rate = pct(d.totals.clickers, d.totals.visitors);
  const visitorsLabel = period === "all" ? "누적 방문자" : period === "7d" ? "최근 7일 방문자" : "기간 방문자";
  return (
    <div className="row k6">
      <div className="card kpi">
        <div className="k">오늘 방문자</div>
        <div className="v">{fmt(d.today_visitors)}<small>명</small></div>
        <div className={`d ${diff > 0 ? "up" : diff < 0 ? "down" : ""}`}>{diff === 0 ? "어제와 같아요" : `${diff > 0 ? "▲" : "▼"} ${fmt(Math.abs(diff))} 어제보다`}</div>
        <Spark data={v.sparkVisitors} />
      </div>
      <div className="card kpi">
        <div className="k">{visitorsLabel}</div>
        <div className="v">{fmt(d.totals.visitors)}<small>명</small></div>
        <div className="d">재방문 {d.totals.visitors ? Math.round(pct(d.totals.returning, d.totals.visitors)) : 0}%</div>
        <Spark data={v.sparkCumulative} />
      </div>
      <div className="card kpi">
        <div className="k">사전 신청 클릭률</div>
        <div className="v">{d.totals.visitors ? rate.toFixed(1) : "—"}<small>%</small></div>
        <div className={`d ${v.rateDelta == null ? "" : v.rateDelta >= 0 ? "up" : "down"}`}>
          {v.rateDelta == null ? `${fmt(d.totals.clickers)}명이 눌렀어요` : `${v.rateDelta >= 0 ? "▲" : "▼"} ${Math.abs(v.rateDelta).toFixed(1)}%p 어제까지보다`}
        </div>
        <Spark data={v.sparkRate} />
      </div>
      <div className="card kpi">
        <div className="k">
          실제 제출 (구글 폼)
          {!editing && <button className="link" onClick={() => { setVal(String(subs)); setEditing(true); }}>수정</button>}
        </div>
        {editing ? (
          <form style={{ display: "flex", gap: 6, marginTop: 8 }} onSubmit={(e) => { e.preventDefault(); const n = Number(val); if (Number.isFinite(n)) onSetSubmissions(n); setEditing(false); }}>
            <input className="sel" style={{ flex: 1, fontSize: 16 }} type="number" inputMode="numeric" min={0} value={val} onChange={(e) => setVal(e.target.value)} autoFocus />
            <button className="btn" type="submit">저장</button>
          </form>
        ) : (
          <div className="v">{fmt(subs)}<small>명</small></div>
        )}
        <div className="d">{subs ? `방문자의 ${pct1(subs, d.all_visitors)}` : "구글 폼 응답 수를 직접 넣어 주세요"}</div>
      </div>
      <div className="card kpi">
        <div className="k">공유 1회당 유입</div>
        <div className="v">{shares ? (shareVisitors / shares).toFixed(1) : "—"}<small>명</small></div>
        <div className="d">공유 {fmt(shares)}회 → {fmt(shareVisitors)}명</div>
      </div>
      <div className="card kpi">
        <div className="k">공연까지</div>
        <div className="v">{dText}</div>
        <div className="d">{now > DEADLINE_MS ? "사전 신청 마감됨" : `신청 마감 ${KO.applyDeadlineText.replace(" 마감", "")}`}</div>
      </div>
    </div>
  );
}

/* ---------- 목표 진행률 ---------- */
function GoalCard({ d, onSave }: { d: Stats; onSave: (key: string, v: number) => Promise<void> }) {
  const goal = d.manual.goal_visitors || 1500;
  const goalSubs = d.manual.goal_submissions || 300;
  const goalEn = d.manual.goal_en || 50;
  const subs = d.manual.form_submissions ?? 0;
  const [edit, setEdit] = useState(false);
  const [g, setG] = useState({ goal_visitors: "", goal_submissions: "", goal_en: "" });
  // "오늘 목표선" = 오픈(11/23)부터 공연 시작까지 고르게 늘어난다고 쳤을 때 지금쯤 와 있어야 할 자리
  const now = Date.now();
  const frac = Math.min(1, Math.max(0, (now - OPEN_MS) / (EVENT_MS - OPEN_MS)));
  const expected = goal * frac;
  const ahead = d.all_visitors >= expected;
  const daysLeft = Math.max(0, kstDayIndex(EVENT_MS) - kstDayIndex(now));
  const need = Math.max(0, goal - d.all_visitors);
  const save = async () => {
    for (const [k, v] of Object.entries(g)) {
      const n = Number(v);
      if (v !== "" && Number.isFinite(n) && n > 0) await onSave(k, n);
    }
    setEdit(false);
  };
  return (
    <div className="card">
      <div className="headrow">
        <h3>공연 전 목표</h3>
        {!edit && <button className="link" onClick={() => { setG({ goal_visitors: String(goal), goal_submissions: String(goalSubs), goal_en: String(goalEn) }); setEdit(true); }}>목표 수정</button>}
      </div>
      {edit ? (
        <div style={{ display: "grid", gap: 8, marginTop: 12, fontSize: 12 }}>
          {([["goal_visitors", "방문자 목표"], ["goal_submissions", "사전 신청 목표"], ["goal_en", "영어 버전 목표"]] as const).map(([k, lb]) => (
            <label key={k} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 96 }}>{lb}</span>
              <input className="sel" style={{ flex: 1, fontSize: 16 }} type="number" inputMode="numeric" min={1} value={g[k]} onChange={(e) => setG((o) => ({ ...o, [k]: e.target.value }))} />
            </label>
          ))}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="btn g" onClick={() => setEdit(false)}>취소</button>
            <button className="btn" onClick={save}>저장</button>
          </div>
        </div>
      ) : (
        <>
          <div className="kpi"><div className="v" style={{ marginTop: 8 }}>{fmt(d.all_visitors)}<small>/ {fmt(goal)}명</small></div></div>
          <div className="gauge">
            <b style={{ width: `${Math.min(100, pct(d.all_visitors, goal))}%` }} />
            {frac > 0 && frac < 1 && <><i style={{ left: `${frac * 100}%` }} /><em style={{ left: `${Math.min(88, Math.max(12, frac * 100))}%` }}>오늘 목표선</em></>}
          </div>
          <div className="note" style={{ color: "var(--ink2)", marginTop: 14 }}>
            {d.all_visitors >= goal ? (
              <span className="up">🎉 목표 달성!</span>
            ) : (
              <>
                <span className={ahead ? "up" : "down"}>● 예정보다 {ahead ? "빠름" : "느림"}</span>
                {daysLeft > 0 && <> · 남은 {daysLeft}일 하루 <b style={{ color: "#fff" }}>{fmt(Math.ceil(need / daysLeft))}명</b>씩이면 달성</>}
              </>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12, fontSize: 12 }}>
            <div>
              사전 신청 <b style={{ color: "#fff" }}>{fmt(subs)}</b>/{fmt(goalSubs)}{subs >= goalSubs ? " 🎉" : ""}
              <div className="gauge" style={{ height: 6, marginTop: 6 }}><b style={{ width: `${Math.min(100, pct(subs, goalSubs))}%`, background: subs >= goalSubs ? "var(--gold)" : undefined }} /></div>
            </div>
            <div>
              영어 버전 <b style={{ color: "#fff" }}>{fmt(d.all_en_visitors)}</b>/{fmt(goalEn)}{d.all_en_visitors >= goalEn ? " 🎉" : ""}
              <div className="gauge" style={{ height: 6, marginTop: 6 }}><b style={{ width: `${Math.min(100, pct(d.all_en_visitors, goalEn))}%`, background: d.all_en_visitors >= goalEn ? "var(--gold)" : undefined }} /></div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- 홍보 기록 추가 / 삭제 ---------- */
function PromoCard({ notes, today, onAdd, onDelete }: { notes: Stats["notes"]; today: string; onAdd: (day: string, memo: string) => void; onDelete: (n: Stats["notes"][number]) => void }) {
  const [day, setDay] = useState(today);
  const [memo, setMemo] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const m = memo.trim();
    if (!m) return;
    onAdd(day || today, m);
    setMemo("");
  };
  const recent = [...notes].reverse();
  return (
    <div className="card">
      <h3>홍보 기록 추가</h3><div className="s">그래프에 금색 점으로 찍혀요</div>
      <form style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }} onSubmit={submit}>
        <input className="sel" type="date" value={day} onChange={(e) => setDay(e.target.value)} aria-label="홍보한 날" style={{ fontSize: 16 }} />
        <input className="sel" style={{ flex: 1, minWidth: 140, fontSize: 16 }} maxLength={200} placeholder="예: 21시 릴스 업로드" value={memo} onChange={(e) => setMemo(e.target.value)} aria-label="홍보 내용" />
        <button className="btn" type="submit" disabled={!memo.trim()}>+ 기록</button>
      </form>
      {recent.length > 0 && (
        <ul className="notes" style={{ marginTop: 10, maxHeight: 150, overflowY: "auto" }}>
          {recent.map((n) => (
            <li key={n.id}>
              <span className="t">{md(n.day)}</span>
              <span className="m" title={n.memo}>{n.memo}</span>
              <button onClick={() => onDelete(n)} aria-label={`${n.memo} 삭제`}>×</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* =========================================================================
 * 화면에 쓰는 계산 (서버가 준 집계 숫자로만)
 * ========================================================================= */
type View = ReturnType<typeof compute>;
function compute(d: Stats) {
  const days = d.daily.map((x) => x.day);
  const idx = new Map(days.map((x, i) => [x, i]));

  // 홍보 점: 같은 날 여러 개면 " · " 로 합쳐서 한 점
  const byDay = new Map<string, string[]>();
  d.notes.forEach((n) => idx.has(n.day) && byDay.set(n.day, [...(byDay.get(n.day) ?? []), n.memo]));
  const ann = [...byDay.entries()].map(([day, memos]) => ({ i: idx.get(day)!, text: memos.join(" · ") })).sort((a, b) => a.i - b.i);

  // 날짜별 경로
  const srcByDay: Record<string, Record<string, number>> = {};
  const srcTotal = new Map<string, number>();
  d.day_src.forEach(({ day, src, visitors }) => {
    (srcByDay[day] ??= {})[src] = visitors;
    srcTotal.set(src, (srcTotal.get(src) ?? 0) + visitors);
  });
  const srcOrder = [...srcTotal.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);

  // 스파크라인 (최근 7개 점)
  const last = <T,>(a: T[]) => a.slice(-7);
  let cum = 0;
  const cumulative = d.daily.map((x) => (cum += x.new));
  let cv = 0, cc = 0;
  const cumRate = d.daily.map((x) => {
    cv += x.visitors;
    cc += x.clickers;
    return cv ? (cc / cv) * 100 : 0;
  });
  // 클릭률 변화: 어제까지의 비율 vs 오늘까지의 비율 (일별 합 기준이라 대략치)
  const n = d.daily.length;
  const rateDelta = n >= 2 && d.daily[n - 1].visitors > 0 && cumRate[n - 2] > 0 ? cumRate[n - 1] - cumRate[n - 2] : null;

  // 가장 효과 있던 홍보 = 홍보한 날 방문자 − 전날 방문자
  const bestPromos = d.notes
    .filter((nt) => idx.has(nt.day) && idx.get(nt.day)! > 0)
    .map((nt) => {
      const i = idx.get(nt.day)!;
      return { ...nt, diff: d.daily[i].visitors - d.daily[i - 1].visitors };
    })
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 3);

  // 오늘의 한 줄
  const todaySrc = Object.entries(srcByDay[d.today] ?? {}).sort((a, b) => b[1] - a[1]);
  const todayTotal = todaySrc.reduce((s, [, v]) => s + v, 0);
  let oneLiner = "오늘은 아직 방문 기록이 없어요. 홍보를 시작해 볼까요? ✨";
  if (d.today_visitors > 0 && todaySrc.length) {
    const [top, v] = todaySrc[0];
    const p = Math.round((v / (todayTotal || 1)) * 100);
    const diff = d.today_visitors - d.yesterday_visitors;
    oneLiner =
      d.yesterday_visitors > 0 && diff > 0
        ? `어제보다 ${fmt(diff)}명 더 왔어요 📈 오늘 1등 경로는 ${srcMeta(top).label} (${p}%)`
        : p >= 50
          ? `오늘은 ${srcMeta(top).label}로 온 사람이 ${p}%예요 📈`
          : `오늘 1등 경로는 ${srcMeta(top).label} (${p}%)`;
  }

  // 단계별 남은 사람
  const f = d.funnel;
  const subs = d.manual.form_submissions ?? 0;
  const funnelSteps = [
    { name: "들어온 사람", value: f.visitors },
    { name: "공연 소개까지 본 사람", value: f.about },
    { name: "사전 신청 섹션까지 본 사람", value: f.apply },
    { name: "신청 버튼 누른 사람", value: f.click },
    ...(subs ? [{ name: "구글 폼 제출 (직접 입력)", value: subs, gold: true }] : []),
  ];
  const drops = [
    { at: "공연 소개까지 내려가기 전", tip: "첫 화면에서 바로 나가는 사람이 많아요. 첫 화면 문구나 버튼을 다듬어 보세요.", n: f.visitors - f.about },
    { at: "사전 신청 섹션까지 내려가기 전", tip: "첫 화면 아래 신청 버튼을 더 눈에 띄게 하면 좋아요.", n: f.about - f.apply },
    { at: "신청 섹션을 보고도 버튼을 누르기 전", tip: "스폰 쿠폰 같은 신청 혜택을 더 강조해 보세요.", n: f.apply - f.click },
    ...(subs ? [{ at: "구글 폼을 열고 제출하기 전", tip: "폼 질문 수를 줄이면 좋아요.", n: f.click - subs }] : []),
  ].sort((a, b) => b.n - a.n);
  const funnelAdvice = !f.visitors
    ? "기록이 쌓이면 어디서 가장 많이 빠지는지 알려줄게요."
    : drops[0].n > 0
      ? <>가장 많이 빠지는 곳은 <b style={{ color: "var(--gold)" }}>{drops[0].at}</b>(−{fmt(drops[0].n)}명). {drops[0].tip}</>
      : "단계마다 빠지는 사람이 거의 없어요 👏";

  // 히트맵 · 추천 시간
  const heat = new Map(d.heat.map((h) => [`${h.dow}-${h.hour}`, h.visitors]));
  const topHours = [...d.heat].sort((a, b) => b.visitors - a.visitors).slice(0, 3)
    .map((h) => `${HEAT_DOW[h.dow - 1]}요일 ${hourWords(h.hour)}`);

  // 오늘 시간대별 (0~23)
  const todayHours = Array.from({ length: 24 }, (_, h) => d.today_hours.find((x) => x.hour === h)?.visitors ?? 0);
  const nowHour = new Date(Date.now() + KST).getUTCHours();

  // 팀 순위 (열람 0회인 팀도 "모두 보기"에 나오게)
  const opens = new Map(d.teams.map((t) => [t.id, t.opens]));
  const teamRank = KO.teams.map((t) => ({ id: t.id, name: t.name, opens: opens.get(t.id) ?? 0 })).sort((a, b) => b.opens - a.opens);
  const teamMax = Math.max(1, ...teamRank.map((t) => t.opens));

  const bTotal = d.browsers.reduce((s, b) => s + b.visitors, 0) || 1;
  const browserPct = d.browsers.slice(0, 5).map((b) => ({ name: BROWSER_NAME[b.browser] ?? b.browser, color: "#7cc4ee", value: Math.round((b.visitors / bTotal) * 100) }));

  const every = Math.ceil(days.length / 7);
  const shortLabels = days.map((x, i) => (i % every === 0 || i === days.length - 1 ? md(x) : ""));

  return {
    ann, srcByDay, srcOrder,
    sparkVisitors: last(d.daily.map((x) => x.visitors)), sparkCumulative: last(cumulative), sparkRate: last(cumRate), rateDelta,
    bestPromos, oneLiner, funnelSteps, funnelAdvice, heat, topHours, todayHours, nowHour, teamRank, teamMax, browserPct, shortLabels,
  };
}

/* =========================================================================
 * 페이지 껍데기 — 제목 · noindex · 글꼴 · 비밀번호 기억
 * ========================================================================= */
export default function ConcertStats() {
  const [pw, setPw] = useState<string | null>(() => {
    try {
      return window.sessionStorage.getItem(PW_KEY);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const prevTitle = document.title;
    const prevBg = document.body.style.backgroundColor;
    document.title = "輪舞 STATS";
    document.body.style.backgroundColor = "#050506";
    // 검색엔진에 안 잡히게 (Netlify _headers 의 X-Robots-Tag 와 이중으로)
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex, nofollow";
    document.head.appendChild(robots);
    // 시안과 같은 글꼴 (이 페이지에서만 불러와요)
    const links = [
      "https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@700;900&family=JetBrains+Mono:wght@400;500&display=swap",
      "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css",
    ].map((href) => {
      const l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = href;
      document.head.appendChild(l);
      return l;
    });
    return () => {
      document.title = prevTitle;
      document.body.style.backgroundColor = prevBg;
      robots.remove();
      links.forEach((l) => l.remove());
    };
  }, []);

  // 비밀번호가 맞으면: 이 탭 동안 기억 + 이 기기는 앞으로 공연 페이지 방문 기록에서 빼요 (회장단 본인 방문 제외)
  const onOk = useCallback((p: string) => {
    try {
      window.sessionStorage.setItem(PW_KEY, p);
    } catch {
      /* 저장이 막혀도 이번 화면에선 계속 써요 */
    }
    markStatsOwner();
    setPw(p);
  }, []);
  const onAuthFail = useCallback(() => {
    try {
      window.sessionStorage.removeItem(PW_KEY);
    } catch {
      /* 무시 */
    }
    setPw(null);
  }, []);
  useEffect(() => {
    if (pw) markStatsOwner();
  }, [pw]);

  return (
    <div className="cs">
      {pw ? <Dashboard pw={pw} onAuthFail={onAuthFail} /> : <Gate onOk={onOk} />}
      <TipLayer />
    </div>
  );
}
