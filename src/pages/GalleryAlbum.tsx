// src/pages/GalleryAlbum.tsx
import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader, Pill } from "../components/Ui";
import { ConfirmModal, IconButton, type PendingConfirm } from "../components/InlineAdmin";
import Lightbox from "../components/Lightbox";
import { useAuth } from "../context/AuthContext";
import { useGallery } from "../context/GalleryContext";

const CATEGORIES = ["공연", "축제", "연습", "기타"];

export default function GalleryAlbum() {
  const { id } = useParams<{ id: string }>();
  const { role } = useAuth();
  const isPresident = role === "president";
  const { getAlbumById, editAlbum, removeAlbum, uploadPhotos, removePhoto, setCoverPhoto } = useGallery();
  const navigate = useNavigate();

  const album = id ? getAlbumById(id) : undefined;

  const [editMode, setEditMode] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const [editingInfo, setEditingInfo] = useState(false);
  const [infoDraft, setInfoDraft] = useState({ title: "", eventDate: "", category: "공연" });

  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const runConfirm = async () => {
    if (!pendingConfirm) return;
    await pendingConfirm.onConfirm();
    setPendingConfirm(null);
  };

  if (!album) {
    return (
      <div>
        <PageHeader eyebrow="Gallery" title="앨범을 찾을 수 없어요" desc="삭제되었거나 존재하지 않는 앨범이에요." />
        <button onClick={() => navigate("/gallery")} className="mt-4 rounded-lg border border-line px-4 py-2 text-sm text-mute">
          갤러리로 돌아가기
        </button>
      </div>
    );
  }

  const photoUrls = album.photos.map((p) => p.photoUrl);

  const handleFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0 || !id) return;
    setUploadError(null);
    setUploading(true);
    const result = await uploadPhotos(id, list);
    setUploading(false);
    if (!result.ok) setUploadError(result.message ?? "업로드에 실패했어요.");
  };

  const startEditInfo = () => {
    setInfoDraft({ title: album.title, eventDate: album.eventDate, category: album.category });
    setEditingInfo(true);
  };

  const saveInfo = () => {
    setPendingConfirm({
      title: "앨범 정보를 수정하시겠습니까?",
      desc: "",
      actionLabel: "수정할게요",
      onConfirm: async () => {
        await editAlbum(album.id, infoDraft.title, infoDraft.eventDate, infoDraft.category);
        setEditingInfo(false);
      },
    });
  };

  const confirmDeleteAlbum = () => {
    setPendingConfirm({
      title: "이 앨범을 삭제하시겠습니까?",
      desc: `사진 ${album.photos.length}장이 전부 함께 삭제되고, 되돌릴 수 없어요.`,
      actionLabel: "삭제할게요",
      onConfirm: async () => {
        await removeAlbum(album.id);
        navigate("/gallery");
      },
    });
  };

  const confirmDeletePhoto = (photoId: string) => {
    setPendingConfirm({
      title: "이 사진을 삭제하시겠습니까?",
      desc: "삭제하면 되돌릴 수 없어요.",
      actionLabel: "삭제할게요",
      onConfirm: async () => {
        await removePhoto(photoId);
      },
    });
  };

  return (
    <div>
      <button onClick={() => navigate("/gallery")} className="mb-4 text-sm text-mute hover:text-backstage">
        ← 갤러리로
      </button>

      {editingInfo ? (
        <div className="mb-6 max-w-md space-y-2.5 rounded-xl border border-dawn-teal/50 bg-afterglow p-4">
          <input
            value={infoDraft.title}
            onChange={(e) => setInfoDraft({ ...infoDraft, title: e.target.value })}
            className="w-full rounded-lg border border-dawn-teal/50 bg-stage px-3 py-2 text-sm text-backstage outline-none"
          />
          <div className="flex flex-wrap gap-3">
            <input
              type="date"
              value={infoDraft.eventDate}
              onChange={(e) => setInfoDraft({ ...infoDraft, eventDate: e.target.value })}
              className="rounded-lg border border-dawn-teal/50 bg-stage px-3 py-2 text-sm text-backstage outline-none"
            />
            <div className="flex gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setInfoDraft({ ...infoDraft, category: c })}
                  className={`rounded-full border px-3 py-1.5 text-xs ${
                    infoDraft.category === c ? "border-wind-gold bg-wind-gold/10 text-wind-gold" : "border-line text-mute"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={saveInfo} className="rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage">저장</button>
            <button onClick={() => setEditingInfo(false)} className="rounded-lg border border-line px-4 py-2 text-sm text-mute">취소</button>
          </div>
        </div>
      ) : (
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <Pill tone="teal">{album.category}</Pill>
            <h1 className="mt-2 font-display text-2xl text-backstage md:text-3xl">{album.title}</h1>
            <p className="mt-1 font-mono text-xs text-mute">{album.eventDate} · 사진 {album.photos.length}장</p>
          </div>
          {isPresident && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditMode((v) => !v)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  editMode ? "border-wind-gold bg-wind-gold text-stage" : "border-line text-backstage/80 hover:border-dawn-teal/50"
                }`}
              >
                {editMode ? "편집 모드 켜짐" : "편집 모드 켜기"}
              </button>
              {editMode && (
                <>
                  <IconButton onClick={startEditInfo} label="정보 수정" />
                  <IconButton onClick={confirmDeleteAlbum} label="앨범 삭제" tone="red" />
                </>
              )}
            </div>
          )}
        </div>
      )}

      {editMode && isPresident && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`mb-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed py-10 text-center transition-colors ${
            dragActive ? "border-wind-gold bg-wind-gold/5" : "border-line hover:border-dawn-teal/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-mute">
            <path d="M12 16V4M12 4l-4 4M12 4l4 4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="mt-3 text-sm text-backstage/80">
            {uploading ? "업로드하는 중..." : "사진을 여기로 끌어다 놓거나 클릭해서 선택하세요"}
          </p>
          <p className="mt-1 text-xs text-mute">여러 장을 한 번에 올릴 수 있어요 (장당 8MB 이하)</p>
        </div>
      )}

      {uploadError && (
        <p className="mb-4 rounded-lg border border-red-400/40 bg-red-400/10 px-3 py-2 text-xs text-red-300">{uploadError}</p>
      )}

      {album.photos.length === 0 ? (
        <p className="text-sm text-mute">아직 업로드된 사진이 없어요.</p>
      ) : (
        <div className="columns-2 gap-3 sm:columns-3 [&>*]:mb-3">
          {album.photos.map((photo, i) => (
            <div key={photo.id} className="group relative break-inside-avoid overflow-hidden rounded-xl border border-line">
              <img
                src={photo.photoUrl}
                alt=""
                onClick={() => setLightboxIndex(i)}
                className="w-full cursor-pointer object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
              {editMode && isPresident && (
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-stage/85 px-2 py-1.5 backdrop-blur-sm">
                  <button
                    onClick={() => setCoverPhoto(album.id, photo.photoUrl)}
                    className={`text-[11px] ${
                      album.coverPhotoUrl === photo.photoUrl ? "text-wind-gold" : "text-mute hover:text-wind-gold"
                    }`}
                  >
                    {album.coverPhotoUrl === photo.photoUrl ? "★ 커버" : "커버로 지정"}
                  </button>
                  <button onClick={() => confirmDeletePhoto(photo.id)} className="text-[11px] text-mute hover:text-red-300">
                    삭제
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          photoUrls={photoUrls}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}

      <ConfirmModal pending={pendingConfirm} onCancel={() => setPendingConfirm(null)} onConfirm={runConfirm} />
    </div>
  );
}