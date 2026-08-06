// src/context/RecruitContentContext.tsx
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";

export interface RecruitContent {
  termLabel: string;
  periodText: string;
  scheduleText: string;
  applyOpen: boolean;
  applyUrl: string;
}

export interface RecruitStep {
  id: string;
  title: string;
  description: string;
  sortOrder: number;
}

interface RecruitContentContextType {
  content: RecruitContent | null;
  steps: RecruitStep[];
  loading: boolean;
  editContent: (data: RecruitContent) => Promise<void>;
  addStep: (title: string, description: string) => Promise<void>;
  editStep: (id: string, title: string, description: string) => Promise<void>;
  removeStep: (id: string) => Promise<void>;
}

const RecruitContentContext = createContext<RecruitContentContextType | null>(null);

export function RecruitContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<RecruitContent | null>(null);
  const [steps, setSteps] = useState<RecruitStep[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: contentData }, { data: stepsData }] = await Promise.all([
      supabase.from("recruit_content").select("*").eq("id", 1).maybeSingle(),
      supabase.from("recruit_steps").select("*").order("sort_order", { ascending: true }),
    ]);

    setContent(
      contentData
        ? {
            termLabel: contentData.term_label,
            periodText: contentData.period_text,
            scheduleText: contentData.schedule_text,
            applyOpen: contentData.apply_open,
            applyUrl: contentData.apply_url,
          }
        : null
    );
    setSteps(
      (stepsData ?? []).map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        sortOrder: s.sort_order,
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const editContent = async (data: RecruitContent) => {
    await supabase
      .from("recruit_content")
      .update({
        term_label: data.termLabel,
        period_text: data.periodText,
        schedule_text: data.scheduleText,
        apply_open: data.applyOpen,
        apply_url: data.applyUrl,
      })
      .eq("id", 1);
    await fetchAll();
  };

  const addStep = async (title: string, description: string) => {
    if (!title.trim() || !description.trim()) return;
    await supabase.from("recruit_steps").insert({
      title: title.trim(),
      description: description.trim(),
      sort_order: steps.length,
    });
    await fetchAll();
  };

  const editStep = async (id: string, title: string, description: string) => {
    if (!title.trim() || !description.trim()) return;
    await supabase.from("recruit_steps").update({ title: title.trim(), description: description.trim() }).eq("id", id);
    await fetchAll();
  };

  const removeStep = async (id: string) => {
    await supabase.from("recruit_steps").delete().eq("id", id);
    await fetchAll();
  };

  return (
    <RecruitContentContext.Provider
      value={{ content, steps, loading, editContent, addStep, editStep, removeStep }}
    >
      {children}
    </RecruitContentContext.Provider>
  );
}

export function useRecruitContent() {
  const ctx = useContext(RecruitContentContext);
  if (!ctx) throw new Error("useRecruitContent는 RecruitContentProvider 안에서만 써야 해요.");
  return ctx;
}