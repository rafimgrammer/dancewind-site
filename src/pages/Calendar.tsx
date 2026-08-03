// src/pages/Calendar.tsx
import { useMemo, useState } from "react";
import { PageHeader, Card } from "../components/Ui";
import { useAuth } from "../context/AuthContext";
import { useCalendar, type EventVisibility } from "../context/CalendarContext";
import { buildMonthGrid } from "../utils/calendarGrid";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const VISIBILITY_LABEL: Record<EventVisibility, string> = {
  public: "전체공개",
  member: "부원전용",
  president: "회장단전용",
};

const VISIBILITY_DOT: Record<EventVisibility, string> = {
  public: "bg-wind-gold",
  member: "bg-dawn-teal",
  president: "bg-red-400",
};

export default function CalendarPage() {
  const { role } = useAuth();
  const { events, addEvent, removeEvent } = useCalendar();
  const isPresident = role === "president";
  const isLoggedIn = role === "member" || role === "president";

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const [formDate, setFormDate] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formVisibility, setFormVisibility] = useState<EventVisibility>("public");
  const [showAddConfirm, setShowAddConfirm] = useState(false);

  const cells = useMemo(() => buildMonthGrid(year, month), [year, month]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, typeof events> = {};
    events.forEach((e) => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [events]);

  const goPrevMonth = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else setMonth((m) => m - 1);
    setSelectedDate(null);
  };

  const goNextMonth = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else setMonth((m) => m + 1);
    setSelectedDate(null);
  };

  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedDate(null);
  };

  const openAddForm = (dateStr?: string) => {
    setFormDate(dateStr ?? selectedDate ?? "");
    setFormTitle("");
    setFormTime("");
    setFormLocation("");
    setFormVisibility("public");
    setShowForm(true);
  };

  const trySubmit = () => {
    if (!formDate || !formTitle.trim()) {
      alert("날짜와 제목을 입력해주세요.");
      return;
    }
    setShowAddConfirm(true);
  };

  const handleSubmit = async () => {
    await addEvent({
      date: formDate,
      title: formTitle.trim(),
      time: formTime,
      location: formLocation.trim(),
      visibility: formVisibility,
    });
    setShowAddConfirm(false);
    setShowForm(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await removeEvent(deleteTarget);
    setDeleteTarget(null);
  };

  const selectedEvents = selectedDate ? eventsByDate[selectedDate] ?? [] : [];

  const inputClass =
    "rounded-lg border border-line bg-stage px-3 py-2 text-sm text-backstage outline-none focus:border-dawn-teal";

  return (
    <div>
      <PageHeader eyebrow="Calendar" title="춤바람 캘린더" desc="공연부터 연습 일정까지, 한눈에 확인해요." />

      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button onClick={goPrevMonth} className="rounded-lg p-2 text-mute transition-colors hover:bg-afterglow-2 hover:text-backstage" aria-label="이전 달">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <p className="min-w-[120px] text-center font-display text-xl text-backstage">
              {year}년 {month + 1}월
            </p>
            <button onClick={goNextMonth} className="rounded-lg p-2 text-mute transition-colors hover:bg-afterglow-2 hover:text-backstage" aria-label="다음 달">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={goToday} className="rounded-lg border border-line px-3 py-1.5 text-xs text-mute hover:border-dawn-teal/40 hover:text-dawn-teal">
              오늘
            </button>
            {isPresident && (
              <button onClick={() => openAddForm()} className="rounded-lg bg-wind-gold px-3 py-1.5 text-xs font-semibold text-stage">
                + 일정 추가
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-7 gap-1">
          {WEEKDAYS.map((w, i) => (
            <div key={w} className={`pb-2 text-center font-mono text-xs ${i === 0 ? "text-red-300/70" : i === 6 ? "text-dawn-teal/70" : "text-mute"}`}>
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell) => {
            const dayEvents = eventsByDate[cell.dateStr] ?? [];
            const isSelected = selectedDate === cell.dateStr;
            const weekday = cell.date.getDay();

            return (
              <button
                key={cell.dateStr}
                onClick={() => setSelectedDate(isSelected ? null : cell.dateStr)}
                className={[
                  "flex aspect-square flex-col items-center gap-1 rounded-lg p-1.5 pt-2 text-left transition-colors",
                  cell.inCurrentMonth ? "" : "opacity-30",
                  isSelected ? "bg-wind-gold/15 ring-1 ring-wind-gold/50" : "hover:bg-afterglow-2",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-6 w-6 items-center justify-center rounded-full font-mono text-xs",
                    cell.isToday ? "bg-wind-gold text-stage font-bold" : "",
                    !cell.isToday && weekday === 0 ? "text-red-300/80" : "",
                    !cell.isToday && weekday === 6 ? "text-dawn-teal/80" : "",
                    !cell.isToday && weekday !== 0 && weekday !== 6 ? "text-backstage/80" : "",
                  ].join(" ")}
                >
                  {cell.date.getDate()}
                </span>
                <div className="flex flex-wrap justify-center gap-0.5">
                  {dayEvents.slice(0, 3).map((e) => (
                    <span key={e.id} className={`h-1.5 w-1.5 rounded-full ${VISIBILITY_DOT[e.visibility]}`} />
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-line pt-4 text-xs text-mute">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-wind-gold" /> 전체공개
          </div>
          {isLoggedIn && (
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-dawn-teal" /> 부원전용
            </div>
          )}
          {isPresident && (
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-400" /> 회장단전용
            </div>
          )}
        </div>
      </Card>

      {selectedDate && (
        <Card className="mt-4">
          <div className="flex items-center justify-between">
            <p className="font-display text-lg text-backstage">{selectedDate.replace(/-/g, ". ")}</p>
            {isPresident && (
              <button onClick={() => openAddForm(selectedDate)} className="rounded-lg border border-wind-gold/40 bg-wind-gold/10 px-3 py-1.5 text-xs font-semibold text-wind-gold">
                + 이 날짜에 추가
              </button>
            )}
          </div>

          {selectedEvents.length === 0 ? (
            <p className="mt-3 text-sm text-mute">이 날짜엔 등록된 일정이 없어요.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {selectedEvents.map((e) => (
                <div key={e.id} className="rounded-lg border border-line bg-stage px-3 py-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${VISIBILITY_DOT[e.visibility]}`} />
                        <span className="text-sm font-medium text-backstage">{e.title}</span>
                      </div>
                      <p className="mt-1 font-mono text-xs text-mute">
                        {e.time && `${e.time}`}
                        {e.location && ` · ${e.location}`}
                        {" · "}
                        {VISIBILITY_LABEL[e.visibility]}
                      </p>
                    </div>
                    {isPresident && e.source === "general" && (
                      <button onClick={() => setDeleteTarget(e.id)} className="shrink-0 text-xs text-mute hover:text-red-300">
                        삭제
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stage/70 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div onClick={(e) => e.stopPropagation()} className="mx-4 w-full max-w-sm rounded-2xl border border-line bg-afterglow p-6">
            <p className="font-display text-lg text-backstage">일정 추가</p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1.5 block text-xs text-mute">날짜</label>
                <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className={`${inputClass} w-full`} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-mute">제목</label>
                <input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="예: 2026 개강공연" className={`${inputClass} w-full`} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-mute">시간</label>
                <input type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} className={`${inputClass} w-full`} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-mute">장소</label>
                <input value={formLocation} onChange={(e) => setFormLocation(e.target.value)} placeholder="예: 학생회관 대강당" className={`${inputClass} w-full`} />
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-mute">공개 범위</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFormVisibility("public")}
                    className={`flex-1 rounded-lg border px-2 py-2 text-xs font-semibold transition-colors ${
                      formVisibility === "public" ? "border-wind-gold/50 bg-wind-gold/10 text-wind-gold" : "border-line text-mute"
                    }`}
                  >
                    전체공개
                  </button>
                  <button
                    onClick={() => setFormVisibility("member")}
                    className={`flex-1 rounded-lg border px-2 py-2 text-xs font-semibold transition-colors ${
                      formVisibility === "member" ? "border-dawn-teal/50 bg-dawn-teal/10 text-dawn-teal" : "border-line text-mute"
                    }`}
                  >
                    부원전용
                  </button>
                  <button
                    onClick={() => setFormVisibility("president")}
                    className={`flex-1 rounded-lg border px-2 py-2 text-xs font-semibold transition-colors ${
                      formVisibility === "president" ? "border-red-400/50 bg-red-400/10 text-red-300" : "border-line text-mute"
                    }`}
                  >
                    회장단전용
                  </button>
                </div>
                <p className="mt-1.5 text-[11px] text-mute">
                  {formVisibility === "public" && "비로그인 방문자도 볼 수 있어요. (예: 개강공연, 동아리페어)"}
                  {formVisibility === "member" && "로그인한 부원만 볼 수 있어요. (예: 중간점검, 리허설)"}
                  {formVisibility === "president" && "회장단만 볼 수 있어요. (예: 회장단 회의)"}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="rounded-lg border border-line px-4 py-2 text-sm text-mute">
                취소
              </button>
              <button onClick={trySubmit} className="rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage">
                등록
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stage/70 backdrop-blur-sm" onClick={() => setShowAddConfirm(false)}>
          <div onClick={(e) => e.stopPropagation()} className="mx-4 w-full max-w-sm rounded-2xl border border-line bg-afterglow p-6">
            <p className="font-display text-lg text-backstage">일정을 등록하시겠습니까?</p>
            <p className="mt-2 text-sm text-backstage/70">{VISIBILITY_LABEL[formVisibility]}으로 등록됩니다.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowAddConfirm(false)} className="rounded-lg border border-line px-4 py-2 text-sm text-mute">
                아니요
              </button>
              <button onClick={handleSubmit} className="rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage">
                등록할게요
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stage/70 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div onClick={(e) => e.stopPropagation()} className="mx-4 w-full max-w-sm rounded-2xl border border-red-400/30 bg-afterglow p-6">
            <p className="font-display text-lg text-backstage">이 일정을 삭제하시겠습니까?</p>
            <p className="mt-2 text-sm text-backstage/70">삭제된 일정은 복구할 수 없습니다.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} className="rounded-lg border border-line px-4 py-2 text-sm text-mute">
                아니요
              </button>
              <button onClick={handleDeleteConfirm} className="rounded-lg border border-red-400/40 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-300">
                삭제할게요
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}