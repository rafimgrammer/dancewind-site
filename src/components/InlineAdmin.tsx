// src/components/InlineAdmin.tsx
// 회장단이 홈/소개/회장단/오시는길/모집안내 페이지 내용을 직접 고칠 때 쓰는 공통 UI들.

export function IconButton({
  onClick,
  label,
  tone = "teal",
}: {
  onClick: () => void;
  label: string;
  tone?: "teal" | "red";
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md border border-line bg-stage px-2 py-1 text-[11px] transition-colors ${
        tone === "red"
          ? "text-mute hover:border-red-400/50 hover:text-red-300"
          : "text-mute hover:border-dawn-teal/50 hover:text-dawn-teal"
      }`}
    >
      {label}
    </button>
  );
}

export function EditModeBanner({
  editMode,
  onToggle,
  label,
}: {
  editMode: boolean;
  onToggle: () => void;
  label?: string;
}) {
  return (
    <div className="mb-6 flex items-center justify-between rounded-xl border border-dawn-teal/40 bg-dawn-teal/5 px-4 py-2.5">
      <p className="text-xs text-dawn-teal">{label ?? "회장단 전용 · 이 페이지 내용을 직접 수정할 수 있어요."}</p>
      <button
        onClick={onToggle}
        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
          editMode
            ? "border-wind-gold bg-wind-gold text-stage"
            : "border-line text-backstage/80 hover:border-dawn-teal/50"
        }`}
      >
        {editMode ? "편집 모드 켜짐" : "편집 모드 켜기"}
      </button>
    </div>
  );
}

export interface PendingConfirm {
  title: string;
  desc: string;
  actionLabel: string;
  onConfirm: () => Promise<void>;
}

export function ConfirmModal({
  pending,
  onCancel,
  onConfirm,
}: {
  pending: PendingConfirm | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!pending) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stage/70 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="mx-4 w-full max-w-sm rounded-2xl border border-line bg-afterglow p-6"
      >
        <p className="font-display text-lg text-backstage">{pending.title}</p>
        {pending.desc && <p className="mt-2 text-sm text-backstage/70">{pending.desc}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-lg border border-line px-4 py-2 text-sm text-mute">
            아니요
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage"
          >
            {pending.actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}