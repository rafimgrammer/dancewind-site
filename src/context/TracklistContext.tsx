// src/context/TracklistContext.tsx
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";
import type { GapOption } from "../utils/tracklistSolver";

export interface TrackMember {
  id: string;
  name: string;
}

export interface TrackItem {
  id: string;
  title: string;
  participantIds: string[];
}

export interface TracklistSettings {
  minGap: GapOption;
  fixedFirstId: string | null;
  fixedLastId: string | null;
}

export interface TracklistSet {
  id: string;
  title: string;
  performanceDate: string;
  members: TrackMember[];
  tracks: TrackItem[];
  settings: TracklistSettings;
  result: TrackItem[] | null;
  confirmed: boolean;
  createdBy: string;
  createdAt: string;
}

const defaultSettings: TracklistSettings = { minGap: 1, fixedFirstId: null, fixedLastId: null };

interface TracklistContextType {
  sets: TracklistSet[];
  loading: boolean;
  getById: (id: string) => TracklistSet | undefined;
  createSet: (title: string, performanceDate: string) => Promise<string | null>;
  updateSet: (id: string, patch: Partial<Omit<TracklistSet, "id">>) => Promise<void>;
  removeSet: (id: string) => Promise<void>;
  confirmSet: (id: string) => Promise<void>;
  unconfirmSet: (id: string) => Promise<void>;
}

const TracklistContext = createContext<TracklistContextType | null>(null);

export function TracklistProvider({ children }: { children: ReactNode }) {
  const { user, name } = useAuth();
  const [sets, setSets] = useState<TracklistSet[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setSets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("tracklist_sets")
      .select("*")
      .order("performance_date", { ascending: true });

    setSets(
      (data ?? []).map((s) => ({
        id: s.id,
        title: s.title,
        performanceDate: s.performance_date,
        members: s.members_data ?? [],
        tracks: s.tracks_data ?? [],
        settings: s.settings_data ?? defaultSettings,
        result: s.result_data ?? null,
        confirmed: s.confirmed,
        createdBy: s.created_by_name,
        createdAt: s.created_at?.slice(0, 10) ?? "",
      }))
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const getById = (id: string) => sets.find((s) => s.id === id);

  const createSet = async (title: string, performanceDate: string) => {
    if (!title.trim() || !user) return null;
    const { data } = await supabase
      .from("tracklist_sets")
      .insert({
        title: title.trim(),
        performance_date: performanceDate,
        created_by_id: user.id,
        created_by_name: name,
      })
      .select("id")
      .single();
    await fetchAll();
    return data?.id ?? null;
  };

  const updateSet = async (id: string, patch: Partial<Omit<TracklistSet, "id">>) => {
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.title !== undefined) payload.title = patch.title;
    if (patch.performanceDate !== undefined) payload.performance_date = patch.performanceDate;
    if (patch.members !== undefined) payload.members_data = patch.members;
    if (patch.tracks !== undefined) payload.tracks_data = patch.tracks;
    if (patch.settings !== undefined) payload.settings_data = patch.settings;
    if (patch.result !== undefined) payload.result_data = patch.result;

    await supabase.from("tracklist_sets").update(payload).eq("id", id);
    await fetchAll();
  };

  const removeSet = async (id: string) => {
    await supabase.from("tracklist_sets").delete().eq("id", id);
    await fetchAll();
  };

  const confirmSet = async (id: string) => {
    await supabase.from("tracklist_sets").update({ confirmed: true }).eq("id", id);
    await fetchAll();
  };

  const unconfirmSet = async (id: string) => {
    await supabase.from("tracklist_sets").update({ confirmed: false }).eq("id", id);
    await fetchAll();
  };

  return (
    <TracklistContext.Provider
      value={{ sets, loading, getById, createSet, updateSet, removeSet, confirmSet, unconfirmSet }}
    >
      {children}
    </TracklistContext.Provider>
  );
}

export function useTracklist() {
  const ctx = useContext(TracklistContext);
  if (!ctx) throw new Error("useTracklist는 TracklistProvider 안에서만 써야 해요.");
  return ctx;
}