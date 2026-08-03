// src/pages/AnonBoardForm.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader, Card, RequireRole } from "../components/Ui";
import { useAnonBoard } from "../context/AnonBoardContext";

export default function AnonBoardForm() {
  const { id } = useParams<{ id: string }>();
  const { getById, editPost } = useAnonBoard();
  const navigate = useNavigate();

  const [body, setBody] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (id) {
      const existing = getById(id);
      if (existing) {
        setBody(existing.body);
        setLoaded(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const trySubmit = () => {
    if (!body.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }
    setShowConfirm(true);
  };

  const doSubmit = async () => {
    if (!id) return;
    await editPost(id, body);
    navigate(`/anonymous/${id}`);
  };

  if (!loaded) {
    return (
      <RequireRole allow={["member", "president"]} what="익명 건의·게시판">
        <div>
          <PageHeader eyebrow="Anonymous" title="글을 찾는 중..." desc="" />
        </div>
      </RequireRole>
    );
  }

  return (
    <RequireRole allow={["member", "president"]} what="익명 건의·게시판">
      <div>
        <PageHeader eyebrow="Anonymous" title="글 수정" desc="내용을 고쳐서 다시 등록해요." />
        <Card>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="내용을 입력해주세요"
            rows={6}
            className="w-full resize-none rounded-lg border border-line bg-stage px-3 py-2 text-sm text-backstage placeholder:text-mute outline-none focus:border-dawn-teal"
          />
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => navigate(`/anonymous/${id}`)}
              className="rounded-lg border border-line px-4 py-2 text-sm text-mute"
            >
              취소
            </button>
            <button onClick={trySubmit} className="rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage">
              수정 완료
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
            <p className="font-display text-lg text-backstage">수정하시겠습니까?</p>
            <p className="mt-2 text-sm text-backstage/70">변경된 내용으로 글이 업데이트됩니다.</p>
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
                수정할게요
              </button>
            </div>
          </div>
        </div>
      )}
    </RequireRole>
  );
}