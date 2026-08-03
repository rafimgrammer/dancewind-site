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
  applicants: string[];
  comments: ReelsComment[];
  createdAt: string;
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
  removePost: (id: string) => Promise<void>;
  confirmPost: (id: string) => Promise<void>;
  unconfirmPost: (id: string) => Promise<void>;
  decideSchedule: (id: string, date: string, time: string) => Promise<void>;
  toggleApply: (id: string) => Promise<void>;
  toggleSave: (id: string) => Promise<void>;
  addComment: (id: string, content: string, parentId: string | null) => Promise<void>;
  editComment: (postId: string, commentId: string, content: string) => Promise<void>;
  removeComment: (postId: string, commentId: string) => Promise<void>;
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

    const { data: applicantData } = await supabase.from("reels_applicants").select("*");
    const { data: commentData } = await supabase
      .from("reels_comments")
      .select("*")
      .order("created_at", { ascending: true });

    const { data: saveData } = await supabase
      .from("reels_saves")
      .select("post_id")
      .eq("user_id", user.id);

    const applicantsByPost: Record<string, string[]> = {};
    (applicantData ?? []).forEach((a) => {
      if (!applicantsByPost[a.post_id]) applicantsByPost[a.post_id] = [];
      applicantsByPost[a.post_id].push(a.user_name);
    });

    const commentsByPost: Record<string, ReelsComment[]> = {};
    (commentData ?? []).forEach((c) => {
      if (!commentsByPost[c.post_id]) commentsByPost[c.post_id] = [];
      commentsByPost[c.post_id].push({
        id: c.id,
        authorId: c.author_id,
        author: c.author_name,
        content: c.content,
        date: c.created_at?.slice(0, 10) ?? "",
        parentId: c.parent_id,
      });
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
        applicants: applicantsByPost[p.id] ?? [],
        comments: commentsByPost[p.id] ?? [],
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
    await fetchAll();
  };

  const editComment = async (_postId: string, commentId: string, content: string) => {
    if (!content.trim()) return;
    await supabase.from("reels_comments").update({ content: content.trim() }).eq("id", commentId);
    await fetchAll();
  };

  const removeComment = async (_postId: string, commentId: string) => {
    await supabase.from("reels_comments").delete().eq("id", commentId);
    await fetchAll();
  };

  return (
    <ReelsContext.Provider
      value={{
        posts,
        loading,
        getById,
        addPost,
        removePost,
        confirmPost,
        unconfirmPost,
        decideSchedule,
        toggleApply,
        toggleSave,
        addComment,
        editComment,
        removeComment,
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