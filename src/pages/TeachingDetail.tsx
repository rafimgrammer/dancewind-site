// src/pages/TeachingDetail.tsx
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader, Card, Pill, RequireRole } from "../components/Ui";
import { useAuth } from "../context/AuthContext";
import { useTeaching } from "../context/TeachingContext";
import { getYoutubeId } from "../utils/youtube";

export default function TeachingDetail() {
    const { id } = useParams<{ id: string }>();
    const { role, name } = useAuth() as { role: string; name?: string };
    const { getById, removeClass, toggleApply, addComment, editComment, removeComment } =
        useTeaching();
    const navigate = useNavigate();
    const [commentDraft, setCommentDraft] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editDraft, setEditDraft] = useState("");
    const [confirmAction, setConfirmAction] = useState<"apply" | "cancel" | null>(null);

    const item = id ? getById(id) : undefined;
    const isPresident = role === "president";
    const myName = name ?? "익명의 부원";
    const isApplied = item ? item.applicants.includes(myName) : false;
    const isFull = item ? item.maxSpots !== null && item.applicants.length >= item.maxSpots : false;

    const sortedComments = useMemo(() => {
        if (!item) return [];
        return [...item.comments].reverse();
    }, [item]);

    if (!item) {
        return (
            <RequireRole allow={["member", "president"]} what="티칭 클래스">
                <div>
                    <PageHeader eyebrow="Teaching" title="클래스를 찾을 수 없어요" desc="삭제되었거나 존재하지 않는 클래스예요." />
                    <button
                        onClick={() => navigate("/classes")}
                        className="mt-4 rounded-lg border border-line px-4 py-2 text-sm text-mute"
                    >
                        목록으로 돌아가기
                    </button>
                </div>
            </RequireRole>
        );
    }

    const videoId = getYoutubeId(item.youtubeUrl);

    const handleDelete = () => {
        removeClass(item.id);
        navigate("/classes");
    };

    const handleCommentSubmit = () => {
        if (!commentDraft.trim()) return;
        addComment(item.id, myName, commentDraft);
        setCommentDraft("");
    };

    const startEdit = (commentId: string, currentContent: string) => {
        setEditingId(commentId);
        setEditDraft(currentContent);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditDraft("");
    };

    const submitEdit = (commentId: string) => {
        if (!editDraft.trim()) return;
        editComment(item.id, commentId, editDraft);
        setEditingId(null);
        setEditDraft("");
    };

    const openConfirm = () => {
        setConfirmAction(isApplied ? "cancel" : "apply");
    };

    const handleConfirm = () => {
        toggleApply(item.id, myName);
        setConfirmAction(null);
    };

    return (
        <RequireRole allow={["member", "president"]} what="티칭 클래스">
            <div>
                <button
                    onClick={() => navigate("/classes")}
                    className="mb-4 text-sm text-mute hover:text-backstage"
                >
                    ← 목록으로
                </button>

                <Card>
                    <div className="flex items-start justify-between">
                        <Pill tone="teal">{item.category}</Pill>
                        {isPresident && (
                            <button
                                onClick={handleDelete}
                                className="rounded-lg border border-line px-3 py-1.5 text-xs text-mute hover:border-red-400/50 hover:text-red-300"
                            >
                                삭제
                            </button>
                        )}
                    </div>

                    <p className="mt-2 font-display text-xl text-backstage">{item.title}</p>
                    <p className="mt-1 font-mono text-xs text-mute">
                        {item.teacher} · 등록일 {item.createdAt}
                    </p>

                    {item.description && (
                        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-backstage/85">
                            {item.description}
                        </p>
                    )}

                    {videoId && (
                        <div className="mt-5 aspect-video overflow-hidden rounded-lg">
                            <iframe
                                className="h-full w-full"
                                src={`https://www.youtube.com/embed/${videoId}`}
                                title={item.songTitle || item.title}
                                allowFullScreen
                            />
                        </div>
                    )}

                    {item.songTitle && (
                        <p className="mt-3 text-sm text-dawn-teal">🎵 {item.songTitle}</p>
                    )}

                    <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-line bg-stage p-4 text-sm sm:grid-cols-4">
                        <div>
                            <p className="text-xs text-mute">구간</p>
                            <p className="mt-1 font-mono text-backstage">
                                {item.songStart} ~ {item.songEnd}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-mute">날짜</p>
                            <p className="mt-1 text-backstage">{item.classDate}</p>
                        </div>
                        <div>
                            <p className="text-xs text-mute">시간</p>
                            <p className="mt-1 text-backstage">{item.classTime}</p>
                        </div>
                        <div>
                            <p className="text-xs text-mute">정원</p>
                            <p className="mt-1 font-mono text-backstage">
                                {item.applicants.length}
                                {item.maxSpots === null ? "명 (인원무관)" : ` / ${item.maxSpots}`}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
                        <button
                            onClick={openConfirm}
                            disabled={!isApplied && isFull}
                            className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${isApplied
                                    ? "border-dawn-teal/50 bg-dawn-teal/10 text-dawn-teal"
                                    : isFull
                                        ? "cursor-not-allowed border-line text-mute opacity-50"
                                        : "border-wind-gold/50 bg-wind-gold/10 text-wind-gold hover:bg-wind-gold/20"
                                }`}
                        >
                            {isApplied ? "신청 취소" : isFull ? "정원 마감" : "신청하기"}
                        </button>
                    </div>

                    <div className="mt-6">
                        <p className="mb-2 text-xs text-mute">신청자 명단 ({item.applicants.length}명)</p>
                        {item.applicants.length === 0 ? (
                            <p className="text-sm text-mute">아직 신청자가 없어요.</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {item.applicants.map((applicant) => (
                                    <span
                                        key={applicant}
                                        className="rounded-full border border-line bg-stage px-3 py-1 text-xs text-backstage"
                                    >
                                        {applicant}
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
                            <button
                                onClick={handleCommentSubmit}
                                className="rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage"
                            >
                                등록
                            </button>
                        </div>

                        {sortedComments.length === 0 ? (
                            <p className="text-sm text-mute">아직 댓글이 없어요.</p>
                        ) : (
                            <div className="space-y-3">
                                {sortedComments.map((c) => {
                                    const isEditing = editingId === c.id;
                                    const isMine = c.author === myName;

                                    return (
                                        <div
                                            key={c.id}
                                            className="rounded-lg border border-line bg-stage px-3 py-2.5"
                                        >
                                            {isEditing ? (
                                                <div className="flex gap-2">
                                                    <input
                                                        value={editDraft}
                                                        onChange={(e) => setEditDraft(e.target.value)}
                                                        onKeyDown={(e) => e.key === "Enter" && submitEdit(c.id)}
                                                        autoFocus
                                                        className="flex-1 rounded-lg border border-dawn-teal/50 bg-stage px-2.5 py-1.5 text-sm text-backstage outline-none"
                                                    />
                                                    <button
                                                        onClick={() => submitEdit(c.id)}
                                                        className="shrink-0 rounded-lg bg-wind-gold px-3 py-1.5 text-xs font-semibold text-stage"
                                                    >
                                                        저장
                                                    </button>
                                                    <button
                                                        onClick={cancelEdit}
                                                        className="shrink-0 rounded-lg border border-line px-3 py-1.5 text-xs text-mute"
                                                    >
                                                        취소
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-sm text-backstage/90">{c.content}</p>
                                                        <p className="mt-1 font-mono text-[11px] text-mute">
                                                            {c.author} · {c.date}
                                                        </p>
                                                    </div>
                                                    <div className="flex shrink-0 gap-2">
                                                        {isMine && (
                                                            <button
                                                                onClick={() => startEdit(c.id, c.content)}
                                                                className="text-[11px] text-mute hover:text-dawn-teal"
                                                            >
                                                                수정
                                                            </button>
                                                        )}
                                                        {(isPresident || isMine) && (
                                                            <button
                                                                onClick={() => removeComment(item.id, c.id)}
                                                                className="text-[11px] text-mute hover:text-red-300"
                                                            >
                                                                삭제
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
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
                        <p className="font-display text-lg text-backstage">
                            {confirmAction === "apply" ? "클래스를 신청하시겠습니까?" : "신청을 취소하시겠습니까?"}
                        </p>
                        <p className="mt-2 font-mono text-sm text-backstage/70">
                            {item.classDate} {item.classTime} · 정원 {item.applicants.length}
                            {item.maxSpots === null ? "명 (인원무관)" : `/${item.maxSpots}`}
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
                                {confirmAction === "apply" ? "신청할게요" : "취소할게요"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </RequireRole>
    );
}