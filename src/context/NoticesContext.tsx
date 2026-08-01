// src/context/NoticesContext.tsx
import { createContext, useContext, useState, type ReactNode } from "react";
import initialNotices from "../data/notices.json";

export interface Notice {
  id: string;
  title: string;
  author: string;
  date: string;
  pinned: boolean;
  body: string;
  views: number;
}

const MAX_PINNED = 3;

interface NoticesContextType {
  notices: Notice[];
  getById: (id: string) => Notice | undefined;
  addNotice: (title: string, body: string) => void;
  removeNotice: (id: string) => void;
  incrementViews: (id: string) => void;
  togglePin: (id: string) => void;
  pinnedCount: number;
}

const NoticesContext = createContext<NoticesContextType | null>(null);

export function NoticesProvider({ children }: { children: ReactNode }) {
  const [notices, setNotices] = useState<Notice[]>(
    (initialNotices as Omit<Notice, "views">[]).map((n) => ({ ...n, views: 0 }))
  );

  const getById = (id: string) => notices.find((n) => n.id === id);

  const addNotice = (title: string, body: string) => {
    if (!title.trim()) return;
    setNotices((prev) => [
      {
        id: `n${Date.now()}`,
        title: title.trim(),
        author: "회장단",
        date: new Date().toISOString().slice(0, 10),
        pinned: false,
        body: body.trim() || "내용을 입력해주세요.",
        views: 0,
      },
      ...prev,
    ]);
  };

  const removeNotice = (id: string) =>
    setNotices((prev) => prev.filter((n) => n.id !== id));

  const incrementViews = (id: string) =>
    setNotices((prev) =>
      prev.map((n) => (n.id === id ? { ...n, views: n.views + 1 } : n))
    );

  const pinnedCount = notices.filter((n) => n.pinned).length;

  const togglePin = (id: string) => {
    setNotices((prev) => {
      const target = prev.find((n) => n.id === id);
      if (!target) return prev;

      if (!target.pinned && pinnedCount >= MAX_PINNED) {
        alert(`고정 공지는 최대 ${MAX_PINNED}개까지만 가능해요. 다른 공지의 고정을 먼저 해제해주세요.`);
        return prev;
      }

      return prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n));
    });
  };

  return (
    <NoticesContext.Provider
      value={{ notices, getById, addNotice, removeNotice, incrementViews, togglePin, pinnedCount }}
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