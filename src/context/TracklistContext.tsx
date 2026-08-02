// src/context/TracklistContext.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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

interface TracklistContextType {
  members: TrackMember[];
  tracks: TrackItem[];
  settings: TracklistSettings;
  result: TrackItem[] | null;
  addMember: (name: string) => void;
  removeMember: (id: string) => void;
  addTrack: (title: string) => void;
  removeTrack: (id: string) => void;
  toggleParticipant: (trackId: string, memberId: string) => void;
  updateSettings: (patch: Partial<TracklistSettings>) => void;
  setResult: (result: TrackItem[] | null) => void;
}

const STORAGE_KEY = "chumbaram_tracklist_master";

const TracklistContext = createContext<TracklistContextType | null>(null);

function defaultState() {
  return {
    members: [] as TrackMember[],
    tracks: [] as TrackItem[],
    settings: { minGap: 1 as GapOption, fixedFirstId: null, fixedLastId: null } as TracklistSettings,
    result: null as TrackItem[] | null,
  };
}

export function TracklistProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(defaultState);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {
      // 저장된 값 없으면 무시
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // 저장 실패해도 화면은 정상 동작
    }
  }, [state]);

  const addMember = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (state.members.some((m) => m.name === trimmed)) return;
    setState((s) => ({ ...s, members: [...s.members, { id: `m${Date.now()}`, name: trimmed }] }));
  };

  const removeMember = (id: string) => {
    setState((s) => ({
      ...s,
      members: s.members.filter((m) => m.id !== id),
      tracks: s.tracks.map((t) => ({
        ...t,
        participantIds: t.participantIds.filter((p) => p !== id),
      })),
    }));
  };

  const addTrack = (title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setState((s) => ({
      ...s,
      tracks: [...s.tracks, { id: `tr${Date.now()}`, title: trimmed, participantIds: [] }],
    }));
  };

  const removeTrack = (id: string) => {
    setState((s) => ({
      ...s,
      tracks: s.tracks.filter((t) => t.id !== id),
      settings: {
        ...s.settings,
        fixedFirstId: s.settings.fixedFirstId === id ? null : s.settings.fixedFirstId,
        fixedLastId: s.settings.fixedLastId === id ? null : s.settings.fixedLastId,
      },
    }));
  };

  const toggleParticipant = (trackId: string, memberId: string) => {
    setState((s) => ({
      ...s,
      tracks: s.tracks.map((t) =>
        t.id === trackId
          ? {
              ...t,
              participantIds: t.participantIds.includes(memberId)
                ? t.participantIds.filter((p) => p !== memberId)
                : [...t.participantIds, memberId],
            }
          : t
      ),
    }));
  };

  const updateSettings = (patch: Partial<TracklistSettings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  };

  const setResult = (result: TrackItem[] | null) => {
    setState((s) => ({ ...s, result }));
  };

  return (
    <TracklistContext.Provider
      value={{
        members: state.members,
        tracks: state.tracks,
        settings: state.settings,
        result: state.result,
        addMember,
        removeMember,
        addTrack,
        removeTrack,
        toggleParticipant,
        updateSettings,
        setResult,
      }}
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