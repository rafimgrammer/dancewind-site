// src/utils/hungarian.ts
//
// 헝가리안 알고리즘(Kuhn-Munkres) — N명을 N개의 새 자리에 배정할 때,
// "이동 거리 총합"이 최소가 되는 조합을 찾아요.
// (참고: 총 이동거리를 최소화하는 배정은, 두 사람의 경로를 서로 바꿨을 때
//  거리가 줄어드는 경우가 없다는 뜻이라 자연스럽게 경로 교차도 최소화돼요.)
//
// cost[i][j] = i번째 사람을 j번째 새 자리로 보낼 때의 비용(거리의 제곱)
// 반환값: result[i] = i번째 사람이 배정된 새 자리의 인덱스

export function hungarianAssign(cost: number[][]): number[] {
  const n = cost.length;
  if (n === 0) return [];

  const INF = Infinity;
  const u = new Array(n + 1).fill(0);
  const v = new Array(n + 1).fill(0);
  const p = new Array(n + 1).fill(0); // p[j] = 현재 j번째 열에 배정된 행(1-indexed)
  const way = new Array(n + 1).fill(0);

  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array(n + 1).fill(INF);
    const used = new Array(n + 1).fill(false);

    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = INF;
      let j1 = -1;

      for (let j = 1; j <= n; j++) {
        if (!used[j]) {
          const cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
          if (cur < minv[j]) {
            minv[j] = cur;
            way[j] = j0;
          }
          if (minv[j] < delta) {
            delta = minv[j];
            j1 = j;
          }
        }
      }

      for (let j = 0; j <= n; j++) {
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else {
          minv[j] -= delta;
        }
      }
      j0 = j1;
    } while (p[j0] !== 0);

    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0 !== 0);
  }

  const result = new Array(n).fill(0);
  for (let j = 1; j <= n; j++) {
    if (p[j] > 0) result[p[j] - 1] = j - 1;
  }
  return result;
}

export interface Point {
  x: number;
  y: number;
}

// from[i] → to[assignment[i]] 로 이동하도록, 총 이동거리가 최소가 되는 짝을 찾아요.
export function assignByShortestTotalDistance(from: Point[], to: Point[]): number[] {
  const n = from.length;
  const cost: number[][] = [];
  for (let i = 0; i < n; i++) {
    cost.push([]);
    for (let j = 0; j < n; j++) {
      const dx = from[i].x - to[j].x;
      const dy = from[i].y - to[j].y;
      cost[i].push(dx * dx + dy * dy);
    }
  }
  return hungarianAssign(cost);
}