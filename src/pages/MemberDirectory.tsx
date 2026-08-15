// src/pages/MemberDirectory.tsx
import { useEffect, useState } from "react";
import { PageHeader, RequireRole } from "../components/Ui";
import { Skeleton } from "../components/Skeleton";
import { supabase } from "../lib/supabase";

interface DirectoryMember {
  id: string;
  name: string;
  cohort: string;
  role: "member" | "president";
}

type SortKey = "name" | "cohortAsc" | "cohortDesc";

function parseCohort(cohort: string): number {
  const match = cohort.match(/\d+/);
  return match ? Number(match[0]) : Number.POSITIVE_INFINITY;
}

function CrownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-wind-gold">
      <path d="M3 8l4 3 5-6 5 6 4-3-2 11H5L3 8z" />
    </svg>
  );
}

function MemberRow({ m }: { m: DirectoryMember }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-line bg-afterglow px-3 py-2.5">
      {m.role === "president" && <CrownIcon />}
      <span className="font-mono text-xs text-mute">{m.cohort}</span>
      <span className="truncate text-sm text-backstage/90">{m.name}</span>
    </div>
  );
}

export default function MemberDirectory() {
  const [members, setMembers] = useState<DirectoryMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("cohortDesc");

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("members")
        .select("id, name, cohort, role")
        .eq("status", "approved");
      setMembers((data ?? []) as DirectoryMember[]);
      setLoading(false);
    };
    run();
  }, []);

  const sortFn = (a: DirectoryMember, b: DirectoryMember) => {
    if (sort === "name") return a.name.localeCompare(b.name, "ko");
    const ca = parseCohort(a.cohort);
    const cb = parseCohort(b.cohort);
    return sort === "cohortAsc" ? ca - cb : cb - ca;
  };

  const filtered = members.filter((m) => m.name.includes(query.trim()));
  const presidents = filtered.filter((m) => m.role === "president").sort(sortFn);
  const regulars = filtered.filter((m) => m.role === "member").sort(sortFn);

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: "cohortDesc", label: "높은 기수순" },
    { key: "cohortAsc", label: "낮은 기수순" },
    { key: "name", label: "이름순" },
  ];

  return (
    <RequireRole allow={["member", "president"]} what="부원 목록">
      <div>
        <PageHeader
          eyebrow="Members"
          title="부원 목록"
          desc={
            loading
              ? "불러오는 중..."
              : `회원가입이 완료된 부원들이예요.\n총 ${members.length}명 · 회장단 ${members.filter((m) => m.role === "president").length}명 · 부원 ${members.filter((m) => m.role === "member").length}명`
          }
        />

        <div className="flex flex-wrap items-center gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="이름으로 검색"
            className="w-full max-w-xs rounded-lg border border-line bg-stage px-3 py-2 text-sm text-backstage placeholder:text-mute outline-none focus:border-dawn-teal"
          />
          <div className="flex gap-1.5">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSort(opt.key)}
                className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  sort === opt.key
                    ? "border-wind-gold bg-wind-gold/10 text-wind-gold"
                    : "border-line text-mute hover:border-dawn-teal/40"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        ) : (
          <>
            <div className="mt-6">
              <p className="mb-2 text-sm font-semibold text-dawn-teal">
                회장단 ({presidents.length})
              </p>
              {presidents.length === 0 ? (
                <p className="text-sm text-mute">검색 결과가 없어요.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {presidents.map((m) => (
                    <MemberRow key={m.id} m={m} />
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6">
              <p className="mb-2 text-sm font-semibold text-dawn-teal">
                부원 ({regulars.length})
              </p>
              {regulars.length === 0 ? (
                <p className="text-sm text-mute">검색 결과가 없어요.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {regulars.map((m) => (
                    <MemberRow key={m.id} m={m} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </RequireRole>
  );
}