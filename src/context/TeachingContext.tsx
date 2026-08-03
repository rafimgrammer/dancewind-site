// src/context/TeachingContext.tsx
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

export interface Comment {
  id: string;
  authorId: string;
  author: string;
  content: string;
  date: string;
  parentId: string | null;
}

export interface TeachingClass {
  id: string;
  category: string;
  title: string;
  description: string;
  teacherId: string;
  teacher: string;
  youtubeUrl: string;
  songTitle: string;
  songStart: string;
  songEnd: string;
  classDate: string;
  classTime: string;
  maxSpots: number | null;
  confirmed: boolean;
  edited: boolean;
  applicants: string[];
  comments: Comment[];
  createdAt: string;
}

interface TeachingContextType {
  classes: TeachingClass[];
  loading: boolean;
  getById: (id: string) => TeachingClass | undefined;
  addClass: (data: {
    category: string;
    title: string;
    description: string;
    youtubeUrl: string;
    songTitle: string;
    songStart: string;
    songEnd: string;
    classDate: string;
    classTime: string;
    maxSpots: number | null;
  }) => Promise<void>;
  editClass: (
    id: string,
    data: {
      title: string;
      description: string;
      youtubeUrl: string;
      songTitle: string;
      songStart: string;
      songEnd: string;
      classDate: string;
      classTime: string;
    }
  ) => Promise<void>;
  removeClass: (id: string) => Promise<void>;
  confirmClass: (id: string) => Promise<void>;
  unconfirmClass: (id: string) => Promise<void>;
  toggleApply: (id: string) => Promise<void>;
  toggleSave: (id: string) => Promise<void>;
  addComment: (id: string, content: string, parentId: string | null) => Promise<void>;
  editComment: (classId: string, commentId: string, content: string) => Promise<void>;
  removeComment: (classId: string, commentId: string) => Promise<void>;
  isApplied: (id: string) => boolean;
  savedIds: Set<string>;
}

const TeachingContext = createContext<TeachingContextType | null>(null);

