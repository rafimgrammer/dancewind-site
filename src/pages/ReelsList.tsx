// src/pages/ReelsList.tsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader, Card, Pill, EmptyState, RequireRole } from "../components/Ui";
import { useReels } from "../context/ReelsContext";

export default function ReelsList() {
  const { posts } = useReels();
  const [statusTab, setStatusTab] = useState<"open" | "confirmed">("open");

  const filtered = useMemo(() => {
    return posts.filter((p) => (statusTab === "open" ? !p.confirmed : p.confirmed));
  }, [posts, statusTab]);

  return (
    <RequireRole allow={["member", "president"]} what="같이 릴스찍자">
      <div>
        <PageHeader
          eyebrow="Reels"
          title="같이 릴스찍자!"
          desc="참고 영상을 올리고, 같이 찍을 사람을 모집해요."
        />

        <Link
          to="/reels/new"
          className="mb-6 inline-block rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage"
        >
          + 릴스 모집 등록
        </Link>

        <div className="mb-6 flex gap-2 border-b border-line">
          <button
            onClick={() => setStatusTab("open")}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              statusTab === "open" ? "border-wind-gold text-wind-gold" : "border-transparent text-mute hover:text-backstage"
            }`}
          >
            모집중
          </button>
          <button
            onClick={() => setStatusTab("confirmed")}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              statusTab === "confirmed" ? "border-dawn-teal text-dawn-teal" : "border-transparent text-mute hover:text-backstage"
            }`}
          >
            확정됨
          </button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title={statusTab === "open" ? "모집중인 릴스가 없어요" : "확정된 릴스가 없어요"}
            desc="같이 찍고 싶은 릴스를 올려보세요."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((p) => (
              <Link key={p.id} to={`/reels/${p.id}`}>
                <Card className="cursor-pointer transition-colors hover:border-dawn-teal/40">
                  <div className="flex items-center gap-2">
                    {p.confirmed && <Pill tone="gold">확정</Pill>}
                    <p className="font-display text-lg text-backstage">{p.title}</p>
                  </div>
                  <p className="mt-1 font-mono text-xs text-mute">
                    {p.creator}
                    {p.edited && " (수정됨)"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-backstage/70">
                    <span>{p.shootDate ?? "날짜 미정"}</span>
                    <span>{p.shootTime ?? ""}</span>
                    <span className="font-mono text-xs text-mute">
                      신청 {p.applicants.length}
                      {p.maxSpots === null ? "명" : ` / ${p.maxSpots}`}
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