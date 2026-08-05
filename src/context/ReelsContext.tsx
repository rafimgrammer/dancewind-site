// src/context/ReelsContext.tsx
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

export interface ReelsComment {
  id: string;
  authorId: string;
  author: string;
  content: string;
  date: string;
  parentId: string | null;
}

export interface ReelsPost {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  creator: string;
  youtubeUrl: string;
  instagramUrl: string;
  shootDate: string | null;
  shootTime: string | null;
  location: string;
  maxSpots: number | null;
  confirmed: boolean;
  edited: boolean;
  applicants: string[];
  comments: ReelsComment[];
  createdAt: string;
}

export interface MyReelsComment {
  postId: string;
  postTitle: string;
  content: string;
  date: string;
}

interface ReelsContextType {
  posts: ReelsPost[];
  loading: boolean;
  getById: (id: string) => ReelsPost | undefined;
  addPost: (data: {
    title: string;
    description: string;
    youtubeUrl: string;
    instagramUrl: string;
    shootDate: string | null;
    shootTime: string | null;
    location: string;
    maxSpots: number | null;
  }) => Promise<void>;
  editPost: (
    id: string,
    data: { title: string; description: string; youtubeUrl: string; instagramUrl: string; location: string }
  ) => Promise<void>;
  removePost: (id: string) => Promise<void>;
  confirmPost: (id: string) => Promise<void>;
  unconfirmPost: (id: string) => Promise<void>;
  decideSchedule: (id: string, date: string, time: string) => Promise<void>;
  toggleApply: (id: string) => Promise<void>;
  toggleSave: (id: string) => Promise<void>;
  addComment: (id: string, content: string, parentId: string | null) => Promise<void>;
  editComment: (postId: string, commentId: string, content: string) => Promise<void>;
  removeComment: (postId: string, commentId: string) => Promise<void>;
  // 목록을 불러올 땐 댓글까지 통째로 가져오지 않아요.
  // 상세 페이지에 들어갔을 때만 그 릴스의 댓글을 따로 불러와요.
  fetchComments: (postId: string) => Promise<void>;
  // 마이페이지의 "댓글 쓴 글" 탭 전용
  fetchMyComments: () => Promise<MyReelsComment[]>;
  isApplied: (id: string) => boolean;
  savedIds: Set<string>;
}

const ReelsContext = createContext<ReelsContextType | null>(null);

