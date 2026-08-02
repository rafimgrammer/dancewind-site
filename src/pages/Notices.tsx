import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader, Card, Pill, EmptyState, RequireRole } from "../components/Ui";
import { useAuth } from "../context/AuthContext";
import { useNotices } from "../context/NoticesContext";

const PAGE_SIZE = 6;
type SearchType = "title" | "titleBody" | "author";

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "");
}

export default function Notices() {
  const { role } = useAuth();
  const { notices, togglePin } = useNotices();
  const [searchType, setSearchType] = useState<SearchType>("title");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const isPresident = role === "president";

  const searchLabels: Record<SearchType, string> = {
    title: "제목",
    titleBody: "제목+내용",
    author: "작성자",
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? notices.filter((n) => {
          const title = n.title.toLowerCase();
          const author = n.author.toLowerCase();
          const body = stripHtml(n.body).toLowerCase();
          if (searchType === "title") return title.includes(q);
          if (searchType === "author") return author.includes(q);
          return title.includes(q) || body.includes(q);
        })
      : notices;

    // 고정글을 항상 맨 위로, 그 안에서는 최신순 유지
    return [...base].sort((a, b) => Number(b.pinned) - Number(a.pinned));
  }, [notices, query, searchType]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  return (
    <RequireRole allow={["member", "president"]} what="공지사항">
      <div>
        <PageHeader eyebrow="Notices" title="공지사항" desc="놓치면 곤란한 소식은 여기에 고정돼요." />

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
          {isPresident && (
            <Link
              to="/notices/new"
              className="whitespace-nowrap rounded-lg bg-wind-gold px-4 py-2 text-center text-sm font-semibold text-stage"
            >
              공지 작성
            </Link>
          )}
        </div>

        {paged.length === 0 ? (
          <EmptyState
            title={query ? "검색 결과가 없어요" : "아직 등록된 공지가 없어요"}
            desc={query ? "다른 검색어로 다시 시도해보세요." : "첫 공지를 올려서 팀에게 소식을 전해보세요."}
          />
        ) : (
          <>
            <div className="space-y-3">
              {paged.map((n) => (
                <Card key={n.id} className="transition-colors hover:border-dawn-teal/40">
                  <div className="flex items-start justify-between gap-3">
                    <Link to={`/notices/${n.id}`} className="flex-1">
                      <div className="flex items-center gap-2">
                        {n.pinned && <Pill tone="gold">고정</Pill>}
                        <p className="font-medium text-backstage">{n.title}</p>
                      </div>
                      <p className="mt-1.5 font-mono text-xs text-mute">
                        {n.author} · {n.date} · 조회 {n.views}
                      </p>
                    </Link>
                    {isPresident && (
                      <button
                        onClick={() => togglePin(n.id)}
                        className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                          n.pinned
                            ? "border-wind-gold/50 text-wind-gold"
                            : "border-line text-mute hover:border-wind-gold/40 hover:text-wind-gold"
                        }`}
                      >
                        {n.pinned ? "고정 해제" : "고정"}
                      </button>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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