// src/pages/Gallery.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader, Pill } from "../components/Ui";
import { Skeleton } from "../components/Skeleton";
import { ConfirmModal, type PendingConfirm } from "../components/InlineAdmin";
import { useAuth } from "../context/AuthContext";
import { useGallery } from "../context/GalleryContext";

const CATEGORIES = ["공연", "축제", "연습", "기타"];
const FILTERS = ["전체", ...CATEGORIES];

function AlbumCover({ photoUrls }: { photoUrls: string[] }) {
  if (photoUrls.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-afterglow-2 to-stage text-mute/50">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="9" cy="10" r="1.5" fill="currentColor" />
          <path d="M4 17l5-5 4 4 3-3 4 4" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
    );
  }

  const stack = photoUrls.slice(0, 3);
  return (
    <div className="absolute inset-0">
      {stack
        .slice()
        .reverse()
        .map((url, i) => {
          const layer = stack.length - 1 - i; // 0 = 맨 위(정면)
          const rotate = layer === 0 ? 0 : layer === 1 ? -6 : 5;
          const scale = 1 - layer * 0.05;
          const translate = layer * 6;
          return (
            <img
              key={url + i}
              src={url}
              alt=""
              className="absolute inset-2 h-[calc(100%-1rem)] w-[calc(100%-1rem)] rounded-lg object-cover shadow-lg shadow-black/30 transition-transform duration-300"
              style={{
                transform: `rotate(${rotate}deg) scale(${scale}) translateY(${translate}px)`,
                zIndex: 10 - layer,
              }}
            />
          );
        })}
    </div>
  );
}

export default function Gallery() {
  const { role } = useAuth();
  const isPresident = role === "president";
  const { albums, loading, addAlbum } = useGallery();

  const [filter, setFilter] = useState("전체");
  const [creating, setCreating] = useState(false);
  const [newAlbum, setNewAlbum] = useState({ title: "", eventDate: "", category: "공연" });
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const navigate = useNavigate();

  const filtered = filter === "전체" ? albums : albums.filter((a) => a.category === filter);

  const runConfirm = async () => {
    if (!pendingConfirm) return;
    await pendingConfirm.onConfirm();
    setPendingConfirm(null);
  };

  const saveNewAlbum = () => {
    if (!newAlbum.title.trim() || !newAlbum.eventDate) return;
    setPendingConfirm({
      title: "새 앨범을 만드시겠습니까?",
      desc: "만든 뒤 바로 사진을 업로드할 수 있어요.",
      actionLabel: "만들게요",
      onConfirm: async () => {
        const id = await addAlbum(newAlbum.title, newAlbum.eventDate, newAlbum.category);
        setNewAlbum({ title: "", eventDate: "", category: "공연" });
        setCreating(false);
        if (id) navigate(`/gallery/${id}`);
      },
    });
  };

  return (
    <div>
      <PageHeader eyebrow="Gallery" title="활동 갤러리" desc="공연별, 행사별로 남긴 순간들." />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={[
                "rounded-full border px-4 py-1.5 text-sm transition-colors",
                filter === f
                  ? "border-wind-gold bg-wind-gold/15 text-wind-gold"
                  : "border-line text-backstage/70 hover:border-dawn-teal/50 hover:text-dawn-teal",
              ].join(" ")}
            >
              {f}
            </button>
          ))}
        </div>

        {isPresident && (
          <button
            onClick={() => setCreating(true)}
            className="rounded-full bg-wind-gold px-4 py-1.5 text-sm font-semibold text-stage"
          >
            + 새 앨범
          </button>
        )}
      </div>

      {creating && (
        <div className="mt-4 max-w-md space-y-2.5 rounded-xl border border-line bg-afterglow p-4">
          <input
            value={newAlbum.title}
            onChange={(e) => setNewAlbum({ ...newAlbum, title: e.target.value })}
            placeholder="앨범 제목 (예: 2026 개강공연 <바람이 분다>)"
            className="w-full rounded-lg border border-line bg-stage px-3 py-2 text-sm text-backstage outline-none focus:border-dawn-teal"
          />
          <div className="flex flex-wrap gap-3">
            <input
              type="date"
              value={newAlbum.eventDate}
              onChange={(e) => setNewAlbum({ ...newAlbum, eventDate: e.target.value })}
              className="rounded-lg border border-line bg-stage px-3 py-2 text-sm text-backstage outline-none focus:border-dawn-teal"
            />
            <div className="flex gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewAlbum({ ...newAlbum, category: c })}
                  className={`rounded-full border px-3 py-1.5 text-xs ${
                    newAlbum.category === c
                      ? "border-wind-gold bg-wind-gold/10 text-wind-gold"
                      : "border-line text-mute"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={saveNewAlbum} className="rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage">
              만들기
            </button>
            <button onClick={() => setCreating(false)} className="rounded-lg border border-line px-4 py-2 text-sm text-mute">
              취소
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <>
            <Skeleton className="aspect-[4/5] w-full" />
            <Skeleton className="aspect-[4/5] w-full" />
            <Skeleton className="aspect-[4/5] w-full" />
          </>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-mute">아직 이 카테고리엔 앨범이 없어요.</p>
        ) : (
          filtered.map((album) => (
            <Link
              key={album.id}
              to={`/gallery/${album.id}`}
              className="group relative aspect-[4/5] overflow-hidden rounded-xl border border-line bg-afterglow transition-transform duration-300 hover:-translate-y-1"
            >
              <AlbumCover
                photoUrls={
                  album.coverPhotoUrl
                    ? [album.coverPhotoUrl, ...album.photos.map((p) => p.photoUrl).filter((u) => u !== album.coverPhotoUrl)]
                    : album.photos.map((p) => p.photoUrl)
                }
              />
              <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-stage via-stage/80 to-transparent p-4 pt-10">
                <Pill tone="teal">{album.category}</Pill>
                <p className="mt-1.5 truncate font-display text-base text-backstage">{album.title}</p>
                <p className="mt-0.5 font-mono text-[11px] text-mute">
                  {album.eventDate} · 사진 {album.photos.length}장
                </p>
              </div>
            </Link>
          ))
        )}
      </div>

      <ConfirmModal pending={pendingConfirm} onCancel={() => setPendingConfirm(null)} onConfirm={runConfirm} />
    </div>
  );
}