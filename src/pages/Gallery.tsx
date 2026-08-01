import { useState } from "react";
import { PageHeader, Pill } from "../components/Ui";

const FILTERS = ["전체", "23기", "22기", "21기", "정기공연", "축제"];

const ITEMS = Array.from({ length: 9 }).map((_, i) => ({
  id: i,
  label: i % 2 === 0 ? "정기공연" : "23기",
  title: i % 2 === 0 ? "2025 정기공연 무대" : "23기 오디션 현장",
}));

export default function Gallery() {
  const [filter, setFilter] = useState("전체");
  const filtered = filter === "전체" ? ITEMS : ITEMS.filter((i) => i.label === filter);

  return (
    <div>
      <PageHeader eyebrow="Gallery" title="활동 갤러리" desc="기수별, 공연별로 남긴 순간들." />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={[
              "rounded-full border px-4 py-1.5 text-sm transition-colors",
              filter === f
                ? "border-wind-gold bg-wind-gold/15 text-wind-gold"
                : "border-line text-backstage/70 hover:border-dawn-teal/50 hover:text-dawn-teal",
            ].join(" ")}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="group relative aspect-[4/5] overflow-hidden rounded-xl border border-line bg-gradient-to-br from-afterglow-2 to-stage"
          >
            <div className="absolute inset-0 flex items-center justify-center text-mute/50">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="9" cy="10" r="1.5" fill="currentColor" />
                <path d="M4 17l5-5 4 4 3-3 4 4" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="absolute inset-x-0 bottom-0 translate-y-full bg-stage/85 p-3 transition-transform duration-300 group-hover:translate-y-0">
              <Pill tone="teal">{item.label}</Pill>
              <p className="mt-1.5 text-sm text-backstage/90">{item.title}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
