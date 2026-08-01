// src/pages/NoticeDetail.tsx
import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader, Card, Pill, RequireRole } from "../components/Ui";
import { useAuth } from "../context/AuthContext";
import { useNotices } from "../context/NoticesContext";

export default function NoticeDetail() {
  const { id } = useParams<{ id: string }>();
  const { role } = useAuth();
  const { getById, incrementViews, removeNotice } = useNotices();
  const navigate = useNavigate();
  const counted = useRef(false);

  const notice = id ? getById(id) : undefined;
  const isPresident = role === "president";

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

  const handleDelete = () => {
    removeNotice(notice.id);
    navigate("/notices");
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
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleDelete}
                className="rounded-lg border border-line px-3 py-1.5 text-xs text-mute hover:border-red-400/50 hover:text-red-300"
              >
                삭제
              </button>
            </div>
          )}
        </Card>
      </div>
    </RequireRole>
  );
}