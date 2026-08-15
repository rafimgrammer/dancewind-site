// src/context/ReactionGameContext.tsx
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

export interface ReactionLeaderboardEntry {
  userId: string;
  userName: string;
  bestMs: number;
}

interface ReactionGameContextType {
  leaderboard: ReactionLeaderboardEntry[];
  myBest: number | null;
  loading: boolean;
  submitScore: (ms: number) => Promise<void>;
}

const ReactionGameContext = createContext<ReactionGameContextType | null>(null);

export function ReactionGameProvider({ children }: { children: ReactNode }) {
  const { user, name } = useAuth();
  const [leaderboard, setLeaderboard] = useState<ReactionLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setLeaderboard([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    // 낮은 ms가 더 좋은 기록이라 오름차순으로 가져와요.
    const { data } = await supabase
      .from("reaction_game_scores")
      .select("user_id, user_name, reaction_ms")
      .order("reaction_ms", { ascending: true });

    const seen = new Set<string>();
    const best: ReactionLeaderboardEntry[] = [];
    (data ?? []).forEach((row) => {
      if (seen.has(row.user_id)) return;
      seen.add(row.user_id);
      best.push({ userId: row.user_id, userName: row.user_name, bestMs: row.reaction_ms });
    });

    setLeaderboard(best);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const myBest = leaderboard.find((e) => e.userId === user?.id)?.bestMs ?? null;

  const submitScore = async (ms: number) => {
    if (!user) return;
    await supabase.from("reaction_game_scores").insert({ user_id: user.id, user_name: name, reaction_ms: ms });
    await fetchAll();
  };

  return (
    <ReactionGameContext.Provider value={{ leaderboard, myBest, loading, submitScore }}>
      {children}
    </ReactionGameContext.Provider>
  );
}

export function useReactionGame() {
  const ctx = useContext(ReactionGameContext);
  if (!ctx) throw new Error("useReactionGame은 ReactionGameProvider 안에서만 써야 해요.");
  return ctx;
}