// src/pages/Teaching.tsx
import { Link } from "react-router-dom";
import { PageHeader, Card, Pill, EmptyState, RequireRole } from "../components/Ui";
import { useTeaching } from "../context/TeachingContext";

export default function Teaching() {
  const { classes } = useTeaching();

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

        {classes.length === 0 ? (
          <EmptyState title="아직 열린 클래스가 없어요" desc="첫 클래스를 등록해보세요." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {classes.map((c) => (
              <Link key={c.id} to={`/classes/${c.id}`}>
                <Card className="cursor-pointer transition-colors hover:border-dawn-teal/40">
                  <Pill tone="teal">{c.category}</Pill>
                  <p className="mt-2 font-display text-lg text-backstage">{c.title}</p>
                  {c.songTitle && (
                    <p className="mt-0.5 truncate text-xs text-dawn-teal">🎵 {c.songTitle}</p>
                  )}
                  <p className="mt-1 font-mono text-xs text-mute">{c.teacher}</p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-backstage/70">
                    <span>{c.classDate}</span>
                    <span>{c.classTime}</span>
                    <span className="font-mono text-xs text-mute">
                      신청 {c.applicants.length}{c.maxSpots === null ? "명" : ` / ${c.maxSpots}`}
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