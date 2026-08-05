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

export interface TeamMemberRef {
  id: string;
  name: string;
}

export interface PracticeTeam {
  id: string;
  teamName: string;
  leaderId: string;
  leaderName: string;
  calendarSynced: boolean;
  behindScenesAllowed: boolean;
  members: TeamMemberRef[];
  createdAt: string;
}

export interface MemberSearchResult {
  id: string;
  name: string;
  cohort: string;
  department: string;
}

interface PracticeContextType {
  teams: PracticeTeam[];
  loading: boolean;
  getTeamById: (id: string) => PracticeTeam | undefined;
  createTeam: (teamName: string) => Promise<string | null>;
  removeTeam: (id: string) => Promise<void>;
  getSavedDates: (teamId: string) => Promise<string[]>;
  getSession: (teamId: string, date: string) => Promise<PracticeSession>;
  saveSession: (teamId: string, date: string, session: PracticeSession) => Promise<void>;
  deleteSession: (teamId: string, date: string) => Promise<void>;
  getSessionsInRange: (teamId: string, startDate: string, endDate: string) => Promise<{ date: string; session: PracticeSession }[]>;
  syncToCalendar: (teamId: string, members: TeamMemberRef[], behindScenesAllowed: boolean) => Promise<void>;
  searchMembers: (query: string) => Promise<MemberSearchResult[]>;
  getBehindScenesTeams: () => Promise<PracticeTeam[]>;
}

const PracticeContext = createContext<PracticeContextType | null>(null);

export function PracticeProvider({ children }: { children: ReactNode }) {
  const { user, name } = useAuth();
  const [teams, setTeams] = useState<PracticeTeam[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeams = useCallback(async () => {
    if (!user) {
      setTeams([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data: teamData } = await supabase
      .from("practice_teams")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: memberData } = await supabase.from("practice_team_members").select("*");

    const membersByTeam: Record<string, TeamMemberRef[]> = {};
    (memberData ?? []).forEach((m) => {
      if (!membersByTeam[m.team_id]) membersByTeam[m.team_id] = [];
      membersByTeam[m.team_id].push({ id: m.user_id, name: m.user_name });
    });

    setTeams(
      (teamData ?? []).map((t) => ({
        id: t.id,
        teamName: t.team_name,
        leaderId: t.leader_id,
        leaderName: t.leader_name,
        calendarSynced: t.calendar_synced,
        behindScenesAllowed: t.behind_scenes_allowed,
        members: membersByTeam[t.id] ?? [],
        createdAt: t.created_at?.slice(0, 10) ?? "",
      }))
    );

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const getTeamById = (id: string) => teams.find((t) => t.id === id);

  const createTeam = async (teamName: string) => {
    if (!user || !teamName.trim()) return null;
    const { data } = await supabase
      .from("practice_teams")
      .insert({ team_name: teamName.trim(), leader_id: user.id, leader_name: name })
      .select("id")
      .single();
    await fetchTeams();
    return data?.id ?? null;
  };

  const removeTeam = async (id: string) => {
    await supabase.from("practice_teams").delete().eq("id", id);
    await fetchTeams();
  };

  const getSavedDates = async (teamId: string): Promise<string[]> => {
    const { data } = await supabase
      .from("practice_team_sessions")
      .select("session_date")
      .eq("team_id", teamId)
      .order("session_date", { ascending: true });
    return (data ?? []).map((d) => d.session_date);
  };

  const getSession = async (teamId: string, date: string): Promise<PracticeSession> => {
    const { data } = await supabase
      .from("practice_team_sessions")
      .select("session_data")
      .eq("team_id", teamId)
      .eq("session_date", date)
      .maybeSingle();
    return (data?.session_data as PracticeSession) ?? emptySession();
  };

  const saveSession = async (teamId: string, date: string, session: PracticeSession) => {
    await supabase.from("practice_team_sessions").upsert(
      { team_id: teamId, session_date: date, session_data: session, updated_at: new Date().toISOString() },
      { onConflict: "team_id,session_date" }
    );
  };

  const deleteSession = async (teamId: string, date: string) => {
    await supabase.from("practice_team_sessions").delete().eq("team_id", teamId).eq("session_date", date);
  };

  const getSessionsInRange = async (teamId: string, startDate: string, endDate: string) => {
    const { data } = await supabase
      .from("practice_team_sessions")
      .select("session_date, session_data")
      .eq("team_id", teamId)
      .gte("session_date", startDate)
      .lte("session_date", endDate)
      .order("session_date", { ascending: true });

    return (data ?? []).map((d) => ({ date: d.session_date, session: d.session_data as PracticeSession }));
  };

  const syncToCalendar = async (teamId: string, members: TeamMemberRef[], behindScenesAllowed: boolean) => {
    await supabase
      .from("practice_teams")
      .update({ calendar_synced: true, behind_scenes_allowed: behindScenesAllowed, updated_at: new Date().toISOString() })
      .eq("id", teamId);

    await supabase.from("practice_team_members").delete().eq("team_id", teamId);
    if (members.length > 0) {
      await supabase.from("practice_team_members").insert(
        members.map((m) => ({ team_id: teamId, user_id: m.id, user_name: m.name }))
      );
    }
    await fetchTeams();
  };

  const searchMembers = async (query: string): Promise<MemberSearchResult[]> => {
    if (!query.trim()) return [];
    const { data } = await supabase.rpc("search_members", { search_query: query.trim() });
    return (data ?? []) as MemberSearchResult[];
  };

  const getBehindScenesTeams = async (): Promise<PracticeTeam[]> => {
    const { data: teamData } = await supabase
      .from("practice_teams")
      .select("*")
      .eq("calendar_synced", true)
      .eq("behind_scenes_allowed", true)
      .order("created_at", { ascending: false });

    const { data: memberData } = await supabase.from("practice_team_members").select("*");
    const membersByTeam: Record<string, TeamMemberRef[]> = {};
    (memberData ?? []).forEach((m) => {
      if (!membersByTeam[m.team_id]) membersByTeam[m.team_id] = [];
      membersByTeam[m.team_id].push({ id: m.user_id, name: m.user_name });
    });

    return (teamData ?? []).map((t) => ({
      id: t.id,
      teamName: t.team_name,
      leaderId: t.leader_id,
      leaderName: t.leader_name,
      calendarSynced: t.calendar_synced,
      behindScenesAllowed: t.behind_scenes_allowed,
      members: membersByTeam[t.id] ?? [],
      createdAt: t.created_at?.slice(0, 10) ?? "",
    }));
  };

  return (
    <PracticeContext.Provider
      value={{
        teams,
        loading,
        getTeamById,
        createTeam,
        removeTeam,
        getSavedDates,
        getSession,
        saveSession,
        deleteSession,
        getSessionsInRange,
        syncToCalendar,
        searchMembers,
        getBehindScenesTeams,
      }}
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