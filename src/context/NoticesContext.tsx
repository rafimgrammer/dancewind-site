// src/context/NoticesContext.tsx
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

export interface Notice {
  id: string;
  title: string;
  author: string;
  date: string;
  pinned: boolean;
  body: string;
  views: number;
}

const MAX_PINNED = 2;

interface NoticesContextType {
  notices: Notice[];
  loading: boolean;
  getById: (id: string) => Notice | undefined;
  addNotice: (title: string, body: string) => Promise<void>;
  editNotice: (id: string, title: string, body: string) => Promise<void>;
  removeNotice: (id: string) => Promise<void>;
  incrementViews: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  pinnedCount: number;
}

const NoticesContext = createContext<NoticesContextType | null>(null);

export function NoticesProvider({ children }: { children: ReactNode }) {
  const { user, name } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotices = useCallback(async () => {
    if (!user) {
      setNotices([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase.from("notices").select("*").order("created_at", { ascending: false });
    setNotices(
      (data ?? []).map((n) => ({
        id: n.id,
        title: n.title,
        author: n.author_name,
        date: n.created_at?.slice(0, 10) ?? "",
        pinned: n.pinned,
        body: n.body,
        views: n.views,
      }))
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const getById = (id: string) => notices.find((n) => n.id === id);

  const addNotice = async (title: string, body: string) => {
    if (!title.trim() || !user) return;
    await supabase.from("notices").insert({
      title: title.trim(),
      body: body.trim() || "내용을 입력해주세요.",
      author_id: user.id,
      author_name: name,
      pinned: false,
    });
    await fetchNotices();
  };

  const editNotice = async (id: string, title: string, body: string) => {
    if (!title.trim()) return;
    await supabase
      .from("notices")
      .update({ title: title.trim(), body: body.trim() || "내용을 입력해주세요." })
      .eq("id", id);
    await fetchNotices();
  };

  const removeNotice = async (id: string) => {
    await supabase.from("notices").delete().eq("id", id);
    await fetchNotices();
  };

  const incrementViews = async (id: string) => {
    await supabase.rpc("increment_notice_views", { notice_id: id });
    setNotices((prev) => prev.map((n) => (n.id === id ? { ...n, views: n.views + 1 } : n)));
  };

  const pinnedCount = notices.filter((n) => n.pinned).length;

  const togglePin = async (id: string) => {
    const target = notices.find((n) => n.id === id);
    if (!target) return;

    if (!target.pinned && pinnedCount >= MAX_PINNED) {
      alert(`고정 공지는 최대 ${MAX_PINNED}개까지만 가능해요. 다른 공지의 고정을 먼저 해제해주세요.`);
      return;
    }

    await supabase.from("notices").update({ pinned: !target.pinned }).eq("id", id);
    await fetchNotices();
  };

  return (
    <NoticesContext.Provider
      value={{
        notices,
        loading,
        getById,
        addNotice,
        editNotice,
        removeNotice,
        incrementViews,
        togglePin,
        pinnedCount,
      }}
    >
      {children}
    </NoticesContext.Provider>
  );
}

export function useNotices() {
  const ctx = useContext(NoticesContext);
  if (!ctx) throw new Error("useNotices는 NoticesProvider 안에서만 써야 해요.");
  return ctx;
}