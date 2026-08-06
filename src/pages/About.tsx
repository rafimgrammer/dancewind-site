// src/pages/About.tsx
import { useState } from "react";
import { PageHeader, Card, Pill } from "../components/Ui";
import { Skeleton } from "../components/Skeleton";
import { EditModeBanner, IconButton, ConfirmModal, type PendingConfirm } from "../components/InlineAdmin";
import { useAuth } from "../context/AuthContext";
import { useAboutContent } from "../context/AboutContentContext";

export default function About() {
  const { role } = useAuth();
  const isPresident = role === "president";
  const { content, parts, loading, editContent, addPart, editPart, removePart } = useAboutContent();

  const [editMode, setEditMode] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);

  const [editingIntro, setEditingIntro] = useState(false);
  const [introDraft, setIntroDraft] = useState("");

  const [editingPrinciples, setEditingPrinciples] = useState(false);
  const [principlesDraft, setPrinciplesDraft] = useState("");

  const [editingRhythm, setEditingRhythm] = useState(false);
  const [rhythmDraft, setRhythmDraft] = useState("");

  const [partEditingId, setPartEditingId] = useState<string | null>(null);
  const [partDraft, setPartDraft] = useState({ name: "", description: "" });
  const [addingPart, setAddingPart] = useState(false);
  const [newPart, setNewPart] = useState({ name: "", description: "" });

  const runConfirm = async () => {
    if (!pendingConfirm) return;
    await pendingConfirm.onConfirm();
    setPendingConfirm(null);
  };

  const saveIntro = () => {
    if (!content) return;
    setPendingConfirm({
      title: "소개 문구를 저장하시겠습니까?",
      desc: "바로 모든 방문자에게 반영돼요.",
      actionLabel: "저장할게요",
      onConfirm: async () => {
        await editContent({ ...content, introDesc: introDraft });
        setEditingIntro(false);
      },
    });
  };

  const savePrinciples = () => {
    if (!content) return;
    setPendingConfirm({
      title: "'우리가 지키는 것'을 저장하시겠습니까?",
      desc: "",
      actionLabel: "저장할게요",
      onConfirm: async () => {
        const lines = principlesDraft.split("\n").map((l) => l.trim()).filter(Boolean);
        await editContent({ ...content, principles: lines });
        setEditingPrinciples(false);
      },
    });
  };

  const saveRhythm = () => {
    if (!content) return;
    setPendingConfirm({
      title: "'활동 리듬'을 저장하시겠습니까?",
      desc: "",
      actionLabel: "저장할게요",
      onConfirm: async () => {
        const lines = rhythmDraft.split("\n").map((l) => l.trim()).filter(Boolean);
        await editContent({ ...content, rhythm: lines });
        setEditingRhythm(false);
      },
    });
  };

  const saveNewPart = () => {
    setPendingConfirm({
      title: "이 파트를 추가하시겠습니까?",
      desc: "",
      actionLabel: "추가할게요",
      onConfirm: async () => {
        await addPart(newPart.name, newPart.description);
        setNewPart({ name: "", description: "" });
        setAddingPart(false);
      },
    });
  };

  const savePartEdit = () => {
    if (!partEditingId) return;
    setPendingConfirm({
      title: "이 파트를 수정하시겠습니까?",
      desc: "",
      actionLabel: "수정할게요",
      onConfirm: async () => {
        await editPart(partEditingId, partDraft.name, partDraft.description);
        setPartEditingId(null);
      },
    });
  };

  const confirmDeletePart = (id: string) => {
    setPendingConfirm({
      title: "이 파트를 삭제하시겠습니까?",
      desc: "삭제하면 되돌릴 수 없어요.",
      actionLabel: "삭제할게요",
      onConfirm: async () => {
        await removePart(id);
      },
    });
  };

  return (
    <div>
      {isPresident && <EditModeBanner editMode={editMode} onToggle={() => setEditMode((v) => !v)} />}

      <PageHeader
        eyebrow="About"
        title="춤바람 소개"
        desc={content?.introDesc ?? "2011년부터 이어져 온 대학 스트릿 댄스 크루입니다."}
      />

      {editMode && isPresident && content && (
        <div className="mb-6 -mt-4">
          {!editingIntro ? (
            <IconButton onClick={() => { setIntroDraft(content.introDesc); setEditingIntro(true); }} label="✎ 소개 문구 수정" />
          ) : (
            <div className="max-w-xl space-y-2 rounded-lg border border-line bg-afterglow p-4">
              <textarea
                value={introDraft}
                onChange={(e) => setIntroDraft(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-lg border border-dawn-teal/50 bg-stage px-3 py-2 text-sm text-backstage outline-none"
              />
              <div className="flex gap-2">
                <button onClick={saveIntro} className="rounded-lg bg-wind-gold px-3 py-1.5 text-xs font-semibold text-stage">저장</button>
                <button onClick={() => setEditingIntro(false)} className="rounded-lg border border-line px-3 py-1.5 text-xs text-mute">취소</button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <p className="font-display text-lg text-backstage">우리가 지키는 것</p>
            {editMode && isPresident && !editingPrinciples && content && (
              <IconButton
                onClick={() => { setPrinciplesDraft(content.principles.join("\n")); setEditingPrinciples(true); }}
                label="✎ 수정"
              />
            )}
          </div>
          {loading || !content ? (
            <div className="mt-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : editingPrinciples ? (
            <div className="mt-3 space-y-2">
              <p className="text-[11px] text-mute">한 줄에 하나씩 적어주세요.</p>
              <textarea
                value={principlesDraft}
                onChange={(e) => setPrinciplesDraft(e.target.value)}
                rows={4}
                className="w-full resize-none rounded-lg border border-dawn-teal/50 bg-stage px-3 py-2 text-sm text-backstage outline-none"
              />
              <div className="flex gap-2">
                <button onClick={savePrinciples} className="rounded-lg bg-wind-gold px-3 py-1.5 text-xs font-semibold text-stage">저장</button>
                <button onClick={() => setEditingPrinciples(false)} className="rounded-lg border border-line px-3 py-1.5 text-xs text-mute">취소</button>
              </div>
            </div>
          ) : (
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-backstage/80">
              {content.principles.map((p, i) => (
                <li key={i}>· {p}</li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <p className="font-display text-lg text-backstage">활동 리듬</p>
            {editMode && isPresident && !editingRhythm && content && (
              <IconButton
                onClick={() => { setRhythmDraft(content.rhythm.join("\n")); setEditingRhythm(true); }}
                label="✎ 수정"
              />
            )}
          </div>
          {loading || !content ? (
            <div className="mt-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : editingRhythm ? (
            <div className="mt-3 space-y-2">
              <p className="text-[11px] text-mute">한 줄에 하나씩 적어주세요.</p>
              <textarea
                value={rhythmDraft}
                onChange={(e) => setRhythmDraft(e.target.value)}
                rows={4}
                className="w-full resize-none rounded-lg border border-dawn-teal/50 bg-stage px-3 py-2 text-sm text-backstage outline-none"
              />
              <div className="flex gap-2">
                <button onClick={saveRhythm} className="rounded-lg bg-wind-gold px-3 py-1.5 text-xs font-semibold text-stage">저장</button>
                <button onClick={() => setEditingRhythm(false)} className="rounded-lg border border-line px-3 py-1.5 text-xs text-mute">취소</button>
              </div>
            </div>
          ) : (
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-backstage/80">
              {content.rhythm.map((r, i) => (
                <li key={i}>· {r}</li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-8">
        <p className="font-mono text-xs tracking-[0.2em] text-dawn-teal uppercase">Parts</p>
        <h2 className="mt-2 font-display text-2xl text-backstage">파트 구성</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            <>
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </>
          ) : (
            parts.map((p) => (
              <Card key={p.id}>
                {partEditingId === p.id ? (
                  <div className="space-y-2">
                    <input
                      value={partDraft.name}
                      onChange={(e) => setPartDraft({ ...partDraft, name: e.target.value })}
                      className="w-full rounded-lg border border-dawn-teal/50 bg-stage px-2 py-1 text-sm text-backstage outline-none"
                    />
                    <textarea
                      value={partDraft.description}
                      onChange={(e) => setPartDraft({ ...partDraft, description: e.target.value })}
                      rows={2}
                      className="w-full resize-none rounded-lg border border-dawn-teal/50 bg-stage px-2 py-1 text-sm text-backstage outline-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={savePartEdit} className="rounded-lg bg-wind-gold px-3 py-1 text-xs font-semibold text-stage">저장</button>
                      <button onClick={() => setPartEditingId(null)} className="rounded-lg border border-line px-3 py-1 text-xs text-mute">취소</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <Pill>{p.name}</Pill>
                      {editMode && isPresident && (
                        <div className="flex gap-1.5">
                          <IconButton onClick={() => { setPartEditingId(p.id); setPartDraft({ name: p.name, description: p.description }); }} label="수정" />
                          <IconButton onClick={() => confirmDeletePart(p.id)} label="삭제" tone="red" />
                        </div>
                      )}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-backstage/75">{p.description}</p>
                  </>
                )}
              </Card>
            ))
          )}
        </div>

        {editMode && isPresident && (
          <div className="mt-3">
            {!addingPart ? (
              <button
                onClick={() => setAddingPart(true)}
                className="rounded-lg border border-dashed border-line px-4 py-2 text-xs text-mute hover:border-wind-gold/50 hover:text-wind-gold"
              >
                + 파트 추가
              </button>
            ) : (
              <div className="max-w-sm space-y-2 rounded-lg border border-line bg-afterglow p-4">
                <input
                  value={newPart.name}
                  onChange={(e) => setNewPart({ ...newPart, name: e.target.value })}
                  placeholder="파트 이름 (예: 락킹)"
                  className="w-full rounded-lg border border-line bg-stage px-3 py-1.5 text-sm text-backstage outline-none focus:border-dawn-teal"
                />
                <textarea
                  value={newPart.description}
                  onChange={(e) => setNewPart({ ...newPart, description: e.target.value })}
                  rows={2}
                  placeholder="설명"
                  className="w-full resize-none rounded-lg border border-line bg-stage px-3 py-1.5 text-sm text-backstage outline-none focus:border-dawn-teal"
                />
                <div className="flex gap-2">
                  <button onClick={saveNewPart} className="rounded-lg bg-wind-gold px-3 py-1.5 text-xs font-semibold text-stage">추가</button>
                  <button onClick={() => setAddingPart(false)} className="rounded-lg border border-line px-3 py-1.5 text-xs text-mute">취소</button>
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