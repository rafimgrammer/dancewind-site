// src/pages/PracticeMatcherList.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, Card, Pill, EmptyState, RequireRole } from "../components/Ui";
import { usePractice } from "../context/PracticeContext";

export default function PracticeMatcherList() {
  const { teams, createTeam, removeTeam } = usePractice();
  const navigate = useNavigate();

  const [showForm, setShowForm] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const handleCreate = async () => {
    if (!teamName.trim()) {
      alert("팀 이름을 입력해주세요.");
      return;
    }
    const id = await createTeam(teamName);
    setShowForm(false);
    setTeamName("");
    if (id) navigate(`/practice-matcher/${id}`);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await removeTeam(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <RequireRole allow={["president"]} what="연습시간 마스터">
      <div>
        <PageHeader
          eyebrow="Practice Matcher"
          title="연습시간 마스터"
          desc="팀별로 연습 시간을 조율하고, 확정된 일정을 팀원과 캘린더로 공유해요."
        />

        <button
          onClick={() => setShowForm(true)}
          className="mb-6 rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage"
        >
          + 새 팀 만들기
        </button>

        {teams.length === 0 ? (
          <EmptyState title="아직 만들어진 팀이 없어요" desc="팀을 만들고 연습 시간을 조율해보세요." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {teams.map((t) => (
              <div key={t.id} className="relative">
                <button onClick={() => navigate(`/practice-matcher/${t.id}`)} className="block w-full text-left">
                  <Card className="cursor-pointer transition-colors hover:border-dawn-teal/40">
                    <div className="flex items-center gap-2">
                      <Pill tone="teal">{t.teamName}</Pill>
                      {t.calendarSynced && <Pill tone="gold">캘린더 공유중</Pill>}
                    </div>
                    <p className="mt-2 font-mono text-xs text-mute">
                      팀장 {t.leaderName} · 팀원 {t.members.length}명
                    </p>
                    {t.behindScenesAllowed && <p className="mt-1 text-xs text-wind-gold">🎥 비하인드 촬영 가능</p>}
                  </Card>
                </button>
                <button
                  onClick={() => setDeleteTarget({ id: t.id, name: t.teamName })}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stage/70 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div onClick={(e) => e.stopPropagation()} className="mx-4 w-full max-w-sm rounded-2xl border border-line bg-afterglow p-6">
            <p className="font-display text-lg text-backstage">새 팀 만들기</p>
            <div className="mt-4">
              <label className="mb-1.5 block text-xs text-mute">팀 이름</label>
              <input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="예: LEMONADE 팀"
                className="w-full rounded-lg border border-line bg-stage px-3 py-2 text-sm text-backstage placeholder:text-mute outline-none focus:border-dawn-teal"
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="rounded-lg border border-line px-4 py-2 text-sm text-mute">
                취소
              </button>
              <button onClick={handleCreate} className="rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage">
                만들기
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stage/70 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div onClick={(e) => e.stopPropagation()} className="mx-4 w-full max-w-sm rounded-2xl border border-red-400/30 bg-afterglow p-6">
            <p className="font-display text-lg text-backstage">"{deleteTarget.name}"을(를) 삭제하시겠습니까?</p>
            <p className="mt-2 text-sm text-backstage/70">삭제하면 이 팀의 연습 계획과 캘린더 공유가 모두 사라지고 복구할 수 없어요.</p>
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
    </RequireRole>
  );
}