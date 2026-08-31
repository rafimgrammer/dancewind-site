// src/pages/AnonBoard.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader, Card, EmptyState, RequireRole } from "../components/Ui";
import { useAuth } from "../context/AuthContext";
import { useAnonBoard } from "../context/AnonBoardContext";
import { formatTimeAgo } from "../utils/timeAgo";
import { CardSkeletonGrid } from "../components/Skeleton";

const PAGE_SIZE = 6;
const ACCENTS = ["bg-dawn-teal", "bg-wind-gold"];

function AnonAvatarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" strokeLinecap="round" />
    </svg>
  );
}

export default function AnonBoard() {
  const { name, role } = useAuth();
  const { posts, addPost, getRemainingCooldown, loading, commentCounts } = useAnonBoard();

  const [titleDraft, setTitleDraft] = useState("");
  const [draft, setDraft] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [cooldownMs, setCooldownMs] = useState(0);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setCooldownMs(getRemainingCooldown());
    const timer = setInterval(() => setCooldownMs(getRemainingCooldown()), 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts]);

  const handleSubmit = async () => {
    const displayName = isAnonymous ? "익명" : name;
    const result = await addPost(displayName, titleDraft, draft);
    if (!result.ok) {
      alert(result.message);
      return;
    }
    setTitleDraft("");
    setDraft("");
  };

  const handleSearch = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const cooldownLabel =
    cooldownMs > 0 ? `${Math.ceil(cooldownMs / 60000)}분 후 다시 작성 가능` : null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter((p) => p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q));
  }, [posts, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <RequireRole allow={["member", "president"]} what="익명 건의·게시판">
      <div>
        <PageHeader
          eyebrow="Anonymous"
          title="춤바람 익명 건의·게시판"
          desc="이름을 밝히지 않아도 괜찮은 이야기들. 신고가 10회 누적되면 자동으로 블라인드돼요."
        />

        <Card className="mb-6">
          <input
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            placeholder="제목을 입력해주세요"
            className="mb-2 w-full rounded-lg border border-line bg-stage px-3 py-2 text-sm font-medium text-backstage placeholder:text-mute outline-none focus:border-dawn-teal"
          />
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

        <div className="mb-6">
          <input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="내용으로 검색"
            className="w-full rounded-lg border border-line bg-stage px-3 py-2 text-sm text-backstage placeholder:text-mute outline-none focus:border-dawn-teal"
          />
        </div>

        {loading ? (
          <CardSkeletonGrid count={6} />
        ) : paged.length === 0 ? (
          <EmptyState
            title={query ? "검색 결과가 없어요" : "아직 등록된 글이 없어요"}
            desc={query ? "다른 검색어로 다시 시도해보세요." : "불편했던 점이나 제안이 있다면 편하게 남겨주세요."}
          />
        ) : (
          <>
            <div className="space-y-3">
              {paged.map((p, i) => {
                const isToday = new Date(p.createdAt).toDateString() === new Date().toDateString();
                const accent = ACCENTS[i % ACCENTS.length];

                return (
                  <Link key={p.id} to={`/anonymous/${p.id}`}>
                    <Card className="relative cursor-pointer overflow-hidden pl-5 transition-colors hover:border-dawn-teal/40">
                      <span className={`absolute left-0 top-0 h-full w-1 ${accent}`} />

                      {p.blinded ? (
                        <p className="py-1 text-center font-mono text-xs text-mute">
                          신고가 누적되어 블라인드 처리되었습니다
                        </p>
                      ) : (
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-afterglow-2 text-backstage/60">
                            <AnonAvatarIcon />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <p className="min-w-0 truncate text-[15px] font-bold text-backstage">{p.title}</p>
                              {isToday && (
                                <span className="shrink-0 rounded-full bg-wind-gold px-1.5 py-0.5 font-mono text-[9px] font-bold text-stage">
                                  NEW
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 truncate text-sm text-backstage/65">{p.body}</p>

                            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-mute">
                              <span>{p.displayName}</span>
                              <span>·</span>
                              <span>
                                {formatTimeAgo(new Date(p.createdAt).getTime())}
                                {p.edited && " (수정됨)"}
                              </span>
                              <span className="flex items-center gap-1">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                                {p.views}
                              </span>
                              {p.likes > 0 && (
                                <span className="flex items-center gap-1 text-red-400/80">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 21s-7-6.2-9.5-10.2C1 8 1.8 4.5 5 3.5c2-.6 3.8.2 5 2 1.2-1.8 3-2.6 5-2 3.2 1 4 4.5 2.5 7.3C19 14.8 12 21 12 21z" />
                                  </svg>
                                  {p.likes}
                                </span>
                              )}
                              <span className="flex items-center gap-1 text-sky-300">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                                </svg>
                                {commentCounts[p.id] ?? 0}
                              </span>
                              {role === "president" && p.reports > 0 && (
                                <span className="text-red-300/80">신고 {p.reports}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>
                  </Link>
                );
              })}
            </div>

            <div className="mt-6 flex items-center justify-center gap-1">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="rounded-lg border border-line px-3 py-1.5 text-sm text-mute disabled:opacity-30"
              >
                ←
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`h-8 w-8 rounded-lg text-sm ${
                    p === page ? "bg-wind-gold font-semibold text-stage" : "text-mute hover:text-backstage"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-line px-3 py-1.5 text-sm text-mute disabled:opacity-30"
              >
                →
              </button>
            </div>
          </>
        )}
      </div>
    </RequireRole>
  );
}