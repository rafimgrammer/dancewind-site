// src/context/FormationContext.tsx
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";
import type { Point } from "../utils/hungarian";

export interface FormationProject {
  id: string;
  songTitle: string;
  memberCount: number;
  memberLabels: string[];
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  locked: boolean;
}

export interface FormationScene {
  id: string;
  projectId: string;
  sortOrder: number;
  name: string;
  positions: Point[];
}

export interface ShareableMember {
  id: string;
  name: string;
  cohort: string;
}

interface FormationContextType {
  projects: FormationProject[];
  loading: boolean;
  createProject: (songTitle: string, memberCount: number, initialPositions: Point[]) => Promise<string | null>;
  removeProject: (id: string) => Promise<void>;
  getProjectById: (id: string) => FormationProject | undefined;
  updateMemberLabels: (projectId: string, labels: string[]) => Promise<void>;
  toggleLock: (projectId: string, locked: boolean) => Promise<void>;
  fetchScenes: (projectId: string) => Promise<FormationScene[]>;
  addScene: (projectId: string, positions: Point[], name: string) => Promise<FormationScene | null>;
  updateScenePositions: (sceneId: string, positions: Point[]) => Promise<void>;
  renameScene: (sceneId: string, name: string) => Promise<void>;
  removeScene: (sceneId: string) => Promise<void>;
  fetchApprovedMembers: () => Promise<ShareableMember[]>;
  shareProject: (project: FormationProject, memberIds: string[]) => Promise<{ ok: boolean; message?: string }>;
}

const FormationContext = createContext<FormationContextType | null>(null);

export function FormationProvider({ children }: { children: ReactNode }) {
  const { user, name } = useAuth();
  const [projects, setProjects] = useState<FormationProject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data } = await supabase
      .from("formation_projects")
      .select("*")
      .order("updated_at", { ascending: false });

    setProjects(
      (data ?? []).map((p) => ({
        id: p.id,
        songTitle: p.song_title,
        memberCount: p.member_count,
        memberLabels: p.member_labels ?? [],
        createdBy: p.created_by,
        createdByName: p.created_by_name,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        locked: p.locked ?? false,
      }))
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const getProjectById = (id: string) => projects.find((p) => p.id === id);

  const createProject = async (
    songTitle: string,
    memberCount: number,
    initialPositions: Point[]
  ): Promise<string | null> => {
    if (!songTitle.trim() || memberCount <= 0 || !user) return null;

    const labels = Array.from({ length: memberCount }, (_, i) => String(i + 1));

    const { data: project, error } = await supabase
      .from("formation_projects")
      .insert({
        song_title: songTitle.trim(),
        member_count: memberCount,
        member_labels: labels,
        created_by: user.id,
        created_by_name: name,
      })
      .select("id")
      .single();

    if (error || !project) return null;

    await supabase.from("formation_scenes").insert({
      project_id: project.id,
      sort_order: 0,
      name: "기본 대형",
      positions: initialPositions,
    });

    await fetchAll();
    return project.id;
  };

  const removeProject = async (id: string) => {
    await supabase.from("formation_projects").delete().eq("id", id);
    await fetchAll();
  };

  const updateMemberLabels = async (projectId: string, labels: string[]) => {
    await supabase
      .from("formation_projects")
      .update({ member_labels: labels, updated_at: new Date().toISOString() })
      .eq("id", projectId);
    await fetchAll();
  };

  const toggleLock = async (projectId: string, locked: boolean) => {
    await supabase.from("formation_projects").update({ locked }).eq("id", projectId);
    await fetchAll();
  };

  const fetchScenes = async (projectId: string): Promise<FormationScene[]> => {
    const { data } = await supabase
      .from("formation_scenes")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true });

    return (data ?? []).map((s) => ({
      id: s.id,
      projectId: s.project_id,
      sortOrder: s.sort_order,
      name: s.name,
      positions: s.positions ?? [],
    }));
  };

  const addScene = async (projectId: string, positions: Point[], name: string): Promise<FormationScene | null> => {
    const { data: existing } = await supabase
      .from("formation_scenes")
      .select("sort_order")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = existing ? existing.sort_order + 1 : 0;

    const { data, error } = await supabase
      .from("formation_scenes")
      .insert({ project_id: projectId, sort_order: nextOrder, name, positions })
      .select("*")
      .single();

    await supabase.from("formation_projects").update({ updated_at: new Date().toISOString() }).eq("id", projectId);

    if (error || !data) return null;
    return {
      id: data.id,
      projectId: data.project_id,
      sortOrder: data.sort_order,
      name: data.name,
      positions: data.positions ?? [],
    };
  };

  const updateScenePositions = async (sceneId: string, positions: Point[]) => {
    await supabase.from("formation_scenes").update({ positions }).eq("id", sceneId);
  };

  const renameScene = async (sceneId: string, name: string) => {
    await supabase.from("formation_scenes").update({ name }).eq("id", sceneId);
  };

  const removeScene = async (sceneId: string) => {
    await supabase.from("formation_scenes").delete().eq("id", sceneId);
  };

  const fetchApprovedMembers = async (): Promise<ShareableMember[]> => {
    const { data } = await supabase
      .from("members")
      .select("id, name, cohort")
      .eq("status", "approved")
      .order("cohort", { ascending: true });
    return (data ?? []).map((m) => ({ id: m.id, name: m.name, cohort: m.cohort }));
  };

  const shareProject = async (
    project: FormationProject,
    memberIds: string[]
  ): Promise<{ ok: boolean; message?: string }> => {
    if (memberIds.length === 0) return { ok: false, message: "공유할 부원을 선택해주세요." };

    const { error } = await supabase.rpc("notify_formation_share", {
      target_ids: memberIds,
      proj_id: project.id,
      proj_title: project.songTitle,
      sender_name: name,
    });

    if (error) return { ok: false, message: "공유 중 문제가 발생했어요: " + error.message };
    return { ok: true };
  };

  return (
    <FormationContext.Provider
      value={{
        projects,
        loading,
        createProject,
        removeProject,
        getProjectById,
        updateMemberLabels,
        toggleLock,
        fetchScenes,
        addScene,
        updateScenePositions,
        renameScene,
        removeScene,
        fetchApprovedMembers,
        shareProject,
      }}
    >
      {children}
    </FormationContext.Provider>
  );
}

export function useFormation() {
  const ctx = useContext(FormationContext);
  if (!ctx) throw new Error("useFormation은 FormationProvider 안에서만 써야 해요.");
  return ctx;
}