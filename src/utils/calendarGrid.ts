// src/utils/calendarGrid.ts
export interface DayCell {
  date: Date;
  dateStr: string; // "2026-08-15"
  inCurrentMonth: boolean;
  isToday: boolean;
}

function toDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function buildMonthGrid(year: number, month: number): DayCell[] {
  // month: 0-indexed (0 = 1월)
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay(); // 0 = 일요일

  const gridStart = new Date(year, month, 1 - startWeekday);
  const today = toDateStr(new Date());

  const cells: DayCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push({
      date: d,
      dateStr: toDateStr(d),
      inCurrentMonth: d.getMonth() === month,
      isToday: toDateStr(d) === today,
    });
  }
  return cells;
}