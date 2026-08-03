// src/pages/TracklistMaster.tsx
import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader, Card, Pill, RequireRole } from "../components/Ui";
import { useTracklist, type TracklistSettings, type TrackItem } from "../context/TracklistContext";
import { generateTracklist, type GapOption } from "../utils/tracklistSolver";
import { exportTracklistToExcel, exportTracklistToImage } from "../utils/exportTracklist";

const GAP_OPTIONS: { value: GapOption; label: string; desc: string }[] = [
  { value: 1, label: "1곡", desc: "최소한의 텀 (원곡 사이 1곡)" },
  { value: 2, label: "2곡", desc: "여유있는 텀 (권장)" },
  { value: 3, label: "3곡", desc: "넉넉한 텀" },
];

type ConfirmAction = "generate" | "confirm" | "unconfirm" | null;

export default function TracklistMaster() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getById, updateSet, confirmSet, unconfirmSet } = useTracklist();

  const set = id ? getById(id) : undefined;

  const [memberInput, setMemberInput] = useState("");
  const [trackInput, setTrackInput] = useState("");
  const [searchByTrack, setSearchByTrack] = useState<Record<string, string>>({});
  const [exporting, setExporting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [pendingResult, setPendingResult] = useState<TrackItem[] | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  if (!set) {
    return (
      <RequireRole allow={["president"]} what="트랙리스트 마스터">
        <div>
          <PageHeader eyebrow="Tracklist Master" title="공연을 찾을 수 없어요" desc="삭제되었거나 존재하지 않는 공연이에요." />
          <button
            onClick={() => navigate("/tracklist-master")}
            className="mt-4 rounded-lg border border-line px-4 py-2 text-sm text-mute"
          >
            목록으로 돌아가기
          </button>
        </div>
      </RequireRole>
    );
  }

  const memberName = (memberId: string) => set.members.find((m) => m.id === memberId)?.name ?? "알 수 없음";

  const handleAddMember = () => {
    const trimmed = memberInput.trim();
    if (!trimmed || set.members.some((m) => m.name === trimmed)) {
      setMemberInput("");
      return;
    }
    const next = [...set.members, { id: `m${Date.now()}`, name: trimmed }];
    updateSet(set.id, { members: next });
    setMemberInput("");
  };

  const handleRemoveMember = (memberId: string) => {
    const nextMembers = set.members.filter((m) => m.id !== memberId);
    const nextTracks = set.tracks.map((t) => ({
      ...t,
      participantIds: t.participantIds.filter((p) => p !== memberId),
    }));
    updateSet(set.id, { members: nextMembers, tracks: nextTracks });
  };

  const handleAddTrack = () => {
    const trimmed = trackInput.trim();
    if (!trimmed) return;
    const next = [...set.tracks, { id: `tr${Date.now()}`, title: trimmed, participantIds: [] }];
    updateSet(set.id, { tracks: next });
    setTrackInput("");
  };

  const handleRemoveTrack = (trackId: string) => {
    const nextTracks = set.tracks.filter((t) => t.id !== trackId);
    const nextSettings: TracklistSettings = {
      ...set.settings,
      fixedFirstId: set.settings.fixedFirstId === trackId ? null : set.settings.fixedFirstId,
      fixedLastId: set.settings.fixedLastId === trackId ? null : set.settings.fixedLastId,
    };
    updateSet(set.id, { tracks: nextTracks, settings: nextSettings });
  };

  const toggleParticipant = (trackId: string, memberId: string) => {
    const next = set.tracks.map((t) =>
      t.id === trackId
        ? {
            ...t,
            participantIds: t.participantIds.includes(memberId)
              ? t.participantIds.filter((p) => p !== memberId)
              : [...t.participantIds, memberId],
          }
        : t
    );
    updateSet(set.id, { tracks: next });
  };

  const updateSettings = (patch: Partial<TracklistSettings>) => {
    updateSet(set.id, { settings: { ...set.settings, ...patch } });
  };

  const handleGenerateClick = () => {
    if (set.tracks.length === 0) {
      alert("곡을 먼저 등록해주세요.");
      return;
    }
    if (set.tracks.length < 2) {
      alert("두 곡 이상 등록해야 순서를 계산할 수 있어요.");
      return;
    }

    const solved = generateTracklist(set.tracks, {
      minGap: set.settings.minGap,
      fixedFirstId: set.settings.fixedFirstId,
      fixedLastId: set.settings.fixedLastId,
    });

    if (!solved) {
      alert(
        "⚠️ 모든 조건을 만족하는 순서를 찾지 못했어요. 특정 인원이 너무 많은 곡에 겹쳐있거나, 사이텀 조건이 너무 빡빡할 수 있어요. 사이텀을 줄이거나 시작/마지막 곡 지정을 해제해보세요."
      );
      return;
    }

    setPendingResult(solved.map((t) => ({ id: t.id, title: t.title, participantIds: t.participantIds })));
    setConfirmAction("generate");
  };

  const handleConfirm = async () => {
    if (confirmAction === "generate" && pendingResult) {
      await updateSet(set.id, { result: pendingResult });
    } else if (confirmAction === "confirm") {
      await confirmSet(set.id);
    } else if (confirmAction === "unconfirm") {
      await unconfirmSet(set.id);
    }
    setConfirmAction(null);
    setPendingResult(null);
  };

  const confirmCopy: Record<Exclude<ConfirmAction, null>, { title: string; desc: string; action: string }> = {
    generate: {
      title: "이 순서로 확정하시겠습니까?",
      desc: "새로 계산된 순서가 기존 결과를 덮어씁니다.",
      action: "적용할게요",
    },
    confirm: {
      title: "이 공연을 확정하시겠습니까?",
      desc: "확정 후에는 인원/곡 구성 수정이 제한될 수 있어요.",
      action: "확정할게요",
    },
    unconfirm: {
      title: "확정을 취소하시겠습니까?",
      desc: "다시 편집 가능한 상태로 돌아갑니다.",
      action: "확정 취소할게요",
    },
  };

  const handleExcelExport = () => {
    if (!set.result || set.result.length === 0) {
      alert("먼저 트랙리스트를 생성해주세요.");
      return;
    }
    exportTracklistToExcel(set.result, set.members, `춤바람_${set.title}_트랙리스트.xlsx`);
  };

  const handleImageExport = async () => {
    if (!set.result || set.result.length === 0) {
      alert("먼저 트랙리스트를 생성해주세요.");
      return;
    }
    setExporting(true);
    try {
      await new Promise((r) => setTimeout(r, 150));
      if (resultRef.current) {
        await exportTracklistToImage(resultRef.current, `춤바람_${set.title}_트랙리스트.png`);
      }
    } catch (err) {
      console.error("이미지 생성 실패:", err);
      alert("이미지 생성에 실패했어요. 콘솔에서 에러 내용을 확인해주세요.");
    } finally {
      setExporting(false);
    }
  };

  const inputClass =
    "flex-1 rounded-lg border border-line bg-stage px-3 py-2 text-sm text-backstage placeholder:text-mute outline-none focus:border-dawn-teal";

  return (
    <RequireRole allow={["president"]} what="트랙리스트 마스터">
      <div>
        <button
          onClick={() => navigate("/tracklist-master")}
          className="mb-4 text-sm text-mute hover:text-backstage"
        >
          ← 공연 목록으로
        </button>

        <PageHeader
          eyebrow="Tracklist Master"
          title={set.title}
          desc={`${set.performanceDate} · 같은 사람이 연달아 무대에 서지 않도록 자동으로 순서를 짜드려요.`}
        />

        {set.confirmed && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-dawn-teal/40 bg-dawn-teal/10 px-4 py-3">
            <p className="text-sm font-semibold text-dawn-teal">✓ 확정된 공연이에요</p>
            <button
              onClick={() => setConfirmAction("unconfirm")}
              className="rounded-lg border border-line px-3 py-1.5 text-xs text-mute hover:border-red-400/50 hover:text-red-300"
            >
              확정 취소하기
            </button>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          {/* 공연진 관리 */}
          <Card>
            <p className="font-display text-lg text-backstage">
              👥 공연진 관리 <span className="font-mono text-sm text-mute">({set.members.length}명)</span>
            </p>
            <div className="mt-3 flex gap-2">
              <input
                value={memberInput}
                onChange={(e) => setMemberInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
                placeholder="이름 입력 후 엔터"
                className={inputClass}
              />
              <button
                onClick={handleAddMember}
                className="rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage"
              >
                추가
              </button>
            </div>
            <div className="mt-3 flex max-h-80 flex-wrap gap-1.5 overflow-y-auto">
              {set.members.length === 0 && (
                <p className="text-sm text-mute">등록된 공연진이 없어요.</p>
              )}
              {set.members.map((m) => (
                <span
                  key={m.id}
                  className="flex items-center gap-1.5 rounded-lg border border-line bg-stage px-2.5 py-1 text-xs text-backstage"
                >
                  {m.name}
                  <button
                    onClick={() => handleRemoveMember(m.id)}
                    className="font-bold text-mute hover:text-red-300"
                    aria-label={`${m.name} 삭제`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </Card>

          {/* 노래 및 출연진 등록 */}
          <Card>
            <p className="font-display text-lg text-backstage">🎵 노래 및 출연진 등록</p>
            <div className="mt-3 flex gap-2">
              <input
                value={trackInput}
                onChange={(e) => setTrackInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTrack()}
                placeholder="곡 제목 입력"
                className={inputClass}
              />
              <button
                onClick={handleAddTrack}
                className="rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage"
              >
                곡 추가
              </button>
            </div>

            <div className="mt-3 max-h-96 space-y-3 overflow-y-auto">
              {set.tracks.length === 0 && <p className="text-sm text-mute">등록된 곡이 없어요.</p>}
              {set.tracks.map((t) => {
                const unassigned = set.members.filter((m) => !t.participantIds.includes(m.id));
                const query = (searchByTrack[t.id] ?? "").trim().toLowerCase();
                const filteredUnassigned = query
                  ? unassigned.filter((m) => m.name.toLowerCase().includes(query))
                  : unassigned;

                return (
                  <div key={t.id} className="rounded-xl border border-line bg-stage p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-backstage">{t.title}</p>
                      <button
                        onClick={() => handleRemoveTrack(t.id)}
                        className="text-xs text-mute hover:text-red-300"
                      >
                        삭제
                      </button>
                    </div>

                    {t.participantIds.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {t.participantIds.map((pid) => (
                          <span
                            key={pid}
                            className="flex items-center gap-1 rounded-lg border border-dawn-teal/30 bg-dawn-teal/10 px-2 py-1 text-xs text-dawn-teal"
                          >
                            {memberName(pid)}
                            <button
                              onClick={() => toggleParticipant(t.id, pid)}
                              className="font-bold hover:text-red-300"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {unassigned.length > 0 && (
                      <div className="mt-2 border-t border-line pt-2">
                        <input
                          value={searchByTrack[t.id] ?? ""}
                          onChange={(e) =>
                            setSearchByTrack((prev) => ({ ...prev, [t.id]: e.target.value }))
                          }
                          placeholder="이름 검색..."
                          className="mb-2 w-full rounded-lg border border-line bg-afterglow px-2.5 py-1.5 text-xs text-backstage placeholder:text-mute outline-none focus:border-dawn-teal"
                        />
                        <div className="flex flex-wrap gap-1.5">
                          {filteredUnassigned.length === 0 ? (
                            <p className="text-xs text-mute">검색 결과가 없어요.</p>
                          ) : (
                            filteredUnassigned.map((m) => (
                              <button
                                key={m.id}
                                onClick={() => toggleParticipant(t.id, m.id)}
                                className="rounded-lg border border-line px-2 py-1 text-xs text-mute hover:border-wind-gold/40 hover:text-wind-gold"
                              >
                                + {m.name}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* 옵션 설정 */}
        <Card className="mt-4">
          <p className="font-display text-lg text-backstage">⚙️ 옵션 설정</p>

          <div className="mt-4">
            <p className="mb-1.5 text-xs text-mute">최소 사이텀 (같은 사람이 다시 나오기까지 필요한 곡 수)</p>
            <div className="flex flex-wrap gap-2">
              {GAP_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateSettings({ minGap: opt.value })}
                  className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                    set.settings.minGap === opt.value
                      ? "border-wind-gold/50 bg-wind-gold/10 text-wind-gold"
                      : "border-line text-mute hover:border-dawn-teal/40 hover:text-dawn-teal"
                  }`}
                >
                  <span className="block font-semibold">{opt.label}</span>
                  <span className="block text-[11px] opacity-80">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-xs text-mute">시작곡 지정 (선택)</p>
              <select
                value={set.settings.fixedFirstId ?? ""}
                onChange={(e) => updateSettings({ fixedFirstId: e.target.value || null })}
                className="w-full rounded-lg border border-line bg-stage px-3 py-2 text-sm text-backstage outline-none focus:border-dawn-teal"
              >
                <option value="">지정 안 함</option>
                {set.tracks
                  .filter((t) => t.id !== set.settings.fixedLastId)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <p className="mb-1.5 text-xs text-mute">마지막곡 지정 (선택)</p>
              <select
                value={set.settings.fixedLastId ?? ""}
                onChange={(e) => updateSettings({ fixedLastId: e.target.value || null })}
                className="w-full rounded-lg border border-line bg-stage px-3 py-2 text-sm text-backstage outline-none focus:border-dawn-teal"
              >
                <option value="">지정 안 함</option>
                {set.tracks
                  .filter((t) => t.id !== set.settings.fixedFirstId)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </Card>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            onClick={handleGenerateClick}
            className="flex-1 rounded-xl bg-wind-gold py-4 text-lg font-bold text-stage transition-opacity hover:opacity-90"
          >
            최적의 순서 자동 생성 ✨
          </button>
          {!set.confirmed && (
            <button
              onClick={() => setConfirmAction("confirm")}
              disabled={!set.result}
              className="rounded-xl border border-dawn-teal/50 bg-dawn-teal/10 px-6 py-4 text-sm font-bold text-dawn-teal disabled:cursor-not-allowed disabled:opacity-40"
            >
              이 공연 확정하기
            </button>
          )}
        </div>

        {/* 결과 */}
        {set.result && (
          <div ref={resultRef} className="mt-6 rounded-2xl border border-line bg-afterglow p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-display text-lg text-backstage">📋 최종 트랙리스트</p>
              <div className="flex gap-2">
                <button
                  onClick={handleExcelExport}
                  className="rounded-lg border border-dawn-teal/50 bg-dawn-teal/10 px-3 py-1.5 text-xs font-semibold text-dawn-teal"
                >
                  📊 엑셀로 저장
                </button>
                <button
                  onClick={handleImageExport}
                  disabled={exporting}
                  className="rounded-lg border border-wind-gold/50 bg-wind-gold/10 px-3 py-1.5 text-xs font-semibold text-wind-gold disabled:opacity-50"
                >
                  {exporting ? "생성 중..." : "🖼️ 이미지로 저장"}
                </button>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {set.result.map((t, idx) => (
                <div
                  key={t.id}
                  className="flex items-center gap-4 rounded-lg border border-line bg-stage px-4 py-3"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-wind-gold/15 font-mono text-sm font-bold text-wind-gold">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-backstage">{t.title}</p>
                    {t.participantIds.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {t.participantIds.map((pid) => (
                          <Pill key={pid} tone="teal">
                            {memberName(pid)}
                          </Pill>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {confirmAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stage/70 backdrop-blur-sm"
          onClick={() => {
            setConfirmAction(null);
            setPendingResult(null);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="mx-4 w-full max-w-sm rounded-2xl border border-line bg-afterglow p-6"
          >
            <p className="font-display text-lg text-backstage">{confirmCopy[confirmAction].title}</p>
            <p className="mt-2 text-sm text-backstage/70">{confirmCopy[confirmAction].desc}</p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setConfirmAction(null);
                  setPendingResult(null);
                }}
                className="rounded-lg border border-line px-4 py-2 text-sm text-mute"
              >
                아니요
              </button>
              <button
                onClick={handleConfirm}
                className="rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage"
              >
                {confirmCopy[confirmAction].action}
              </button>
            </div>
          </div>
        </div>
      )}
    </RequireRole>
  );
}