// src/context/AboutContentContext.tsx
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";

export interface AboutContent {
  introDesc: string;
  principles: string[];
  rhythm: string[];
}

export interface AboutPart {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
}

interface AboutContentContextType {
  content: AboutContent | null;
  parts: AboutPart[];
  loading: boolean;
  editContent: (data: AboutContent) => Promise<void>;
  addPart: (name: string, description: string) => Promise<void>;
  editPart: (id: string, name: string, description: string) => Promise<void>;
  removePart: (id: string) => Promise<void>;
}

const AboutContentContext = createContext<AboutContentContextType | null>(null);

export function AboutContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<AboutContent | null>(null);
  const [parts, setParts] = useState<AboutPart[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: contentData }, { data: partsData }] = await Promise.all([
      supabase.from("about_content").select("*").eq("id", 1).maybeSingle(),
      supabase.from("about_parts").select("*").order("sort_order", { ascending: true }),
    ]);

    setContent(
      contentData
        ? {
            introDesc: contentData.intro_desc,
            principles: contentData.principles ?? [],
            rhythm: contentData.rhythm ?? [],
          }
        : null
    );
    setParts(
      (partsData ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        sortOrder: p.sort_order,
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const editContent = async (data: AboutContent) => {
    await supabase
      .from("about_content")
      .update({ intro_desc: data.introDesc, principles: data.principles, rhythm: data.rhythm })
      .eq("id", 1);
    await fetchAll();
  };

  const addPart = async (name: string, description: string) => {
    if (!name.trim() || !description.trim()) return;
    await supabase.from("about_parts").insert({
      name: name.trim(),
      description: description.trim(),
      sort_order: parts.length,
    });
    await fetchAll();
  };

  const editPart = async (id: string, name: string, description: string) => {
    if (!name.trim() || !description.trim()) return;
    await supabase.from("about_parts").update({ name: name.trim(), description: description.trim() }).eq("id", id);
    await fetchAll();
  };

  const removePart = async (id: string) => {
    await supabase.from("about_parts").delete().eq("id", id);
    await fetchAll();
  };

  return (
    <AboutContentContext.Provider value={{ content, parts, loading, editContent, addPart, editPart, removePart }}>
      {children}
    </AboutContentContext.Provider>
  );
}

export function useAboutContent() {
  const ctx = useContext(AboutContentContext);
  if (!ctx) throw new Error("useAboutContent는 AboutContentProvider 안에서만 써야 해요.");
  return ctx;
}