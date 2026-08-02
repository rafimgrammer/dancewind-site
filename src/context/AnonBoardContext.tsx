// src/context/AnonBoardContext.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface AnonComment {
  id: string;
  authorKey: string;
  displayName: string;
  content: string;
  createdAt: number;
  parentId: string | null;
}

export interface AnonPost {
  id: string;
  authorKey: string;
  displayName: string;
  body: string;
  createdAt: number;
  views: number;
  likes: number;
  reports: number;
  blinded: boolean;
  comments: AnonComment[];
}

const BLIND_THRESHOLD = 3;
const COOLDOWN_MS = 5 * 60 * 1000;

const STORAGE_KEY = "chumbaram_anon_posts_v3";
const COOLDOWN_KEY = "chumbaram_anon_last_post";
const LIKED_KEY = "chumbaram_anon_liked";
const REPORTED_KEY = "chumbaram_anon_reported";

interface AnonBoardContextType {
  posts: AnonPost[];
  getById: (id: string) => AnonPost | undefined;
  addPost: (authorKey: string, displayName: string, body: string) => { ok: boolean; message?: string };
  removePost: (id: string) => void;
  addComment: (
    postId: string,
    authorKey: string,
    displayName: string,
    content: string,
    parentId: string | null
  ) => void;
  removeComment: (postId: string, commentId: string) => void;
  incrementViews: (id: string) => void;
  toggleLike: (id: string, userKey: string) => void;
  report: (id: string, userKey: string) => { ok: boolean; message?: string };
  getRemainingCooldown: (authorKey: string) => number;
  likedIds: Set<string>;
  reportedIds: Set<string>;
}

const AnonBoardContext = createContext<AnonBoardContextType | null>(null);

function loadSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function AnonBoardProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<AnonPost[]>([]);
  const [lastPostTimes, setLastPostTimes] = useState<Record<string, number>>({});
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPosts(JSON.parse(raw));
      const rawCooldown = localStorage.getItem(COOLDOWN_KEY);
      if (rawCooldown) setLastPostTimes(JSON.parse(rawCooldown));
    } catch {
      // 저장된 값 없으면 무시
    }
    setLikedIds(loadSet(LIKED_KEY));
    setReportedIds(loadSet(REPORTED_KEY));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    } catch {
      // 저장 실패해도 화면은 정상 동작
    }
  }, [posts]);

  useEffect(() => {
    try {
      localStorage.setItem(COOLDOWN_KEY, JSON.stringify(lastPostTimes));
    } catch {
      // 저장 실패해도 화면은 정상 동작
    }
  }, [lastPostTimes]);

  useEffect(() => {
    localStorage.setItem(LIKED_KEY, JSON.stringify(Array.from(likedIds)));
  }, [likedIds]);

  useEffect(() => {
    localStorage.setItem(REPORTED_KEY, JSON.stringify(Array.from(reportedIds)));
  }, [reportedIds]);

  const getById = (id: string) => posts.find((p) => p.id === id);

  const getRemainingCooldown = (authorKey: string) => {
    const last = lastPostTimes[authorKey];
    if (!last) return 0;
    const remaining = COOLDOWN_MS - (Date.now() - last);
    return remaining > 0 ? remaining : 0;
  };

  const addPost = (authorKey: string, displayName: string, body: string) => {
    if (!body.trim()) return { ok: false, message: "내용을 입력해주세요." };

    const remaining = getRemainingCooldown(authorKey);
    if (remaining > 0) {
      const minutes = Math.ceil(remaining / 60000);
      return { ok: false, message: `글 작성은 5분에 한 번만 가능해요. 약 ${minutes}분 후 다시 시도해주세요.` };
    }

    const post: AnonPost = {
      id: `ap${Date.now()}`,
      authorKey,
      displayName,
      body: body.trim(),
      createdAt: Date.now(),
      views: 0,
      likes: 0,
      reports: 0,
      blinded: false,
      comments: [],
    };

    setPosts((prev) => [post, ...prev]);
    setLastPostTimes((prev) => ({ ...prev, [authorKey]: Date.now() }));
    return { ok: true };
  };

  const removePost = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const addComment = (
    postId: string,
    authorKey: string,
    displayName: string,
    content: string,
    parentId: string | null
  ) => {
    if (!content.trim()) return;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: [
                ...p.comments,
                {
                  id: `ac${Date.now()}`,
                  authorKey,
                  displayName,
                  content: content.trim(),
                  createdAt: Date.now(),
                  parentId,
                },
              ],
            }
          : p
      )
    );
  };

  const removeComment = (postId: string, commentId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              // 댓글 삭제 시, 그 댓글에 달린 답글들도 함께 삭제
              comments: p.comments.filter((c) => c.id !== commentId && c.parentId !== commentId),
            }
          : p
      )
    );
  };

  const incrementViews = (id: string) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, views: p.views + 1 } : p)));
  };

  const toggleLike = (id: string, userKey: string) => {
    const likeKey = `${id}:${userKey}`;
    setLikedIds((prev) => {
      const next = new Set(prev);
      const already = next.has(likeKey);
      if (already) next.delete(likeKey);
      else next.add(likeKey);

      setPosts((prevPosts) =>
        prevPosts.map((p) => (p.id === id ? { ...p, likes: p.likes + (already ? -1 : 1) } : p))
      );

      return next;
    });
  };

  const report = (id: string, userKey: string) => {
    const reportKey = `${id}:${userKey}`;
    if (reportedIds.has(reportKey)) {
      return { ok: false, message: "이미 신고한 글이에요." };
    }
    setReportedIds((prev) => new Set(prev).add(reportKey));
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const reports = p.reports + 1;
        return { ...p, reports, blinded: p.blinded || reports >= BLIND_THRESHOLD };
      })
    );
    return { ok: true };
  };

  return (
    <AnonBoardContext.Provider
      value={{
        posts,
        getById,
        addPost,
        removePost,
        addComment,
        removeComment,
        incrementViews,
        toggleLike,
        report,
        getRemainingCooldown,
        likedIds,
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