// src/utils/timeAgo.ts
export function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffDay >= 1) {
    const d = new Date(timestamp);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
      d.getDate()
    ).padStart(2, "0")}`;
  }
  if (diffHour >= 1) return `${diffHour}시간 전`;
  if (diffMin >= 1) return `${diffMin}분 전`;
  return "방금 전";
}