import { PageHeader, Card, Pill } from "../components/Ui";
import { useYoutubeVideos } from "../hooks/useYoutubeVideos";

export default function Videos() {
  const { videos, loading, error } = useYoutubeVideos(8);

  return (
    <div>
      <PageHeader eyebrow="Videos" title="춤바람 활동 영상" desc="무대 위 순간부터 연습실 뒷이야기까지." />

      {loading && <p className="text-sm text-mute">영상을 불러오는 중이에요...</p>}
      {error && <p className="text-sm text-mute">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((v) => (
          <a
            key={v.id}
            href={`https://www.youtube.com/watch?v=${v.id}`}
            target="_blank"
            rel="noreferrer"
          >
            <Card className="group cursor-pointer">
              <div className="relative aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-afterglow-2 to-stage">
                <img
                  src={v.thumbnail}
                  alt={v.title}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Pill tone="teal">
                  {new Date(v.publishedAt).toLocaleDateString("ko-KR")}
                </Pill>
                <span className="font-mono text-[11px] text-mute">{v.duration}</span>
              </div>
              <p className="mt-2 text-sm font-medium leading-relaxed text-backstage/90">
                {v.title}
              </p>
            </Card>
          </a>
        ))}
      </div>
    </div >
  );
}