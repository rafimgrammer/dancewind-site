// src/pages/AnonBoardDetail.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader, Card, RequireRole } from "../components/Ui";
import { useAuth } from "../context/AuthContext";
import { useAnonBoard, type AnonComment } from "../context/AnonBoardContext";
import { formatTimeAgo } from "../utils/timeAgo";

type ConfirmAction = "like" | "report" | "save" | "unsave" | "delete" | null;

export default function AnonBoardDetail() {
  const { id } = useParams<{ id: string }>();
  const { role, name, user } = useAuth();
  const {
    getById,
    removePost,
    addComment,
    removeComment,
    incrementViews,
    toggleLike,
    toggleSave,
    report,
    fetchComments,
    likedIds,
    savedIds,
    reportedIds,
  } = useAnonBoard();
  const navigate = useNavigate();
  const counted = useRef(false);

  const isPresident = role === "president";

  const [commentDraft, setCommentDraft] = useState("");
  const [commentAnon, setCommentAnon] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [replyAnon, setReplyAnon] = useState(true);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [commentsLoading, setCommentsLoading] = useState(true);

  const post = id ? getById(id) : undefined;

  useEffect(() => {
    if (id && !counted.current) {
      incrementViews(id);
      counted.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // 목록을 불러올 땐 댓글 개수만 알고 있으니까, 상세 페이지에 들어왔을 때
  // 이 글의 댓글 본문을 따로 불러와요.
  useEffect(() => {
    if (!id) return;
    setCommentsLoading(true);
    fetchComments(id).finally(() => setCommentsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!post) {
    return (
      <RequireRole allow={["member", "president"]} what="익명 건의·게시판">
        <div>
          <PageHeader eyebrow="Anonymous" title="글을 찾을 수 없어요" desc="삭제되었거나 존재하지 않는 글이에요." />
          <button
            onClick={() => navigate("/anonymous")}
            className="mt-4 rounded-lg border border-line px-4 py-2 text-sm text-mute"
          >
            목록으로 돌아가기
          </button>
        </div>
      </RequireRole>
    );
  }

  const isMine = post.authorId === user?.id;
  const isLiked = likedIds.has(post.id);
  const isSaved = savedIds.has(post.id);
  const isReported = reportedIds.has(post.id);

  const anonNumberMap = new Map<string, number>();
  let anonCounter = 0;
  post.comments.forEach((c) => {
    const isPostAuthor = c.authorId === post.authorId;
    if (c.displayName === "익명" && !isPostAuthor && !anonNumberMap.has(c.authorId)) {
      anonCounter += 1;
      anonNumberMap.set(c.authorId, anonCounter);
    }
  });

  const topLevelComments = post.comments.filter((c) => !c.parentId);
  const getReplies = (parentId: string) => post.comments.filter((c) => c.parentId === parentId);

  const handleDelete = async () => {
    await removePost(post.id);
    navigate("/anonymous");
  };

  const handleCommentSubmit = async () => {
    if (!commentDraft.trim()) return;
    await addComment(post.id, commentAnon ? "익명" : name, commentDraft, null);
    setCommentDraft("");
  };

  const handleReplySubmit = async (parentId: string) => {
    if (!replyDraft.trim()) return;
    await addComment(post.id, replyAnon ? "익명" : name, replyDraft, parentId);
    setReplyDraft("");
    setReplyingTo(null);
  };

  const handleConfirm = async () => {
    if (confirmAction === "like") {
      await toggleLike(post.id);
    } else if (confirmAction === "save" || confirmAction === "unsave") {
      await toggleSave(post.id);
    } else if (confirmAction === "report") {
      const result = await report(post.id);
      if (!result.ok) alert(result.message);
    } else if (confirmAction === "delete") {
      await handleDelete();
    }
    setConfirmAction(null);
  };

  const confirmCopy: Record<Exclude<ConfirmAction, null>, { title: string; desc: string; action: string }> = {
    like: {
      title: "좋아요를 누르시겠습니까?",
      desc: "좋아요를 누르면 취소할 수 없습니다.",
      action: "좋아요 누를게요",
    },
    save: {
      title: "저장하시겠습니까?",
      desc: "마이페이지 저장함에서 다시 볼 수 있어요.",
      action: "저장할게요",
    },
    unsave: {
      title: "저장을 취소하시겠습니까?",
      desc: "저장함에서 제거됩니다.",
      action: "취소할게요",
    },
    report: {
      title: "신고하시겠습니까?",
      desc: "신고는 철회할 수 없습니다.",
      action: "신고할게요",
    },
    delete: {
      title: "정말로 삭제하시겠습니까?",
      desc: "삭제된 글은 복구할 수 없습니다.",
      action: "삭제할게요",
    },
  };

  const renderCommentLabel = (c: AnonComment) => {
    const isPostAuthor = c.authorId === post.authorId;
    const label =
      c.displayName === "익명" && !isPostAuthor
        ? `익명 ${anonNumberMap.get(c.authorId)}`
        : c.displayName;
    const timeLabel = formatTimeAgo(new Date(c.createdAt).getTime());

    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-semibold text-backstage/90">{label}</span>
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

  const renderCommentActions = (c: AnonComment, isReply: boolean) => {
    const isCommentMine = c.authorId === user?.id;
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
    <RequireRole allow={["member", "president"]} what="익명 건의·게시판">
      <div>
        <button onClick={() => navigate("/anonymous")} className="mb-4 text-sm text-mute hover:text-backstage">
          ← 목록으로
        </button>

        <Card>
          {post.blinded ? (
            <div className="py-4 text-center">
              <p className="font-mono text-xs text-mute">신고가 누적되어 블라인드 처리되었습니다</p>
              {isPresident && (
                <p className="mt-3 text-sm text-backstage/60">
                  회장단 보기: <span className="text-backstage/85">{post.body}</span>
                </p>
              )}
            </div>
          ) : (
            <>
              <p className="font-mono text-xs text-mute">
                {post.displayName} · {formatTimeAgo(new Date(post.createdAt).getTime())}
                {post.edited && " (수정됨)"}
              </p>
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-backstage/90">{post.body}</p>

              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-mute">
                <span>조회 {post.views}</span>
                <span>좋아요 {post.likes}</span>
                <span>댓글 {post.comments.length}</span>
                {post.reports > 0 && <span className="text-red-300/80">신고 {post.reports}</span>}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
                {!isMine ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => !isLiked && setConfirmAction("like")}
                      disabled={isLiked}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                        isLiked
                          ? "cursor-not-allowed border-red-400/40 bg-red-400/10 text-red-400"
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
                    <button
                      onClick={() => setConfirmAction("report")}
                      disabled={isReported}
                      className="rounded-lg border border-line px-3 py-1.5 text-xs text-mute transition-colors hover:border-red-400/50 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {isReported ? "신고 완료" : "신고하기"}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-mute">내가 작성한 글이에요</p>
                )}
                <div className="flex gap-2">
                  {isMine && (
                    <button
                      onClick={() => navigate(`/anonymous/${post.id}/edit`)}
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

              <div className="mt-6 border-t border-line pt-6">
                {commentsLoading ? (
                  <p className="mb-3 text-xs text-mute">댓글 불러오는 중...</p>
                ) : (
                  <p className="mb-3 text-xs text-mute">댓글 {post.comments.length}</p>
                )}

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
                            <label className="flex shrink-0 items-center gap-1 text-[11px] text-mute">
                              <input
                                type="checkbox"
                                checked={replyAnon}
                                onChange={(e) => setReplyAnon(e.target.checked)}
                                className="accent-wind-gold"
                              />
                              익명
                            </label>
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
                    placeholder="댓글 남기기"
                    className="flex-1 rounded-lg border border-line bg-stage px-3 py-2 text-sm text-backstage placeholder:text-mute outline-none focus:border-dawn-teal"
                  />
                  <label className="flex shrink-0 items-center gap-1 text-[11px] text-mute">
                    <input
                      type="checkbox"
                      checked={commentAnon}
                      onChange={(e) => setCommentAnon(e.target.checked)}
                      className="accent-wind-gold"
                    />
                    익명
                  </label>
                  <button
                    onClick={handleCommentSubmit}
                    className="shrink-0 rounded-lg bg-wind-gold px-4 py-2 text-xs font-semibold text-stage"
                  >
                    등록
                  </button>
                </div>
              </div>
            </>
          )}
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
            <p className="mt-2 text-sm text-backstage/70">{confirmCopy[confirmAction].desc}</p>
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