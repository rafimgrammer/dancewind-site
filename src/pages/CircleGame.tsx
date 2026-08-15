// src/pages/CircleGame.tsx
import { useEffect, useRef, useState } from "react";
import { PageHeader, Pill, RequireRole } from "../components/Ui";
import { useAuth } from "../context/AuthContext";
import { useCircleGame } from "../context/CircleGameContext";
import { scoreCircle, scoreGrade, type Pt } from "../utils/circleScore";

const CENTER: Pt = { x: 50, y: 50 };

function useCountUp(target: number, active: boolean, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start: number | null = null;
    let frame: number;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [active, target, duration]);
  return value;
}

export default function CircleGame() {
  const { user } = useAuth();
  const { leaderboard, myBest, loading, submitScore } = useCircleGame();

  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<Pt[]>([]);
  const [liveScore, setLiveScore] = useState<number | null>(null);
  const [result, setResult] = useState<{ score: number; meanRadius: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  // 그리는 동안 실시간으로 점수를 계산해서 보여줘요.
  useEffect(() => {
    if (!isDrawing || points.length < 12) {
      setLiveScore(null);
      return;
    }
    setLiveScore(scoreCircle(points, CENTER).score);
  }, [points, isDrawing]);

  const displayScore = useCountUp(result?.score ?? 0, result !== null);

  const relativePoint = (clientX: number, clientY: number): Pt => {
    const rect = stageRef.current!.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isDrawing) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setResult(null);
    setPoints([relativePoint(e.clientX, e.clientY)]);
    setIsDrawing(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    setPoints((prev) => [...prev, relativePoint(e.clientX, e.clientY)]);
  };

  const handlePointerUp = async () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const scored = scoreCircle(points, CENTER);
    setResult({ score: scored.score, meanRadius: scored.meanRadius });

    if (scored.score > 0) {
      setSubmitting(true);
      await submitScore(scored.score);
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setPoints([]);
    setResult(null);
  };

  const pathD = points.length > 0 ? "M " + points.map((p) => `${p.x},${p.y}`).join(" L ") : "";
  const grade = result ? scoreGrade(result.score) : null;

  const myRank = leaderboard.findIndex((e) => e.userId === user?.id);

  return (
    <RequireRole allow={["member", "president"]} what="완벽한 원 그리기">
      <div>
        <PageHeader
          eyebrow="Mini Game"
          title="완벽한 원 그리기"
          desc="중심점을 기준으로 최대한 동그란 원을 그려보세요. 100점 만점!"
        />

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <div>
            <div
              ref={stageRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="relative aspect-square w-full touch-none select-none overflow-hidden rounded-2xl border border-line bg-afterglow"
            >
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* 중심점 */}
                <circle cx={CENTER.x} cy={CENTER.y} r="1" fill="var(--color-wind-gold)" />

                {/* 채점 후 비교용 이상적인 원 (점선) */}
                {result && result.meanRadius > 0 && (
                  <circle
                    cx={CENTER.x}
                    cy={CENTER.y}
                    r={result.meanRadius}
                    fill="none"
                    stroke="var(--color-dawn-teal)"
                    strokeOpacity="0.5"
                    strokeWidth="0.4"
                    strokeDasharray="1.5 1.2"
                    vectorEffect="non-scaling-stroke"
                  />
                )}

                {/* 내가 그린 경로 */}
                {pathD && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="var(--color-wind-gold)"
                    strokeWidth="0.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                )}
              </svg>

              {!isDrawing && points.length === 0 && (
                <p className="pointer-events-none absolute inset-x-0 bottom-6 text-center text-xs text-mute">
                  점 주변을 눌러서 드래그하며 원을 그려보세요
                </p>
              )}

              {isDrawing && liveScore !== null && (
                <div className="pointer-events-none absolute right-3 top-3 rounded-full border border-wind-gold/40 bg-stage/80 px-3 py-1.5 backdrop-blur-sm">
                  <span className="font-display text-lg tabular-nums text-wind-gold">{liveScore}</span>
                  <span className="ml-1 font-mono text-[10px] text-mute">실시간</span>
                </div>
              )}
            </div>

            {result && (
              <div className="mt-5 rounded-2xl border border-line bg-afterglow p-6 text-center">
                <p className="font-display text-6xl tabular-nums text-wind-gold">{displayScore}</p>
                <p className="mt-1 font-mono text-xs text-mute">/ 100점</p>
                {grade && (
                  <div className="mt-3">
                    <Pill tone={grade.tone}>{grade.label}</Pill>
                  </div>
                )}
                {submitting && <p className="mt-3 text-xs text-mute">순위표에 등록하는 중...</p>}
              </div>
            )}

            <div className="mt-4 flex justify-center">
              <button
                onClick={handleReset}
                className="rounded-full bg-wind-gold px-6 py-2.5 text-sm font-semibold text-stage transition-transform hover:-translate-y-0.5"
              >
                {result ? "다시 그리기" : "지우기"}
              </button>
            </div>
          </div>

          <div>
            <p className="font-mono text-xs tracking-[0.2em] text-dawn-teal uppercase">Leaderboard</p>
            <h2 className="mt-2 font-display text-xl text-backstage">순위표</h2>

            {myBest !== null && (
              <p className="mt-2 text-xs text-mute">
                내 최고 기록 <span className="text-wind-gold">{myBest}점</span>
                {myRank >= 0 && ` · 전체 ${myRank + 1}등`}
              </p>
            )}

            {loading ? (
              <p className="mt-4 text-sm text-mute">불러오는 중...</p>
            ) : leaderboard.length === 0 ? (
              <p className="mt-4 text-sm text-mute">아직 아무도 도전하지 않았어요. 첫 주자가 되어보세요!</p>
            ) : (
              <>
                {/* 1~3위 포디움 */}
                <div className="mt-5 flex items-end justify-center gap-2">
                  {[leaderboard[1], leaderboard[0], leaderboard[2]].map((entry, slot) => {
                    if (!entry) return <div key={slot} className="w-[30%]" />;
                    const place = slot === 0 ? 2 : slot === 1 ? 1 : 3;
                    const isMe = entry.userId === user?.id;
                    const heightClass = place === 1 ? "h-32" : place === 2 ? "h-24" : "h-20";
                    const medal = place === 1 ? "🥇" : place === 2 ? "🥈" : "🥉";
                    const ring =
                      place === 1
                        ? "border-wind-gold shadow-[0_0_30px_-8px_rgba(255,61,138,0.5)]"
                        : place === 2
                          ? "border-backstage/40"
                          : "border-dawn-teal/50";
                    return (
                      <div key={entry.userId} className="flex w-[30%] flex-col items-center">
                        <span className="text-2xl">{medal}</span>
                        <p className="mt-1 w-full truncate text-center text-xs font-medium text-backstage/90">
                          {entry.userName}
                          {isMe && " (나)"}
                        </p>
                        <p
                          className={`font-display tabular-nums ${place === 1 ? "text-2xl text-wind-gold" : "text-lg text-backstage/80"}`}
                        >
                          {entry.bestScore}
                        </p>
                        <div
                          className={`mt-2 w-full rounded-t-xl border-2 border-b-0 bg-afterglow ${heightClass} ${ring} ${
                            isMe ? "bg-wind-gold/10" : ""
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* 4위 이하 */}
                {leaderboard.length > 3 && (
                  <div className="mt-3 space-y-1.5">
                    {leaderboard.slice(3, 15).map((entry, i) => {
                      const isMe = entry.userId === user?.id;
                      return (
                        <div
                          key={entry.userId}
                          className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
                            isMe ? "border-wind-gold/50 bg-wind-gold/10" : "border-line bg-afterglow"
                          }`}
                        >
                          <span className="w-6 shrink-0 text-center font-mono text-xs font-bold text-mute">{i + 4}</span>
                          <span className="min-w-0 flex-1 truncate text-sm text-backstage/85">
                            {entry.userName}
                            {isMe && " (나)"}
                          </span>
                          <span className="shrink-0 font-mono text-sm font-semibold text-backstage">{entry.bestScore}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </RequireRole>
  );
}