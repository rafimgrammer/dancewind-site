// src/context/CalendarContext.tsx
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";
import { toTimeString } from "../utils/time";

export type EventVisibility = "public" | "member" | "president";

export interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  time: string;
  location: string;
  visibility: EventVisibility;
  source: "general" | "class" | "team_practice";
}

interface CalendarContextType {
  events: CalendarEvent[];
  loading: boolean;
  addEvent: (data: { date: string; title: string; time: string; location: string; visibility: EventVisibility }) => Promise<void>;
  removeEvent: (id: string) => Promise<void>;
}

const CalendarContext = createContext<CalendarContextType | null>(null);

export function CalendarProvider({ children }: { children: ReactNode }) {
  const { user, role } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);

    const { data: generalData } = await supabase
      .from("calendar_events")
      .select("*")
      .order("event_date", { ascending: true });

    const generalEvents: CalendarEvent[] = (generalData ?? []).map((e) => ({
      id: e.id,
      date: e.event_date,
      title: e.title,
      time: e.event_time,
      location: e.location,
      visibility: e.visibility,
      source: "general",
    }));

    let classEvents: CalendarEvent[] = [];
    let teamPracticeEvents: CalendarEvent[] = [];

    if (user) {
      const { data: myApplications } = await supabase.from("teaching_applicants").select("class_id").eq("user_id", user.id);
      const appliedClassIds = new Set((myApplications ?? []).map((a) => a.class_id));

      const { data: classData } = await supabase.from("teaching_classes").select("*").eq("confirmed", true);

      classEvents = (classData ?? [])
        .filter((c) => appliedClassIds.has(c.id) || c.teacher_id === user.id)
        .map((c) => ({
          id: `class-${c.id}`,
          date: c.class_date,
          title: `🎵 ${c.title}`,
          time: c.class_time,
          location: "",
          visibility: "member" as EventVisibility,
          source: "class" as const,
        }));

      const { data: teamsData } = await supabase
        .from("practice_teams")
        .select("id, team_name, leader_id")
        .eq("calendar_synced", true);

      const { data: teamMemberRows } = await supabase
        .from("practice_team_members")
        .select("team_id")
        .eq("user_id", user.id);
      const myTeamIds = new Set((teamMemberRows ?? []).map((r) => r.team_id));

      const visibleTeams = (teamsData ?? []).filter((t) => t.leader_id === user.id || myTeamIds.has(t.id));

      if (visibleTeams.length > 0) {
        const teamIds = visibleTeams.map((t) => t.id);
        const { data: sessionsData } = await supabase
          .from("practice_team_sessions")
          .select("team_id, session_date, session_data")
          .in("team_id", teamIds);

        const teamNameById = new Map(visibleTeams.map((t) => [t.id, t.team_name]));

        teamPracticeEvents = (sessionsData ?? [])
          .filter((s: any) => s.session_data?.mainSlot)
          .map((s: any) => {
            const slot = s.session_data.mainSlot;
            return {
              id: `team-practice-${s.team_id}-${s.session_date}`,
              date: s.session_date,
              title: `🕺 ${teamNameById.get(s.team_id) ?? "팀"} 연습`,
              time: `${toTimeString(slot.start)} ~ ${toTimeString(slot.end)}`,
              location: "",
              visibility: "member" as EventVisibility,
              source: "team_practice" as const,
            };
          });
      }
    }

    setEvents([...generalEvents, ...classEvents, ...teamPracticeEvents]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addEvent: CalendarContextType["addEvent"] = async (data) => {
    if (!user) return;
    await supabase.from("calendar_events").insert({
      event_date: data.date,
      title: data.title,
      event_time: data.time,
      location: data.location,
      visibility: data.visibility,
      created_by_id: user.id,
      created_by_name: role,
    });
    await fetchAll();
  };

  const removeEvent = async (id: string) => {
    await supabase.from("calendar_events").delete().eq("id", id);
    await fetchAll();
  };

  return (
    <CalendarContext.Provider value={{ events, loading, addEvent, removeEvent }}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() {
  const ctx = useContext(CalendarContext);
  if (!ctx) throw new Error("useCalendar는 CalendarProvider 안에서만 써야 해요.");
  return ctx;
}