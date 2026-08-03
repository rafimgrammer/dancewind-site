// src/context/PracticeContext.tsx
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

export interface PersonEntry {
  id: string;
  name: string;
  ranges: { start: string; end: string }[];
}

export interface MainSlot {
  start: number;
  end: number;
  personIds: string[];
  names: string[];
}

export interface ExtraSession {
  personId: string;
  name: string;
  start: string;
  end: string;
}

export interface PracticeSession {
  leaders: PersonEntry[];
  members: PersonEntry[];
  mainSlot: MainSlot | null;
  extraSessions: ExtraSession[];
}

export function emptySession(): PracticeSession {
  return { leaders: [], members: [], mainSlot: null, extraSessions: [] };
}

interface PracticeContextType {
  savedDates: string[];
  loading: boolean;
  getSession: (date: string) => Promise<PracticeSession>;
  saveSession: (date: string, session: PracticeSession) => Promise<void>;
  deleteSession: (date: string) => Promise<void>;
  getSessionsInRange: (
    startDate: string,
    endDate: string
  ) => Promise<{ date: string; session: PracticeSession }[]>;
}

const PracticeContext = createContext<PracticeContextType | null>(null);

export function PracticeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [savedDates, setSavedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDates = useCallback(async () => {
    if (!user) {
      setSavedDates([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("practice_sessions")
      .select("session_date")
      .eq("owner_id", user.id)
      .order("session_date", { ascending: true });
    setSavedDates((data ?? []).map((d) => d.session_date));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchDates();
  }, [fetchDates]);

  const getSession = async (date: string): Promise<PracticeSession> => {
    if (!user) return emptySession();
    const { data } = await supabase
      .from("practice_sessions")
      .select("session_data")
      .eq("owner_id", user.id)
      .eq("session_date", date)
      .maybeSingle();
    return (data?.session_data as PracticeSession) ?? emptySession();
  };

  const saveSession = async (date: string, session: PracticeSession) => {
    if (!user) return;
    await supabase
      .from("practice_sessions")
      .upsert(
        { owner_id: user.id, session_date: date, session_data: session, updated_at: new Date().toISOString() },
        { onConflict: "owner_id,session_date" }
      );
    await fetchDates();
  };

  const deleteSession = async (date: string) => {
    if (!user) return;
    await supabase.from("practice_sessions").delete().eq("owner_id", user.id).eq("session_date", date);
    await fetchDates();
  };

  const getSessionsInRange = async (startDate: string, endDate: string) => {
    if (!user) return [];
    const { data } = await supabase
      .from("practice_sessions")
      .select("session_date, session_data")
      .eq("owner_id", user.id)
      .gte("session_date", startDate)
      .lte("session_date", endDate)
      .order("session_date", { ascending: true });

    return (data ?? []).map((d) => ({
      date: d.session_date,
      session: d.session_data as PracticeSession,
    }));
  };

  return (
    <PracticeContext.Provider
      value={{ savedDates, loading, getSession, saveSession, deleteSession, getSessionsInRange }}
    >
      {children}
    </PracticeContext.Provider>
  );
}

export function usePractice() {
  const ctx = useContext(PracticeContext);
  if (!ctx) throw new Error("usePractice는 PracticeProvider 안에서만 써야 해요.");
  return ctx;
}