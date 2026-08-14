// src/pages/FormationEditor.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader, RequireRole } from "../components/Ui";
import { ConfirmModal, IconButton, type PendingConfirm } from "../components/InlineAdmin";
import { useAuth } from "../context/AuthContext";
import { useFormation, type FormationScene, type ShareableMember } from "../context/FormationContext";
import { assignByShortestTotalDistance, type Point } from "../utils/hungarian";
import { generateTemplate, TEMPLATE_LABELS, type TemplateType } from "../utils/formationTemplates";

const DOT_COLORS = ["bg-wind-gold", "bg-dawn-teal"];

export default function FormationEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    getProjectById,
    loading: projectsLoading,
    fetchScenes,
    addScene,
    updateScenePositions,
    renameScene,
    removeScene,
    updateMemberLabels,
    fetchApprovedMembers,
    shareProject,
  } = useFormation();

  const project = id ? getProjectById(id) : undefined;

  const [scenes, setScenes] = useState<FormationScene[]>([]);
  const [scenesLoading, setScenesLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [positions, setPositions] = useState<Point[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [showPaths, setShowPaths] = useState(true);

  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [editingLabelIndex, setEditingLabelIndex] = useState<number | null>(null);
  const [labelDraft, setLabelDraft] = useState("");

  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [editingSceneName, setEditingSceneName] = useState(false);
  const [sceneNameDraft, setSceneNameDraft] = useState("");

  const [shareOpen, setShareOpen] = useState(false);
  const [shareMembers, setShareMembers] = useState<ShareableMember[]>([]);
  const [shareSelected, setShareSelected] = useState<Set<string>>(new Set());
  const [shareQuery, setShareQuery] = useState("");
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    setScenesLoading(true);
    fetchScenes(id).then((data) => {
      setScenes(data);
      setActiveIndex(0);
      setScenesLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (project) setLabels(project.memberLabels);
  }, [project]);

  useEffect(() => {
    const scene = scenes[activeIndex];
    if (scene) setPositions(scene.positions);
  }, [scenes, activeIndex]);

  const runConfirm = async () => {
    if (!pendingConfirm) return;
    await pendingConfirm.onConfirm();
    setPendingConfirm(null);
  };

  if (projectsLoading || scenesLoading) {
    return (
      <RequireRole allow={["member", "president"]} what="안무 대형 플래너">
        <p className="text-sm text-mute">불러오는 중...</p>
      </RequireRole>
    );
  }

  if (!project) {
    return (
      <RequireRole allow={["member", "president"]} what="안무 대형 플래너">
        <div>
          <PageHeader eyebrow="Formation" title="찾을 수 없어요" desc="삭제되었거나 존재하지 않는 대형이에요." />
          <button onClick={() => navigate("/formation")} className="mt-4 rounded-lg border border-line px-4 py-2 text-sm text-mute">
            목록으로
          </button>
        </div>
      </RequireRole>
    );
  }

  const currentScene = scenes[activeIndex];
  const prevScene = activeIndex > 0 ? scenes[activeIndex - 1] : null;
  const isOwner = project.createdBy === user?.id;

  const clientToRelative = (clientX: number, clientY: number): Point => {
    const rect = stageRef.current!.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    return { x, y };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isOwner || draggingIndex === null) return;
    const p = clientToRelative(e.clientX, e.clientY);
    setPositions((prev) => prev.map((pt, i) => (i === draggingIndex ? p : pt)));
  };

  const handlePointerUp = async () => {
    if (!isOwner || draggingIndex === null || !currentScene) return;
    setDraggingIndex(null);
    await updateScenePositions(currentScene.id, positions);
    setScenes((prev) => prev.map((s, i) => (i === activeIndex ? { ...s, positions } : s)));
  };

  const startEditLabel = (i: number) => {
    if (!isOwner) return;
    setEditingLabelIndex(i);
    setLabelDraft(labels[i] ?? String(i + 1));
  };

  const saveLabel = async () => {
    if (editingLabelIndex === null || !id) return;
    const next = labels.map((l, i) => (i === editingLabelIndex ? labelDraft.trim() || String(i + 1) : l));
    setLabels(next);
    setEditingLabelIndex(null);
    await updateMemberLabels(id, next);
  };

  const applyBlankScene = async () => {
    if (!id) return;
    // 템플릿 없이, 지금 보고 있는 대형을 그대로 복사해서 시작해요.
    // 여기서부터는 자유롭게 드래그해서 원하는 모양을 직접 만들 수 있어요.
    const created = await addScene(id, positions, "새 대형");
    setTemplatePickerOpen(false);
    if (created) {
      setScenes((prev) => [...prev, created]);
      setActiveIndex(scenes.length);
    }
  };

  const applyTemplate = async (type: TemplateType) => {
    if (!id) return;
    const template = generateTemplate(type, project.memberCount);
    const assignment = assignByShortestTotalDistance(positions, template);
    const newPositions = assignment.map((targetIdx) => template[targetIdx]);

    const created = await addScene(id, newPositions, `${TEMPLATE_LABELS[type]} 대형`);
    setTemplatePickerOpen(false);
    if (created) {
      setScenes((prev) => [...prev, created]);
      setActiveIndex(scenes.length);
    }
  };

  const startEditSceneName = () => {
    setSceneNameDraft(currentScene?.name ?? "");
    setEditingSceneName(true);
  };

  const saveSceneName = async () => {
    if (!currentScene) return;
    await renameScene(currentScene.id, sceneNameDraft);
    setScenes((prev) => prev.map((s, i) => (i === activeIndex ? { ...s, name: sceneNameDraft } : s)));
    setEditingSceneName(false);
  };

  const confirmDeleteScene = () => {
    if (!currentScene || scenes.length <= 1) return;
    setPendingConfirm({
      title: "이 장면을 삭제하시겠습니까?",
      desc: "삭제하면 되돌릴 수 없어요.",
      actionLabel: "삭제할게요",
      onConfirm: async () => {
        await removeScene(currentScene.id);
        setScenes((prev) => prev.filter((s) => s.id !== currentScene.id));
        setActiveIndex((prev) => Math.max(0, prev - 1));
      },
    });
  };

  const openShare = async () => {
    setShareOpen(true);
    setShareStatus(null);
    const members = await fetchApprovedMembers();
    setShareMembers(members);
  };

  const toggleShareMember = (memberId: string) => {
    setShareSelected((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  };

  const handleShare = async () => {
    const result = await shareProject(project, Array.from(shareSelected));
    if (result.ok) {
      setShareStatus(`${shareSelected.size}명에게 공유했어요.`);
      setShareSelected(new Set());
    } else {
      setShareStatus(result.message ?? "공유에 실패했어요.");
    }
  };

  const filteredShareMembers = shareMembers.filter(
    (m) => m.name.includes(shareQuery) || m.cohort.includes(shareQuery)
  );

  return (
    <RequireRole allow={["member", "president"]} what="안무 대형 플래너">
      <div>
        <button onClick={() => navigate("/formation")} className="mb-4 text-sm text-mute hover:text-backstage">
          ← 목록으로
        </button>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-xs tracking-[0.2em] text-dawn-teal uppercase">Formation</p>
            <h1 className="mt-1 font-display text-2xl text-backstage md:text-3xl">{project.songTitle}</h1>
            <p className="mt-1 font-mono text-xs text-mute">{project.memberCount}명</p>
          </div>
          {isOwner ? (
            <button
              onClick={openShare}
              className="rounded-full bg-wind-gold px-4 py-2 text-sm font-semibold text-stage"
            >
              공유하기
            </button>
          ) : (
            <span className="rounded-full border border-dawn-teal/40 bg-dawn-teal/10 px-3 py-1.5 text-xs text-dawn-teal">
              보기 전용 (공유받음)
            </span>
          )}
        </div>

        {/* 장면 탭 */}
        <div className="mb-3 flex items-center gap-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {scenes.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setActiveIndex(i)}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  i === activeIndex
                    ? "border-wind-gold bg-wind-gold/15 text-wind-gold"
                    : "border-line text-backstage/70 hover:border-dawn-teal/40"
                }`}
              >
                {i + 1}. {s.name || `장면 ${i + 1}`}
              </button>
            ))}
          </div>
          {isOwner && (
            <div className="relative shrink-0">
              <button
                onClick={() => setTemplatePickerOpen((v) => !v)}
                className="rounded-full border border-dashed border-line px-3.5 py-1.5 text-xs text-mute hover:border-wind-gold/50 hover:text-wind-gold"
              >
                + 다음 대형
              </button>
              {templatePickerOpen && (
                <div className="absolute right-0 top-full z-20 mt-2 w-52 rounded-xl border border-line bg-afterglow p-2 shadow-xl shadow-black/40">
                  <button
                    onClick={applyBlankScene}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-backstage/85 hover:bg-afterglow-2 hover:text-wind-gold"
                  >
                    자유 배치 (직접 만들기)
                  </button>
                  <div className="my-1 border-t border-line" />
                  <p className="px-3 pb-1 pt-1 text-[10px] text-mute">기본 모양에서 자동 배정</p>
                  {(Object.keys(TEMPLATE_LABELS) as TemplateType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => applyTemplate(t)}
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm text-backstage/85 hover:bg-afterglow-2 hover:text-wind-gold"
                    >
                      {TEMPLATE_LABELS[t]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 장면 이름 + 도구 */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          {isOwner ? (
            editingSceneName ? (
              <div className="flex items-center gap-2">
                <input
                  value={sceneNameDraft}
                  onChange={(e) => setSceneNameDraft(e.target.value)}
                  autoFocus
                  className="rounded-lg border border-dawn-teal/50 bg-stage px-2 py-1 text-sm text-backstage outline-none"
                />
                <button onClick={saveSceneName} className="rounded-lg bg-wind-gold px-3 py-1 text-xs font-semibold text-stage">
                  저장
                </button>
                <button onClick={() => setEditingSceneName(false)} className="rounded-lg border border-line px-3 py-1 text-xs text-mute">
                  취소
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <IconButton onClick={startEditSceneName} label="✎ 장면 이름" />
                {scenes.length > 1 && <IconButton onClick={confirmDeleteScene} label="이 장면 삭제" tone="red" />}
              </div>
            )
          ) : (
            <span />
          )}

          {prevScene && (
            <button
              onClick={() => setShowPaths((v) => !v)}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                showPaths ? "border-dawn-teal/50 bg-dawn-teal/10 text-dawn-teal" : "border-line text-mute"
              }`}
            >
              {showPaths ? "동선 보기 켜짐" : "동선 보기"}
            </button>
          )}
        </div>

        {/* 무대 캔버스 */}
        <div
          ref={stageRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="relative aspect-[16/10] w-full touch-none overflow-hidden rounded-2xl border border-line bg-afterglow"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--color-line) 1px, transparent 1px), linear-gradient(to bottom, var(--color-line) 1px, transparent 1px)",
            backgroundSize: "10% 10%",
            backgroundPosition: "center",
            opacity: 1,
          }}
        >
          <div className="pointer-events-none absolute inset-x-0 top-2 text-center font-mono text-[10px] tracking-[0.3em] text-mute/50">
            STAGE FRONT
          </div>

          {/* 동선 경로 */}
          {showPaths && prevScene && (
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <marker id="arrowhead" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
                  <polygon points="0 0, 4 2, 0 4" fill="var(--color-dawn-teal)" opacity="0.6" />
                </marker>
              </defs>
              {positions.map((p, i) => {
                const from = prevScene.positions[i];
                if (!from) return null;
                return (
                  <line
                    key={i}
                    x1={from.x * 100}
                    y1={from.y * 100}
                    x2={p.x * 100}
                    y2={p.y * 100}
                    stroke="var(--color-dawn-teal)"
                    strokeOpacity="0.45"
                    strokeWidth="0.4"
                    strokeDasharray="1.5 1.2"
                    markerEnd="url(#arrowhead)"
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
            </svg>
          )}

          {/* 멤버 점들 */}
          {positions.map((p, i) => {
            const hasCustomLabel = labels[i] && labels[i] !== String(i + 1);
            return (
              <div
                key={i}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${p.x * 100}%`,
                  top: `${p.y * 100}%`,
                  transition:
                    draggingIndex === i
                      ? "none"
                      : "left 0.6s cubic-bezier(0.22,1,0.36,1), top 0.6s cubic-bezier(0.22,1,0.36,1)",
                }}
              >
                <button
                  onPointerDown={(e) => {
                    if (!isOwner) return;
                    e.currentTarget.setPointerCapture(e.pointerId);
                    setDraggingIndex(i);
                  }}
                  title={labels[i] ?? String(i + 1)}
                  className={`flex h-5 w-5 items-center justify-center rounded-full border-2 border-stage font-bold text-stage shadow-lg shadow-black/30 sm:h-9 sm:w-9 ${
                    hasCustomLabel ? "text-[9px] sm:text-sm" : "font-mono text-[8px] sm:text-[11px]"
                  } ${isOwner ? "cursor-grab active:cursor-grabbing" : "cursor-default"} ${
                    DOT_COLORS[i % DOT_COLORS.length]
                  }`}
                >
                  {hasCustomLabel ? labels[i].trim().charAt(0) : i + 1}
                </button>
              </div>
            );
          })}
        </div>

        {/* 부원 이름 설정 — 캔버스 위 작은 글씨 대신 여기서 편하게 입력해요 */}
        <div className="mt-4">
          <p className="mb-2 text-xs text-mute">부원 이름 {isOwner ? "(눌러서 수정)" : ""}</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {Array.from({ length: project.memberCount }, (_, i) => (
              <div key={i} className="flex items-center gap-1.5 rounded-lg border border-line bg-afterglow px-2 py-1.5">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[9px] font-bold text-stage ${
                    DOT_COLORS[i % DOT_COLORS.length]
                  }`}
                >
                  {i + 1}
                </span>
                {isOwner ? (
                  editingLabelIndex === i ? (
                    <input
                      autoFocus
                      value={labelDraft}
                      onChange={(e) => setLabelDraft(e.target.value)}
                      onBlur={saveLabel}
                      onKeyDown={(e) => e.key === "Enter" && saveLabel()}
                      className="w-full min-w-0 rounded border border-dawn-teal/60 bg-stage px-1.5 py-1 text-xs text-backstage outline-none"
                    />
                  ) : (
                    <button
                      onClick={() => startEditLabel(i)}
                      className="min-w-0 flex-1 truncate text-left text-xs text-backstage/85 hover:text-wind-gold"
                    >
                      {labels[i] ?? i + 1}
                    </button>
                  )
                ) : (
                  <span className="min-w-0 flex-1 truncate text-xs text-backstage/85">{labels[i] ?? i + 1}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <p className="mt-3 text-xs text-mute">
          {isOwner ? "점을 드래그해서 위치를 옮길 수 있어요." : "공유받은 대형이에요 — 보기만 가능해요."}
        </p>
      </div>

      {shareOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stage/70 backdrop-blur-sm"
          onClick={() => setShareOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="mx-4 w-full max-w-sm rounded-2xl border border-line bg-afterglow p-5"
          >
            <p className="font-display text-lg text-backstage">부원들과 공유하기</p>
            <p className="mt-1 text-xs text-mute">선택한 부원에게 알림이 가요.</p>

            <input
              value={shareQuery}
              onChange={(e) => setShareQuery(e.target.value)}
              placeholder="이름/기수로 검색"
              className="mt-3 w-full rounded-lg border border-line bg-stage px-3 py-2 text-sm text-backstage placeholder:text-mute outline-none focus:border-dawn-teal"
            />

            <div className="mt-3 max-h-64 space-y-1 overflow-y-auto">
              {filteredShareMembers.map((m) => (
                <label
                  key={m.id}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-backstage/85 hover:bg-afterglow-2"
                >
                  <input
                    type="checkbox"
                    checked={shareSelected.has(m.id)}
                    onChange={() => toggleShareMember(m.id)}
                    className="accent-wind-gold"
                  />
                  {m.cohort} {m.name}
                </label>
              ))}
            </div>

            {shareStatus && <p className="mt-3 text-xs text-dawn-teal">{shareStatus}</p>}

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShareOpen(false)} className="rounded-lg border border-line px-4 py-2 text-sm text-mute">
                닫기
              </button>
              <button
                onClick={handleShare}
                className="rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage"
              >
                공유하기 ({shareSelected.size})
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal pending={pendingConfirm} onCancel={() => setPendingConfirm(null)} onConfirm={runConfirm} />
    </RequireRole>
  );
}