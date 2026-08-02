// src/pages/Board.tsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader, Card, EmptyState, RequireRole } from "../components/Ui";
import { useAuth } from "../context/AuthContext";
import { useBoard } from "../context/BoardContext";

const PAGE_SIZE = 6;
type SearchType = "title" | "titleBody" | "author";

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "");
}

export default function Board() {
  const { role } = useAuth();
  const { posts } = useBoard();
  const [searchType, setSearchType] = useState<SearchType>("title");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter((p) => {
      const title = p.title.toLowerCase();
      const author = p.author.toLowerCase();
      const body = stripHtml(p.body).toLowerCase();
      if (searchType === "title") return title.includes(q);
      if (searchType === "author") return author.includes(q);
      return title.includes(q) || body.includes(q);
    });
  }, [posts, query, searchType]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const searchLabels: Record<SearchType, string> = {
    title: "제목",
    titleBody: "제목+내용",
    author: "작성자",
  };

  return (
    <RequireRole allow={["member", "president"]} what="자유게시판">
      <div>
        <PageHeader eyebrow="Board" title="자유게시판" desc="동방 잡담부터 팀티 투표까지, 자유롭게." />

        <div className="mb-6 flex flex-col gap-2 sm:flex-row">
          <div className="flex gap-2">
            {(Object.keys(searchLabels) as SearchType[]).map((type) => (
              <button
                key={type}
                onClick={() => setSearchType(type)}
                className={`whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                  searchType === type
                    ? "border-wind-gold bg-wind-gold/10 text-wind-gold"
                    : "border-line text-mute"
                }`}
              >
                {searchLabels[type]}
              </button>
            ))}
          </div>
          <input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={`${searchLabels[searchType]}(으)로 검색`}
            className="flex-1 rounded-lg border border-line bg-stage px-3 py-2 text-sm text-backstage placeholder:text-mute outline-none focus:border-dawn-teal"
          />
          <Link
            to="/board/new"
            className="whitespace-nowrap rounded-lg bg-wind-gold px-4 py-2 text-center text-sm font-semibold text-stage"
          >
            글쓰기
          </Link>
        </div>

        {paged.length === 0 ? (
          <EmptyState
            title={query ? "검색 결과가 없어요" : "아직 아무도 글을 남기지 않았어요"}
            desc={query ? "다른 검색어로 다시 시도해보세요." : "첫 스텝을 밟아보세요!"}
          />
        ) : (
          <>
            <div className="space-y-3">
              {paged.map((p) => (
                <Link key={p.id} to={`/board/${p.id}`}>
                  <Card className="cursor-pointer transition-colors hover:border-dawn-teal/40">
                    <p className="font-medium text-backstage">{p.title}</p>
                    <p className="mt-1.5 font-mono text-xs text-mute">
                      {p.author} · {p.date} · 조회 {p.views} · 좋아요 {p.likes}
                    </p>
                  </Card>
                </Link>
              ))}
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
                    p === page
                      ? "bg-wind-gold font-semibold text-stage"
                      : "text-mute hover:text-backstage"
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