// src/pages/NoticeForm.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, Card, RequireRole } from "../components/Ui";
import { useNotices } from "../context/NoticesContext";
import RichTextEditor from "../components/RichTextEditor";

export default function NoticeForm() {
  const { addNotice } = useNotices();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) return;
    addNotice(title, body);
    navigate("/notices");
  };

  return (
    <RequireRole allow={["president"]} what="공지 작성">
      <div>
        <PageHeader eyebrow="Notices" title="공지 작성" desc="부원들에게 전할 소식을 남겨주세요." />
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
              onClick={() => navigate("/notices")}
              className="rounded-lg border border-line px-4 py-2 text-sm text-mute"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              className="rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage"
            >
              등록
            </button>
          </div>
        </Card>
      </div>
    </RequireRole>
  );
}