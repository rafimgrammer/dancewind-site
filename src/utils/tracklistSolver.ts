// src/utils/tracklistSolver.ts
export interface SolverTrack {
  id: string;
  title: string;
  participantIds: string[];
}

export type GapOption = 1 | 2 | 3;

interface SolveOptions {
  minGap: GapOption;
  fixedFirstId?: string | null;
  fixedLastId?: string | null;
}

function hasConflict(candidate: SolverTrack, recentTracks: SolverTrack[]): boolean {
  return recentTracks.some((t) =>
    t.participantIds.some((p) => candidate.participantIds.includes(p))
  );
}

function backtrack(
  currentList: SolverTrack[],
  remaining: SolverTrack[],
  minGap: number
): SolverTrack[] | null {
  if (remaining.length === 0) return currentList;

  for (let i = 0; i < remaining.length; i++) {
    const candidate = remaining[i];
    const recentTracks = currentList.slice(-minGap);

    if (!hasConflict(candidate, recentTracks)) {
      const result = backtrack(
        [...currentList, candidate],
        remaining.filter((_, idx) => idx !== i),
        minGap
      );
      if (result) return result;
    }
  }
  return null;
}

/**
 * 시작곡/마지막곡 고정 + 최소 간격(사이텀) 조건을 만족하는 트랙 순서를 찾아요.
 * 여러 번 랜덤 셔플 후 재시도해서 해를 찾을 확률을 높여요 (원본 로직과 동일한 전략).
 */
export function generateTracklist(
  tracks: SolverTrack[],
  options: SolveOptions
): SolverTrack[] | null {
  const { minGap, fixedFirstId, fixedLastId } = options;

  const fixedFirst = fixedFirstId ? tracks.find((t) => t.id === fixedFirstId) ?? null : null;
  const fixedLast = fixedLastId ? tracks.find((t) => t.id === fixedLastId) ?? null : null;

  const middlePool = tracks.filter(
    (t) => t.id !== fixedFirst?.id && t.id !== fixedLast?.id
  );

  const ATTEMPTS = 15;

  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const shuffled = [...middlePool].sort(() => Math.random() - 0.5);
    const startList = fixedFirst ? [fixedFirst] : [];

    const midResult = backtrack(startList, shuffled, minGap);
    if (!midResult) continue;

    if (!fixedLast) return midResult;

    // 마지막 곡을 강제로 붙이고, 그 자리에서도 간격 조건이 성립하는지 확인
    const recentBeforeLast = midResult.slice(-minGap);
    if (hasConflict(fixedLast, recentBeforeLast)) continue;

    return [...midResult, fixedLast];
  }

  return null;
}