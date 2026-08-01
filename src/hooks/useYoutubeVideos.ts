// src/hooks/useYoutubeVideos.ts
import { useEffect, useState } from "react";

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const CHANNEL_HANDLE = "2dancewind2023"; // @ 없이

export type YoutubeVideo = {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  duration: string; // "04:12" 형태로 가공됨
};

function parseDuration(iso: string) {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  const h = Number(m?.[1] ?? 0);
  const min = Number(m?.[2] ?? 0);
  const s = Number(m?.[3] ?? 0);
  const totalMin = h * 60 + min;
  return `${String(totalMin).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function useYoutubeVideos(count = 8) {
  const [videos, setVideos] = useState<YoutubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        // 1. 핸들 → 채널의 업로드 재생목록 ID 조회
        const chRes = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&forHandle=${CHANNEL_HANDLE}&key=${API_KEY}`
        );
        const chData = await chRes.json();
        const uploadsId =
          chData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
        if (!uploadsId) throw new Error("채널을 찾을 수 없어요.");

        // 2. 업로드 재생목록에서 최신 영상 N개
        const plRes = await fetch(
          `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsId}&maxResults=${count}&key=${API_KEY}`
        );
        const plData = await plRes.json();
        const videoIds = plData.items
          .map((i: any) => i.snippet.resourceId.videoId)
          .join(",");

        // 3. 영상별 길이(duration) 조회
        const vRes = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${API_KEY}`
        );
        const vData = await vRes.json();
        const durationMap = new Map(
          vData.items.map((v: any) => [v.id, parseDuration(v.contentDetails.duration)])
        );

        const result: YoutubeVideo[] = plData.items.map((i: any) => ({
          id: i.snippet.resourceId.videoId,
          title: i.snippet.title,
          thumbnail: i.snippet.thumbnails.medium.url,
          publishedAt: i.snippet.publishedAt,
          duration: durationMap.get(i.snippet.resourceId.videoId) ?? "",
        }));

        if (!cancelled) setVideos(result);
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? "영상을 불러오지 못했어요.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [count]);

  return { videos, loading, error };
}