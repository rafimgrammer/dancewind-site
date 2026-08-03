// src/pages/NoticeForm.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader, Card, RequireRole } from "../components/Ui";
import { useNotices } from "../context/NoticesContext";
import RichTextEditor from "../components/RichTextEditor";

export default function NoticeForm() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const { getById, addNotice, editNotice } = useNotices();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loaded, setLoaded] = useState(!isEditMode);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (isEditMode && id) {
      const existing = getById(id);
      if (existing) {
        setTitle(existing.title);
        setBody(existing.body);
        setLoaded(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const doSubmit = async () => {
    if (isEditMode && id) {
      await editNotice(id, title, body);
      navigate(`/notices/${id}`);
    } else {
      await addNotice(title, body);
      navigate("/notices");
    }
  };

  const trySubmit = () => {
    if (!title.trim()) return;
    setShowConfirm(true);
  };

  if (isEditMode && !loaded) {
    return (
      <RequireRole allow={["president"]} what="공지 수정">
        <div>
          <PageHeader eyebrow="Notices" title="공지를 찾는 중..." desc="" />
        </div>
      </RequireRole>
    );
  }

  return (
    <RequireRole allow={["president"]} what={isEditMode ? "공지 수정" : "공지 작성"}>
      <div>
        <PageHeader
          eyebrow="Notices"
          title={isEditMode ? "공지 수정" : "공지 작성"}
          desc="부원들에게 전할 소식을 남겨주세요."
        />
        <Card className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs text-mute">제목</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="공지 제목을 입력하세요"
              className="w-full rounded-lg border border-line bg-stage px-3 py-2 text-sm text-backstage placeholder:text-mute outline-none focus:border-dawn-teal"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-mute">내용</label>
            <RichTextEditor value={body} onChange={setBody} />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => navigate(isEditMode ? `/notices/${id}` : "/notices")}
              className="rounded-lg border border-line px-4 py-2 text-sm text-mute"
            >
              취소
            </button>
            <button
              onClick={trySubmit}
              className="rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage"
            >
              {isEditMode ? "수정 완료" : "등록"}
            </button>
          </div>
        </Card>
      </div>

      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stage/70 backdrop-blur-sm"
          onClick={() => setShowConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="mx-4 w-full max-w-sm rounded-2xl border border-line bg-afterglow p-6"
          >
            <p className="font-display text-lg text-backstage">
              {isEditMode ? "수정하시겠습니까?" : "등록하시겠습니까?"}
            </p>
            <p className="mt-2 text-sm text-backstage/70">
              {isEditMode ? "변경된 내용으로 공지가 업데이트됩니다." : "부원들에게 이 공지가 바로 공개됩니다."}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="rounded-lg border border-line px-4 py-2 text-sm text-mute"
              >
                아니요
              </button>
              <button
                onClick={async () => {
                  setShowConfirm(false);
                  await doSubmit();
                }}
                className="rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage"
              >
                {isEditMode ? "수정할게요" : "등록할게요"}
              </button>
            </div>
          </div>
        </div>
      )}
    </RequireRole>
  );
}