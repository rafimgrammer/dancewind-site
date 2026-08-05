// src/context/AnonBoardContext.tsx
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

export interface AnonComment {
  id: string;
  authorId: string;
  displayName: string;
  content: string;
  createdAt: string;
  parentId: string | null;
}

export interface AnonPost {
  id: string;
  authorId: string;
  displayName: string;
  body: string;
  createdAt: string;
  edited: boolean;
  views: number;
  likes: number;
  reports: number;
  blinded: boolean;
  comments: AnonComment[];
}

export interface MyAnonComment {
  postId: string;
  postPreview: string;
  content: string;
  createdAt: string;
}

const COOLDOWN_MS = 5 * 60 * 1000;

interface AnonBoardContextType {
  posts: AnonPost[];
  loading: boolean;
  getById: (id: string) => AnonPost | undefined;
  addPost: (displayName: string, body: string) => Promise<{ ok: boolean; message?: string }>;
  editPost: (id: string, body: string) => Promise<void>;
  removePost: (id: string) => Promise<void>;
  addComment: (postId: string, displayName: string, content: string, parentId: string | null) => Promise<void>;
  removeComment: (postId: string, commentId: string) => Promise<void>;
  incrementViews: (id: string) => Promise<void>;
  toggleLike: (id: string) => Promise<void>;
  toggleSave: (id: string) => Promise<void>;
  report: (id: string) => Promise<{ ok: boolean; message?: string }>;
  getRemainingCooldown: () => number;
  // 목록 페이지에서 "댓글 N개"를 보여주려고 개수만 따로 들고 있어요.
  // (댓글 본문 전체를 다 가져오지 않기 위해서예요)
  commentCounts: Record<string, number>;
  // 상세 페이지에 들어갔을 때만 그 글의 댓글 본문을 실제로 불러와요.
  fetchComments: (postId: string) => Promise<void>;
  // 마이페이지의 "댓글 쓴 글" 탭 전용
  fetchMyComments: () => Promise<MyAnonComment[]>;
  likedIds: Set<string>;
  savedIds: Set<string>;
  reportedIds: Set<string>;
}

const AnonBoardContext = createContext<AnonBoardContextType | null>(null);

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "");
}

