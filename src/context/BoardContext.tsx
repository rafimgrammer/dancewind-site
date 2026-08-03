// src/context/BoardContext.tsx
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

export interface BoardComment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  parentId: string | null;
}

export interface BoardPost {
  id: string;
  authorId: string;
  title: string;
  author: string;
  date: string;
  body: string;
  views: number;
  likes: number;
  edited: boolean;
  comments: BoardComment[];
}

interface BoardContextType {
  posts: BoardPost[];
  loading: boolean;
  getById: (id: string) => BoardPost | undefined;
  addPost: (title: string, body: string) => Promise<void>;
  editPost: (id: string, title: string, body: string) => Promise<void>;
  removePost: (id: string) => Promise<void>;
  incrementViews: (id: string) => Promise<void>;
  toggleLike: (id: string) => Promise<void>;
  toggleSave: (id: string) => Promise<void>;
  addComment: (postId: string, content: string, parentId: string | null) => Promise<void>;
  removeComment: (postId: string, commentId: string) => Promise<void>;
  likedIds: Set<string>;
  savedIds: Set<string>;
}

const BoardContext = createContext<BoardContextType | null>(null);

export function BoardProvider({ children }: { children: ReactNode }) {
  const { user, name } = useAuth();
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setPosts([]);
      setLikedIds(new Set());
      setSavedIds(new Set());
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data: postData } = await supabase
      .from("board_posts")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: reactionData } = await supabase
      .from("board_reactions")
      .select("*")
      .eq("user_id", user.id);

    const { data: commentData } = await supabase
      .from("board_comments")
      .select("*")
      .order("created_at", { ascending: true });

    const commentsByPost: Record<string, BoardComment[]> = {};
    (commentData ?? []).forEach((c) => {
      if (!commentsByPost[c.post_id]) commentsByPost[c.post_id] = [];
      commentsByPost[c.post_id].push({
        id: c.id,
        authorId: c.author_id,
        authorName: c.author_name,
        content: c.content,
        createdAt: c.created_at,
        parentId: c.parent_id,
      });
    });

    setPosts(
      (postData ?? []).map((p) => ({
        id: p.id,
        authorId: p.author_id,
        title: p.title,
        author: p.author_name,
        date: p.created_at?.slice(0, 10) ?? "",
        body: p.body,
        views: p.views,
        likes: p.likes,
        edited: p.edited,
        comments: commentsByPost[p.id] ?? [],
      }))
    );

    const liked = new Set<string>();
    const saved = new Set<string>();
    (reactionData ?? []).forEach((r) => {
      if (r.type === "like") liked.add(r.post_id);
      if (r.type === "save") saved.add(r.post_id);
    });
    setLikedIds(liked);
    setSavedIds(saved);

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const getById = (id: string) => posts.find((p) => p.id === id);

  const addPost = async (title: string, body: string) => {
    if (!title.trim() || !user) return;
    await supabase.from("board_posts").insert({
      title: title.trim(),
      body: body.trim() || "내용을 입력해주세요.",
      author_id: user.id,
      author_name: name,
    });
    await fetchAll();
  };

  const editPost = async (id: string, title: string, body: string) => {
    if (!title.trim()) return;
    await supabase
      .from("board_posts")
      .update({ title: title.trim(), body: body.trim() || "내용을 입력해주세요.", edited: true })
      .eq("id", id);
    await fetchAll();
  };

  const removePost = async (id: string) => {
    await supabase.from("board_posts").delete().eq("id", id);
    await fetchAll();
  };

  const incrementViews = async (id: string) => {
    await supabase.rpc("increment_board_views", { post_id: id });
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, views: p.views + 1 } : p)));
  };

  const toggleLike = async (id: string) => {
    if (!user) return;
    const alreadyLiked = likedIds.has(id);

    if (alreadyLiked) {
      await supabase.from("board_reactions").delete().eq("post_id", id).eq("user_id", user.id).eq("type", "like");
      await supabase.rpc("adjust_board_likes", { post_id: id, delta: -1 });
    } else {
      await supabase.from("board_reactions").insert({ post_id: id, user_id: user.id, type: "like" });
      await supabase.rpc("adjust_board_likes", { post_id: id, delta: 1 });
    }

    setLikedIds((prev) => {
      const next = new Set(prev);
      if (alreadyLiked) next.delete(id);
      else next.add(id);
      return next;
    });
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, likes: p.likes + (alreadyLiked ? -1 : 1) } : p))
    );
  };

  const toggleSave = async (id: string) => {
    if (!user) return;
    const alreadySaved = savedIds.has(id);

    if (alreadySaved) {
      await supabase.from("board_reactions").delete().eq("post_id", id).eq("user_id", user.id).eq("type", "save");
    } else {
      await supabase.from("board_reactions").insert({ post_id: id, user_id: user.id, type: "save" });
    }

    setSavedIds((prev) => {
      const next = new Set(prev);
      if (alreadySaved) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addComment = async (postId: string, content: string, parentId: string | null) => {
    if (!content.trim() || !user) return;
    await supabase.from("board_comments").insert({
      post_id: postId,
      author_id: user.id,
      author_name: name,
      content: content.trim(),
      parent_id: parentId,
    });
    await fetchAll();
  };

  const removeComment = async (_postId: string, commentId: string) => {
    await supabase.from("board_comments").delete().eq("id", commentId);
    await fetchAll();
  };

  return (
    <BoardContext.Provider
      value={{
        posts,
        loading,
        getById,
        addPost,
        editPost,
        removePost,
        incrementViews,
        toggleLike,
        toggleSave,
        addComment,
        removeComment,
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