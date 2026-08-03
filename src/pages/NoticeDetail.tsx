// src/pages/NoticeDetail.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader, Card, Pill, RequireRole } from "../components/Ui";
import { useAuth } from "../context/AuthContext";
import { useNotices } from "../context/NoticesContext";

type ConfirmAction = "pin" | "unpin" | "delete" | null;

export default function NoticeDetail() {
  const { id } = useParams<{ id: string }>();
  const { role } = useAuth();
  const { getById, incrementViews, removeNotice, togglePin } = useNotices();
  const navigate = useNavigate();
  const counted = useRef(false);

  const notice = id ? getById(id) : undefined;
  const isPresident = role === "president";

  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  useEffect(() => {
    if (id && !counted.current) {
      incrementViews(id);
      counted.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!notice) {
    return (
      <RequireRole allow={["member", "president"]} what="공지사항">
        <div>
          <PageHeader eyebrow="Notices" title="공지를 찾을 수 없어요" desc="삭제되었거나 존재하지 않는 글이에요." />
          <button
            onClick={() => navigate("/notices")}
            className="mt-4 rounded-lg border border-line px-4 py-2 text-sm text-mute"
          >
            목록으로 돌아가기
          </button>
        </div>
      </RequireRole>
    );
  }

  const handleDelete = async () => {
    await removeNotice(notice.id);
    navigate("/notices");
  };

  const handlePinToggle = async () => {
    await togglePin(notice.id);
  };

  const handleConfirm = async () => {
    if (confirmAction === "pin" || confirmAction === "unpin") {
      await handlePinToggle();
    } else if (confirmAction === "delete") {
      await handleDelete();
    }
    setConfirmAction(null);
  };

  const confirmCopy: Record<Exclude<ConfirmAction, null>, { title: string; desc: string; action: string }> = {
    pin: {
      title: "고정하시겠습니까?",
      desc: "한 번에 2개의 공지사항만 고정 가능합니다.",
      action: "고정할게요",
    },
    unpin: {
      title: "고정을 해제하시겠습니까?",
      desc: "목록 상단에서 내려가고, 일반 공지로 표시됩니다.",
      action: "해제할게요",
    },
    delete: {
      title: "정말로 삭제하시겠습니까?",
      desc: "삭제된 공지는 복구할 수 없습니다.",
      action: "삭제할게요",
    },
  };

  return (
    <RequireRole allow={["member", "president"]} what="공지사항">
      <div>
        <button
          onClick={() => navigate("/notices")}
          className="mb-4 text-sm text-mute hover:text-backstage"
        >
          ← 목록으로
        </button>

        <Card>
          <div className="flex items-center gap-2">
            {notice.pinned && <Pill tone="gold">고정</Pill>}
            <p className="font-display text-xl text-backstage">{notice.title}</p>
          </div>
          <p className="mt-2 font-mono text-xs text-mute">
            {notice.author} · {notice.date} · 조회 {notice.views}
          </p>
          <div
            className="prose prose-invert mt-6 max-w-none text-sm leading-relaxed text-backstage/85"
            dangerouslySetInnerHTML={{ __html: notice.body }}
          />

          {isPresident && (
            <div className="mt-8 flex justify-end gap-2">
              <button
                onClick={() => setConfirmAction(notice.pinned ? "unpin" : "pin")}
                className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                  notice.pinned
                    ? "border-wind-gold/50 text-wind-gold"
                    : "border-line text-mute hover:border-wind-gold/40 hover:text-wind-gold"
                }`}
              >
                {notice.pinned ? "고정 해제" : "고정하기"}
              </button>
              <button
                onClick={() => navigate(`/notices/${notice.id}/edit`)}
                className="rounded-lg border border-dawn-teal/40 bg-dawn-teal/10 px-3 py-1.5 text-xs text-dawn-teal"
              >
                수정
              </button>
              <button
                onClick={() => setConfirmAction("delete")}
                className="rounded-lg border border-line px-3 py-1.5 text-xs text-mute hover:border-red-400/50 hover:text-red-300"
              >
                삭제
              </button>
            </div>
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