// src/pages/Updates.tsx
import { useState } from "react";
import { PageHeader, RequireRole } from "../components/Ui";
import { useAuth } from "../context/AuthContext";
import { useUpdates, type UpdateCategory } from "../context/UpdatesContext";
import { formatTimeAgo } from "../utils/timeAgo";
import { CardSkeletonGrid } from "../components/Skeleton";

const CATEGORY_META: Record<UpdateCategory, { label: string; dot: string; pill: string }> = {
  new: { label: "새 기능", dot: "bg-wind-gold", pill: "border-wind-gold/40 bg-wind-gold/10 text-wind-gold" },
  improved: { label: "개선", dot: "bg-dawn-teal", pill: "border-dawn-teal/40 bg-dawn-teal/10 text-dawn-teal" },
  fixed: { label: "수정", dot: "bg-mute", pill: "border-line bg-afterglow-2 text-mute" },
};

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

type ConfirmAction = "add" | "edit" | "delete" | null;

export default function Updates() {
  const { isSiteAdmin } = useAuth();
  const { updates, loading, addUpdate, editUpdate, removeUpdate } = useUpdates();

  const [composerOpen, setComposerOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<UpdateCategory>("new");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editCategory, setEditCategory] = useState<UpdateCategory>("new");

  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const resetComposer = () => {
    setTitle("");
    setBody("");
    setCategory("new");
    setComposerOpen(false);
  };

  const trySubmitAdd = () => {
    if (!title.trim() || !body.trim()) return;
    setConfirmAction("add");
  };

  const startEdit = (id: string, currentTitle: string, currentBody: string, currentCategory: UpdateCategory) => {
    setEditingId(id);
    setEditTitle(currentTitle);
    setEditBody(currentBody);
    setEditCategory(currentCategory);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditBody("");
  };

  const trySubmitEdit = () => {
    if (!editTitle.trim() || !editBody.trim()) return;
    setConfirmAction("edit");
  };

  const openDeleteConfirm = (id: string) => {
    setPendingDeleteId(id);
    setConfirmAction("delete");
  };

  const handleConfirm = async () => {
    if (confirmAction === "add") {
      await addUpdate(title, body, category);
      resetComposer();
    } else if (confirmAction === "edit" && editingId) {
      await editUpdate(editingId, editTitle, editBody, editCategory);
      cancelEdit();
    } else if (confirmAction === "delete" && pendingDeleteId) {
      await removeUpdate(pendingDeleteId);
    }
    setConfirmAction(null);
    setPendingDeleteId(null);
  };

  const confirmCopy: Record<Exclude<ConfirmAction, null>, { title: string; desc: string; action: string }> = {
    add: { title: "업데이트를 등록하시겠습니까?", desc: "등록하면 바로 모든 부원에게 보여요.", action: "등록할게요" },
    edit: { title: "수정하시겠습니까?", desc: "변경된 내용으로 바로 반영돼요.", action: "수정할게요" },
    delete: { title: "정말로 삭제하시겠습니까?", desc: "삭제된 업데이트는 복구할 수 없습니다.", action: "삭제할게요" },
  };

  const categoryButtons = (value: UpdateCategory, onChange: (c: UpdateCategory) => void) => (
    <div className="flex gap-2">
      {(Object.keys(CATEGORY_META) as UpdateCategory[]).map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            value === c ? CATEGORY_META[c].pill : "border-line text-mute hover:border-dawn-teal/30"
          }`}
        >
          {CATEGORY_META[c].label}
        </button>
      ))}
    </div>
  );

  return (
    <RequireRole allow={["member", "president"]} what="사이트 업데이트">
      <div>
        <PageHeader
          eyebrow="Updates"
          title="사이트 업데이트"
          desc="춤바람 홈페이지에 새로 생기거나 바뀐 것들을 여기서 확인하세요."
        />

        {isSiteAdmin && (
          <div className="mb-8 rounded-2xl border border-line bg-afterglow p-5">
            {!composerOpen ? (
              <button
                onClick={() => setComposerOpen(true)}
                className="w-full rounded-lg border border-dashed border-line py-3 text-sm text-mute transition-colors hover:border-wind-gold/50 hover:text-wind-gold"
              >
                + 새 업데이트 작성
              </button>
            ) : (
              <div className="space-y-3">
                {categoryButtons(category, setCategory)}
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="제목 (예: 접속중인 부원 표시 추가)"
                  className="w-full rounded-lg border border-line bg-stage px-3 py-2 text-sm text-backstage placeholder:text-mute outline-none focus:border-dawn-teal"
                />
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="어떤 게 바뀌었는지 간단히 설명해주세요"
                  rows={3}
                  className="w-full resize-none rounded-lg border border-line bg-stage px-3 py-2 text-sm text-backstage placeholder:text-mute outline-none focus:border-dawn-teal"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={resetComposer}
                    className="rounded-lg border border-line px-4 py-2 text-sm text-mute"
                  >
                    취소
                  </button>
                  <button
                    onClick={trySubmitAdd}
                    className="rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage"
                  >
                    등록
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <CardSkeletonGrid count={4} />
        ) : updates.length === 0 ? (
          <p className="text-sm text-mute">아직 등록된 업데이트가 없어요.</p>
        ) : (
          <div className="space-y-0">
            {updates.map((u) => {
              const meta = CATEGORY_META[u.category];
              const isNew = Date.now() - new Date(u.createdAt).getTime() < THREE_DAYS_MS;
              const isEditing = editingId === u.id;

              return (
                <div key={u.id} className="group relative flex gap-5 border-l border-line pl-6 pb-8 last:pb-0">
                  <div
                    className={`absolute -left-[7px] top-1 h-3.5 w-3.5 rounded-full border-2 border-stage ${meta.dot}`}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${meta.pill}`}>
                        {meta.label}
                      </span>
                      {isNew && (
                        <span className="rounded-full bg-wind-gold px-2 py-0.5 font-mono text-[10px] font-bold text-stage">
                          NEW
                        </span>
                      )}
                      <span className="font-mono text-[11px] text-mute">
                        {formatTimeAgo(new Date(u.createdAt).getTime())}
                        {u.edited && " · (수정됨)"}
                      </span>
                    </div>

                    {isEditing ? (
                      <div className="mt-2.5 space-y-2.5">
                        {categoryButtons(editCategory, setEditCategory)}
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full rounded-lg border border-dawn-teal/50 bg-stage px-3 py-2 text-sm text-backstage outline-none"
                        />
                        <textarea
                          value={editBody}
                          onChange={(e) => setEditBody(e.target.value)}
                          rows={3}
                          className="w-full resize-none rounded-lg border border-dawn-teal/50 bg-stage px-3 py-2 text-sm text-backstage outline-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={trySubmitEdit}
                            className="rounded-lg bg-wind-gold px-3 py-1.5 text-xs font-semibold text-stage"
                          >
                            저장
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="rounded-lg border border-line px-3 py-1.5 text-xs text-mute"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="mt-2 font-display text-lg text-backstage">{u.title}</p>
                        <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-backstage/75">
                          {u.body}
                        </p>
                      </>
                    )}

                    {isSiteAdmin && !isEditing && (
                      <div className="mt-2 flex items-center gap-3 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => startEdit(u.id, u.title, u.body, u.category)}
                          className="text-[11px] text-mute hover:text-dawn-teal"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(u.id)}
                          className="text-[11px] text-mute hover:text-red-300"
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {confirmAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stage/70 backdrop-blur-sm"
          onClick={() => {
            setConfirmAction(null);
            setPendingDeleteId(null);
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
                  setPendingDeleteId(null);
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