// src/pages/FormationList.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader, Card, RequireRole } from "../components/Ui";
import { Skeleton } from "../components/Skeleton";
import { ConfirmModal, IconButton, type PendingConfirm } from "../components/InlineAdmin";
import { useAuth } from "../context/AuthContext";
import { useFormation } from "../context/FormationContext";
import { generateTemplate } from "../utils/formationTemplates";
import { formatTimeAgo } from "../utils/timeAgo";

export default function FormationList() {
  const { user } = useAuth();
  const { projects, loading, createProject, removeProject } = useFormation();
  const navigate = useNavigate();

  const [creating, setCreating] = useState(false);
  const [songTitle, setSongTitle] = useState("");
  const [memberCount, setMemberCount] = useState(8);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const runConfirm = async () => {
    if (!pendingConfirm) return;
    await pendingConfirm.onConfirm();
    setPendingConfirm(null);
  };

  const handleCreate = async () => {
    if (!songTitle.trim() || memberCount <= 0 || submitting) return;
    setSubmitting(true);
    const initial = generateTemplate("grid", memberCount);
    const id = await createProject(songTitle, memberCount, initial);
    setSubmitting(false);
    if (id) navigate(`/formation/${id}`);
  };

  const confirmDelete = (id: string, title: string) => {
    setPendingConfirm({
      title: `"${title}" 대형을 삭제하시겠습니까?`,
      desc: "안에 있는 모든 대형 장면이 함께 삭제되고, 되돌릴 수 없어요.",
      actionLabel: "삭제할게요",
      onConfirm: async () => {
        await removeProject(id);
      },
    });
  };

  return (
    <RequireRole allow={["member", "president"]} what="안무 대형 플래너">
      <div>
        <PageHeader
          eyebrow="Formation"
          title="안무 대형 플래너"
          desc="곡별로 대형을 짜고, 장면 사이 동선까지 한눈에 확인하세요."
        />

        <div className="mb-6 rounded-2xl border border-line bg-afterglow p-5">
          {!creating ? (
            <button
              onClick={() => setCreating(true)}
              className="w-full rounded-lg border border-dashed border-line py-3 text-sm text-mute transition-colors hover:border-wind-gold/50 hover:text-wind-gold"
            >
              + 새 대형 만들기
            </button>
          ) : (
            <div className="max-w-sm space-y-3">
              <input
                value={songTitle}
                onChange={(e) => setSongTitle(e.target.value)}
                placeholder="곡 이름 (예: 바람이 분다)"
                className="w-full rounded-lg border border-line bg-stage px-3 py-2 text-sm text-backstage placeholder:text-mute outline-none focus:border-dawn-teal"
              />
              <div className="flex items-center gap-3">
                <label className="text-xs text-mute">인원 수</label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={memberCount}
                  onChange={(e) => setMemberCount(Math.max(1, Number(e.target.value) || 1))}
                  className="w-20 rounded-lg border border-line bg-stage px-3 py-1.5 text-sm text-backstage outline-none focus:border-dawn-teal"
                />
                <span className="text-xs text-mute">명</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  disabled={submitting}
                  className="rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage disabled:opacity-60"
                >
                  {submitting ? "만드는 중..." : "만들기"}
                </button>
                <button
                  onClick={() => setCreating(false)}
                  className="rounded-lg border border-line px-4 py-2 text-sm text-mute"
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <>
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </>
          ) : projects.length === 0 ? (
            <p className="text-sm text-mute">아직 만든 대형이 없어요.</p>
          ) : (
            projects.map((p) => {
              const isOwner = p.createdBy === user?.id;
              return (
                <Card key={p.id} className="group relative">
                  <Link to={`/formation/${p.id}`} className="block">
                    <div className="flex items-center gap-2">
                      <p className="font-display text-lg text-backstage">{p.songTitle}</p>
                      {!isOwner && (
                        <span className="rounded-full border border-dawn-teal/40 bg-dawn-teal/10 px-2 py-0.5 text-[10px] text-dawn-teal">
                          공유받음
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 font-mono text-xs text-mute">
                      {p.memberCount}명 · {p.createdByName} · {formatTimeAgo(new Date(p.updatedAt).getTime())}
                    </p>
                  </Link>
                  {isOwner && (
                    <div className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100">
                      <IconButton onClick={() => confirmDelete(p.id, p.songTitle)} label="삭제" tone="red" />
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>

        <ConfirmModal pending={pendingConfirm} onCancel={() => setPendingConfirm(null)} onConfirm={runConfirm} />
      </div>
    </RequireRole>
  );
}