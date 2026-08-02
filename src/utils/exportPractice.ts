// src/utils/exportPractice.ts
import * as XLSX from "xlsx";
import html2canvas from "html2canvas-pro";
import { toTimeString } from "./time";
import type { PracticeSession } from "../context/PracticeContext";

export function exportToExcel(
  entries: { date: string; session: PracticeSession }[],
  fileName: string
) {
  const rows: Record<string, string>[] = [];

  entries.forEach(({ date, session }) => {
    const allPeople = [
      ...session.leaders.map((p) => ({ ...p, isLeader: true })),
      ...session.members.map((p) => ({ ...p, isLeader: false })),
    ];

    allPeople.forEach((p) => {
      const rangesText = p.ranges.map((r) => `${r.start}~${r.end}`).join(", ");
      const included = session.mainSlot?.personIds.includes(p.id);
      rows.push({
        날짜: date,
        구분: p.isLeader ? "팀장" : "부원",
        이름: p.name,
        입력한시간: rangesText,
        메인연습참여: included ? "포함" : "미포함",
      });
    });

    if (session.mainSlot) {
      rows.push({
        날짜: date,
        구분: "요약",
        이름: "메인 연습 시간",
        입력한시간: `${toTimeString(session.mainSlot.start)}~${toTimeString(session.mainSlot.end)}`,
        메인연습참여: `${session.mainSlot.names.length}명 (${session.mainSlot.names.join(", ")})`,
      });
    }

    session.extraSessions.forEach((ex) => {
      rows.push({
        날짜: date,
        구분: "별도 세션",
        이름: ex.name,
        입력한시간: `${ex.start}~${ex.end}`,
        메인연습참여: "-",
      });
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "연습시간");
  XLSX.writeFile(workbook, fileName);
}

export async function exportElementToImage(element: HTMLElement, fileName: string) {
  const canvas = await html2canvas(element, { backgroundColor: null, scale: 2 });
  const link = document.createElement("a");
  link.download = fileName;
  link.href = canvas.toDataURL("image/png");
  link.click();
}