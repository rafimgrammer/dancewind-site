// src/context/CircleGameContext.tsx
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  bestScore: number;
}

interface CircleGameContextType {
  leaderboard: LeaderboardEntry[];
  myBest: number | null;
  loading: boolean;
  submitScore: (score: number) => Promise<void>;
}

const CircleGameContext = createContext<CircleGameContextType | null>(null);

export function CircleGameProvider({ children }: { children: ReactNode }) {
  const { user, name } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setLeaderboard([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data } = await supabase
      .from("circle_game_scores")
      .select("user_id, user_name, score")
      .order("score", { ascending: false });

    // 사람마다 제일 높은 점수 하나만 순위표에 올라가요 (먼저 나온 게 이미 최고점이에요, score desc 정렬이라).
    const seen = new Set<string>();
    const best: LeaderboardEntry[] = [];
    (data ?? []).forEach((row) => {
      if (seen.has(row.user_id)) return;
      seen.add(row.user_id);
      best.push({ userId: row.user_id, userName: row.user_name, bestScore: row.score });
    });

    setLeaderboard(best);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const myBest = leaderboard.find((e) => e.userId === user?.id)?.bestScore ?? null;

  const submitScore = async (score: number) => {
    if (!user) return;
    await supabase.from("circle_game_scores").insert({ user_id: user.id, user_name: name, score });
    await fetchAll();
  };

  return (
    <CircleGameContext.Provider value={{ leaderboard, myBest, loading, submitScore }}>
      {children}
    </CircleGameContext.Provider>
  );
}

export function useCircleGame() {
  const ctx = useContext(CircleGameContext);
  if (!ctx) throw new Error("useCircleGame은 CircleGameProvider 안에서만 써야 해요.");
  return ctx;
}