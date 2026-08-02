// src/context/CalendarContext.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type EventVisibility = "public" | "member";
export type EventType = "공연" | "모집" | "연습" | "기타";

export interface CalendarEvent {
  id: string;
  date: string; // "2026-08-15"
  title: string;
  type: EventType;
  visibility: EventVisibility;
}

interface CalendarContextType {
  events: CalendarEvent[];
  addEvent: (data: Omit<CalendarEvent, "id">) => void;
  removeEvent: (id: string) => void;
}

const STORAGE_KEY = "chumbaram_calendar_events";

const CalendarContext = createContext<CalendarContextType | null>(null);

const SEED_EVENTS: CalendarEvent[] = [];

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<CalendarEvent[]>(SEED_EVENTS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setEvents(JSON.parse(raw));
    } catch {
      // 저장된 값 없으면 무시
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch {
      // 저장 실패해도 화면은 정상 동작
    }
  }, [events]);

  const addEvent = (data: Omit<CalendarEvent, "id">) => {
    setEvents((prev) => [...prev, { ...data, id: `e${Date.now()}` }]);
  };

  const removeEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <CalendarContext.Provider value={{ events, addEvent, removeEvent }}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() {
  const ctx = useContext(CalendarContext);
  if (!ctx) throw new Error("useCalendar는 CalendarProvider 안에서만 써야 해요.");
  return ctx;
}