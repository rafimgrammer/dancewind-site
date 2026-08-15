// src/pages/ReactionGame.tsx
import { useEffect, useRef, useState } from "react";
import { PageHeader, Pill, RequireRole } from "../components/Ui";
import { useAuth } from "../context/AuthContext";
import { useReactionGame } from "../context/ReactionGameContext";

type GameState = "idle" | "waiting" | "go" | "result" | "tooSoon";

function grade(ms: number): { label: string; tone: "gold" | "teal" | "mute" } {
  if (ms < 200) return { label: "번개같아요! ⚡", tone: "gold" };
  if (ms < 250) return { label: "훌륭해요! 👏", tone: "gold" };
  if (ms < 350) return { label: "평균이에요", tone: "teal" };
  if (ms < 450) return { label: "조금 느려요", tone: "teal" };
  return { label: "한 번 더 도전!", tone: "mute" };
}

export default function ReactionGame() {
  const { user } = useAuth();
  const { leaderboard, myBest, loading, submitScore } = useReactionGame();

  const [state, setState] = useState<GameState>("idle");
  const [reactionMs, setReactionMs] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const goAtRef = useRef<number>(0);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const startRound = () => {
    setReactionMs(null);
    setState("waiting");
    const delay = 1200 + Math.random() * 2800; // 1.2 ~ 4초 사이 무작위
    timeoutRef.current = window.setTimeout(() => {
      goAtRef.current = performance.now();
      setState("go");
    }, delay);
  };

  const handleAreaClick = async () => {
    if (state === "idle" || state === "result" || state === "tooSoon") {
      startRound();
      return;
    }

    if (state === "waiting") {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      setState("tooSoon");
      return;
    }

    if (state === "go") {
      const ms = Math.round(performance.now() - goAtRef.current);
      setReactionMs(ms);
      setState("result");
      setSubmitting(true);
      await submitScore(ms);
      setSubmitting(false);
    }
  };

  const g = reactionMs !== null ? grade(reactionMs) : null;
  const myRank = leaderboard.findIndex((e) => e.userId === user?.id);

  const areaStyle =
    state === "waiting"
      ? "bg-red-500/20 border-red-400/40"
      : state === "go"
        ? "bg-emerald-500/25 border-emerald-400/50"
        : state === "tooSoon"
          ? "bg-orange-500/20 border-orange-400/40"
          : "bg-afterglow border-line";

  return (
    <RequireRole allow={["member", "president"]} what="반응속도 테스트">
      <div>
        <PageHeader eyebrow="Mini Game" title="반응속도 테스트" desc="초록색으로 바뀌는 순간, 최대한 빨리 탭하세요!" />

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <div>
            <button
              onClick={handleAreaClick}
              className={`flex aspect-[4/3] w-full flex-col items-center justify-center rounded-2xl border-2 text-center transition-colors duration-150 ${areaStyle}`}
            >
              {state === "idle" && (
                <>
                  <p className="font-display text-2xl text-backstage">탭해서 시작</p>
                  <p className="mt-2 text-sm text-mute">화면이 초록색으로 바뀌면 최대한 빨리 눌러주세요</p>
                </>
              )}
              {state === "waiting" && (
                <>
                  <p className="font-display text-2xl text-red-300">기다리세요...</p>
                  <p className="mt-2 text-sm text-red-300/70">아직이에요, 지금 누르면 안 돼요</p>
                </>
              )}
              {state === "go" && <p className="font-display text-4xl text-emerald-300">지금 탭하세요!</p>}
              {state === "tooSoon" && (
                <>
                  <p className="font-display text-2xl text-orange-300">너무 빨랐어요 😅</p>
                  <p className="mt-2 text-sm text-orange-300/70">다시 탭해서 도전해보세요</p>
                </>
              )}
              {state === "result" && reactionMs !== null && (
                <div className="animate-lightbox-in">
                  <p className="font-display text-6xl tabular-nums text-wind-gold">{reactionMs}</p>
                  <p className="mt-1 font-mono text-xs text-mute">ms</p>
                  {g && (
                    <div className="mt-3">
                      <Pill tone={g.tone}>{g.label}</Pill>
                    </div>
                  )}
                  {submitting && <p className="mt-3 text-xs text-mute">순위표에 등록하는 중...</p>}
                  {!submitting && <p className="mt-3 text-xs text-mute">다시 탭해서 재도전!</p>}
                </div>
              )}
            </button>
          </div>

          <div>
            <p className="font-mono text-xs tracking-[0.2em] text-dawn-teal uppercase">Leaderboard</p>
            <h2 className="mt-2 font-display text-xl text-backstage">순위표</h2>

            {myBest !== null && (
              <p className="mt-2 text-xs text-mute">
                내 최고 기록 <span className="text-wind-gold">{myBest}ms</span>
                {myRank >= 0 && ` · 전체 ${myRank + 1}등`}
              </p>
            )}

            {loading ? (
              <p className="mt-4 text-sm text-mute">불러오는 중...</p>
            ) : leaderboard.length === 0 ? (
              <p className="mt-4 text-sm text-mute">아직 아무도 도전하지 않았어요. 첫 주자가 되어보세요!</p>
            ) : (
              <>
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
                          {entry.bestMs}
                          <span className="text-xs text-mute">ms</span>
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
                          <span className="shrink-0 font-mono text-sm font-semibold text-backstage">{entry.bestMs}ms</span>
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