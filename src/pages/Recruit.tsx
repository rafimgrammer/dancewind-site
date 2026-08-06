// src/pages/Recruit.tsx
import { useState } from "react";
import { PageHeader, Card, Pill } from "../components/Ui";
import { Skeleton } from "../components/Skeleton";
import { EditModeBanner, IconButton, ConfirmModal, type PendingConfirm } from "../components/InlineAdmin";
import { useAuth } from "../context/AuthContext";
import { useRecruitContent, type RecruitContent } from "../context/RecruitContentContext";

export default function Recruit() {
  const { role } = useAuth();
  const isPresident = role === "president";
  const { content, steps, loading, editContent, addStep, editStep, removeStep } = useRecruitContent();

  const [editMode, setEditMode] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);

  const [editingBanner, setEditingBanner] = useState(false);
  const [bannerDraft, setBannerDraft] = useState<RecruitContent | null>(null);

  const [stepEditingId, setStepEditingId] = useState<string | null>(null);
  const [stepDraft, setStepDraft] = useState({ title: "", description: "" });
  const [addingStep, setAddingStep] = useState(false);
  const [newStep, setNewStep] = useState({ title: "", description: "" });

  const runConfirm = async () => {
    if (!pendingConfirm) return;
    await pendingConfirm.onConfirm();
    setPendingConfirm(null);
  };

  const startEditBanner = () => {
    if (!content) return;
    setBannerDraft(content);
    setEditingBanner(true);
  };

  const saveBanner = () => {
    if (!bannerDraft) return;
    setPendingConfirm({
      title: "모집 안내를 저장하시겠습니까?",
      desc: "바로 모든 방문자에게 반영돼요.",
      actionLabel: "저장할게요",
      onConfirm: async () => {
        await editContent(bannerDraft);
        setEditingBanner(false);
      },
    });
  };

  const saveNewStep = () => {
    setPendingConfirm({
      title: "이 단계를 추가하시겠습니까?",
      desc: "",
      actionLabel: "추가할게요",
      onConfirm: async () => {
        await addStep(newStep.title, newStep.description);
        setNewStep({ title: "", description: "" });
        setAddingStep(false);
      },
    });
  };

  const saveStepEdit = () => {
    if (!stepEditingId) return;
    setPendingConfirm({
      title: "이 단계를 수정하시겠습니까?",
      desc: "",
      actionLabel: "수정할게요",
      onConfirm: async () => {
        await editStep(stepEditingId, stepDraft.title, stepDraft.description);
        setStepEditingId(null);
      },
    });
  };

  const confirmDeleteStep = (id: string) => {
    setPendingConfirm({
      title: "이 단계를 삭제하시겠습니까?",
      desc: "삭제하면 되돌릴 수 없어요.",
      actionLabel: "삭제할게요",
      onConfirm: async () => {
        await removeStep(id);
      },
    });
  };

  return (
    <div>
      {isPresident && <EditModeBanner editMode={editMode} onToggle={() => setEditMode((v) => !v)} />}

      <PageHeader eyebrow="Recruiting" title="신입 부원 모집 안내" desc="이번 바람은 여러분 차례입니다." />

      <div className="rounded-2xl border border-wind-gold/30 bg-gradient-to-br from-afterglow to-stage p-6 md:p-8">
        {loading || !content ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        ) : editingBanner && bannerDraft ? (
          <div className="max-w-md space-y-2.5">
            <input
              value={bannerDraft.termLabel}
              onChange={(e) => setBannerDraft({ ...bannerDraft, termLabel: e.target.value })}
              placeholder="모집 태그 (예: 2026 2학기 모집)"
              className="w-full rounded-lg border border-dawn-teal/50 bg-stage px-3 py-2 text-sm text-backstage outline-none"
            />
            <input
              value={bannerDraft.periodText}
              onChange={(e) => setBannerDraft({ ...bannerDraft, periodText: e.target.value })}
              placeholder="지원 기간 문구"
              className="w-full rounded-lg border border-dawn-teal/50 bg-stage px-3 py-2 text-sm text-backstage outline-none"
            />
            <input
              value={bannerDraft.scheduleText}
              onChange={(e) => setBannerDraft({ ...bannerDraft, scheduleText: e.target.value })}
              placeholder="오디션/발표 일정 문구"
              className="w-full rounded-lg border border-dawn-teal/50 bg-stage px-3 py-2 text-sm text-backstage outline-none"
            />
            <input
              value={bannerDraft.applyUrl}
              onChange={(e) => setBannerDraft({ ...bannerDraft, applyUrl: e.target.value })}
              placeholder="지원서 링크 (예: https://forms.gle/...)"
              className="w-full rounded-lg border border-dawn-teal/50 bg-stage px-3 py-2 text-sm text-backstage outline-none"
            />

            <label className="flex items-center gap-2 pt-1 text-sm text-backstage/85">
              <input
                type="checkbox"
                checked={bannerDraft.applyOpen}
                onChange={(e) => setBannerDraft({ ...bannerDraft, applyOpen: e.target.checked })}
                className="accent-wind-gold"
              />
              지금 지원서 접수 중이에요 (끄면 "지원 기간이 종료되었어요"로 바뀌어요)
            </label>

            <div className="flex gap-2 pt-1">
              <button onClick={saveBanner} className="rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage">저장</button>
              <button onClick={() => setEditingBanner(false)} className="rounded-lg border border-line px-4 py-2 text-sm text-mute">취소</button>
            </div>
          </div>
        ) : (
          <>
            {editMode && isPresident && (
              <div className="mb-3">
                <IconButton onClick={startEditBanner} label="✎ 모집 안내 수정" />
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <Pill tone="gold">{content.termLabel}</Pill>
              <Pill tone="teal">경력 무관</Pill>
              {!content.applyOpen && <Pill tone="mute">모집 마감</Pill>}
            </div>
            <p className="mt-4 font-display text-2xl text-backstage">{content.periodText}</p>
            <p className="mt-1 text-sm text-backstage/70">{content.scheduleText}</p>

            {content.applyOpen ? (
              <a
                href={content.applyUrl || "#"}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex rounded-full bg-wind-gold px-6 py-3 text-sm font-semibold text-stage transition-transform hover:-translate-y-0.5"
              >
                지원서 작성하기
              </a>
            ) : (
              <button
                disabled
                className="mt-6 inline-flex cursor-not-allowed rounded-full border border-line px-6 py-3 text-sm font-semibold text-mute"
              >
                지원 기간이 종료되었어요
              </button>
            )}
          </>
        )}
      </div>

      <div className="mt-10">
        <p className="font-mono text-xs tracking-[0.2em] text-dawn-teal uppercase">Process</p>
        <h2 className="mt-2 font-display text-2xl text-backstage">지원 방법</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {loading ? (
            <>
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </>
          ) : (
            steps.map((s, i) => (
              <Card key={s.id} className="relative">
                {stepEditingId === s.id ? (
                  <div className="space-y-2">
                    <input
                      value={stepDraft.title}
                      onChange={(e) => setStepDraft({ ...stepDraft, title: e.target.value })}
                      className="w-full rounded-lg border border-dawn-teal/50 bg-stage px-2 py-1 text-sm text-backstage outline-none"
                    />
                    <textarea
                      value={stepDraft.description}
                      onChange={(e) => setStepDraft({ ...stepDraft, description: e.target.value })}
                      rows={3}
                      className="w-full resize-none rounded-lg border border-dawn-teal/50 bg-stage px-2 py-1 text-sm text-backstage outline-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={saveStepEdit} className="rounded-lg bg-wind-gold px-3 py-1 text-xs font-semibold text-stage">저장</button>
                      <button onClick={() => setStepEditingId(null)} className="rounded-lg border border-line px-3 py-1 text-xs text-mute">취소</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-wind-gold">STEP {i + 1}</span>
                      {editMode && isPresident && (
                        <div className="flex gap-1.5">
                          <IconButton onClick={() => { setStepEditingId(s.id); setStepDraft({ title: s.title, description: s.description }); }} label="수정" />
                          <IconButton onClick={() => confirmDeleteStep(s.id)} label="삭제" tone="red" />
                        </div>
                      )}
                    </div>
                    <p className="mt-2 font-display text-lg text-backstage">{s.title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-backstage/70">{s.description}</p>
                  </>
                )}
              </Card>
            ))
          )}
        </div>

        {editMode && isPresident && (
          <div className="mt-3">
            {!addingStep ? (
              <button
                onClick={() => setAddingStep(true)}
                className="rounded-lg border border-dashed border-line px-4 py-2 text-xs text-mute hover:border-wind-gold/50 hover:text-wind-gold"
              >
                + 단계 추가
              </button>
            ) : (
              <div className="max-w-sm space-y-2 rounded-lg border border-line bg-afterglow p-4">
                <input
                  value={newStep.title}
                  onChange={(e) => setNewStep({ ...newStep, title: e.target.value })}
                  placeholder="단계 이름 (예: 최종 합류)"
                  className="w-full rounded-lg border border-line bg-stage px-3 py-1.5 text-sm text-backstage outline-none focus:border-dawn-teal"
                />
                <textarea
                  value={newStep.description}
                  onChange={(e) => setNewStep({ ...newStep, description: e.target.value })}
                  rows={2}
                  placeholder="설명"
                  className="w-full resize-none rounded-lg border border-line bg-stage px-3 py-1.5 text-sm text-backstage outline-none focus:border-dawn-teal"
                />
                <div className="flex gap-2">
                  <button onClick={saveNewStep} className="rounded-lg bg-wind-gold px-3 py-1.5 text-xs font-semibold text-stage">추가</button>
                  <button onClick={() => setAddingStep(false)} className="rounded-lg border border-line px-3 py-1.5 text-xs text-mute">취소</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmModal pending={pendingConfirm} onCancel={() => setPendingConfirm(null)} onConfirm={runConfirm} />
    </div>
  );
}