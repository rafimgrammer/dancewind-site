// src/pages/Teaching.tsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader, Card, Pill, EmptyState, RequireRole } from "../components/Ui";
import { useTeaching } from "../context/TeachingContext";
import { CardSkeletonGrid } from "../components/Skeleton";

const CATEGORIES = ["전체", "케이팝", "코레오", "스트릿", "락킹", "왁킹", "보깅", "힙합", "하우스"];
const PAGE_SIZE = 6;
type SearchType = "title" | "titleBody" | "teacher";

export default function Teaching() {
  const { classes, loading } = useTeaching();
  const [statusTab, setStatusTab] = useState<"open" | "confirmed">("open");
  const [categoryTab, setCategoryTab] = useState("전체");
  const [searchType, setSearchType] = useState<SearchType>("title");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const searchLabels: Record<SearchType, string> = {
    title: "제목",
    titleBody: "제목+내용",
    teacher: "선생님",
  };

  const handleSearch = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return classes.filter((c) => {
      const matchesStatus = statusTab === "open" ? !c.confirmed : c.confirmed;
      const matchesCategory = categoryTab === "전체" || c.category === categoryTab;
      if (!matchesStatus || !matchesCategory) return false;
      if (!q) return true;

      const title = c.title.toLowerCase();
      const teacher = c.teacher.toLowerCase();
      const description = c.description.toLowerCase();
      if (searchType === "title") return title.includes(q);
      if (searchType === "teacher") return teacher.includes(q);
      return title.includes(q) || description.includes(q);
    });
  }, [classes, statusTab, categoryTab, query, searchType]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <RequireRole allow={["member", "president"]} what="티칭 클래스">
      <div>
        <PageHeader eyebrow="Teaching" title="티칭 클래스" desc="선배가 여는 정규 클래스, 신청은 자유예요." />

        <Link
          to="/classes/new"
          className="mb-6 inline-block rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage"
        >
          + 클래스 등록
        </Link>

        <div className="mb-4 flex gap-2 border-b border-line">
          <button
            onClick={() => {
              setStatusTab("open");
              setPage(1);
            }}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${statusTab === "open" ? "border-wind-gold text-wind-gold" : "border-transparent text-mute hover:text-backstage"
              }`}
          >
            모집중인 클래스
          </button>
          <button
            onClick={() => {
              setStatusTab("confirmed");
              setPage(1);
            }}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${statusTab === "confirmed" ? "border-dawn-teal text-dawn-teal" : "border-transparent text-mute hover:text-backstage"
              }`}
          >
            확정된 클래스
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setCategoryTab(cat);
                setPage(1);
              }}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${categoryTab === cat
                  ? "border-wind-gold bg-wind-gold/10 text-wind-gold"
                  : "border-line text-mute hover:border-dawn-teal/40 hover:text-dawn-teal"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="mb-6 flex flex-col gap-2 sm:flex-row">
          <div className="flex gap-2">
            {(Object.keys(searchLabels) as SearchType[]).map((type) => (
              <button
                key={type}
                onClick={() => setSearchType(type)}
                className={`whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                  searchType === type ? "border-wind-gold bg-wind-gold/10 text-wind-gold" : "border-line text-mute"
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
        </div>

        {loading ? (
          <CardSkeletonGrid count={6} />
        ) : paged.length === 0 ? (
          <EmptyState
            title={query ? "검색 결과가 없어요" : statusTab === "open" ? "모집중인 클래스가 없어요" : "확정된 클래스가 없어요"}
            desc={query ? "다른 검색어로 다시 시도해보세요." : "첫 클래스를 등록해보세요."}
          />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {paged.map((c) => (
                <Link key={c.id} to={`/classes/${c.id}`}>
                  <Card className="cursor-pointer transition-colors hover:border-dawn-teal/40">
                    <div className="flex items-center gap-2">
                      <Pill tone="teal">{c.category}</Pill>
                      {c.confirmed && <Pill tone="gold">확정</Pill>}
                    </div>
                    <p className="mt-2 font-display text-lg text-backstage">{c.title}</p>
                    {c.songTitle && (
                      <p className="mt-0.5 truncate text-xs text-dawn-teal">🎵 {c.songTitle}</p>
                    )}
                    <p className="mt-1 font-mono text-xs text-mute">
                      {c.teacher}
                      {c.edited && " (수정됨)"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-backstage/70">
                      <span>{c.classDate}</span>
                      <span>{c.classTime}</span>
                      <span className="font-mono text-xs text-mute">
                        신청 {c.applicants.length}
                        {c.maxSpots === null ? "명" : ` / ${c.maxSpots}`}
                      </span>
                    </div>
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