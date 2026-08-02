// src/context/PracticeContext.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface TimeRange {
  start: string;
  end: string;
}

export interface PersonEntry {
  id: string;
  name: string;
  ranges: TimeRange[];
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

type AllSessions = Record<string, Record<string, PracticeSession>>;

interface PracticeContextType {
  getSession: (userName: string, date: string) => PracticeSession;
  saveSession: (userName: string, date: string, session: PracticeSession) => void;
  getSavedDates: (userName: string) => string[];
  getSessionsInRange: (
    userName: string,
    startDate: string,
    endDate: string
  ) => { date: string; session: PracticeSession }[];
}

const STORAGE_KEY = "chumbaram_practice_sessions_v4";

const PracticeContext = createContext<PracticeContextType | null>(null);

export function emptySession(): PracticeSession {
  return { leaders: [], members: [], mainSlot: null, extraSessions: [] };
}

export function PracticeProvider({ children }: { children: ReactNode }) {
  const [allSessions, setAllSessions] = useState<AllSessions>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setAllSessions(JSON.parse(raw));
    } catch {
      // 저장된 값 없으면 무시
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allSessions));
    } catch {
      // 저장 실패해도 화면은 정상 동작
    }
  }, [allSessions]);

  const getSession = (userName: string, date: string) =>
    allSessions[userName]?.[date] ?? emptySession();

  const saveSession = (userName: string, date: string, session: PracticeSession) => {
    setAllSessions((prev) => ({
      ...prev,
      [userName]: { ...(prev[userName] ?? {}), [date]: session },
    }));
  };

  const getSavedDates = (userName: string) => Object.keys(allSessions[userName] ?? {}).sort();

  const getSessionsInRange = (userName: string, startDate: string, endDate: string) => {
    const userSessions = allSessions[userName] ?? {};
    return Object.entries(userSessions)
      .filter(([date]) => date >= startDate && date <= endDate)
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([date, session]) => ({ date, session }));
  };

  return (
    <PracticeContext.Provider
      value={{ getSession, saveSession, getSavedDates, getSessionsInRange }}
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