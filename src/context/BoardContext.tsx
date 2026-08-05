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

export interface MyBoardComment {
  postId: string;
  postTitle: string;
  content: string;
  createdAt: string;
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
  // 게시글 목록을 불러올 땐 댓글까지 통째로 가져오지 않아요.
  // 상세 페이지에 들어갔을 때만 그 글의 댓글을 따로 불러와요.
  fetchComments: (postId: string) => Promise<void>;
  // 마이페이지의 "댓글 쓴 글" 탭 전용: 내가 쓴 댓글만 딱 필요한 만큼만 가져와요.
  fetchMyComments: () => Promise<MyBoardComment[]>;
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

    // 댓글은 여기서 같이 안 가져와요. 게시글이 많아지고 댓글이 쌓일수록
    // 목록 페이지 하나 여는 데 필요한 데이터량이 계속 불어나는 걸 막기 위해서예요.
    const { data: postData } = await supabase
      .from("board_posts")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: reactionData } = await supabase
      .from("board_reactions")
      .select("*")
      .eq("user_id", user.id);

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
        comments: [],
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

  const fetchComments = async (postId: string) => {
    const { data: commentData } = await supabase
      .from("board_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    const comments: BoardComment[] = (commentData ?? []).map((c) => ({
      id: c.id,
      authorId: c.author_id,
      authorName: c.author_name,
      content: c.content,
      createdAt: c.created_at,
      parentId: c.parent_id,
    }));

    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comments } : p)));
  };

  const fetchMyComments = async (): Promise<MyBoardComment[]> => {
    if (!user) return [];

    const { data: myComments } = await supabase
      .from("board_comments")
      .select("*")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false });

    if (!myComments || myComments.length === 0) return [];

    const postIds = [...new Set(myComments.map((c) => c.post_id))];
    const { data: relatedPosts } = await supabase.from("board_posts").select("id, title").in("id", postIds);
    const titleMap = new Map((relatedPosts ?? []).map((p) => [p.id, p.title as string]));

    return myComments.map((c) => ({
      postId: c.post_id,
      postTitle: titleMap.get(c.post_id) ?? "삭제된 글",
      content: c.content,
      createdAt: c.created_at,
    }));
  };

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
    await fetchComments(postId);
  };

  const removeComment = async (postId: string, commentId: string) => {
    await supabase.from("board_comments").delete().eq("id", commentId);
    await fetchComments(postId);
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
        fetchComments,
        fetchMyComments,
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