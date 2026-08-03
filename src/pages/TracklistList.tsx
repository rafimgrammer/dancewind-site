// src/pages/TracklistList.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, Card, Pill, EmptyState, RequireRole } from "../components/Ui";
import { useTracklist } from "../context/TracklistContext";

export default function TracklistList() {
  const { sets, createSet, removeSet } = useTracklist();
  const navigate = useNavigate();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [performanceDate, setPerformanceDate] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const handleCreate = async () => {
    if (!title.trim() || !performanceDate) {
      alert("공연 이름과 날짜를 입력해주세요.");
      return;
    }
    const id = await createSet(title, performanceDate);
    setShowForm(false);
    setTitle("");
    setPerformanceDate("");
    if (id) navigate(`/tracklist-master/${id}`);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await removeSet(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <RequireRole allow={["president"]} what="트랙리스트 마스터">
      <div>
        <PageHeader
          eyebrow="Tracklist Master"
          title="트랙리스트 마스터"
          desc="공연별로 트랙리스트를 만들고, 회장단끼리 함께 확인해요."
        />

        <button
          onClick={() => setShowForm(true)}
          className="mb-6 rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage"
        >
          + 새 공연 만들기
        </button>

        {sets.length === 0 ? (
          <EmptyState title="아직 만들어진 공연이 없어요" desc="새 공연을 만들고 트랙리스트를 짜보세요." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {sets.map((s) => (
              <div key={s.id} className="relative">
                <button
                  onClick={() => navigate(`/tracklist-master/${s.id}`)}
                  className="block w-full text-left"
                >
                  <Card className="cursor-pointer transition-colors hover:border-dawn-teal/40">
                    <div className="flex items-center gap-2">
                      {s.confirmed && <Pill tone="gold">확정</Pill>}
                      <p className="font-display text-lg text-backstage">{s.title}</p>
                    </div>
                    <p className="mt-1.5 font-mono text-xs text-mute">
                      {s.performanceDate} · {s.createdBy} 생성
                    </p>
                    <p className="mt-2 text-xs text-mute">
                      인원 {s.members.length}명 · 곡 {s.tracks.length}곡
                    </p>
                  </Card>
                </button>
                <button
                  onClick={() => setDeleteTarget({ id: s.id, title: s.title })}
                  className="absolute right-3 top-3 rounded-lg border border-line bg-stage px-2 py-1 text-xs text-mute hover:border-red-400/50 hover:text-red-300"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stage/70 backdrop-blur-sm"
          onClick={() => setShowForm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="mx-4 w-full max-w-sm rounded-2xl border border-line bg-afterglow p-6"
          >
            <p className="font-display text-lg text-backstage">새 공연 만들기</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1.5 block text-xs text-mute">공연 이름</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 개강공연"
                  className="w-full rounded-lg border border-line bg-stage px-3 py-2 text-sm text-backstage placeholder:text-mute outline-none focus:border-dawn-teal"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-mute">공연 날짜</label>
                <input
                  type="date"
                  value={performanceDate}
                  onChange={(e) => setPerformanceDate(e.target.value)}
                  className="w-full rounded-lg border border-line bg-stage px-3 py-2 text-sm text-backstage outline-none focus:border-dawn-teal"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-line px-4 py-2 text-sm text-mute"
              >
                취소
              </button>
              <button
                onClick={handleCreate}
                className="rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage"
              >
                만들기
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stage/70 backdrop-blur-sm"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="mx-4 w-full max-w-sm rounded-2xl border border-red-400/30 bg-afterglow p-6"
          >
            <p className="font-display text-lg text-backstage">"{deleteTarget.title}"을(를) 삭제하시겠습니까?</p>
            <p className="mt-2 text-sm text-backstage/70">삭제하면 이 공연의 트랙리스트가 모두 사라지고 복구할 수 없어요.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-line px-4 py-2 text-sm text-mute"
              >
                아니요
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="rounded-lg border border-red-400/40 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-300"
              >
                삭제할게요
              </button>
            </div>
          </div>
        </div>
      )}
    </RequireRole>
  );
}