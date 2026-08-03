// src/pages/BoardDetail.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader, Card, RequireRole } from "../components/Ui";
import { useAuth } from "../context/AuthContext";
import { useBoard, type BoardComment } from "../context/BoardContext";

type ConfirmAction = "like" | "unlike" | "save" | "unsave" | "delete" | null;

export default function BoardDetail() {
  const { id } = useParams<{ id: string }>();
  const { role, name } = useAuth();
  const {
    getById,
    removePost,
    incrementViews,
    toggleLike,
    toggleSave,
    addComment,
    removeComment,
    likedIds,
    savedIds,
  } = useBoard();
  const navigate = useNavigate();
  const counted = useRef(false);

  const isPresident = role === "president";
  const myName = name;

  const [commentDraft, setCommentDraft] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const post = id ? getById(id) : undefined;

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

  const isMine = post.author === myName;
  const isLiked = likedIds.has(post.id);
  const isSaved = savedIds.has(post.id);

  const topLevelComments = post.comments.filter((c) => !c.parentId);
  const getReplies = (parentId: string) => post.comments.filter((c) => c.parentId === parentId);

  const handleDelete = async () => {
    await removePost(post.id);
    navigate("/board");
  };

  const handleCommentSubmit = async () => {
    if (!commentDraft.trim()) return;
    await addComment(post.id, commentDraft, null);
    setCommentDraft("");
  };

  const handleReplySubmit = async (parentId: string) => {
    if (!replyDraft.trim()) return;
    await addComment(post.id, replyDraft, parentId);
    setReplyDraft("");
    setReplyingTo(null);
  };

  const handleConfirm = async () => {
    if (confirmAction === "like" || confirmAction === "unlike") {
      await toggleLike(post.id);
    } else if (confirmAction === "save" || confirmAction === "unsave") {
      await toggleSave(post.id);
    } else if (confirmAction === "delete") {
      await handleDelete();
    }
    setConfirmAction(null);
  };

  const confirmCopy: Record<Exclude<ConfirmAction, null>, { title: string; desc: string; action: string }> = {
    like: { title: "좋아요를 누르시겠습니까?", desc: "좋아요를 언제든 취소할 수 있습니다.", action: "좋아요 누를게요" },
    unlike: { title: "좋아요를 취소하시겠습니까?", desc: "", action: "취소할게요" },
    save: { title: "저장하시겠습니까?", desc: "마이페이지 저장함에서 다시 볼 수 있어요.", action: "저장할게요" },
    unsave: { title: "저장을 취소하시겠습니까?", desc: "저장함에서 제거됩니다.", action: "취소할게요" },
    delete: { title: "정말로 삭제하시겠습니까?", desc: "삭제된 글은 복구할 수 없습니다.", action: "삭제할게요" },
  };

  const renderCommentLabel = (c: BoardComment) => {
    const isPostAuthor = c.authorName === post.author;
    const timeLabel = new Date(c.createdAt).toLocaleString("ko-KR", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-semibold text-backstage/90">{c.authorName}</span>
        {isPostAuthor && (
          <span className="rounded-full bg-wind-gold/15 px-1.5 py-0.5 text-[10px] font-medium text-wind-gold">
            작성자
          </span>
        )}
        <span className="text-mute">·</span>
        <span className="font-mono text-[11px] text-mute">{timeLabel}</span>
      </div>
    );
  };

  const renderCommentActions = (c: BoardComment, isReply: boolean) => {
    const isCommentMine = c.authorName === myName;
    return (
      <div className="mt-1.5 flex items-center gap-3">
        {!isReply && (
          <button
            onClick={() => {
              setReplyingTo(replyingTo === c.id ? null : c.id);
              setReplyDraft("");
            }}
            className="text-[11px] text-mute hover:text-dawn-teal"
          >
            답글
          </button>
        )}
        {(isCommentMine || isPresident) && (
          <button
            onClick={() => removeComment(post.id, c.id)}
            className="text-[11px] text-mute hover:text-red-300"
          >
            삭제
          </button>
        )}
      </div>
    );
  };

  return (
    <RequireRole allow={["member", "president"]} what="자유게시판">
      <div>
        <button onClick={() => navigate("/board")} className="mb-4 text-sm text-mute hover:text-backstage">
          ← 목록으로
        </button>

        <Card>
          <div className="flex items-center gap-2">
            <p className="font-display text-xl text-backstage">{post.title}</p>
            {post.edited && <span className="font-mono text-[11px] text-mute">(수정됨)</span>}
          </div>
          <p className="mt-2 font-mono text-xs text-mute">
            {post.author} · {post.date} · 조회 {post.views}
          </p>

          <div
            className="prose prose-invert mt-6 max-w-none text-sm leading-relaxed text-backstage/90"
            dangerouslySetInnerHTML={{ __html: post.body }}
          />

          <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmAction(isLiked ? "unlike" : "like")}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                  isLiked
                    ? "border-red-400/40 bg-red-400/10 text-red-400"
                    : "border-line text-mute hover:border-red-400/30 hover:text-red-300"
                }`}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill={isLiked ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`transition-transform ${isLiked ? "scale-110" : "scale-100"}`}
                >
                  <path
                    d="M12 21s-7-6.2-9.5-10.2C1 8 1.8 4.5 5 3.5c2-.6 3.8.2 5 2 1.2-1.8 3-2.6 5-2 3.2 1 4 4.5 2.5 7.3C19 14.8 12 21 12 21z"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>{post.likes}</span>
              </button>
              <button
                onClick={() => setConfirmAction(isSaved ? "unsave" : "save")}
                className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                  isSaved
                    ? "border-dawn-teal/50 bg-dawn-teal/10 text-dawn-teal"
                    : "border-line text-mute hover:border-dawn-teal/40 hover:text-dawn-teal"
                }`}
              >
                {isSaved ? "저장됨" : "저장"}
              </button>
            </div>

            <div className="flex gap-2">
              {isMine && (
                <button
                  onClick={() => navigate(`/board/${post.id}/edit`)}
                  className="rounded-lg border border-dawn-teal/40 bg-dawn-teal/10 px-3 py-1.5 text-xs text-dawn-teal"
                >
                  수정
                </button>
              )}
              {(isMine || isPresident) && (
                <button
                  onClick={() => setConfirmAction("delete")}
                  className="rounded-lg border border-line px-3 py-1.5 text-xs text-mute hover:border-red-400/50 hover:text-red-300"
                >
                  삭제
                </button>
              )}
            </div>
          </div>

          {/* 댓글 */}
          <div className="mt-8 border-t border-line pt-6">
            <p className="mb-3 text-xs text-mute">댓글 {post.comments.length}</p>

            {topLevelComments.length > 0 && (
              <div className="mb-4 space-y-3">
                {topLevelComments.map((c) => (
                  <div key={c.id}>
                    <div className="rounded-lg bg-stage px-3 py-2.5">
                      <p className="text-sm text-backstage/90">{c.content}</p>
                      <div className="mt-1.5">{renderCommentLabel(c)}</div>
                      {renderCommentActions(c, false)}
                    </div>

                    {getReplies(c.id).length > 0 && (
                      <div className="mt-2 ml-6 space-y-2 border-l border-line pl-3">
                        {getReplies(c.id).map((r) => (
                          <div key={r.id} className="rounded-lg bg-afterglow-2 px-3 py-2">
                            <p className="text-sm text-backstage/90">{r.content}</p>
                            <div className="mt-1.5">{renderCommentLabel(r)}</div>
                            {renderCommentActions(r, true)}
                          </div>
                        ))}
                      </div>
                    )}

                    {replyingTo === c.id && (
                      <div className="mt-2 ml-6 flex items-center gap-2 pl-3">
                        <input
                          value={replyDraft}
                          onChange={(e) => setReplyDraft(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleReplySubmit(c.id)}
                          placeholder="답글 남기기"
                          autoFocus
                          className="flex-1 rounded-lg border border-line bg-stage px-3 py-1.5 text-sm text-backstage placeholder:text-mute outline-none focus:border-dawn-teal"
                        />
                        <button
                          onClick={() => handleReplySubmit(c.id)}
                          className="shrink-0 rounded-lg bg-wind-gold px-3 py-1.5 text-xs font-semibold text-stage"
                        >
                          등록
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCommentSubmit()}
                placeholder="댓글을 남겨보세요"
                className="flex-1 rounded-lg border border-line bg-stage px-3 py-2 text-sm text-backstage placeholder:text-mute outline-none focus:border-dawn-teal"
              />
              <button
                onClick={handleCommentSubmit}
                className="rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage"
              >
                등록
              </button>
            </div>
          </div>
        </Card>
      </div>

      {confirmAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stage/70 backdrop-blur-sm"
          onClick={() => setConfirmAction(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="mx-4 w-full max-w-sm rounded-2xl border border-line bg-afterglow p-6"
          >
            <p className="font-display text-lg text-backstage">{confirmCopy[confirmAction].title}</p>
            {confirmCopy[confirmAction].desc && (
              <p className="mt-2 text-sm text-backstage/70">{confirmCopy[confirmAction].desc}</p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="rounded-lg border border-line px-4 py-2 text-sm text-mute"
              >
                아니요
              </button>
              <button
                onClick={handleConfirm}
                className="rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage"
              >
                {confirmCopy[confirmAction].action}
              </button>
            </div>
          </div>
        </div>
      )}
    </RequireRole>
  );
}