// src/pages/Home.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import WindLine from "../components/WindLine";
import { Card, Pill } from "../components/Ui";
import Reveal from "../components/Reveal";
import VisitorCounter from "../components/VisitorCounter";
import { Skeleton } from "../components/Skeleton";
import KakaoShareButton from "../components/KakaoShareButton";
import { useAuth } from "../context/AuthContext";
import { useHomeContent, type HomeIntro, type ScheduleType } from "../context/HomeContentContext";

const CHANNELS = [
  {
    name: "Instagram",
    handle: "@hallym_dancewind",
    href: "https://www.instagram.com/hallym_dancewind?igsh=MWFweWs4cGVvcTNvYw==",
    desc: "연습 영상과 공연 스케치",
  },
  {
    name: "YouTube",
    handle: "춤바람 CHUMBARAM",
    href: "https://youtube.com/@2dancewind2023?si=jPvCFrEvj8KHF4H1",
    desc: "정기공연 풀영상 아카이브",
  },
];

const SCHEDULE_TYPES: ScheduleType[] = ["공연", "모집", "행사"];

interface PendingConfirm {
  title: string;
  desc: string;
  actionLabel: string;
  onConfirm: () => Promise<void>;
}

function IconButton({ onClick, label, tone = "teal" }: { onClick: () => void; label: string; tone?: "teal" | "red" }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md border border-line bg-stage px-2 py-1 text-[11px] transition-colors ${
        tone === "red" ? "text-mute hover:border-red-400/50 hover:text-red-300" : "text-mute hover:border-dawn-teal/50 hover:text-dawn-teal"
      }`}
    >
      {label}
    </button>
  );
}

export default function Home() {
  const { role } = useAuth();
  const isPresident = role === "president";

  const {
    intro,
    history,
    schedule,
    loading,
    editIntro,
    addHistoryEntry,
    editHistoryEntry,
    removeHistoryEntry,
    addScheduleEntry,
    editScheduleEntry,
    removeScheduleEntry,
  } = useHomeContent();

  const [editMode, setEditMode] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);

  // 히어로 편집
  const [editingHero, setEditingHero] = useState(false);
  const [heroDraft, setHeroDraft] = useState<HomeIntro | null>(null);

  // 인삿말 편집
  const [editingGreeting, setEditingGreeting] = useState(false);
  const [greetingDraft, setGreetingDraft] = useState<{ body: string; signature: string }>({
    body: "",
    signature: "",
  });

  // 역사 편집
  const [historyEditingId, setHistoryEditingId] = useState<string | null>(null);
  const [historyDraft, setHistoryDraft] = useState({ year: "", description: "" });
  const [addingHistory, setAddingHistory] = useState(false);
  const [newHistory, setNewHistory] = useState({ year: "", description: "" });

  // 일정 편집
  const [scheduleEditingId, setScheduleEditingId] = useState<string | null>(null);
  const [scheduleDraft, setScheduleDraft] = useState({ eventDate: "", label: "", type: "공연" as ScheduleType });
  const [addingSchedule, setAddingSchedule] = useState(false);
  const [newSchedule, setNewSchedule] = useState({ eventDate: "", label: "", type: "공연" as ScheduleType });

  const startEditHero = () => {
    if (!intro) return;
    setHeroDraft(intro);
    setEditingHero(true);
  };

  const startEditGreeting = () => {
    if (!intro) return;
    setGreetingDraft({ body: intro.greetingBody, signature: intro.greetingSignature });
    setEditingGreeting(true);
  };

  const saveHero = () => {
    if (!heroDraft || !intro) return;
    setPendingConfirm({
      title: "히어로 문구를 저장하시겠습니까?",
      desc: "바로 모든 방문자에게 반영돼요.",
      actionLabel: "저장할게요",
      onConfirm: async () => {
        await editIntro(heroDraft);
        setEditingHero(false);
      },
    });
  };

  const saveGreeting = () => {
    if (!intro) return;
    setPendingConfirm({
      title: "인삿말을 저장하시겠습니까?",
      desc: "바로 모든 방문자에게 반영돼요.",
      actionLabel: "저장할게요",
      onConfirm: async () => {
        await editIntro({ ...intro, greetingBody: greetingDraft.body, greetingSignature: greetingDraft.signature });
        setEditingGreeting(false);
      },
    });
  };

  const startEditHistory = (id: string, year: string, description: string) => {
    setHistoryEditingId(id);
    setHistoryDraft({ year, description });
  };

  const saveHistoryEdit = () => {
    if (!historyEditingId) return;
    setPendingConfirm({
      title: "이 연혁을 수정하시겠습니까?",
      desc: "",
      actionLabel: "수정할게요",
      onConfirm: async () => {
        await editHistoryEntry(historyEditingId, historyDraft.year, historyDraft.description);
        setHistoryEditingId(null);
      },
    });
  };

  const saveNewHistory = () => {
    setPendingConfirm({
      title: "이 연혁을 추가하시겠습니까?",
      desc: "",
      actionLabel: "추가할게요",
      onConfirm: async () => {
        await addHistoryEntry(newHistory.year, newHistory.description);
        setNewHistory({ year: "", description: "" });
        setAddingHistory(false);
      },
    });
  };

  const confirmDeleteHistory = (id: string) => {
    setPendingConfirm({
      title: "이 연혁을 삭제하시겠습니까?",
      desc: "삭제하면 되돌릴 수 없어요.",
      actionLabel: "삭제할게요",
      onConfirm: async () => {
        await removeHistoryEntry(id);
      },
    });
  };

  const startEditSchedule = (id: string, eventDate: string, label: string, type: ScheduleType) => {
    setScheduleEditingId(id);
    setScheduleDraft({ eventDate, label, type });
  };

  const saveScheduleEdit = () => {
    if (!scheduleEditingId) return;
    setPendingConfirm({
      title: "이 일정을 수정하시겠습니까?",
      desc: "",
      actionLabel: "수정할게요",
      onConfirm: async () => {
        await editScheduleEntry(scheduleEditingId, scheduleDraft.eventDate, scheduleDraft.label, scheduleDraft.type);
        setScheduleEditingId(null);
      },
    });
  };

  const saveNewSchedule = () => {
    setPendingConfirm({
      title: "이 일정을 추가하시겠습니까?",
      desc: "",
      actionLabel: "추가할게요",
      onConfirm: async () => {
        await addScheduleEntry(newSchedule.eventDate, newSchedule.label, newSchedule.type);
        setNewSchedule({ eventDate: "", label: "", type: "공연" });
        setAddingSchedule(false);
      },
    });
  };

  const confirmDeleteSchedule = (id: string) => {
    setPendingConfirm({
      title: "이 일정을 삭제하시겠습니까?",
      desc: "삭제하면 되돌릴 수 없어요.",
      actionLabel: "삭제할게요",
      onConfirm: async () => {
        await removeScheduleEntry(id);
      },
    });
  };

  const runConfirm = async () => {
    if (!pendingConfirm) return;
    await pendingConfirm.onConfirm();
    setPendingConfirm(null);
  };

  return (
    <div className="space-y-24">
      {isPresident && (
        <div className="flex items-center justify-between rounded-xl border border-dawn-teal/40 bg-dawn-teal/5 px-4 py-2.5">
          <p className="text-xs text-dawn-teal">회장단 전용 · 홈 화면 내용을 직접 수정할 수 있어요.</p>
          <button
            onClick={() => setEditMode((v) => !v)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              editMode
                ? "border-wind-gold bg-wind-gold text-stage"
                : "border-line text-backstage/80 hover:border-dawn-teal/50"
            }`}
          >
            {editMode ? "편집 모드 켜짐" : "편집 모드 켜기"}
          </button>
        </div>
      )}

      {/* 히어로 — 페이지의 첫인상이자 테제, 바로 보여야 하니 Reveal 미적용 */}
      <section className="relative overflow-hidden rounded-3xl border border-line bg-afterglow">
        <div className="grid gap-8 p-6 md:grid-cols-[1.1fr_0.9fr] md:p-10">
          <div className="flex flex-col justify-center animate-rise">
            {loading || !intro ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-10 w-72" />
                <Skeleton className="h-16 w-full max-w-md" />
              </div>
            ) : editingHero && heroDraft ? (
              <div className="space-y-2.5">
                <input
                  value={heroDraft.heroEyebrow}
                  onChange={(e) => setHeroDraft({ ...heroDraft, heroEyebrow: e.target.value })}
                  placeholder="상단 태그 (예: 2011 ~ NOW · 90+ CREW)"
                  className="w-full rounded-lg border border-dawn-teal/50 bg-stage px-3 py-2 text-sm text-backstage outline-none"
                />
                <div className="grid gap-2 sm:grid-cols-3">
                  <input
                    value={heroDraft.heroTitleLine1}
                    onChange={(e) => setHeroDraft({ ...heroDraft, heroTitleLine1: e.target.value })}
                    placeholder="제목 1줄"
                    className="rounded-lg border border-dawn-teal/50 bg-stage px-3 py-2 text-sm text-backstage outline-none"
                  />
                  <input
                    value={heroDraft.heroTitleLine2}
                    onChange={(e) => setHeroDraft({ ...heroDraft, heroTitleLine2: e.target.value })}
                    placeholder="제목 2줄"
                    className="rounded-lg border border-dawn-teal/50 bg-stage px-3 py-2 text-sm text-backstage outline-none"
                  />
                  <input
                    value={heroDraft.heroTitleHighlight}
                    onChange={(e) => setHeroDraft({ ...heroDraft, heroTitleHighlight: e.target.value })}
                    placeholder="강조 3줄 (골드색)"
                    className="rounded-lg border border-dawn-teal/50 bg-stage px-3 py-2 text-sm text-backstage outline-none"
                  />
                </div>
                <textarea
                  value={heroDraft.heroBody}
                  onChange={(e) => setHeroDraft({ ...heroDraft, heroBody: e.target.value })}
                  rows={3}
                  placeholder="소개 문구"
                  className="w-full resize-none rounded-lg border border-dawn-teal/50 bg-stage px-3 py-2 text-sm text-backstage outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveHero}
                    className="rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => setEditingHero(false)}
                    className="rounded-lg border border-line px-4 py-2 text-sm text-mute"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <>
                {editMode && isPresident && (
                  <div className="mb-2">
                    <IconButton onClick={startEditHero} label="✎ 히어로 수정" />
                  </div>
                )}
                <Pill tone="teal">{intro.heroEyebrow}</Pill>
                <h1 className="mt-4 font-display text-4xl leading-tight text-backstage md:text-5xl">
                  {intro.heroTitleLine1}
                  <br />
                  {intro.heroTitleLine2}
                  <br />
                  <span className="text-wind-gold">{intro.heroTitleHighlight}</span>
                </h1>
                <p className="mt-5 max-w-md text-[15px] leading-relaxed text-backstage/70">{intro.heroBody}</p>
              </>
            )}

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/recruit"
                className="rounded-full bg-wind-gold px-6 py-3 text-sm font-semibold text-stage transition-transform hover:-translate-y-0.5"
              >
                신입 부원 모집 안내
              </Link>
              <Link
                to="/videos"
                className="rounded-full border border-line px-6 py-3 text-sm text-backstage/85 transition-colors hover:border-dawn-teal/60 hover:text-dawn-teal"
              >
                활동 영상 보기
              </Link>
              <KakaoShareButton
                label="카카오톡으로 초대하기"
                templateArgs={{
                  title: "춤바람 — 모두의 스텝이 하나의 박자로",
                  description: "한림대학교 중앙 댄스 동아리 춤바람 홈페이지입니다.",
                  image_url: "https://hallymdancewind.com/share/home-share.png",
                  button_title: "홈페이지 구경하기",
                  link_url: "https://hallymdancewind.com",
                }}
              />
            </div>
          </div>

          {/* 영상 자리 — 홍보영상 자동재생, 무대 조명처럼 살짝 기울인 비대칭 프레임 */}
          <div className="relative flex items-center justify-center">
            <div className="relative w-full max-w-sm -rotate-2 rounded-2xl border border-line bg-stage p-2 shadow-2xl shadow-black/40 transition-transform duration-500 hover:rotate-0">
              <div className="relative aspect-[9/13] overflow-hidden rounded-xl bg-stage">
                <iframe
                  className="pointer-events-none absolute left-1/2 top-1/2 h-[130%] w-[130%] -translate-x-1/2 -translate-y-1/2"
                  src="https://www.youtube.com/embed/Ehg9VxymfT4?autoplay=1&mute=1&loop=1&playlist=Ehg9VxymfT4&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1"
                  title="2026 춤바람 홍보영상"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              </div>
              <span className="absolute -bottom-3 left-4 rounded-full bg-dawn-teal px-3 py-1 font-mono text-[10px] text-stage">
                LIVE AT STAGE
              </span>

              {/* 이어폰 줄 디테일 */}
              <svg
                className="pointer-events-none absolute -bottom-24 right-6 h-28 w-16 overflow-visible"
                viewBox="0 0 60 100"
                fill="none"
              >
                <path
                  d="M10 0 C 10 30, 45 20, 40 50 S 15 75, 20 95"
                  stroke="var(--color-line)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle
                  cx="20"
                  cy="95"
                  r="6"
                  fill="var(--color-afterglow-2)"
                  stroke="var(--color-wind-gold)"
                  strokeWidth="1.5"
                />
                <circle cx="20" cy="95" r="2" fill="var(--color-wind-gold)" />
              </svg>
            </div>
          </div>
        </div>
        <WindLine variant="hero" className="h-24 w-full opacity-80" />
      </section>

      {/* 회장단 인삿말 */}
      <Reveal>
        <section className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div>
            <p className="font-mono text-xs tracking-[0.2em] text-dawn-teal uppercase">Greeting</p>
            <h2 className="mt-2 font-display text-2xl text-backstage md:text-3xl">회장단 인삿말</h2>
          </div>
          <Card>
            {loading || !intro ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : editingGreeting ? (
              <div className="space-y-2.5">
                <textarea
                  value={greetingDraft.body}
                  onChange={(e) => setGreetingDraft({ ...greetingDraft, body: e.target.value })}
                  rows={6}
                  className="w-full resize-none rounded-lg border border-dawn-teal/50 bg-stage px-3 py-2 text-sm text-backstage outline-none"
                />
                <input
                  value={greetingDraft.signature}
                  onChange={(e) => setGreetingDraft({ ...greetingDraft, signature: e.target.value })}
                  placeholder="서명 (예: — 19기 강지호, 춤바람 회장)"
                  className="w-full rounded-lg border border-dawn-teal/50 bg-stage px-3 py-2 text-xs text-mute outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveGreeting}
                    className="rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => setEditingGreeting(false)}
                    className="rounded-lg border border-line px-4 py-2 text-sm text-mute"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <>
                {editMode && isPresident && (
                  <div className="mb-3">
                    <IconButton onClick={startEditGreeting} label="✎ 인삿말 수정" />
                  </div>
                )}
                <p className="text-[15px] leading-relaxed text-backstage/85">{intro.greetingBody}</p>
                <p className="mt-4 font-mono text-xs text-mute">{intro.greetingSignature}</p>
              </>
            )}
          </Card>
        </section>
      </Reveal>

      {/* 춤바람의 역사 — 실제 타임라인이므로 순서 장치 사용 */}
      <Reveal delay={100}>
        <section>
          <p className="font-mono text-xs tracking-[0.2em] text-dawn-teal uppercase">History</p>
          <h2 className="mt-2 font-display text-2xl text-backstage md:text-3xl">춤바람의 역사</h2>
          <div className="mt-8 space-y-0">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : (
              history.map((h, i) => (
                <div key={h.id} className="group flex gap-5 border-l border-line pl-6 pb-8 last:pb-0">
                  <div className="relative -ml-[29px] flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line bg-stage font-mono text-[10px] text-wind-gold">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    {historyEditingId === h.id ? (
                      <div className="space-y-2">
                        <input
                          value={historyDraft.year}
                          onChange={(e) => setHistoryDraft({ ...historyDraft, year: e.target.value })}
                          className="w-28 rounded-lg border border-dawn-teal/50 bg-stage px-3 py-1.5 text-sm text-backstage outline-none"
                        />
                        <textarea
                          value={historyDraft.description}
                          onChange={(e) => setHistoryDraft({ ...historyDraft, description: e.target.value })}
                          rows={2}
                          className="w-full resize-none rounded-lg border border-dawn-teal/50 bg-stage px-3 py-1.5 text-sm text-backstage outline-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={saveHistoryEdit}
                            className="rounded-lg bg-wind-gold px-3 py-1 text-xs font-semibold text-stage"
                          >
                            저장
                          </button>
                          <button
                            onClick={() => setHistoryEditingId(null)}
                            className="rounded-lg border border-line px-3 py-1 text-xs text-mute"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <p className="font-display text-lg text-wind-gold">{h.year}</p>
                          {editMode && isPresident && (
                            <div className="flex gap-1.5">
                              <IconButton onClick={() => startEditHistory(h.id, h.year, h.description)} label="수정" />
                              <IconButton onClick={() => confirmDeleteHistory(h.id)} label="삭제" tone="red" />
                            </div>
                          )}
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-backstage/75">{h.description}</p>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}

            {editMode && isPresident && (
              <div className="pl-6">
                {!addingHistory ? (
                  <button
                    onClick={() => setAddingHistory(true)}
                    className="rounded-lg border border-dashed border-line px-4 py-2 text-xs text-mute hover:border-wind-gold/50 hover:text-wind-gold"
                  >
                    + 연혁 추가
                  </button>
                ) : (
                  <div className="max-w-md space-y-2 rounded-lg border border-line bg-afterglow p-4">
                    <input
                      value={newHistory.year}
                      onChange={(e) => setNewHistory({ ...newHistory, year: e.target.value })}
                      placeholder="연도 (예: 2027)"
                      className="w-28 rounded-lg border border-line bg-stage px-3 py-1.5 text-sm text-backstage outline-none focus:border-dawn-teal"
                    />
                    <textarea
                      value={newHistory.description}
                      onChange={(e) => setNewHistory({ ...newHistory, description: e.target.value })}
                      rows={2}
                      placeholder="내용"
                      className="w-full resize-none rounded-lg border border-line bg-stage px-3 py-1.5 text-sm text-backstage outline-none focus:border-dawn-teal"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={saveNewHistory}
                        className="rounded-lg bg-wind-gold px-3 py-1.5 text-xs font-semibold text-stage"
                      >
                        추가
                      </button>
                      <button
                        onClick={() => setAddingHistory(false)}
                        className="rounded-lg border border-line px-3 py-1.5 text-xs text-mute"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </Reveal>

      {/* 일정 */}
      <Reveal delay={100}>
        <section>
          <p className="font-mono text-xs tracking-[0.2em] text-dawn-teal uppercase">Schedule</p>
          <h2 className="mt-2 font-display text-2xl text-backstage md:text-3xl">춤바람 일정</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : (
              schedule.map((s) => (
                <Card key={s.id} className="group flex items-start justify-between gap-3">
                  {scheduleEditingId === s.id ? (
                    <div className="w-full space-y-2">
                      <input
                        type="date"
                        value={scheduleDraft.eventDate}
                        onChange={(e) => setScheduleDraft({ ...scheduleDraft, eventDate: e.target.value })}
                        className="w-full rounded-lg border border-dawn-teal/50 bg-stage px-2 py-1 text-xs text-backstage outline-none"
                      />
                      <input
                        value={scheduleDraft.label}
                        onChange={(e) => setScheduleDraft({ ...scheduleDraft, label: e.target.value })}
                        className="w-full rounded-lg border border-dawn-teal/50 bg-stage px-2 py-1 text-sm text-backstage outline-none"
                      />
                      <div className="flex gap-1.5">
                        {SCHEDULE_TYPES.map((t) => (
                          <button
                            key={t}
                            onClick={() => setScheduleDraft({ ...scheduleDraft, type: t })}
                            className={`rounded-full border px-2 py-0.5 text-[11px] ${
                              scheduleDraft.type === t
                                ? "border-wind-gold bg-wind-gold/10 text-wind-gold"
                                : "border-line text-mute"
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={saveScheduleEdit}
                          className="rounded-lg bg-wind-gold px-3 py-1 text-xs font-semibold text-stage"
                        >
                          저장
                        </button>
                        <button
                          onClick={() => setScheduleEditingId(null)}
                          className="rounded-lg border border-line px-3 py-1 text-xs text-mute"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="font-mono text-xs text-mute">{s.eventDate}</p>
                        <p className="mt-1.5 text-[15px] font-medium text-backstage">{s.label}</p>
                        {editMode && isPresident && (
                          <div className="mt-2 flex gap-1.5">
                            <IconButton
                              onClick={() => startEditSchedule(s.id, s.eventDate, s.label, s.type)}
                              label="수정"
                            />
                            <IconButton onClick={() => confirmDeleteSchedule(s.id)} label="삭제" tone="red" />
                          </div>
                        )}
                      </div>
                      <Pill tone={s.type === "공연" ? "gold" : s.type === "모집" ? "teal" : "mute"}>{s.type}</Pill>
                    </>
                  )}
                </Card>
              ))
            )}
          </div>

          {editMode && isPresident && (
            <div className="mt-3">
              {!addingSchedule ? (
                <button
                  onClick={() => setAddingSchedule(true)}
                  className="rounded-lg border border-dashed border-line px-4 py-2 text-xs text-mute hover:border-wind-gold/50 hover:text-wind-gold"
                >
                  + 일정 추가
                </button>
              ) : (
                <div className="max-w-sm space-y-2 rounded-lg border border-line bg-afterglow p-4">
                  <input
                    type="date"
                    value={newSchedule.eventDate}
                    onChange={(e) => setNewSchedule({ ...newSchedule, eventDate: e.target.value })}
                    className="w-full rounded-lg border border-line bg-stage px-3 py-1.5 text-sm text-backstage outline-none focus:border-dawn-teal"
                  />
                  <input
                    value={newSchedule.label}
                    onChange={(e) => setNewSchedule({ ...newSchedule, label: e.target.value })}
                    placeholder="일정 내용"
                    className="w-full rounded-lg border border-line bg-stage px-3 py-1.5 text-sm text-backstage outline-none focus:border-dawn-teal"
                  />
                  <div className="flex gap-1.5">
                    {SCHEDULE_TYPES.map((t) => (
                      <button
                        key={t}
                        onClick={() => setNewSchedule({ ...newSchedule, type: t })}
                        className={`rounded-full border px-2 py-0.5 text-[11px] ${
                          newSchedule.type === t
                            ? "border-wind-gold bg-wind-gold/10 text-wind-gold"
                            : "border-line text-mute"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={saveNewSchedule}
                      className="rounded-lg bg-wind-gold px-3 py-1.5 text-xs font-semibold text-stage"
                    >
                      추가
                    </button>
                    <button
                      onClick={() => setAddingSchedule(false)}
                      className="rounded-lg border border-line px-3 py-1.5 text-xs text-mute"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </Reveal>

      {/* 채널 */}
      <Reveal delay={100}>
        <section>
          <p className="font-mono text-xs tracking-[0.2em] text-dawn-teal uppercase">Channels</p>
          <h2 className="mt-2 font-display text-2xl text-backstage md:text-3xl">춤바람 채널</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {CHANNELS.map((c) => (
              <a
                key={c.name}
                href={c.href}
                target="_blank"
                rel="noreferrer"
                className="group rounded-2xl border border-line bg-afterglow p-5 transition-all hover:-translate-y-1 hover:border-dawn-teal/50"
              >
                <p className="font-display text-lg text-backstage group-hover:text-dawn-teal">{c.name}</p>
                <p className="mt-1 font-mono text-xs text-wind-gold">{c.handle}</p>
                <p className="mt-2 text-sm text-mute">{c.desc}</p>
              </a>
            ))}
          </div>
        </section>
      </Reveal>

      {/* 오늘 방문자수 */}
      <Reveal delay={100}>
        <VisitorCounter />
      </Reveal>

      {/* 모집 CTA 배너 */}
      <Reveal delay={100}>
        <section className="relative overflow-hidden rounded-3xl border border-wind-gold/30 bg-gradient-to-br from-afterglow to-stage p-8 text-center md:p-12">
          <p className="font-mono text-xs tracking-[0.2em] text-dawn-teal uppercase">Recruiting</p>
          <h2 className="mt-3 font-display text-3xl text-backstage md:text-4xl">
            이번 바람은, <span className="text-wind-gold">당신 차례.</span>
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-backstage/70">
            경험이 없어도 괜찮아요. 리듬을 즐기려는 마음이면 충분합니다.
          </p>
          <Link
            to="/recruit"
            className="mt-6 inline-flex rounded-full bg-wind-gold px-7 py-3 text-sm font-semibold text-stage transition-transform hover:-translate-y-0.5"
          >
            지원 방법 확인하기
          </Link>
        </section>
      </Reveal>

      {pendingConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stage/70 backdrop-blur-sm"
          onClick={() => setPendingConfirm(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="mx-4 w-full max-w-sm rounded-2xl border border-line bg-afterglow p-6"
          >
            <p className="font-display text-lg text-backstage">{pendingConfirm.title}</p>
            {pendingConfirm.desc && <p className="mt-2 text-sm text-backstage/70">{pendingConfirm.desc}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setPendingConfirm(null)}
                className="rounded-lg border border-line px-4 py-2 text-sm text-mute"
              >
                아니요
              </button>
              <button
                onClick={runConfirm}
                className="rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage"
              >
                {pendingConfirm.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}