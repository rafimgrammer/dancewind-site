// src/pages/Teaching.tsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader, Card, Pill, EmptyState, RequireRole } from "../components/Ui";
import { useTeaching } from "../context/TeachingContext";

const CATEGORIES = ["전체", "케이팝", "코레오", "스트릿", "락킹", "왁킹", "보깅", "힙합", "하우스"];

export default function Teaching() {
  const { classes } = useTeaching();
  const [statusTab, setStatusTab] = useState<"open" | "confirmed">("open");
  const [categoryTab, setCategoryTab] = useState("전체");

  const filtered = useMemo(() => {
    return classes.filter((c) => {
      const matchesStatus = statusTab === "open" ? !c.confirmed : c.confirmed;
      const matchesCategory = categoryTab === "전체" || c.category === categoryTab;
      return matchesStatus && matchesCategory;
    });
  }, [classes, statusTab, categoryTab]);

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
            onClick={() => setStatusTab("open")}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              statusTab === "open" ? "border-wind-gold text-wind-gold" : "border-transparent text-mute hover:text-backstage"
            }`}
          >
            모집중인 클래스
          </button>
          <button
            onClick={() => setStatusTab("confirmed")}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              statusTab === "confirmed" ? "border-dawn-teal text-dawn-teal" : "border-transparent text-mute hover:text-backstage"
            }`}
          >
            확정된 클래스
          </button>
        </div>

        <div className="mb-6 flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryTab(cat)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                categoryTab === cat
                  ? "border-wind-gold bg-wind-gold/10 text-wind-gold"
                  : "border-line text-mute hover:border-dawn-teal/40 hover:text-dawn-teal"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title={statusTab === "open" ? "모집중인 클래스가 없어요" : "확정된 클래스가 없어요"}
            desc="첫 클래스를 등록해보세요."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((c) => (
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
        )}
      </div>
    </RequireRole>
  );
}