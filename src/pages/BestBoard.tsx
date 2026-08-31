// src/pages/BestBoard.tsx
import { Link } from "react-router-dom";
import { PageHeader, Card, EmptyState, RequireRole, Pill } from "../components/Ui";
import { useBoard } from "../context/BoardContext";
import { useAnonBoard } from "../context/AnonBoardContext";
import { CardSkeletonGrid } from "../components/Skeleton";
import { stripHtml } from "../utils/text";
import { formatTimeAgo } from "../utils/timeAgo";

const LIKE_THRESHOLD = 10;

interface BestItem {
  id: string;
  source: "자유게시판" | "익명게시판";
  title: string;
  preview: string;
  author: string;
  dateLabel: string;
  likes: number;
  commentCount: number;
  href: string;
  edited: boolean;
}

export default function BestBoard() {
  const { posts: boardPosts, loading: boardLoading, commentCounts: boardCommentCounts } = useBoard();
  const { posts: anonPosts, loading: anonLoading, commentCounts: anonCommentCounts } = useAnonBoard();

  const loading = boardLoading || anonLoading;

  const boardBest: BestItem[] = boardPosts
    .filter((p) => p.likes >= LIKE_THRESHOLD)
    .map((p) => ({
      id: p.id,
      source: "자유게시판",
      title: p.title,
      preview: stripHtml(p.body).trim(),
      author: p.author,
      dateLabel: p.date,
      likes: p.likes,
      commentCount: boardCommentCounts[p.id] ?? 0,
      href: `/board/${p.id}`,
      edited: p.edited,
    }));

  const anonBest: BestItem[] = anonPosts
    .filter((p) => !p.blinded && p.likes >= LIKE_THRESHOLD)
    .map((p) => ({
      id: p.id,
      source: "익명게시판",
      title: p.title || stripHtml(p.body).slice(0, 30),
      preview: p.body,
      author: p.displayName,
      dateLabel: formatTimeAgo(new Date(p.createdAt).getTime()),
      likes: p.likes,
      commentCount: anonCommentCounts[p.id] ?? 0,
      href: `/anonymous/${p.id}`,
      edited: p.edited,
    }));

  const combined = [...boardBest, ...anonBest].sort((a, b) => b.likes - a.likes);

  return (
    <RequireRole allow={["member", "president"]} what="BEST 게시판">
      <div>
        <PageHeader
          eyebrow="Best"
          title="🔥 BEST 게시판"
          desc={`자유게시판과 익명게시판에서 좋아요 ${LIKE_THRESHOLD}개 이상 받은 글들만 모았어요.`}
        />

        {loading ? (
          <CardSkeletonGrid count={4} />
        ) : combined.length === 0 ? (
          <EmptyState title="아직 BEST 글이 없어요" desc={`좋아요 ${LIKE_THRESHOLD}개를 넘는 글이 생기면 여기 올라와요.`} />
        ) : (
          <div className="space-y-3">
            {combined.map((item, i) => (
              <Link key={`${item.source}-${item.id}`} to={item.href}>
                <Card className="relative cursor-pointer overflow-hidden pl-5 transition-colors hover:border-dawn-teal/40">
                  <span className="absolute left-0 top-0 h-full w-1 bg-wind-gold" />

                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-wind-gold/15 font-display text-sm text-wind-gold">
                      {i + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Pill tone={item.source === "자유게시판" ? "teal" : "mute"}>{item.source}</Pill>
                        <p className="truncate font-medium text-backstage">{item.title}</p>
                        {item.edited && <span className="font-mono text-[11px] text-mute">(수정됨)</span>}
                      </div>

                      {item.preview && (
                        <p className="mt-1 line-clamp-1 text-sm text-backstage/65">{item.preview}</p>
                      )}

                      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-mute">
                        <span>{item.author}</span>
                        <span>·</span>
                        <span>{item.dateLabel}</span>
                        <span className="flex items-center gap-1 text-red-400/80">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 21s-7-6.2-9.5-10.2C1 8 1.8 4.5 5 3.5c2-.6 3.8.2 5 2 1.2-1.8 3-2.6 5-2 3.2 1 4 4.5 2.5 7.3C19 14.8 12 21 12 21z" />
                          </svg>
                          {item.likes}
                        </span>
                        {item.commentCount > 0 && (
                          <span className="flex items-center gap-1 text-sky-300">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                            </svg>
                            {item.commentCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </RequireRole>
  );
}