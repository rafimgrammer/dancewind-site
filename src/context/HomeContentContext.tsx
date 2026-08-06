// src/context/HomeContentContext.tsx
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";

export interface HomeIntro {
  heroEyebrow: string;
  heroTitleLine1: string;
  heroTitleLine2: string;
  heroTitleHighlight: string;
  heroBody: string;
  greetingBody: string;
  greetingSignature: string;
}

export interface HistoryEntry {
  id: string;
  year: string;
  description: string;
  sortOrder: number;
}

export type ScheduleType = "공연" | "모집" | "행사";

export interface ScheduleEntry {
  id: string;
  eventDate: string;
  label: string;
  type: ScheduleType;
  sortOrder: number;
}

interface HomeContentContextType {
  intro: HomeIntro | null;
  history: HistoryEntry[];
  schedule: ScheduleEntry[];
  loading: boolean;
  editIntro: (data: HomeIntro) => Promise<void>;
  addHistoryEntry: (year: string, description: string) => Promise<void>;
  editHistoryEntry: (id: string, year: string, description: string) => Promise<void>;
  removeHistoryEntry: (id: string) => Promise<void>;
  addScheduleEntry: (eventDate: string, label: string, type: ScheduleType) => Promise<void>;
  editScheduleEntry: (id: string, eventDate: string, label: string, type: ScheduleType) => Promise<void>;
  removeScheduleEntry: (id: string) => Promise<void>;
}

const HomeContentContext = createContext<HomeContentContextType | null>(null);

export function HomeContentProvider({ children }: { children: ReactNode }) {
  const [intro, setIntro] = useState<HomeIntro | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // 홈 화면은 로그인 안 한 방문자도 보는 페이지라, user 여부와 상관없이 항상 불러와요.
  const fetchAll = useCallback(async () => {
    setLoading(true);

    const [{ data: introData }, { data: historyData }, { data: scheduleData }] = await Promise.all([
      supabase.from("home_intro").select("*").eq("id", 1).maybeSingle(),
      supabase.from("home_history").select("*").order("sort_order", { ascending: true }),
      supabase.from("home_schedule").select("*").order("sort_order", { ascending: true }),
    ]);

    setIntro(
      introData
        ? {
            heroEyebrow: introData.hero_eyebrow,
            heroTitleLine1: introData.hero_title_line1,
            heroTitleLine2: introData.hero_title_line2,
            heroTitleHighlight: introData.hero_title_highlight,
            heroBody: introData.hero_body,
            greetingBody: introData.greeting_body,
            greetingSignature: introData.greeting_signature,
          }
        : null
    );

    setHistory(
      (historyData ?? []).map((h) => ({
        id: h.id,
        year: h.year,
        description: h.description,
        sortOrder: h.sort_order,
      }))
    );

    setSchedule(
      (scheduleData ?? []).map((s) => ({
        id: s.id,
        eventDate: s.event_date,
        label: s.label,
        type: s.type,
        sortOrder: s.sort_order,
      }))
    );

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const editIntro = async (data: HomeIntro) => {
    await supabase
      .from("home_intro")
      .update({
        hero_eyebrow: data.heroEyebrow,
        hero_title_line1: data.heroTitleLine1,
        hero_title_line2: data.heroTitleLine2,
        hero_title_highlight: data.heroTitleHighlight,
        hero_body: data.heroBody,
        greeting_body: data.greetingBody,
        greeting_signature: data.greetingSignature,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    await fetchAll();
  };

  const addHistoryEntry = async (year: string, description: string) => {
    if (!year.trim() || !description.trim()) return;
    await supabase.from("home_history").insert({
      year: year.trim(),
      description: description.trim(),
      sort_order: history.length,
    });
    await fetchAll();
  };

  const editHistoryEntry = async (id: string, year: string, description: string) => {
    if (!year.trim() || !description.trim()) return;
    await supabase.from("home_history").update({ year: year.trim(), description: description.trim() }).eq("id", id);
    await fetchAll();
  };

  const removeHistoryEntry = async (id: string) => {
    await supabase.from("home_history").delete().eq("id", id);
    await fetchAll();
  };

  const addScheduleEntry = async (eventDate: string, label: string, type: ScheduleType) => {
    if (!eventDate.trim() || !label.trim()) return;
    await supabase.from("home_schedule").insert({
      event_date: eventDate,
      label: label.trim(),
      type,
      sort_order: schedule.length,
    });
    await fetchAll();
  };

  const editScheduleEntry = async (id: string, eventDate: string, label: string, type: ScheduleType) => {
    if (!eventDate.trim() || !label.trim()) return;
    await supabase
      .from("home_schedule")
      .update({ event_date: eventDate, label: label.trim(), type })
      .eq("id", id);
    await fetchAll();
  };

  const removeScheduleEntry = async (id: string) => {
    await supabase.from("home_schedule").delete().eq("id", id);
    await fetchAll();
  };

  return (
    <HomeContentContext.Provider
      value={{
        intro,
        history,
        schedule,
        loading,
        editIntro,
        addHistoryEntry,
        editHistoryEntry,
        removeHistoryEntry,
        addScheduleEntry,
        editScheduleEntry,
        removeScheduleEntry,
      }}
    >
      {children}
    </HomeContentContext.Provider>
  );
}

export function useHomeContent() {
  const ctx = useContext(HomeContentContext);
  if (!ctx) throw new Error("useHomeContent는 HomeContentProvider 안에서만 써야 해요.");
  return ctx;
}