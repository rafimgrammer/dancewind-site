// src/pages/Officers.tsx
import { useRef, useState } from "react";
import { PageHeader, Card, Pill } from "../components/Ui";
import { Skeleton } from "../components/Skeleton";
import { EditModeBanner, IconButton, ConfirmModal, type PendingConfirm } from "../components/InlineAdmin";
import { useAuth } from "../context/AuthContext";
import { useOfficers, type OfficerInput } from "../context/OfficersContext";

const EMPTY_FORM: OfficerInput = { role: "", name: "", part: "", note: "" };

export default function Officers() {
  const { role } = useAuth();
  const isPresident = role === "president";
  const { officers, loading, addOfficer, editOfficer, removeOfficer, uploadPhoto } = useOfficers();

  const [editMode, setEditMode] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<OfficerInput>(EMPTY_FORM);
  const [adding, setAdding] = useState(false);
  const [newOfficer, setNewOfficer] = useState<OfficerInput>(EMPTY_FORM);

  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const runConfirm = async () => {
    if (!pendingConfirm) return;
    await pendingConfirm.onConfirm();
    setPendingConfirm(null);
  };

  const startEdit = (id: string, data: OfficerInput) => {
    setEditingId(id);
    setDraft(data);
  };

  const saveEdit = () => {
    if (!editingId) return;
    setPendingConfirm({
      title: "프로필을 수정하시겠습니까?",
      desc: "",
      actionLabel: "수정할게요",
      onConfirm: async () => {
        await editOfficer(editingId, draft);
        setEditingId(null);
      },
    });
  };

  const saveNew = () => {
    setPendingConfirm({
      title: "새 프로필을 추가하시겠습니까?",
      desc: "",
      actionLabel: "추가할게요",
      onConfirm: async () => {
        await addOfficer(newOfficer);
        setNewOfficer(EMPTY_FORM);
        setAdding(false);
      },
    });
  };

  const confirmDelete = (id: string) => {
    setPendingConfirm({
      title: "이 프로필을 삭제하시겠습니까?",
      desc: "삭제하면 되돌릴 수 없어요.",
      actionLabel: "삭제할게요",
      onConfirm: async () => {
        await removeOfficer(id);
      },
    });
  };

  const handlePhotoSelect = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadError(null);
    setUploadingId(id);
    const result = await uploadPhoto(id, file);
    setUploadingId(null);
    if (!result.ok) setUploadError(result.message ?? "업로드에 실패했어요.");
  };

  return (
    <div>
      {isPresident && <EditModeBanner editMode={editMode} onToggle={() => setEditMode((v) => !v)} />}

      <PageHeader eyebrow="Officers" title="회장단 프로필" desc="90명의 살림을 맡고 있는 사람들." />

      {uploadError && (
        <p className="mb-4 rounded-lg border border-red-400/40 bg-red-400/10 px-3 py-2 text-xs text-red-300">
          {uploadError}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {loading ? (
          <>
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </>
        ) : (
          officers.map((o) => {
            const displayInitial = o.name.replace(/^\d+(\.\d+)?기\s*/, "")[0] ?? o.name[0];
            const isEditing = editingId === o.id;
            const isUploading = uploadingId === o.id;

            return (
              <Card key={o.id} className="flex items-center gap-4">
                <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-2xl bg-afterglow-2">
                  {o.photoUrl ? (
                    <img src={o.photoUrl} alt={o.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-display text-3xl text-wind-gold">
                      {displayInitial}
                    </div>
                  )}
                  {editMode && isPresident && (
                    <>
                      <input
                        ref={(el) => {
                          fileInputs.current[o.id] = el;
                        }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handlePhotoSelect(o.id, e)}
                      />
                      <button
                        onClick={() => fileInputs.current[o.id]?.click()}
                        disabled={isUploading}
                        className="absolute inset-x-0 bottom-0 bg-stage/85 py-1 text-[10px] text-backstage/85 backdrop-blur-sm transition-colors hover:text-wind-gold disabled:opacity-60"
                      >
                        {isUploading ? "업로드 중..." : "사진 변경"}
                      </button>
                    </>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        value={draft.role}
                        onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                        placeholder="직책 (예: 회장)"
                        className="w-full rounded-lg border border-dawn-teal/50 bg-stage px-2 py-1 text-sm text-backstage outline-none"
                      />
                      <input
                        value={draft.name}
                        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                        placeholder="이름 (예: 29기 임예진)"
                        className="w-full rounded-lg border border-dawn-teal/50 bg-stage px-2 py-1 text-sm text-backstage outline-none"
                      />
                      <input
                        value={draft.part}
                        onChange={(e) => setDraft({ ...draft, part: e.target.value })}
                        placeholder="파트 / 역할"
                        className="w-full rounded-lg border border-dawn-teal/50 bg-stage px-2 py-1 text-sm text-backstage outline-none"
                      />
                      <textarea
                        value={draft.note}
                        onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                        rows={2}
                        placeholder="한 줄 소개"
                        className="w-full resize-none rounded-lg border border-dawn-teal/50 bg-stage px-2 py-1 text-sm text-backstage outline-none"
                      />
                      <div className="flex gap-2">
                        <button onClick={saveEdit} className="rounded-lg bg-wind-gold px-3 py-1 text-xs font-semibold text-stage">저장</button>
                        <button onClick={() => setEditingId(null)} className="rounded-lg border border-line px-3 py-1 text-xs text-mute">취소</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        <Pill tone="gold">{o.role}</Pill>
                        {editMode && isPresident && (
                          <div className="flex gap-1.5">
                            <IconButton
                              onClick={() => startEdit(o.id, { role: o.role, name: o.name, part: o.part, note: o.note })}
                              label="수정"
                            />
                            <IconButton onClick={() => confirmDelete(o.id)} label="삭제" tone="red" />
                          </div>
                        )}
                      </div>
                      <p className="mt-2 font-display text-lg text-backstage">{o.name}</p>
                      <p className="mt-0.5 font-mono text-xs text-dawn-teal">{o.part}</p>
                      <p className="mt-2 text-sm text-backstage/70">{o.note}</p>
                    </>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {editMode && isPresident && (
        <div className="mt-4">
          {!adding ? (
            <button
              onClick={() => setAdding(true)}
              className="rounded-lg border border-dashed border-line px-4 py-2 text-xs text-mute hover:border-wind-gold/50 hover:text-wind-gold"
            >
              + 프로필 추가
            </button>
          ) : (
            <div className="max-w-sm space-y-2 rounded-lg border border-line bg-afterglow p-4">
              <input
                value={newOfficer.role}
                onChange={(e) => setNewOfficer({ ...newOfficer, role: e.target.value })}
                placeholder="직책 (예: 회장)"
                className="w-full rounded-lg border border-line bg-stage px-3 py-1.5 text-sm text-backstage outline-none focus:border-dawn-teal"
              />
              <input
                value={newOfficer.name}
                onChange={(e) => setNewOfficer({ ...newOfficer, name: e.target.value })}
                placeholder="이름 (예: 29기 임예진)"
                className="w-full rounded-lg border border-line bg-stage px-3 py-1.5 text-sm text-backstage outline-none focus:border-dawn-teal"
              />
              <input
                value={newOfficer.part}
                onChange={(e) => setNewOfficer({ ...newOfficer, part: e.target.value })}
                placeholder="파트 / 역할"
                className="w-full rounded-lg border border-line bg-stage px-3 py-1.5 text-sm text-backstage outline-none focus:border-dawn-teal"
              />
              <textarea
                value={newOfficer.note}
                onChange={(e) => setNewOfficer({ ...newOfficer, note: e.target.value })}
                rows={2}
                placeholder="한 줄 소개"
                className="w-full resize-none rounded-lg border border-line bg-stage px-3 py-1.5 text-sm text-backstage outline-none focus:border-dawn-teal"
              />
              <p className="text-[11px] text-mute">사진은 추가한 뒤 편집 모드에서 "사진 변경"으로 올릴 수 있어요.</p>
              <div className="flex gap-2">
                <button onClick={saveNew} className="rounded-lg bg-wind-gold px-3 py-1.5 text-xs font-semibold text-stage">추가</button>
                <button onClick={() => setAdding(false)} className="rounded-lg border border-line px-3 py-1.5 text-xs text-mute">취소</button>
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmModal pending={pendingConfirm} onCancel={() => setPendingConfirm(null)} onConfirm={runConfirm} />
    </div>
  );
}