// src/context/UpdatesContext.tsx
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

export type UpdateCategory = "new" | "improved" | "fixed";

export interface SiteUpdate {
  id: string;
  title: string;
  body: string;
  category: UpdateCategory;
  authorName: string;
  createdAt: string;
  edited: boolean;
}

interface UpdatesContextType {
  updates: SiteUpdate[];
  loading: boolean;
  addUpdate: (title: string, body: string, category: UpdateCategory) => Promise<void>;
  editUpdate: (id: string, title: string, body: string, category: UpdateCategory) => Promise<void>;
  removeUpdate: (id: string) => Promise<void>;
}

const UpdatesContext = createContext<UpdatesContextType | null>(null);

export function UpdatesProvider({ children }: { children: ReactNode }) {
  const { user, name } = useAuth();
  const [updates, setUpdates] = useState<SiteUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setUpdates([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data } = await supabase
      .from("site_updates")
      .select("*")
      .order("created_at", { ascending: false });

    setUpdates(
      (data ?? []).map((u) => ({
        id: u.id,
        title: u.title,
        body: u.body,
        category: u.category,
        authorName: u.author_name,
        createdAt: u.created_at,
        edited: u.edited,
      }))
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addUpdate = async (title: string, body: string, category: UpdateCategory) => {
    if (!title.trim() || !user) return;
    await supabase.from("site_updates").insert({
      title: title.trim(),
      body: body.trim(),
      category,
      author_id: user.id,
      author_name: name,
    });
    await fetchAll();
  };

  const editUpdate = async (id: string, title: string, body: string, category: UpdateCategory) => {
    if (!title.trim()) return;
    await supabase
      .from("site_updates")
      .update({ title: title.trim(), body: body.trim(), category, edited: true })
      .eq("id", id);
    await fetchAll();
  };

  const removeUpdate = async (id: string) => {
    await supabase.from("site_updates").delete().eq("id", id);
    await fetchAll();
  };

  return (
    <UpdatesContext.Provider value={{ updates, loading, addUpdate, editUpdate, removeUpdate }}>
      {children}
    </UpdatesContext.Provider>
  );
}

export function useUpdates() {
  const ctx = useContext(UpdatesContext);
  if (!ctx) throw new Error("useUpdates는 UpdatesProvider 안에서만 써야 해요.");
  return ctx;
}