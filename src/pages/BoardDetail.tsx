// src/pages/BoardDetail.tsx
import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader, Card, RequireRole } from "../components/Ui";
import { useAuth } from "../context/AuthContext";
import { useBoard } from "../context/BoardContext";

export default function BoardDetail() {
  const { id } = useParams<{ id: string }>();
  const { role } = useAuth();
  const { getById, incrementViews, removePost, toggleLike, toggleSave, likedIds, savedIds } =
    useBoard();
  const navigate = useNavigate();
  const counted = useRef(false);

  const post = id ? getById(id) : undefined;
  const isPresident = role === "president";
  const isLiked = id ? likedIds.has(id) : false;
  const isSaved = id ? savedIds.has(id) : false;

  useEffect(() => {
    if (id && !counted.current) {
      incrementViews(id);
      counted.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!post) {
    return (
      <RequireRole allow={["member", "president"]} what="자유게시판">
        <div>
          <PageHeader eyebrow="Board" title="글을 찾을 수 없어요" desc="삭제되었거나 존재하지 않는 글이에요." />
          <button
            onClick={() => navigate("/board")}
            className="mt-4 rounded-lg border border-line px-4 py-2 text-sm text-mute"
          >
            목록으로 돌아가기
          </button>
        </div>
      </RequireRole>
    );
  }

  const handleDelete = () => {
    removePost(post.id);
    navigate("/board");
  };

  return (
    <RequireRole allow={["member", "president"]} what="자유게시판">
      <div>
        <button
          onClick={() => navigate("/board")}
          className="mb-4 text-sm text-mute hover:text-backstage"
        >
          ← 목록으로
        </button>

        <Card>
          <p className="font-display text-xl text-backstage">{post.title}</p>
          <p className="mt-2 font-mono text-xs text-mute">
            {post.author} · {post.date} · 조회 {post.views}
          </p>

          <div
            className="prose prose-invert mt-6 max-w-none text-sm leading-relaxed text-backstage/85"
            dangerouslySetInnerHTML={{ __html: post.body }}
          />

          <div className="mt-8 flex items-center justify-between border-t border-line pt-4">
            <div className="flex gap-2">
              <button
                onClick={() => toggleLike(post.id)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                  isLiked
                    ? "border-wind-gold/50 bg-wind-gold/10 text-wind-gold"
                    : "border-line text-mute hover:border-wind-gold/40 hover:text-wind-gold"
                }`}
              >
                {isLiked ? "♥" : "♡"} 좋아요 {post.likes}
              </button>
              <button
                onClick={() => toggleSave(post.id)}
                className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                  isSaved
                    ? "border-dawn-teal/50 bg-dawn-teal/10 text-dawn-teal"
                    : "border-line text-mute hover:border-dawn-teal/40 hover:text-dawn-teal"
                }`}
              >
                {isSaved ? "저장됨" : "저장"}
              </button>
            </div>

            {isPresident && (
              <button
                onClick={handleDelete}
                className="rounded-lg border border-line px-3 py-1.5 text-xs text-mute hover:border-red-400/50 hover:text-red-300"
              >
                삭제
              </button>
            )}
          </div>
        </Card>
      </div>
    </RequireRole>
  );
}