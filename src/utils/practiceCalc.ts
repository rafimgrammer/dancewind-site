// src/utils/practiceCalc.ts
import { toMinutes } from "./time";
import type { PersonEntry } from "../context/PracticeContext";

export interface SlotCandidate {
  start: number;
  end: number;
  count: number;
  personIds: string[];
  names: string[];
}

export function computeBestSlots(
  leaders: PersonEntry[],
  members: PersonEntry[],
  topN = 5
): SlotCandidate[] {
  const leaderIds = leaders.map((p) => p.id);
  const allPeople = [...leaders, ...members];

  const boundariesSet = new Set<number>();
  allPeople.forEach((p) =>
    p.ranges.forEach((r) => {
      const s = toMinutes(r.start);
      const e = toMinutes(r.end);
      if (s !== null) boundariesSet.add(s);
      if (e !== null) boundariesSet.add(e);
    })
  );
  const boundaries = Array.from(boundariesSet).sort((a, b) => a - b);
  if (boundaries.length < 2) return [];

  const rawIntervals: SlotCandidate[] = [];
  for (let i = 0; i < boundaries.length - 1; i++) {
    const start = boundaries[i];
    const end = boundaries[i + 1];
    const mid = (start + end) / 2;
    const covering = allPeople.filter((p) =>
      p.ranges.some((r) => {
        const s = toMinutes(r.start);
        const e = toMinutes(r.end);
        return s !== null && e !== null && s <= mid && mid < e;
      })
    );
    if (covering.length === 0) continue;

    const coveringIds = covering.map((p) => p.id);
    // 팀장이 있다면, 팀장 전원이 이 구간에 포함되어야만 후보로 인정
    if (leaderIds.length > 0 && !leaderIds.every((id) => coveringIds.includes(id))) continue;

    rawIntervals.push({
      start,
      end,
      count: covering.length,
      personIds: coveringIds.sort(),
      names: covering.map((p) => p.name),
    });
  }

  const merged: SlotCandidate[] = [];
  rawIntervals.forEach((interval) => {
    const last = merged[merged.length - 1];
    if (last && last.end === interval.start && last.personIds.join(",") === interval.personIds.join(",")) {
      last.end = interval.end;
    } else {
      merged.push({ ...interval });
    }
  });

  return merged
    .sort((a, b) => b.count - a.count || b.end - b.start - (a.end - a.start))
    .slice(0, topN);
}