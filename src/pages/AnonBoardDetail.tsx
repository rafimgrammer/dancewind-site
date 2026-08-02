// src/pages/AnonBoardDetail.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader, Card, RequireRole } from "../components/Ui";
import { useAuth } from "../context/AuthContext";
import { useAnonBoard, type AnonComment } from "../context/AnonBoardContext";
import { formatTimeAgo } from "../utils/timeAgo";

export default function AnonBoardDetail() {
  const { id } = useParams<{ id: string }>();
  const { role, name } = useAuth() as { role: "member" | "president"; name?: string };
  const {
    getById,
    removePost,
    addComment,
    removeComment,
    incrementViews,
    toggleLike,
    report,
    likedIds,
    reportedIds,
  } = useAnonBoard();
  const navigate = useNavigate();
  const counted = useRef(false);

  const myKey = name ?? "익명의 부원";
  const isPresident = role === "president";

  const [commentDraft, setCommentDraft] = useState("");
  const [commentAnon, setCommentAnon] = useState(true);
  const [confirmAction, setConfirmAction] = useState<"like" | "report" | null>(null);

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [replyAnon, setReplyAnon] = useState(true);

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

  const isMine = post.authorKey === myKey;
  const isLiked = likedIds.has(`${post.id}:${myKey}`);
  const isReported = reportedIds.has(`${post.id}:${myKey}`);

  // 익명 댓글(답글 포함)에 등장 순서대로 번호 매기기
  const anonNumberMap = new Map<string, number>();
  let anonCounter = 0;
  post.comments.forEach((c) => {
    if (c.displayName === "익명" && !anonNumberMap.has(c.id)) {
      anonCounter += 1;
      anonNumberMap.set(c.id, anonCounter);
    }
  });

  const topLevelComments = post.comments.filter((c) => !c.parentId);
  const getReplies = (parentId: string) => post.comments.filter((c) => c.parentId === parentId);

  const handleDelete = () => {
    removePost(post.id);
    navigate("/anonymous");
  };

  const handleCommentSubmit = () => {
    if (!commentDraft.trim()) return;
    addComment(post.id, myKey, commentAnon ? "익명" : myKey, commentDraft, null);
    setCommentDraft("");
  };

  const handleReplySubmit = (parentId: string) => {
    if (!replyDraft.trim()) return;
    addComment(post.id, myKey, replyAnon ? "익명" : myKey, replyDraft, parentId);
    setReplyDraft("");
    setReplyingTo(null);
  };

  const handleConfirm = () => {
    if (confirmAction === "like") {
      toggleLike(post.id, myKey);
    } else if (confirmAction === "report") {
      const result = report(post.id, myKey);
      if (!result.ok) alert(result.message);
    }
    setConfirmAction(null);
  };

  const renderCommentLabel = (c: AnonComment) => {
    const label = c.displayName === "익명" ? `익명 ${anonNumberMap.get(c.id)}` : c.displayName;
    const isPostAuthor = c.authorKey === post.authorKey;
    return (
      <>
        {label}
        {isPostAuthor && <span className="text-wind-gold"> · 작성자</span>} · {formatTimeAgo(c.createdAt)}
      </>
    );
  };

  const renderCommentActions = (c: AnonComment) => {
    const isCommentMine = c.authorKey === myKey;
    return (
      <div className="mt-1.5 flex items-center gap-3">
        <button
          onClick={() => {
            setReplyingTo(replyingTo === c.id ? null : c.id);
            setReplyDraft("");
          }}
          className="text-[11px] text-mute hover:text-dawn-teal"
        >
          답글
        </button>
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
        <button
          onClick={() => navigate("/anonymous")}
          className="mb-4 text-sm text-mute hover:text-backstage"
        >
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
                {post.displayName} · {formatTimeAgo(post.createdAt)}
              </p>
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-backstage/90">
                {post.body}
              </p>

              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-mute">
                <span>조회 {post.views}</span>
                <span>좋아요 {post.likes}</span>
                <span>댓글 {post.comments.length}</span>
                {post.reports > 0 && <span className="text-red-300/80">신고 {post.reports}</span>}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                {!isMine ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => !isLiked && setConfirmAction("like")}
                      disabled={isLiked}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                        isLiked
                          ? "cursor-not-allowed border-wind-gold/50 bg-wind-gold/10 text-wind-gold"
                          : "border-line text-mute hover:border-wind-gold/40 hover:text-wind-gold"
                      }`}
                    >
                      {isLiked ? "♥" : "♡"} 좋아요
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
                {(isMine || isPresident) && (
                  <button
                    onClick={handleDelete}
                    className="rounded-lg border border-line px-3 py-1.5 text-xs text-mute hover:border-red-400/50 hover:text-red-300"
                  >
                    삭제
                  </button>
                )}
              </div>

              <div className="mt-6 border-t border-line pt-6">
                <p className="mb-3 text-xs text-mute">댓글 {post.comments.length}</p>

                {topLevelComments.length > 0 && (
                  <div className="mb-4 space-y-3">
                    {topLevelComments.map((c) => (
                      <div key={c.id}>
                        <div className="rounded-lg bg-stage px-3 py-2.5">
                          <p className="text-sm text-backstage/90">{c.content}</p>
                          <p className="mt-0.5 font-mono text-[11px] text-mute">
                            {renderCommentLabel(c)}
                          </p>
                          {renderCommentActions(c)}
                        </div>

                        {/* 답글 목록 */}
                        {getReplies(c.id).length > 0 && (
                          <div className="mt-2 ml-6 space-y-2 border-l border-line pl-3">
                            {getReplies(c.id).map((r) => (
                              <div key={r.id} className="rounded-lg bg-afterglow-2 px-3 py-2">
                                <p className="text-sm text-backstage/90">{r.content}</p>
                                <p className="mt-0.5 font-mono text-[11px] text-mute">
                                  {renderCommentLabel(r)}
                                </p>
                                {renderCommentActions(r)}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 답글 입력창 */}
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
            <p className="font-display text-lg text-backstage">
              {confirmAction === "like" ? "좋아요를 누르시겠습니까?" : "신고하시겠습니까?"}
            </p>
            <p className="mt-2 text-sm text-backstage/70">
              {confirmAction === "like"
                ? "좋아요를 누르면 취소할 수 없습니다."
                : "신고는 철회할 수 없습니다."}
            </p>
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
                {confirmAction === "like" ? "좋아요 누를게요" : "신고할게요"}
              </button>
            </div>
          </div>
        </div>
      )}
    </RequireRole>
  );
}