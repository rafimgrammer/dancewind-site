// src/utils/exportTracklist.ts
import * as XLSX from "xlsx";
import html2canvas from "html2canvas-pro";
import type { TrackItem, TrackMember } from "../context/TracklistContext";

export function exportTracklistToExcel(
  result: TrackItem[],
  members: TrackMember[],
  fileName: string
) {
  const memberName = (id: string) => members.find((m) => m.id === id)?.name ?? "알 수 없음";

  const rows = result.map((t, idx) => ({
    순서: idx + 1,
    곡제목: t.title,
    출연진: t.participantIds.map(memberName).join(", ") || "없음",
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "트랙리스트");
  XLSX.writeFile(workbook, fileName);
}

export async function exportTracklistToImage(element: HTMLElement, fileName: string) {
  const canvas = await html2canvas(element, { backgroundColor: null, scale: 2 });
  const link = document.createElement("a");
  link.download = fileName;
  link.href = canvas.toDataURL("image/png");
  link.click();
}