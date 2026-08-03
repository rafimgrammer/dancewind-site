// src/pages/ReelsDetail.tsx
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader, Card, Pill, RequireRole } from "../components/Ui";
import { useAuth } from "../context/AuthContext";
import { useReels, type ReelsComment } from "../context/ReelsContext";
import { getYoutubeId } from "../utils/youtube";
import InstagramEmbed from "../components/InstagramEmbed";

type ConfirmAction =
  | "apply"
  | "cancel"
  | "deletePost"
  | "deleteComment"
  | "confirm"
  | "unconfirm"
  | null;

export default function ReelsDetail() {
  const { id } = useParams<{ id: string }>();
  const { role, user } = useAuth();
  const {
    getById,
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
  } = useReels();
  const navigate = useNavigate();

  const [commentDraft, setCommentDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [pendingCommentId, setPendingCommentId] = useState<string | null>(null);

  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [showScheduleConfirm, setShowScheduleConfirm] = useState(false);

  const item = id ? getById(id) : undefined;
  const isPresident = role === "president";
  const isCreator = item ? item.creatorId === user?.id : false;

  const applied = item ? isApplied(item.id) : false;
  const isSaved = item ? savedIds.has(item.id) : false;
  const isFull = item ? item.maxSpots !== null && item.applicants.length >= item.maxSpots : false;
  const canConfirm = item ? isCreator && !item.confirmed && isFull : false;
  const canUnconfirm = item ? isCreator && item.confirmed : false;

  const topLevelComments = useMemo(() => {
    if (!item) return [];
    return [...item.comments].filter((c) => !c.parentId).reverse();
  }, [item]);

  const getReplies = (parentId: string) => (item ? item.comments.filter((c) => c.parentId === parentId) : []);

  if (!item) {
    return (
      <RequireRole allow={["member", "president"]} what="같이 릴스찍자">
        <div>
          <PageHeader eyebrow="Reels" title="릴스를 찾을 수 없어요" desc="삭제되었거나 존재하지 않는 게시물이에요." />
          <button onClick={() => navigate("/reels")} className="mt-4 rounded-lg border border-line px-4 py-2 text-sm text-mute">
            목록으로 돌아가기
          </button>
        </div>
      </RequireRole>
    );
  }

  const videoId = getYoutubeId(item.youtubeUrl);

  const handleCommentSubmit = async () => {
    if (!commentDraft.trim()) return;
    await addComment(item.id, commentDraft, null);
    setCommentDraft("");
  };

  const handleReplySubmit = async (parentId: string) => {
    if (!replyDraft.trim()) return;
    await addComment(item.id, replyDraft, parentId);
    setReplyDraft("");
    setReplyingTo(null);
  };

  const startEdit = (commentId: string, currentContent: string) => {
    setEditingId(commentId);
    setEditDraft(currentContent);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft("");
  };

  const submitEdit = async (commentId: string) => {
    if (!editDraft.trim()) return;
    await editComment(item.id, commentId, editDraft);
    setEditingId(null);
    setEditDraft("");
  };

  const openApplyConfirm = () => setConfirmAction(applied ? "cancel" : "apply");
  const openDeleteCommentConfirm = (commentId: string) => {
    setPendingCommentId(commentId);
    setConfirmAction("deleteComment");
  };

  const handleConfirm = async () => {
    if (confirmAction === "apply" || confirmAction === "cancel") {
      await toggleApply(item.id);
    } else if (confirmAction === "deletePost") {
      await removePost(item.id);
      navigate("/reels");
    } else if (confirmAction === "deleteComment" && pendingCommentId) {
      await removeComment(item.id, pendingCommentId);
    } else if (confirmAction === "confirm") {
      await confirmPost(item.id);
    } else if (confirmAction === "unconfirm") {
      await unconfirmPost(item.id);
    }
    setConfirmAction(null);
    setPendingCommentId(null);
  };

  const confirmCopy: Record<Exclude<ConfirmAction, null>, { title: string; desc: string; action: string }> = {
    apply: {
      title: "이 릴스에 신청하시겠습니까?",
      desc: `${item.shootDate ?? "날짜 미정"} ${item.shootTime ?? ""} · 정원 ${item.applicants.length}${
        item.maxSpots === null ? "명 (인원무관)" : `/${item.maxSpots}`
      }`,
      action: "신청할게요",
    },
    cancel: {
      title: "신청을 취소하시겠습니까?",
      desc: `${item.shootDate ?? "날짜 미정"} ${item.shootTime ?? ""}`,
      action: "취소할게요",
    },
    deletePost: { title: "정말로 삭제하시겠습니까?", desc: "삭제된 게시물은 복구할 수 없습니다.", action: "삭제할게요" },
    deleteComment: { title: "댓글을 삭제하시겠습니까?", desc: "삭제된 댓글은 복구할 수 없습니다.", action: "삭제할게요" },
    confirm: { title: "확정하시겠습니까?", desc: "확정 후에는 신청/취소가 불가능해집니다.", action: "확정할게요" },
    unconfirm: { title: "확정을 취소하시겠습니까?", desc: "다시 모집중 상태가 됩니다.", action: "확정 취소할게요" },
  };

  const renderComment = (c: ReelsComment, isReply: boolean) => {
    const isEditing = editingId === c.id;
    const isMine = c.authorId === user?.id;

    return (
      <div key={c.id} className={`rounded-lg border border-line px-3 py-2.5 ${isReply ? "bg-afterglow-2" : "bg-stage"}`}>
        {isEditing ? (
          <div className="flex gap-2">
            <input
              value={editDraft}
              onChange={(e) => setEditDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitEdit(c.id)}
              autoFocus
              className="flex-1 rounded-lg border border-dawn-teal/50 bg-stage px-2.5 py-1.5 text-sm text-backstage outline-none"
            />
            <button onClick={() => submitEdit(c.id)} className="shrink-0 rounded-lg bg-wind-gold px-3 py-1.5 text-xs font-semibold text-stage">
              저장
            </button>
            <button onClick={cancelEdit} className="shrink-0 rounded-lg border border-line px-3 py-1.5 text-xs text-mute">
              취소
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-backstage/90">{c.content}</p>
            <p className="mt-1 font-mono text-[11px] text-mute">
              {c.author} · {c.date}
            </p>
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
              {isMine && (
                <button onClick={() => startEdit(c.id, c.content)} className="text-[11px] text-mute hover:text-dawn-teal">
                  수정
                </button>
              )}
              {(isMine || isPresident) && (
                <button onClick={() => openDeleteCommentConfirm(c.id)} className="text-[11px] text-mute hover:text-red-300">
                  삭제
                </button>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <RequireRole allow={["member", "president"]} what="같이 릴스찍자">
      <div>
        <button onClick={() => navigate("/reels")} className="mb-4 text-sm text-mute hover:text-backstage">
          ← 목록으로
        </button>

        <Card>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">{item.confirmed && <Pill tone="gold">확정</Pill>}</div>
            {isPresident && (
              <button
                onClick={() => setConfirmAction("deletePost")}
                className="rounded-lg border border-line px-3 py-1.5 text-xs text-mute hover:border-red-400/50 hover:text-red-300"
              >
                삭제
              </button>
            )}
          </div>

          <p className="mt-2 font-display text-xl text-backstage">{item.title}</p>
          <p className="mt-1 font-mono text-xs text-mute">
            {item.creator} · 등록일 {item.createdAt}
          </p>

          {item.description && (
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-backstage/85">{item.description}</p>
          )}

          {videoId && (
            <div className="mt-5 aspect-video overflow-hidden rounded-lg">
              <iframe className="h-full w-full" src={`https://www.youtube.com/embed/${videoId}`} title={item.title} allowFullScreen />
            </div>
          )}

          {item.instagramUrl && (
            <div className="mt-5 flex justify-center">
              <InstagramEmbed url={item.instagramUrl} />
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-line bg-stage p-4 text-sm sm:grid-cols-4">
            <div>
              <p className="text-xs text-mute">날짜</p>
              <p className="mt-1 text-backstage">{item.shootDate ?? "미정"}</p>
            </div>
            <div>
              <p className="text-xs text-mute">시간</p>
              <p className="mt-1 text-backstage">{item.shootTime ?? "미정"}</p>
            </div>
            <div>
              <p className="text-xs text-mute">장소</p>
              <p className="mt-1 text-backstage">{item.location || "미정"}</p>
            </div>
            <div>
              <p className="text-xs text-mute">정원</p>
              <p className="mt-1 font-mono text-backstage">
                {item.applicants.length}
                {item.maxSpots === null ? "명 (인원무관)" : ` / ${item.maxSpots}`}
              </p>
            </div>
          </div>

          {!item.shootDate && !item.confirmed && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-wind-gold/30 bg-wind-gold/5 px-4 py-3">
              <p className="text-xs text-wind-gold">💬 날짜/시간이 아직 미정이에요. 댓글로 의견을 나눠보세요!</p>
              {isCreator && (
                <button
                  onClick={() => {
                    setScheduleDate("");
                    setScheduleTime("");
                    setShowScheduleForm(true);
                  }}
                  className="shrink-0 rounded-lg bg-wind-gold px-3 py-1.5 text-xs font-semibold text-stage"
                >
                  날짜/시간 결정
                </button>
              )}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
            <div className="flex flex-wrap items-center gap-2">
              {item.confirmed ? (
                <span className="rounded-lg border border-dawn-teal/40 bg-dawn-teal/10 px-4 py-2 text-sm font-semibold text-dawn-teal">
                  ✓ 확정된 릴스예요
                </span>
              ) : isCreator ? (
                <span className="rounded-lg border border-wind-gold/40 bg-wind-gold/10 px-4 py-2 text-sm font-semibold text-wind-gold">
                  👑 내가 개설한 릴스 (자동 참여중)
                </span>
              ) : (
                <button
                  onClick={openApplyConfirm}
                  disabled={!applied && isFull}
                  className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                    applied
                      ? "border-dawn-teal/50 bg-dawn-teal/10 text-dawn-teal"
                      : isFull
                      ? "cursor-not-allowed border-line text-mute opacity-50"
                      : "border-wind-gold/50 bg-wind-gold/10 text-wind-gold hover:bg-wind-gold/20"
                  }`}
                >
                  {applied ? "신청 취소" : isFull ? "정원 마감" : "신청하기"}
                </button>
              )}
              <button
                onClick={() => toggleSave(item.id)}
                className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                  isSaved
                    ? "border-dawn-teal/50 bg-dawn-teal/10 text-dawn-teal"
                    : "border-line text-mute hover:border-dawn-teal/40 hover:text-dawn-teal"
                }`}
              >
                {isSaved ? "저장됨" : "저장"}
              </button>
            </div>

            <div className="flex gap-2">
              {canConfirm && (
                <button onClick={() => setConfirmAction("confirm")} className="rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage">
                  릴스 확정
                </button>
              )}
              {canUnconfirm && (
                <button
                  onClick={() => setConfirmAction("unconfirm")}
                  className="rounded-lg border border-line px-4 py-2 text-sm text-mute hover:border-red-400/50 hover:text-red-300"
                >
                  확정 취소하기
                </button>
              )}
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-2 text-xs text-mute">참여자 명단 ({item.applicants.length}명)</p>
            {item.applicants.length === 0 ? (
              <p className="text-sm text-mute">아직 참여자가 없어요.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {item.applicants.map((a, idx) => (
                  <span key={`${a}-${idx}`} className="rounded-full border border-line bg-stage px-3 py-1 text-xs text-backstage">
                    {a}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 border-t border-line pt-6">
            <p className="mb-3 text-xs text-mute">댓글 ({item.comments.length})</p>

            <div className="mb-4 flex gap-2">
              <input
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCommentSubmit()}
                placeholder="댓글을 남겨보세요"
                className="flex-1 rounded-lg border border-line bg-stage px-3 py-2 text-sm text-backstage placeholder:text-mute outline-none focus:border-dawn-teal"
              />
              <button onClick={handleCommentSubmit} className="rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage">
                등록
              </button>
            </div>

            {topLevelComments.length === 0 ? (
              <p className="text-sm text-mute">아직 댓글이 없어요.</p>
            ) : (
              <div className="space-y-3">
                {topLevelComments.map((c) => (
                  <div key={c.id}>
                    {renderComment(c, false)}
                    {getReplies(c.id).length > 0 && (
                      <div className="mt-2 ml-6 space-y-2 border-l border-line pl-3">
                        {getReplies(c.id).map((r) => renderComment(r, true))}
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
          </div>
        </Card>
      </div>

      {confirmAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stage/70 backdrop-blur-sm"
          onClick={() => {
            setConfirmAction(null);
            setPendingCommentId(null);
          }}
        >
          <div onClick={(e) => e.stopPropagation()} className="mx-4 w-full max-w-sm rounded-2xl border border-line bg-afterglow p-6">
            <p className="font-display text-lg text-backstage">{confirmCopy[confirmAction].title}</p>
            <p className="mt-2 font-mono text-sm text-backstage/70">{confirmCopy[confirmAction].desc}</p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setConfirmAction(null);
                  setPendingCommentId(null);
                }}
                className="rounded-lg border border-line px-4 py-2 text-sm text-mute"
              >
                아니요
              </button>
              <button onClick={handleConfirm} className="rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage">
                {confirmCopy[confirmAction].action}
              </button>
            </div>
          </div>
        </div>
      )}

      {showScheduleForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stage/70 backdrop-blur-sm" onClick={() => setShowScheduleForm(false)}>
          <div onClick={(e) => e.stopPropagation()} className="mx-4 w-full max-w-sm rounded-2xl border border-line bg-afterglow p-6">
            <p className="font-display text-lg text-backstage">날짜/시간 결정</p>
            <p className="mt-1 text-sm text-backstage/70">댓글로 합의된 날짜와 시간을 입력해주세요.</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1.5 block text-xs text-mute">촬영 날짜</label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full rounded-lg border border-line bg-stage px-3 py-2 text-sm text-backstage outline-none focus:border-dawn-teal"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-mute">촬영 시간</label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full rounded-lg border border-line bg-stage px-3 py-2 text-sm text-backstage outline-none focus:border-dawn-teal"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowScheduleForm(false)} className="rounded-lg border border-line px-4 py-2 text-sm text-mute">
                취소
              </button>
              <button
                onClick={() => {
                  if (!scheduleDate || !scheduleTime) {
                    alert("날짜와 시간을 모두 입력해주세요.");
                    return;
                  }
                  setShowScheduleForm(false);
                  setShowScheduleConfirm(true);
                }}
                className="rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage"
              >
                다음
              </button>
            </div>
          </div>
        </div>
      )}

      {showScheduleConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stage/70 backdrop-blur-sm" onClick={() => setShowScheduleConfirm(false)}>
          <div onClick={(e) => e.stopPropagation()} className="mx-4 w-full max-w-sm rounded-2xl border border-line bg-afterglow p-6">
            <p className="font-display text-lg text-backstage">이 날짜/시간으로 결정하시겠습니까?</p>
            <p className="mt-2 font-mono text-sm text-backstage/70">
              {scheduleDate} {scheduleTime}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowScheduleConfirm(false)} className="rounded-lg border border-line px-4 py-2 text-sm text-mute">
                아니요
              </button>
              <button
                onClick={async () => {
                  await decideSchedule(item.id, scheduleDate, scheduleTime);
                  setShowScheduleConfirm(false);
                }}
                className="rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage"
              >
                결정할게요
              </button>
            </div>
          </div>
        </div>
      )}
    </RequireRole>
  );
}