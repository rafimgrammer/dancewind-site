// src/pages/AnonBoard.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader, Card, EmptyState, RequireRole } from "../components/Ui";
import { useAuth } from "../context/AuthContext";
import { useAnonBoard } from "../context/AnonBoardContext";
import { formatTimeAgo } from "../utils/timeAgo";

export default function AnonBoard() {
  const { name } = useAuth() as { name?: string };
  const { posts, addPost, getRemainingCooldown } = useAnonBoard();

  const myKey = name ?? "익명의 부원";

  const [draft, setDraft] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [cooldownMs, setCooldownMs] = useState(0);

  useEffect(() => {
    setCooldownMs(getRemainingCooldown(myKey));
    const timer = setInterval(() => setCooldownMs(getRemainingCooldown(myKey)), 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myKey, posts]);

  const handleSubmit = () => {
    const displayName = isAnonymous ? "익명" : myKey;
    const result = addPost(myKey, displayName, draft);
    if (!result.ok) {
      alert(result.message);
      return;
    }
    setDraft("");
  };

  const cooldownLabel =
    cooldownMs > 0 ? `${Math.ceil(cooldownMs / 60000)}분 후 다시 작성 가능` : null;

  return (
    <RequireRole allow={["member", "president"]} what="익명 건의·게시판">
      <div>
        <PageHeader
          eyebrow="Anonymous"
          title="춤바람 익명 건의·게시판"
          desc="이름을 밝히지 않아도 괜찮은 이야기들. 신고가 쌓이면 자동으로 블라인드돼요."
        />

        <Card className="mb-6">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="하고 싶은 이야기를 자유롭게 남겨주세요"
            rows={4}
            className="w-full resize-none rounded-lg border border-line bg-stage px-3 py-2 text-sm text-backstage placeholder:text-mute outline-none focus:border-dawn-teal"
          />
          <div className="mt-3 flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs text-backstage/80">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="accent-wind-gold"
              />
              익명으로 작성
            </label>
            <div className="flex items-center gap-3">
              {cooldownLabel && <span className="text-xs text-mute">{cooldownLabel}</span>}
              <button
                onClick={handleSubmit}
                disabled={cooldownMs > 0}
                className="rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage disabled:cursor-not-allowed disabled:opacity-40"
              >
                등록
              </button>
            </div>
          </div>
        </Card>

        {posts.length === 0 ? (
          <EmptyState title="아직 등록된 글이 없어요" desc="불편했던 점이나 제안이 있다면 편하게 남겨주세요." />
        ) : (
          <div className="space-y-3">
            {posts.map((p) => (
              <Link key={p.id} to={`/anonymous/${p.id}`}>
                <Card className="cursor-pointer transition-colors hover:border-dawn-teal/40">
                  {p.blinded ? (
                    <p className="py-1 text-center font-mono text-xs text-mute">
                      신고가 누적되어 블라인드 처리되었습니다
                    </p>
                  ) : (
                    <>
                      <p className="line-clamp-2 text-sm leading-relaxed text-backstage/90">{p.body}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-mute">
                        <span>{p.displayName} · {formatTimeAgo(p.createdAt)}</span>
                        <span>조회 {p.views}</span>
                        <span>좋아요 {p.likes}</span>
                        <span>댓글 {p.comments.length}</span>
                        {p.reports > 0 && <span className="text-red-300/80">신고 {p.reports}</span>}
                      </div>
                    </>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </RequireRole>
  );
}