export function TeachingProvider({ children }: { children: ReactNode }) {
  const { user, name } = useAuth();
  const [classes, setClasses] = useState<TeachingClass[]>([]);
  const [myApplications, setMyApplications] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setClasses([]);
      setMyApplications(new Set());
      setSavedIds(new Set());
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data: classData } = await supabase
      .from("teaching_classes")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: applicantData } = await supabase.from("teaching_applicants").select("*");
    const { data: commentData } = await supabase
      .from("teaching_comments")
      .select("*")
      .order("created_at", { ascending: true });

    const { data: saveData } = await supabase
      .from("teaching_saves")
      .select("class_id")
      .eq("user_id", user.id);

    const applicantsByClass: Record<string, string[]> = {};
    (applicantData ?? []).forEach((a) => {
      if (!applicantsByClass[a.class_id]) applicantsByClass[a.class_id] = [];
      applicantsByClass[a.class_id].push(a.user_name);
    });

    const commentsByClass: Record<string, Comment[]> = {};
    (commentData ?? []).forEach((c) => {
      if (!commentsByClass[c.class_id]) commentsByClass[c.class_id] = [];
      commentsByClass[c.class_id].push({
        id: c.id,
        authorId: c.author_id,
        author: c.author_name,
        content: c.content,
        date: c.created_at?.slice(0, 10) ?? "",
        parentId: c.parent_id,
      });
    });

    setClasses(
      (classData ?? []).map((c) => ({
        id: c.id,
        category: c.category,
        title: c.title,
        description: c.description,
        teacherId: c.teacher_id,
        teacher: c.teacher_name,
        youtubeUrl: c.youtube_url,
        songTitle: c.song_title,
        songStart: c.song_start,
        songEnd: c.song_end,
        classDate: c.class_date,
        classTime: c.class_time,
        maxSpots: c.max_spots,
        confirmed: c.confirmed,
        edited: c.edited,
        applicants: applicantsByClass[c.id] ?? [],
        comments: commentsByClass[c.id] ?? [],
        createdAt: c.created_at?.slice(0, 10) ?? "",
      }))
    );

    const myApps = new Set(
      (applicantData ?? []).filter((a) => a.user_id === user.id).map((a) => a.class_id)
    );
    setMyApplications(myApps);
    setSavedIds(new Set((saveData ?? []).map((s) => s.class_id)));

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const getById = (id: string) => classes.find((c) => c.id === id);
  const isApplied = (id: string) => myApplications.has(id);

  const addClass: TeachingContextType["addClass"] = async (data) => {
    if (!user) return;
    const { data: created } = await supabase
      .from("teaching_classes")
      .insert({
        category: data.category,
        title: data.title,
        description: data.description,
        teacher_id: user.id,
        teacher_name: name,
        youtube_url: data.youtubeUrl,
        song_title: data.songTitle,
        song_start: data.songStart,
        song_end: data.songEnd,
        class_date: data.classDate,
        class_time: data.classTime,
        max_spots: data.maxSpots,
      })
      .select("id")
      .single();

    if (created) {
      await supabase.from("teaching_applicants").insert({
        class_id: created.id,
        user_id: user.id,
        user_name: name,
      });
    }
    await fetchAll();
  };

  const editClass: TeachingContextType["editClass"] = async (id, data) => {
    await supabase
      .from("teaching_classes")
      .update({
        title: data.title,
        description: data.description,
        youtube_url: data.youtubeUrl,
        song_title: data.songTitle,
        song_start: data.songStart,
        song_end: data.songEnd,
        class_date: data.classDate,
        class_time: data.classTime,
        edited: true,
      })
      .eq("id", id);
    await fetchAll();
  };

  const removeClass = async (id: string) => {
    await supabase.from("teaching_classes").delete().eq("id", id);
    await fetchAll();
  };

  const confirmClass = async (id: string) => {
    await supabase.from("teaching_classes").update({ confirmed: true }).eq("id", id);
    await fetchAll();
  };

  const unconfirmClass = async (id: string) => {
    await supabase.from("teaching_classes").update({ confirmed: false }).eq("id", id);
    await fetchAll();
  };

  const toggleApply = async (id: string) => {
    if (!user) return;
    const target = classes.find((c) => c.id === id);
    if (!target || target.confirmed) return;

    if (target.teacherId === user.id) {
      alert("클래스를 개설한 사람은 신청을 취소할 수 없어요.");
      return;
    }

    const applied = myApplications.has(id);

    if (applied) {
      await supabase.from("teaching_applicants").delete().eq("class_id", id).eq("user_id", user.id);
    } else {
      if (target.maxSpots !== null && target.applicants.length >= target.maxSpots) {
        alert("정원이 마감된 클래스예요.");
        return;
      }
      await supabase.from("teaching_applicants").insert({ class_id: id, user_id: user.id, user_name: name });
    }
    await fetchAll();
  };

  const toggleSave = async (id: string) => {
    if (!user) return;
    const alreadySaved = savedIds.has(id);

    if (alreadySaved) {
      await supabase.from("teaching_saves").delete().eq("class_id", id).eq("user_id", user.id);
    } else {
      await supabase.from("teaching_saves").insert({ class_id: id, user_id: user.id });
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
    await supabase.from("teaching_comments").insert({
      class_id: id,
      author_id: user.id,
      author_name: name,
      content: content.trim(),
      parent_id: parentId,
    });
    await fetchAll();
  };

  const editComment = async (_classId: string, commentId: string, content: string) => {
    if (!content.trim()) return;
    await supabase.from("teaching_comments").update({ content: content.trim() }).eq("id", commentId);
    await fetchAll();
  };

  const removeComment = async (_classId: string, commentId: string) => {
    await supabase.from("teaching_comments").delete().eq("id", commentId);
    await fetchAll();
  };

  return (
    <TeachingContext.Provider
      value={{
        classes,
        loading,
        getById,
        addClass,
        editClass,
        removeClass,
        confirmClass,
        unconfirmClass,
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
    </TeachingContext.Provider>
  );
}

export function useTeaching() {
  const ctx = useContext(TeachingContext);
  if (!ctx) throw new Error("useTeaching은 TeachingProvider 안에서만 써야 해요.");
  return ctx;
}