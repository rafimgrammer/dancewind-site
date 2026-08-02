// src/pages/PracticeMatcher.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader, Card, RequireRole } from "../components/Ui";
import { useAuth } from "../context/AuthContext";
import {
  usePractice,
  type PersonEntry,
  type PracticeSession,
  type MainSlot,
} from "../context/PracticeContext";
import { computeBestSlots, type SlotCandidate } from "../utils/practiceCalc";
import { toTimeString } from "../utils/time";
import { exportToExcel, exportElementToImage } from "../utils/exportPractice";

let idCounter = 0;
function newId() {
  idCounter += 1;
  return `p${Date.now()}${idCounter}`;
}

type Group = "leaders" | "members";

export default function PracticeMatcher() {
  const { name } = useAuth() as { name?: string };
  const myName = name ?? "익명의 부원";
  const { getSession, saveSession, getSavedDates, getSessionsInRange } = usePractice();

  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [draft, setDraft] = useState<PracticeSession>(() => getSession(myName, today));
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const [rangeStart, setRangeStart] = useState(today);
  const [rangeEnd, setRangeEnd] = useState(today);
  const [exporting, setExporting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraft(getSession(myName, date));
    setLastSavedAt(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, myName]);

  const savedDates = getSavedDates(myName);

  const addPerson = (group: Group) => {
    const list = draft[group];
    const entry: PersonEntry = {
      id: newId(),
      name: group === "leaders" ? `팀장 ${list.length + 1}` : `부원 ${list.length + 1}`,
      ranges: [{ start: "", end: "" }],
    };
    setDraft((prev) => ({ ...prev, [group]: [...prev[group], entry] }));
  };

  const removePerson = (group: Group, id: string) => {
    setDraft((prev) => ({
      ...prev,
      [group]: prev[group].filter((p) => p.id !== id),
      mainSlot: null,
      extraSessions: prev.extraSessions.filter((ex) => ex.personId !== id),
    }));
  };

  const updatePersonName = (group: Group, id: string, value: string) => {
    setDraft((prev) => ({
      ...prev,
      [group]: prev[group].map((p) => (p.id === id ? { ...p, name: value } : p)),
    }));
  };

  const addRange = (group: Group, personId: string) => {
    setDraft((prev) => ({
      ...prev,
      [group]: prev[group].map((p) =>
        p.id === personId ? { ...p, ranges: [...p.ranges, { start: "", end: "" }] } : p
      ),
      mainSlot: null,
    }));
  };

  const updateRange = (
    group: Group,
    personId: string,
    rangeIndex: number,
    field: "start" | "end",
    value: string
  ) => {
    setDraft((prev) => ({
      ...prev,
      [group]: prev[group].map((p) =>
        p.id === personId
          ? {
              ...p,
              ranges: p.ranges.map((r, i) => (i === rangeIndex ? { ...r, [field]: value } : r)),
            }
          : p
      ),
      mainSlot: null,
    }));
  };

  const removeRange = (group: Group, personId: string, rangeIndex: number) => {
    setDraft((prev) => ({
      ...prev,
      [group]: prev[group].map((p) =>
        p.id === personId ? { ...p, ranges: p.ranges.filter((_, i) => i !== rangeIndex) } : p
      ),
      mainSlot: null,
    }));
  };

  const candidates: SlotCandidate[] = useMemo(
    () => computeBestSlots(draft.leaders, draft.members),
    [draft.leaders, draft.members]
  );

  const confirmMainSlot = (c: SlotCandidate) => {
    const mainSlot: MainSlot = {
      start: c.start,
      end: c.end,
      personIds: c.personIds,
      names: c.names,
    };
    setDraft((prev) => ({ ...prev, mainSlot }));
  };

  const clearMainSlot = () => {
    setDraft((prev) => ({ ...prev, mainSlot: null }));
  };

  const unfitPeople = useMemo(() => {
    if (!draft.mainSlot) return [];
    return [...draft.leaders, ...draft.members].filter(
      (p) => !draft.mainSlot!.personIds.includes(p.id)
    );
  }, [draft.leaders, draft.members, draft.mainSlot]);

  const isInExtraSession = (personId: string, r: { start: string; end: string }) =>
    draft.extraSessions.some(
      (ex) => ex.personId === personId && ex.start === r.start && ex.end === r.end
    );

  const addExtraSession = (person: PersonEntry, r: { start: string; end: string }) => {
    if (!r.start || !r.end) return;
    setDraft((prev) => ({
      ...prev,
      extraSessions: [
        ...prev.extraSessions,
        { personId: person.id, name: person.name, start: r.start, end: r.end },
      ],
    }));
  };

  const removeExtraSession = (personId: string, start: string, end: string) => {
    setDraft((prev) => ({
      ...prev,
      extraSessions: prev.extraSessions.filter(
        (ex) => !(ex.personId === personId && ex.start === start && ex.end === end)
      ),
    }));
  };

  const formattedDate = useMemo(() => {
    const d = new Date(date);
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  }, [date]);

  const handleSaveClick = () => {
    if (draft.leaders.length === 0 && draft.members.length === 0) {
      alert("먼저 팀장이나 부원을 추가해주세요.");
      return;
    }
    setShowSaveConfirm(true);
  };

  const confirmSave = () => {
    saveSession(myName, date, draft);
    setShowSaveConfirm(false);
    setLastSavedAt(new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }));
  };

  const rangeEntries = useMemo(
    () => getSessionsInRange(myName, rangeStart, rangeEnd),
    [myName, rangeStart, rangeEnd, getSessionsInRange]
  );

  const handleExcelExport = () => {
    if (rangeEntries.length === 0) {
      alert("선택한 기간에 저장된 연습시간이 없어요.");
      return;
    }
    exportToExcel(rangeEntries, `춤바람_연습시간_${rangeStart}_${rangeEnd}.xlsx`);
  };

  const handleImageExport = async () => {
    if (rangeEntries.length === 0) {
      alert("선택한 기간에 저장된 연습시간이 없어요.");
      return;
    }
    setExporting(true);
    try {
      await new Promise((r) => setTimeout(r, 150));
      if (printRef.current) {
        await exportElementToImage(printRef.current, `춤바람_연습시간_${rangeStart}_${rangeEnd}.png`);
      }
    } catch (err) {
      console.error("이미지 생성 실패:", err);
      alert("이미지 생성에 실패했어요. 콘솔에서 에러 내용을 확인해주세요.");
    } finally {
      setExporting(false);
    }
  };

  const inputClass =
    "rounded-lg border border-line bg-stage px-2.5 py-1.5 text-sm text-backstage outline-none focus:border-dawn-teal";

  const renderPersonGroup = (group: Group) => {
    const list = draft[group];
    const isLeaderGroup = group === "leaders";

    return (
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <p className={`font-display text-lg ${isLeaderGroup ? "text-wind-gold" : "text-backstage"}`}>
            {isLeaderGroup ? "👑 팀장 가능 시간" : "👥 부원 가능 시간"}
          </p>
          <button
            onClick={() => addPerson(group)}
            className={
              isLeaderGroup
                ? "rounded-lg border border-wind-gold/40 bg-wind-gold/10 px-3 py-1.5 text-xs font-semibold text-wind-gold"
                : "rounded-lg bg-wind-gold px-3 py-1.5 text-xs font-semibold text-stage"
            }
          >
            {isLeaderGroup ? "+ 팀장 추가" : "+ 부원 추가"}
          </button>
        </div>
        <div className="space-y-3">
          {list.length === 0 && (
            <p className="text-sm text-mute">
              {isLeaderGroup ? "아직 입력된 팀장이 없어요." : "아직 입력된 부원이 없어요."}
            </p>
          )}
          {list.map((p) => (
            <div
              key={p.id}
              className={`rounded-xl border p-3 ${
                isLeaderGroup ? "border-wind-gold/30 bg-wind-gold/5" : "border-line bg-stage"
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  value={p.name}
                  onChange={(e) => updatePersonName(group, p.id, e.target.value)}
                  className={`${inputClass} w-28 font-semibold ${isLeaderGroup ? "text-wind-gold" : ""}`}
                />
                <button
                  onClick={() => addRange(group, p.id)}
                  className="rounded-lg border border-dawn-teal/40 px-2.5 py-1 text-xs text-dawn-teal"
                >
                  + 시간대 추가
                </button>
                <button
                  onClick={() => removePerson(group, p.id)}
                  className="ml-auto text-xs text-mute hover:text-red-300"
                >
                  삭제
                </button>
              </div>
              <div className="mt-2 space-y-1.5">
                {p.ranges.map((r, idx) => (
                  <div key={idx} className="flex items-center gap-2 pl-2">
                    <input
                      type="time"
                      value={r.start}
                      onChange={(e) => updateRange(group, p.id, idx, "start", e.target.value)}
                      className={inputClass}
                    />
                    <span className="text-mute">~</span>
                    <input
                      type="time"
                      value={r.end}
                      onChange={(e) => updateRange(group, p.id, idx, "end", e.target.value)}
                      className={inputClass}
                    />
                    {p.ranges.length > 1 && (
                      <button
                        onClick={() => removeRange(group, p.id, idx)}
                        className="text-xs text-mute hover:text-red-300"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <RequireRole allow={["member", "president"]} what="연습시간 마스터">
      <div>
        <PageHeader
          eyebrow="Practice Matcher"
          title="연습시간 마스터"
          desc="팀장님 시간을 기준으로, 가장 많이 겹치는 연습 시간대를 찾아드려요."
        />

        <Card className="mb-6">
          <label className="mb-1.5 block text-xs text-mute">연습 날짜</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />

          {savedDates.length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 text-xs text-mute">저장된 날짜</p>
              <div className="flex flex-wrap gap-1.5">
                {savedDates.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDate(d)}
                    className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                      d === date
                        ? "border-wind-gold/50 bg-wind-gold/10 text-wind-gold"
                        : "border-line text-mute hover:border-dawn-teal/40 hover:text-dawn-teal"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>

        {renderPersonGroup("leaders")}
        {renderPersonGroup("members")}

        <Card className="mb-6">
          <p className="font-display text-lg text-backstage">가장 많이 겹치는 시간대</p>
          {candidates.length === 0 ? (
            <p className="mt-3 text-sm text-mute">
              팀장과 부원의 시간을 입력하면 자동으로 후보가 나타나요.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {candidates.map((c, idx) => {
                const isSelected =
                  draft.mainSlot?.start === c.start && draft.mainSlot?.end === c.end;
                return (
                  <div
                    key={`${c.start}-${c.end}`}
                    className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 ${
                      isSelected ? "border-wind-gold/60 bg-wind-gold/10" : "border-line bg-stage"
                    }`}
                  >
                    <div>
                      <p className="font-mono text-sm font-bold text-backstage">
                        {idx === 0 && "🏆 "}
                        {toTimeString(c.start)} ~ {toTimeString(c.end)}
                      </p>
                      <p className="mt-0.5 text-xs text-mute">
                        {c.count}명: {c.names.join(", ")}
                      </p>
                    </div>
                    <button
                      onClick={() => (isSelected ? clearMainSlot() : confirmMainSlot(c))}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                        isSelected ? "border border-line text-mute" : "bg-wind-gold text-stage"
                      }`}
                    >
                      {isSelected ? "선택 해제" : "이 시간대로 확정"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {draft.mainSlot && unfitPeople.length > 0 && (
          <Card className="mb-6">
            <p className="font-display text-lg text-backstage">겹치지 않는 인원 처리</p>
            <p className="mt-1 text-sm text-mute">
              메인 연습 시간과 안 맞는 사람들이에요. 별도 세션으로 포함할지 정해주세요.
            </p>
            <div className="mt-3 space-y-3">
              {unfitPeople.map((p) => (
                <div key={p.id} className="rounded-lg border border-line bg-stage p-3">
                  <p className="text-sm font-semibold text-backstage">{p.name}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {p.ranges
                      .filter((r) => r.start && r.end)
                      .map((r, idx) => {
                        const included = isInExtraSession(p.id, r);
                        return (
                          <button
                            key={idx}
                            onClick={() =>
                              included
                                ? removeExtraSession(p.id, r.start, r.end)
                                : addExtraSession(p, r)
                            }
                            className={`rounded-lg border px-3 py-1.5 text-xs font-mono transition-colors ${
                              included
                                ? "border-dawn-teal/50 bg-dawn-teal/10 text-dawn-teal"
                                : "border-line text-mute hover:border-wind-gold/40 hover:text-wind-gold"
                            }`}
                          >
                            {r.start}~{r.end} {included ? "· 포함됨 (해제)" : "· 별도 세션 포함"}
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <button
          onClick={handleSaveClick}
          className="w-full rounded-xl bg-wind-gold py-4 text-lg font-bold text-stage transition-opacity hover:opacity-90"
        >
          💾 {formattedDate} 연습 계획 저장
        </button>
        {lastSavedAt && (
          <p className="mt-2 text-center text-xs text-dawn-teal">{lastSavedAt}에 저장됨</p>
        )}

        {(draft.mainSlot || draft.extraSessions.length > 0) && (
          <Card className="mt-6">
            <p className="border-b border-line pb-2 font-mono text-xs uppercase tracking-widest text-dawn-teal">
              {date} 연습 계획 요약
            </p>

            {draft.mainSlot && (
              <div className="mt-4">
                <p className="text-sm text-mute">메인 연습 시간</p>
                <p className="mt-1 font-mono text-3xl font-black text-backstage">
                  {toTimeString(draft.mainSlot.start)} ~ {toTimeString(draft.mainSlot.end)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {draft.mainSlot.names.map((n) => (
                    <span
                      key={n}
                      className="rounded-full border border-wind-gold/30 bg-wind-gold/10 px-3 py-1 text-xs text-wind-gold"
                    >
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {draft.extraSessions.length > 0 && (
              <div className="mt-6 border-t border-line pt-4">
                <p className="mb-2 text-sm font-semibold text-dawn-teal">별도 세션</p>
                <div className="space-y-1.5">
                  {draft.extraSessions.map((ex) => (
                    <div
                      key={`${ex.personId}-${ex.start}`}
                      className="flex items-center justify-between rounded-lg border border-dawn-teal/30 bg-dawn-teal/5 px-3 py-2"
                    >
                      <span className="text-sm text-backstage">{ex.name}</span>
                      <span className="font-mono text-xs text-dawn-teal">
                        {ex.start} ~ {ex.end}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        <Card className="mt-8">
          <p className="font-display text-lg text-backstage">기간별 내보내기</p>
          <p className="mt-1 text-sm text-mute">저장된 연습시간을 기간으로 골라 엑셀이나 이미지로 저장해요.</p>

          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1.5 block text-xs text-mute">시작 날짜</label>
              <input
                type="date"
                value={rangeStart}
                onChange={(e) => setRangeStart(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-mute">종료 날짜</label>
              <input
                type="date"
                value={rangeEnd}
                onChange={(e) => setRangeEnd(e.target.value)}
                className={inputClass}
              />
            </div>
            <button
              onClick={handleExcelExport}
              className="rounded-lg border border-dawn-teal/50 bg-dawn-teal/10 px-4 py-2 text-sm font-semibold text-dawn-teal"
            >
              📊 엑셀로 저장
            </button>
            <button
              onClick={handleImageExport}
              disabled={exporting}
              className="rounded-lg border border-wind-gold/50 bg-wind-gold/10 px-4 py-2 text-sm font-semibold text-wind-gold disabled:opacity-50"
            >
              {exporting ? "이미지 생성 중..." : "🖼️ 이미지로 저장"}
            </button>
          </div>

          <p className="mt-3 text-xs text-mute">
            {rangeEntries.length === 0
              ? "선택한 기간에 저장된 날짜가 없어요."
              : `${rangeEntries.length}개 날짜가 이 기간에 저장되어 있어요: ${rangeEntries
                  .map((e) => e.date)
                  .join(", ")}`}
          </p>
        </Card>

        <div
          ref={printRef}
          className="fixed left-[-9999px] top-0 w-[640px] bg-stage p-8"
          style={{ pointerEvents: "none" }}
        >
          <p className="font-display text-2xl text-backstage">
            춤바람 연습시간 ({rangeStart} ~ {rangeEnd})
          </p>
          <div className="mt-6 space-y-6">
            {rangeEntries.map(({ date: d, session }) => (
              <div key={d} className="rounded-xl border border-line bg-afterglow p-5">
                <p className="font-mono text-xs uppercase tracking-widest text-dawn-teal">{d}</p>

                {session.mainSlot ? (
                  <>
                    <p className="mt-2 font-mono text-xl font-bold text-backstage">
                      {toTimeString(session.mainSlot.start)} ~ {toTimeString(session.mainSlot.end)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {session.mainSlot.names.map((n) => (
                        <span
                          key={n}
                          className="rounded-full bg-wind-gold/15 px-2.5 py-1 text-xs text-wind-gold"
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-mute">확정된 메인 시간 없음</p>
                )}

                {session.extraSessions.length > 0 && (
                  <div className="mt-3 border-t border-line pt-3">
                    <p className="mb-1.5 text-xs text-dawn-teal">별도 세션</p>
                    <div className="space-y-1">
                      {session.extraSessions.map((ex) => (
                        <p key={`${ex.personId}-${ex.start}`} className="text-xs text-backstage">
                          {ex.name} · {ex.start}~{ex.end}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showSaveConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stage/70 backdrop-blur-sm"
          onClick={() => setShowSaveConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="mx-4 w-full max-w-sm rounded-2xl border border-line bg-afterglow p-6"
          >
            <p className="font-display text-lg text-backstage">
              {formattedDate} 연습 계획을 저장하시겠습니까?
            </p>
            <p className="mt-2 text-sm text-backstage/70">
              팀장 {draft.leaders.length}명, 부원 {draft.members.length}명의 시간이 저장돼요.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowSaveConfirm(false)}
                className="rounded-lg border border-line px-4 py-2 text-sm text-mute"
              >
                아니요
              </button>
              <button
                onClick={confirmSave}
                className="rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage"
              >
                저장할게요
              </button>
            </div>
          </div>
        </div>
      )}
    </RequireRole>
  );
}