// src/utils/reelsLinks.ts
export function isInstagramUrl(url: string) {
  return /instagram\.com\/(reel|p)\//.test(url);
}