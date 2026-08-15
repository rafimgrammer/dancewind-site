// src/utils/circleScore.ts

export interface Pt {
  x: number;
  y: number;
}

function dist(a: Pt, b: Pt) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export interface CircleScoreResult {
  score: number; // 0~100
  meanRadius: number;
  points: Pt[];
}

// center와 좌표계는 같은 단위(예: 0~100 캔버스 좌표)여야 해요.
export function scoreCircle(points: Pt[], center: Pt): CircleScoreResult {
  if (points.length < 12) {
    return { score: 0, meanRadius: 0, points };
  }

  const radii = points.map((p) => dist(p, center));
  const meanR = radii.reduce((a, b) => a + b, 0) / radii.length;

  // 중심 근처에서 콕 찍은 수준이면 원을 그린 게 아니라고 봐요.
  if (meanR < 3) {
    return { score: 0, meanRadius: meanR, points };
  }

  // 1) 일정함 — 반지름들이 서로 얼마나 고르게 유지됐는지
  const variance = radii.reduce((sum, r) => sum + (r - meanR) ** 2, 0) / radii.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / meanR; // 변동계수 (0에 가까울수록 완벽한 원)
  const consistencyScore = clamp(100 - cv * 380, 0, 100);

  // 2) 완주 여부 — 중심 기준으로 총 몇 도를 돌았는지 (360도가 이상적)
  let totalSweep = 0;
  for (let i = 1; i < points.length; i++) {
    const a1 = Math.atan2(points[i - 1].y - center.y, points[i - 1].x - center.x);
    const a2 = Math.atan2(points[i].y - center.y, points[i].x - center.x);
    let diff = a2 - a1;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    totalSweep += diff;
  }
  const sweepDeg = Math.abs((totalSweep * 180) / Math.PI);
  const completenessScore = clamp(100 - Math.abs(sweepDeg - 360) * 1.2, 0, 100);

  // 3) 닫힘 여부 — 시작점과 끝점이 서로 얼마나 가까운지 (반지름 대비)
  const closureRatio = dist(points[0], points[points.length - 1]) / meanR;
  const closureScore = clamp(100 - closureRatio * 140, 0, 100);

  const score = Math.round(consistencyScore * 0.6 + completenessScore * 0.25 + closureScore * 0.15);

  return { score: clamp(score, 0, 100), meanRadius: meanR, points };
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

export function scoreGrade(score: number): { label: string; tone: "gold" | "teal" | "mute" } {
  if (score >= 95) return { label: "완벽해요! 🏆", tone: "gold" };
  if (score >= 85) return { label: "훌륭해요! 👏", tone: "gold" };
  if (score >= 70) return { label: "꽤 괜찮아요", tone: "teal" };
  if (score >= 50) return { label: "다시 도전해보세요", tone: "teal" };
  return { label: "음... 다시 한번? 😅", tone: "mute" };
}