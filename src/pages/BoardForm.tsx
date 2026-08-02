// src/pages/BoardForm.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, Card, RequireRole } from "../components/Ui";
import { useAuth } from "../context/AuthContext";
import { useBoard } from "../context/BoardContext";
import RichTextEditor from "../components/RichTextEditor";

export default function BoardForm() {
  const { name } = useAuth() as { name?: string };
  const { addPost } = useBoard();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) return;
    addPost(title, body, name ?? "익명의 부원");
    navigate("/board");
  };

  return (
    <RequireRole allow={["member", "president"]} what="자유게시판 글쓰기">
      <div>
        <PageHeader eyebrow="Board" title="글쓰기" desc="동방 잡담부터 팀티 투표까지, 자유롭게." />
        <Card className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs text-mute">제목</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              className="w-full rounded-lg border border-line bg-stage px-3 py-2 text-sm text-backstage placeholder:text-mute outline-none focus:border-dawn-teal"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-mute">내용</label>
            <RichTextEditor value={body} onChange={setBody} />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => navigate("/board")}
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