export function AnonBoardProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<AnonPost[]>([]);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());
  const [lastPostTime, setLastPostTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setPosts([]);
      setCommentCounts({});
      setLikedIds(new Set());
      setSavedIds(new Set());
      setReportedIds(new Set());
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data: postData } = await supabase
      .from("anon_posts")
      .select("*")
      .order("created_at", { ascending: false });

    // 댓글 본문 전체가 아니라 post_id만 가져와서 개수만 세요.
    // (목록 페이지는 "댓글 N개" 숫자만 필요하지 본문은 필요 없어요)
    const { data: commentIdData } = await supabase.from("anon_comments").select("post_id");

    const { data: likeData } = await supabase.from("anon_likes").select("post_id").eq("user_id", user.id);
    const { data: saveData } = await supabase.from("anon_saves").select("post_id").eq("user_id", user.id);
    const { data: reportData } = await supabase.from("anon_reports").select("post_id").eq("user_id", user.id);

    const { data: myLastPost } = await supabase
      .from("anon_posts")
      .select("created_at")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const counts: Record<string, number> = {};
    (commentIdData ?? []).forEach((c) => {
      counts[c.post_id] = (counts[c.post_id] ?? 0) + 1;
    });
    setCommentCounts(counts);

    setPosts(
      (postData ?? []).map((p) => ({
        id: p.id,
        authorId: p.author_id,
        displayName: p.display_name,
        body: p.body,
        createdAt: p.created_at,
        edited: p.edited,
        views: p.views,
        likes: p.likes,
        reports: p.reports,
        blinded: p.blinded,
        comments: [],
      }))
    );

    setLikedIds(new Set((likeData ?? []).map((l) => l.post_id)));
    setSavedIds(new Set((saveData ?? []).map((s) => s.post_id)));
    setReportedIds(new Set((reportData ?? []).map((r) => r.post_id)));
    setLastPostTime(myLastPost ? new Date(myLastPost.created_at).getTime() : null);

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const getById = (id: string) => posts.find((p) => p.id === id);

  const getRemainingCooldown = () => {
    if (!lastPostTime) return 0;
    const remaining = COOLDOWN_MS - (Date.now() - lastPostTime);
    return remaining > 0 ? remaining : 0;
  };

  const fetchComments = async (postId: string) => {
    const { data: commentData } = await supabase
      .from("anon_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    const comments: AnonComment[] = (commentData ?? []).map((c) => ({
      id: c.id,
      authorId: c.author_id,
      displayName: c.display_name,
      content: c.content,
      createdAt: c.created_at,
      parentId: c.parent_id,
    }));

    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comments } : p)));
    setCommentCounts((prev) => ({ ...prev, [postId]: comments.length }));
  };

  const fetchMyComments = async (): Promise<MyAnonComment[]> => {
    if (!user) return [];

    const { data: myComments } = await supabase
      .from("anon_comments")
      .select("*")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false });

    if (!myComments || myComments.length === 0) return [];

    const postIds = [...new Set(myComments.map((c) => c.post_id))];
    const { data: relatedPosts } = await supabase
      .from("anon_posts")
      .select("id, body, blinded")
      .in("id", postIds);
    const postMap = new Map((relatedPosts ?? []).map((p) => [p.id, p]));

    return myComments.map((c) => {
      const relatedPost = postMap.get(c.post_id);
      const preview = !relatedPost
        ? "삭제된 글"
        : relatedPost.blinded
          ? "블라인드 처리된 글"
          : stripHtml(relatedPost.body).slice(0, 50);
      return {
        postId: c.post_id,
        postPreview: preview,
        content: c.content,
        createdAt: c.created_at,
      };
    });
  };

  const addPost = async (displayName: string, body: string) => {
    if (!body.trim() || !user) return { ok: false, message: "내용을 입력해주세요." };

    const remaining = getRemainingCooldown();
    if (remaining > 0) {
      const minutes = Math.ceil(remaining / 60000);
      return { ok: false, message: `글 작성은 5분에 한 번만 가능해요. 약 ${minutes}분 후 다시 시도해주세요.` };
    }

    await supabase.from("anon_posts").insert({
      author_id: user.id,
      display_name: displayName,
      body: body.trim(),
    });
    await fetchAll();
    return { ok: true };
  };

  const editPost = async (id: string, body: string) => {
    if (!body.trim()) return;
    await supabase.from("anon_posts").update({ body: body.trim(), edited: true }).eq("id", id);
    await fetchAll();
  };

  const removePost = async (id: string) => {
    await supabase.from("anon_posts").delete().eq("id", id);
    await fetchAll();
  };

  const addComment = async (postId: string, displayName: string, content: string, parentId: string | null) => {
    if (!content.trim() || !user) return;
    await supabase.from("anon_comments").insert({
      post_id: postId,
      author_id: user.id,
      display_name: displayName,
      content: content.trim(),
      parent_id: parentId,
    });
    await fetchComments(postId);
  };

  const removeComment = async (postId: string, commentId: string) => {
    await supabase.from("anon_comments").delete().eq("id", commentId);
    await fetchComments(postId);
  };

  const incrementViews = async (id: string) => {
    await supabase.rpc("increment_anon_views", { post_id: id });
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, views: p.views + 1 } : p)));
  };

  const toggleLike = async (id: string) => {
    if (!user) return;
    const alreadyLiked = likedIds.has(id);

    if (alreadyLiked) {
      await supabase.from("anon_likes").delete().eq("post_id", id).eq("user_id", user.id);
      await supabase.rpc("adjust_anon_likes", { post_id: id, delta: -1 });
    } else {
      await supabase.from("anon_likes").insert({ post_id: id, user_id: user.id });
      await supabase.rpc("adjust_anon_likes", { post_id: id, delta: 1 });
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
      await supabase.from("anon_saves").delete().eq("post_id", id).eq("user_id", user.id);
    } else {
      await supabase.from("anon_saves").insert({ post_id: id, user_id: user.id });
    }

    setSavedIds((prev) => {
      const next = new Set(prev);
      if (alreadySaved) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const report = async (id: string) => {
    if (!user) return { ok: false, message: "로그인이 필요해요." };
    const { data, error } = await supabase.rpc("report_anon_post", {
      target_post_id: id,
      reporter_id: user.id,
    });
    if (error) return { ok: false, message: "신고 처리 중 문제가 발생했어요." };
    if (data === "already_reported") return { ok: false, message: "이미 신고한 글이에요." };

    setReportedIds((prev) => new Set(prev).add(id));
    await fetchAll();
    return { ok: true };
  };

  return (
    <AnonBoardContext.Provider
      value={{
        posts,
        loading,
        getById,
        addPost,
        editPost,
        removePost,
        addComment,
        removeComment,
        incrementViews,
        toggleLike,
        toggleSave,
        report,
        getRemainingCooldown,
        commentCounts,
        fetchComments,
        fetchMyComments,
        likedIds,
        savedIds,
        reportedIds,
      }}
    >
      {children}
    </AnonBoardContext.Provider>
  );
}

export function useAnonBoard() {
  const ctx = useContext(AnonBoardContext);
  if (!ctx) throw new Error("useAnonBoard는 AnonBoardProvider 안에서만 써야 해요.");
  return ctx;
}