export function ReelsProvider({ children }: { children: ReactNode }) {
  const { user, name } = useAuth();
  const [posts, setPosts] = useState<ReelsPost[]>([]);
  const [myApplications, setMyApplications] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setPosts([]);
      setMyApplications(new Set());
      setSavedIds(new Set());
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data: postData } = await supabase
      .from("reels_posts")
      .select("*")
      .order("created_at", { ascending: false });

    // 신청자 명단은 목록/정원 표시에 바로 필요해서 그대로 가져오고,
    // 댓글은 여기서 같이 안 가져와요(상세 페이지에서만 필요하니까요).
    const { data: applicantData } = await supabase.from("reels_applicants").select("*");

    const { data: saveData } = await supabase
      .from("reels_saves")
      .select("post_id")
      .eq("user_id", user.id);

    const applicantsByPost: Record<string, string[]> = {};
    (applicantData ?? []).forEach((a) => {
      if (!applicantsByPost[a.post_id]) applicantsByPost[a.post_id] = [];
      applicantsByPost[a.post_id].push(a.user_name);
    });

    setPosts(
      (postData ?? []).map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        creatorId: p.creator_id,
        creator: p.creator_name,
        youtubeUrl: p.youtube_url,
        instagramUrl: p.instagram_url,
        shootDate: p.shoot_date,
        shootTime: p.shoot_time,
        location: p.location,
        maxSpots: p.max_spots,
        confirmed: p.confirmed,
        edited: p.edited,
        applicants: applicantsByPost[p.id] ?? [],
        comments: [],
        createdAt: p.created_at?.slice(0, 10) ?? "",
      }))
    );

    const myApps = new Set(
      (applicantData ?? []).filter((a) => a.user_id === user.id).map((a) => a.post_id)
    );
    setMyApplications(myApps);
    setSavedIds(new Set((saveData ?? []).map((s) => s.post_id)));

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const getById = (id: string) => posts.find((p) => p.id === id);
  const isApplied = (id: string) => myApplications.has(id);

  const fetchComments = async (postId: string) => {
    const { data: commentData } = await supabase
      .from("reels_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    const comments: ReelsComment[] = (commentData ?? []).map((c) => ({
      id: c.id,
      authorId: c.author_id,
      author: c.author_name,
      content: c.content,
      date: c.created_at?.slice(0, 10) ?? "",
      parentId: c.parent_id,
    }));

    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comments } : p)));
  };

  const fetchMyComments = async (): Promise<MyReelsComment[]> => {
    if (!user) return [];

    const { data: myComments } = await supabase
      .from("reels_comments")
      .select("*")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false });

    if (!myComments || myComments.length === 0) return [];

    const postIds = [...new Set(myComments.map((c) => c.post_id))];
    const { data: relatedPosts } = await supabase.from("reels_posts").select("id, title").in("id", postIds);
    const titleMap = new Map((relatedPosts ?? []).map((p) => [p.id, p.title as string]));

    return myComments.map((c) => ({
      postId: c.post_id,
      postTitle: titleMap.get(c.post_id) ?? "삭제된 게시물",
      content: c.content,
      date: c.created_at?.slice(0, 10) ?? "",
    }));
  };

  const addPost: ReelsContextType["addPost"] = async (data) => {
    if (!user) return;
    const { data: created } = await supabase
      .from("reels_posts")
      .insert({
        title: data.title,
        description: data.description,
        creator_id: user.id,
        creator_name: name,
        youtube_url: data.youtubeUrl,
        instagram_url: data.instagramUrl,
        shoot_date: data.shootDate,
        shoot_time: data.shootTime,
        location: data.location,
        max_spots: data.maxSpots,
      })
      .select("id")
      .single();

    if (created) {
      await supabase.from("reels_applicants").insert({
        post_id: created.id,
        user_id: user.id,
        user_name: name,
      });
    }
    await fetchAll();
  };

  const editPost: ReelsContextType["editPost"] = async (id, data) => {
    await supabase
      .from("reels_posts")
      .update({
        title: data.title,
        description: data.description,
        youtube_url: data.youtubeUrl,
        instagram_url: data.instagramUrl,
        location: data.location,
        edited: true,
      })
      .eq("id", id);
    await fetchAll();
  };

  const removePost = async (id: string) => {
    await supabase.from("reels_posts").delete().eq("id", id);
    await fetchAll();
  };

  const confirmPost = async (id: string) => {
    await supabase.from("reels_posts").update({ confirmed: true }).eq("id", id);
    await fetchAll();
  };

  const unconfirmPost = async (id: string) => {
    await supabase.from("reels_posts").update({ confirmed: false }).eq("id", id);
    await fetchAll();
  };

  const decideSchedule = async (id: string, date: string, time: string) => {
    await supabase.from("reels_posts").update({ shoot_date: date, shoot_time: time }).eq("id", id);
    await fetchAll();
  };

  const toggleApply = async (id: string) => {
    if (!user) return;
    const target = posts.find((p) => p.id === id);
    if (!target || target.confirmed) return;

    if (target.creatorId === user.id) {
      alert("릴스를 개설한 사람은 신청을 취소할 수 없어요.");
      return;
    }

    const applied = myApplications.has(id);

    if (applied) {
      await supabase.from("reels_applicants").delete().eq("post_id", id).eq("user_id", user.id);
    } else {
      if (target.maxSpots !== null && target.applicants.length >= target.maxSpots) {
        alert("정원이 마감됐어요.");
        return;
      }
      await supabase.from("reels_applicants").insert({ post_id: id, user_id: user.id, user_name: name });
    }
    await fetchAll();
  };

  const toggleSave = async (id: string) => {
    if (!user) return;
    const alreadySaved = savedIds.has(id);

    if (alreadySaved) {
      await supabase.from("reels_saves").delete().eq("post_id", id).eq("user_id", user.id);
    } else {
      await supabase.from("reels_saves").insert({ post_id: id, user_id: user.id });
    }

    setSavedIds((prev) => {
      const next = new Set(prev);
      if (alreadySaved) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addComment = async (id: string, content: string, parentId: string | null) => {
    if (!content.trim() || !user) return;
    await supabase.from("reels_comments").insert({
      post_id: id,
      author_id: user.id,
      author_name: name,
      content: content.trim(),
      parent_id: parentId,
    });
    await fetchComments(id);
  };

  const editComment = async (postId: string, commentId: string, content: string) => {
    if (!content.trim()) return;
    await supabase.from("reels_comments").update({ content: content.trim() }).eq("id", commentId);
    await fetchComments(postId);
  };

  const removeComment = async (postId: string, commentId: string) => {
    await supabase.from("reels_comments").delete().eq("id", commentId);
    await fetchComments(postId);
  };

  return (
    <ReelsContext.Provider
      value={{
        posts,
        loading,
        getById,
        addPost,
        editPost,
        removePost,
        confirmPost,
        unconfirmPost,
        decideSchedule,
        toggleApply,
        toggleSave,
        addComment,
        editComment,
        removeComment,
        fetchComments,
        fetchMyComments,
        isApplied,
        savedIds,
      }}
    >
      {children}
    </ReelsContext.Provider>
  );
}

export function useReels() {
  const ctx = useContext(ReelsContext);
  if (!ctx) throw new Error("useReels는 ReelsProvider 안에서만 써야 해요.");
  return ctx;
}