import { useState } from "react";
import { PageHeader, EmptyState, RequireRole } from "../components/Ui";
import { useAuth } from "../context/AuthContext";
import initialPosts from "../data/boardPosts.json";

interface Post {
  id: string;
  title: string;
  author: string;
  date: string;
  comments: number;
}

export default function Board() {
  const { role } = useAuth();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [draft, setDraft] = useState("");
  const isPresident = role === "president";

  const addPost = () => {
    if (!draft.trim()) return;
    setPosts((prev) => [
      { id: `b${Date.now()}`, title: draft.trim(), author: "나", date: new Date().toISOString().slice(0, 10), comments: 0 },
      ...prev,
    ]);
    setDraft("");
  };

  return (
    <RequireRole allow={["member", "president"]} what="자유게시판">
      <div>
        <PageHeader eyebrow="Board" title="자유게시판" desc="동방 잡담부터 팀티 투표까지, 자유롭게." />

        <div className="mb-6 flex flex-col gap-2 rounded-2xl border border-line bg-afterglow p-4 sm:flex-row">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="무슨 얘기든 좋아요"
            className="flex-1 rounded-lg border border-line bg-stage px-3 py-2 text-sm text-backstage placeholder:text-mute focus:border-dawn-teal outline-none"
          />
          <button onClick={addPost} className="rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage">
            등록
          </button>
        </div>

        {posts.length === 0 ? (
          <EmptyState title="아직 아무도 글을 남기지 않았어요" desc="첫 스텝을 밟아보세요!" />
        ) : (
          <div className="divide-y divide-line rounded-2xl border border-line bg-afterglow">
            {posts.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-backstage">{p.title}</p>
                  <p className="mt-1 font-mono text-xs text-mute">
                    {p.author} · {p.date}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-dawn-teal">댓글 {p.comments}</span>
                  {isPresident && (
                    <button
                      onClick={() => setPosts((prev) => prev.filter((x) => x.id !== p.id))}
                      className="rounded-lg border border-line px-2.5 py-1 text-[11px] text-mute hover:border-red-400/50 hover:text-red-300"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </RequireRole>
  );
}
