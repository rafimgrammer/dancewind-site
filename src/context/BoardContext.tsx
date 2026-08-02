// src/context/BoardContext.tsx
import { createContext, useContext, useState, type ReactNode } from "react";
import initialPosts from "../data/boardPosts.json";

export interface BoardPost {
  id: string;
  title: string;
  author: string;
  date: string;
  body: string;
  views: number;
  likes: number;
}

interface BoardContextType {
  posts: BoardPost[];
  getById: (id: string) => BoardPost | undefined;
  addPost: (title: string, body: string, author: string) => void;
  removePost: (id: string) => void;
  incrementViews: (id: string) => void;
  toggleLike: (id: string) => void;
  toggleSave: (id: string) => void;
  likedIds: Set<string>;
  savedIds: Set<string>;
}

const BoardContext = createContext<BoardContextType | null>(null);

export function BoardProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<BoardPost[]>(
    (initialPosts as any[]).map((p) => ({
      id: p.id,
      title: p.title,
      author: p.author,
      date: p.date,
      body: p.body ?? "",
      views: p.views ?? 0,
      likes: p.likes ?? 0,
    }))
  );
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const getById = (id: string) => posts.find((p) => p.id === id);

  const addPost = (title: string, body: string, author: string) => {
    if (!title.trim()) return;
    setPosts((prev) => [
      {
        id: `b${Date.now()}`,
        title: title.trim(),
        author,
        date: new Date().toISOString().slice(0, 10),
        body: body.trim() || "내용을 입력해주세요.",
        views: 0,
        likes: 0,
      },
      ...prev,
    ]);
  };

  const removePost = (id: string) =>
    setPosts((prev) => prev.filter((p) => p.id !== id));

  const incrementViews = (id: string) =>
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, views: p.views + 1 } : p))
    );

  const toggleLike = (id: string) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      const alreadyLiked = next.has(id);
      if (alreadyLiked) next.delete(id);
      else next.add(id);

      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === id ? { ...p, likes: p.likes + (alreadyLiked ? -1 : 1) } : p
        )
      );

      return next;
    });
  };

  const toggleSave = (id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <BoardContext.Provider
      value={{
        posts,
        getById,
        addPost,
        removePost,
        incrementViews,
        toggleLike,
        toggleSave,
        likedIds,
        savedIds,
      }}
    >
      {children}
    </BoardContext.Provider>
  );
}

export function useBoard() {
  const ctx = useContext(BoardContext);
  if (!ctx) throw new Error("useBoard는 BoardProvider 안에서만 써야 해요.");
  return ctx;
}