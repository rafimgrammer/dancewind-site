import { useState } from "react";
import { PageHeader, Card, EmptyState, RequireRole, Pill } from "../components/Ui";
import { useAuth } from "../context/AuthContext";
import initialPosts from "../data/anonPosts.json";

interface Post {
  id: string;
  title: string;
  date: string;
  reports: number;
  blinded: boolean;
  body: string;
}

const BLIND_THRESHOLD = 3;

export default function AnonBoard() {
  const { role } = useAuth();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [reportedIds, setReportedIds] = useState<string[]>([]);
  const isPresident = role === "president";

  const report = (id: string) => {
    if (reportedIds.includes(id)) return;
    setReportedIds((prev) => [...prev, id]);
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const reports = p.reports + 1;
        return { ...p, reports, blinded: p.blinded || reports >= BLIND_THRESHOLD };
      })
    );
  };

  return (
    <RequireRole allow={["member", "president"]} what="익명 건의·게시판">
      <div>
        <PageHeader
          eyebrow="Anonymous"
          title="춤바람 익명 건의·게시판"
          desc="이름을 밝히지 않아도 괜찮은 이야기들. 신고가 쌓이면 자동으로 블라인드돼요."
        />

        {posts.length === 0 ? (
          <EmptyState title="아직 등록된 글이 없어요" desc="불편했던 점이나 제안이 있다면 편하게 남겨주세요." />
        ) : (
          <div className="space-y-3">
            {posts.map((p) => (
              <Card key={p.id}>
                {p.blinded ? (
                  <div className="text-center py-2">
                    <p className="font-mono text-xs text-mute">신고가 누적되어 블라인드 처리되었습니다</p>
                    {isPresident && (
                      <p className="mt-2 text-sm text-backstage/60">
                        회장단 보기: <span className="text-backstage/85">{p.title}</span> — {p.body}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-backstage">{p.title}</p>
                        <p className="mt-1 font-mono text-xs text-mute">익명 · {p.date}</p>
                      </div>
                      {p.reports > 0 && <Pill tone="mute">신고 {p.reports}</Pill>}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-backstage/80">{p.body}</p>
                    <div className="mt-4 flex items-center gap-2">
                      <button
                        onClick={() => report(p.id)}
                        disabled={reportedIds.includes(p.id)}
                        className="rounded-lg border border-line px-3 py-1.5 text-xs text-mute transition-colors hover:border-red-400/50 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {reportedIds.includes(p.id) ? "신고 완료" : "신고하기"}
                      </button>
                      {isPresident && (
                        <button
                          onClick={() => setPosts((prev) => prev.filter((x) => x.id !== p.id))}
                          className="rounded-lg border border-line px-3 py-1.5 text-xs text-mute hover:border-red-400/50 hover:text-red-300"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  </>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </RequireRole>
  );
}
