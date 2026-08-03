// src/pages/MemberManage.tsx
import { useMemo, useState } from "react";
import { PageHeader, Card, Pill, EmptyState, RequireRole } from "../components/Ui";
import { useAuth } from "../context/AuthContext";
import { useMemberManage, type Member } from "../context/MemberManageContext";

type Tab = "pending" | "members" | "kickRequests";
type SortType = "name" | "cohort";
type ConfirmTarget =
  | { type: "approve" | "reject"; id: string; name: string }
  | { type: "requestKick"; id: string; name: string };

export default function MemberManage() {
  const { name } = useAuth();
  const {
    pending,
    members,
    kickRequests,
    approve,
    reject,
    requestKick,
    approveKick,
    cancelKickRequest,
    presidentCount,
  } = useMemberManage();

  const myName = name ?? "회장단";

  const [tab, setTab] = useState<Tab>("pending");
  const [query, setQuery] = useState("");
  const [cohortFilter, setCohortFilter] = useState("전체");
  const [sortType, setSortType] = useState<SortType>("cohort");
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);

  const cohorts = useMemo(() => {
    const set = new Set(members.map((m) => m.cohort));
    return ["전체", ...Array.from(set).sort()];
  }, [members]);

  const filteredMembers = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = members.filter((m) => {
      const matchesQuery =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.studentId.includes(q) ||
        m.department.toLowerCase().includes(q);
      const matchesCohort = cohortFilter === "전체" || m.cohort === cohortFilter;
      return matchesQuery && matchesCohort;
    });

    return [...base].sort((a, b) => {
      if (sortType === "name") return a.name.localeCompare(b.name, "ko");
      // 기수순: 숫자 기준 내림차순(최신 기수 먼저), 같은 기수면 이름순
      const cohortA = parseFloat(a.cohort) || 0;
      const cohortB = parseFloat(b.cohort) || 0;
      if (cohortB !== cohortA) return cohortB - cohortA;
      return a.name.localeCompare(b.name, "ko");
    });
  }, [members, query, cohortFilter, sortType]);

  const presidentMembers = filteredMembers.filter((m) => m.role === "president");
  const regularMembers = filteredMembers.filter((m) => m.role === "member");

  const currentCohort = cohorts[1] ?? "-"; // cohorts[0]은 "전체"
  const newestCohortCount = members.filter((m) => m.cohort === currentCohort).length;

  const runConfirm = async () => {
    if (!confirmTarget) return;
    if (confirmTarget.type === "approve") await approve(confirmTarget.id);
    if (confirmTarget.type === "reject") await reject(confirmTarget.id);
    if (confirmTarget.type === "requestKick") await requestKick(confirmTarget.id, myName);
    setConfirmTarget(null);
  };

  const confirmCopy: Record<ConfirmTarget["type"], { title: string; desc: string; action: string }> = {
    approve: { title: "가입을 승인하시겠습니까?", desc: "승인 즉시 정식 부원으로 전환됩니다.", action: "승인할게요" },
    reject: { title: "가입 신청을 거절하시겠습니까?", desc: "거절 후에는 신청 내역이 삭제됩니다.", action: "거절할게요" },
    requestKick: {
      title: "강퇴를 요청하시겠습니까?",
      desc: `회장단 전원(${presidentCount}명)이 동의해야 실제로 강퇴됩니다.`,
      action: "요청할게요",
    },
  };

  const renderMemberCard = (m: Member) => {
    const hasActiveRequest = kickRequests.some((r) => r.targetId === m.id);
    return (
      <Card key={m.id} className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-afterglow-2 font-display text-sm text-wind-gold">
            {m.name[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-backstage">{m.name}</p>
              <Pill tone={m.role === "president" ? "gold" : "teal"}>
                {m.role === "president" ? "회장단" : "부원"}
              </Pill>
              <span className="font-mono text-[11px] text-mute">{m.cohort}</span>
            </div>
            <p className="mt-0.5 font-mono text-[11px] text-mute">
              {m.department} · {m.studentId}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => setConfirmTarget({ type: "requestKick", id: m.id, name: m.name })}
            disabled={hasActiveRequest}
            className="rounded-lg border border-line px-3 py-1.5 text-xs text-mute hover:border-red-400/50 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {hasActiveRequest ? "요청 진행 중" : "강퇴 요청"}
          </button>
        </div>
      </Card>
    );
  };

  return (
    <RequireRole allow={["president"]} what="전체 부원 관리">
      <div>
        <PageHeader eyebrow="Member Manage" title="전체 부원 관리" desc="가입 승인과 부원 명단을 관리해요." />

        {/* 통계 카드 */}
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <Card>
            <p className="text-xs text-mute">전체 부원</p>
            <p className="mt-1 font-display text-2xl text-backstage">{members.length}명</p>
          </Card>
          <Card>
            <p className="text-xs text-mute">승인 대기</p>
            <p className="mt-1 font-display text-2xl text-wind-gold">{pending.length}명</p>
          </Card>
          <Card>
            <p className="text-xs text-mute">
              {currentCohort} 신입 · 회장단 {presidentCount}명
            </p>
            <p className="mt-1 font-display text-2xl text-dawn-teal">{newestCohortCount}명</p>
          </Card>
        </div>

        {/* 탭 */}
        <div className="mb-6 flex gap-2 overflow-x-auto border-b border-line">
          <button
            onClick={() => setTab("pending")}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === "pending" ? "border-wind-gold text-wind-gold" : "border-transparent text-mute hover:text-backstage"
            }`}
          >
            승인 대기 {pending.length > 0 && `(${pending.length})`}
          </button>
          <button
            onClick={() => setTab("members")}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === "members" ? "border-wind-gold text-wind-gold" : "border-transparent text-mute hover:text-backstage"
            }`}
          >
            전체 부원
          </button>
          <button
            onClick={() => setTab("kickRequests")}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === "kickRequests" ? "border-red-400 text-red-300" : "border-transparent text-mute hover:text-backstage"
            }`}
          >
            강퇴 요청 {kickRequests.length > 0 && `(${kickRequests.length})`}
          </button>
        </div>

        {/* 승인 대기 */}
        {tab === "pending" && (
          <div className="space-y-3">
            {pending.length === 0 ? (
              <EmptyState title="승인 대기 중인 신청이 없어요" desc="새 가입 신청이 오면 여기에 표시돼요." />
            ) : (
              pending.map((p) => (
                <Card key={p.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-display text-lg text-backstage">{p.name}</p>
                        <Pill tone="gold">{p.cohort}</Pill>
                      </div>
                      <p className="mt-1 font-mono text-xs text-mute">신청일 {p.appliedAt}</p>
                      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-backstage/80 sm:grid-cols-3">
                        <p>학번: {p.studentId}</p>
                        <p>학과: {p.department}</p>
                        <p className="truncate">이메일: {p.email}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() => setConfirmTarget({ type: "reject", id: p.id, name: p.name })}
                        className="rounded-lg border border-line px-3 py-1.5 text-xs text-mute hover:border-red-400/50 hover:text-red-300"
                      >
                        거절
                      </button>
                      <button
                        onClick={() => setConfirmTarget({ type: "approve", id: p.id, name: p.name })}
                        className="rounded-lg bg-wind-gold px-3 py-1.5 text-xs font-semibold text-stage"
                      >
                        승인
                      </button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* 전체 부원 */}
        {tab === "members" && (
          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="이름, 학번, 학과로 검색"
                className="flex-1 rounded-lg border border-line bg-stage px-3 py-2 text-sm text-backstage placeholder:text-mute outline-none focus:border-dawn-teal"
              />
              <select
                value={cohortFilter}
                onChange={(e) => setCohortFilter(e.target.value)}
                className="rounded-lg border border-line bg-stage px-3 py-2 text-sm text-backstage outline-none focus:border-dawn-teal"
              >
                {cohorts.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <div className="flex gap-1.5 rounded-lg border border-line bg-stage p-1">
                <button
                  onClick={() => setSortType("cohort")}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    sortType === "cohort" ? "bg-wind-gold text-stage" : "text-mute hover:text-backstage"
                  }`}
                >
                  기수순
                </button>
                <button
                  onClick={() => setSortType("name")}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    sortType === "name" ? "bg-wind-gold text-stage" : "text-mute hover:text-backstage"
                  }`}
                >
                  이름순
                </button>
              </div>
            </div>

            {filteredMembers.length === 0 ? (
              <EmptyState title="검색 결과가 없어요" desc="다른 검색어나 기수로 시도해보세요." />
            ) : (
              <div className="space-y-6">
                {presidentMembers.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold text-wind-gold">👑 회장단 ({presidentMembers.length}명)</p>
                    <div className="space-y-2">{presidentMembers.map(renderMemberCard)}</div>
                  </div>
                )}
                {regularMembers.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold text-dawn-teal">👥 부원 ({regularMembers.length}명)</p>
                    <div className="space-y-2">{regularMembers.map(renderMemberCard)}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 강퇴 요청 */}
        {tab === "kickRequests" && (
          <div className="space-y-3">
            {kickRequests.length === 0 ? (
              <EmptyState title="진행 중인 강퇴 요청이 없어요" desc="강퇴 요청을 하면 여기에 표시돼요." />
            ) : (
              kickRequests.map((r) => {
                const alreadyApproved = r.approvedBy.includes(myName);
                return (
                  <Card key={r.id} className="border-red-400/20">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-backstage">{r.targetName} 강퇴 요청</p>
                        <p className="mt-0.5 font-mono text-xs text-mute">
                          {r.requestedBy}님이 요청 · {r.requestedAt} · 동의 {r.approvedBy.length}/{presidentCount}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {r.approvedBy.map((n) => (
                            <span
                              key={n}
                              className="rounded-full border border-dawn-teal/30 bg-dawn-teal/10 px-2 py-0.5 text-[11px] text-dawn-teal"
                            >
                              {n} 동의
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => cancelKickRequest(r.id)}
                          className="rounded-lg border border-line px-3 py-1.5 text-xs text-mute hover:border-red-400/50 hover:text-red-300"
                        >
                          요청 취소
                        </button>
                        <button
                          onClick={() => approveKick(r.id, myName)}
                          disabled={alreadyApproved}
                          className="rounded-lg border border-red-400/40 bg-red-400/10 px-3 py-1.5 text-xs font-semibold text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {alreadyApproved ? "동의 완료" : "강퇴 동의"}
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>

      {confirmTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stage/70 backdrop-blur-sm"
          onClick={() => setConfirmTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="mx-4 w-full max-w-sm rounded-2xl border border-line bg-afterglow p-6"
          >
            <p className="font-display text-lg text-backstage">{confirmCopy[confirmTarget.type].title}</p>
            <p className="mt-2 text-sm text-backstage/70">
              {confirmTarget.name}님 — {confirmCopy[confirmTarget.type].desc}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setConfirmTarget(null)}
                className="rounded-lg border border-line px-4 py-2 text-sm text-mute"
              >
                아니요
              </button>
              <button
                onClick={runConfirm}
                className="rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage"
              >
                {confirmCopy[confirmTarget.type].action}
              </button>
            </div>
          </div>
        </div>
      )}
    </RequireRole>
  );
}