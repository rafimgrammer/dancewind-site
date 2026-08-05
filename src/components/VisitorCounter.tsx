// src/components/VisitorCounter.tsx
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { useScrollReveal } from "../hooks/useScrollReveal";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

// 0에서 target까지 부드럽게 올라가는 카운트업 애니메이션.
// active가 true가 되는 순간(=화면에 보이는 순간)부터 시작해요.
function useCountUp(target: number, active: boolean, duration = 1400) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setValue(target);
      return;
    }

    let startTime: number | null = null;
    let frame: number;

    const step = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [active, target, duration]);

  return value;
}

export default function VisitorCounter() {
  const [todayCount, setTodayCount] = useState<number | null>(null);
  const { ref, visible } = useScrollReveal<HTMLDivElement>();
  const requested = useRef(false);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;

    const run = async () => {
      const storageKey = `chumbaram_visited_${todayKey()}`;
      const alreadyCountedToday = sessionStorage.getItem(storageKey);

      if (!alreadyCountedToday) {
        sessionStorage.setItem(storageKey, "1");
        const { data, error } = await supabase.rpc("increment_daily_visit");
        if (!error && typeof data === "number") {
          setTodayCount(data);
          return;
        }
      }

      // 이미 이번 세션에서 카운트했거나, 어떤 이유로든 증가 요청이 실패했으면
      // 조회만 해서 현재 값을 보여줘요.
      const { data } = await supabase
        .from("site_visits")
        .select("count")
        .eq("visit_date", todayKey())
        .maybeSingle();
      setTodayCount(data?.count ?? 0);
    };

    run();
  }, []);

  const displayValue = useCountUp(todayCount ?? 0, visible && todayCount !== null);

  return (
    <div
      ref={ref}
      className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-afterglow to-stage p-6 text-center md:p-10"
    >
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-wind-gold/10 blur-2xl" aria-hidden="true" />
      <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-dawn-teal/10 blur-2xl" aria-hidden="true" />

      <div className="relative flex items-center justify-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-dawn-teal opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-dawn-teal" />
        </span>
        <p className="font-mono text-xs tracking-[0.2em] text-dawn-teal uppercase">Today</p>
      </div>

      <p className="relative mt-3 font-display text-5xl tabular-nums text-wind-gold md:text-6xl">
        {displayValue.toLocaleString()}
      </p>

      <p className="relative mt-3 text-sm text-backstage/70">오늘 춤바람 홈페이지를 찾아준 발걸음이에요</p>
    </div>
  );
}