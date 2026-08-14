// src/utils/formationTemplates.ts
import type { Point } from "./hungarian";

export type TemplateType = "grid" | "circle" | "line" | "twoLines" | "v" | "diamond";

export const TEMPLATE_LABELS: Record<TemplateType, string> = {
  grid: "사각형",
  circle: "원형",
  line: "일렬",
  twoLines: "두 줄",
  v: "브이(V)자",
  diamond: "다이아몬드",
};

const PAD = 0.14; // 무대 가장자리 여백 (0~1 좌표계 기준)

export function generateTemplate(type: TemplateType, count: number): Point[] {
  if (count <= 0) return [];

  switch (type) {
    case "grid": {
      const cols = Math.ceil(Math.sqrt(count));
      const rows = Math.ceil(count / cols);
      const points: Point[] = [];
      for (let i = 0; i < count; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = cols === 1 ? 0.5 : PAD + (col / (cols - 1)) * (1 - 2 * PAD);
        const y = rows === 1 ? 0.5 : PAD + (row / (rows - 1)) * (1 - 2 * PAD);
        points.push({ x, y });
      }
      return points;
    }

    case "circle": {
      const points: Point[] = [];
      const cx = 0.5;
      const cy = 0.5;
      const r = 0.5 - PAD;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
        points.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
      }
      return points;
    }

    case "line": {
      const points: Point[] = [];
      for (let i = 0; i < count; i++) {
        const x = count === 1 ? 0.5 : PAD + (i / (count - 1)) * (1 - 2 * PAD);
        points.push({ x, y: 0.5 });
      }
      return points;
    }

    case "twoLines": {
      const points: Point[] = [];
      const frontCount = Math.ceil(count / 2);
      const backCount = count - frontCount;
      for (let i = 0; i < count; i++) {
        const isFront = i < frontCount;
        const idx = isFront ? i : i - frontCount;
        const rowCount = isFront ? frontCount : backCount;
        const x = rowCount <= 1 ? 0.5 : PAD + (idx / (rowCount - 1)) * (1 - 2 * PAD);
        points.push({ x, y: isFront ? 0.62 : 0.32 });
      }
      return points;
    }

    case "v": {
      const points: Point[] = [];
      const half = Math.ceil(count / 2);
      const spreadX = (1 - 2 * PAD) / 2;
      for (let i = 0; i < count; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const depth = Math.floor(i / 2);
        const depthRatio = half <= 1 ? 0 : depth / (half - 1);
        points.push({
          x: 0.5 + side * depthRatio * spreadX,
          y: PAD + depthRatio * (1 - 2 * PAD),
        });
      }
      return points;
    }

    case "diamond": {
      const corners = [
        { x: 0.5, y: PAD }, // 위
        { x: 1 - PAD, y: 0.5 }, // 오른쪽
        { x: 0.5, y: 1 - PAD }, // 아래
        { x: PAD, y: 0.5 }, // 왼쪽
      ];
      const points: Point[] = [];
      for (let i = 0; i < count; i++) {
        const t = (i / count) * 4;
        const edge = Math.floor(t) % 4;
        const frac = t - Math.floor(t);
        const a = corners[edge];
        const b = corners[(edge + 1) % 4];
        points.push({ x: a.x + (b.x - a.x) * frac, y: a.y + (b.y - a.y) * frac });
      }
      return points;
    }
  }
}