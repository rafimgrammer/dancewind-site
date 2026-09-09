// src/components/ImageCropModal.tsx
import { useEffect, useRef, useState } from "react";

const VIEWPORT = 288; // 크롭 틀 크기 (px)
const OUTPUT_SIZE = 640; // 실제 저장되는 이미지 해상도 (px)
const MAX_ZOOM = 3;

interface Point {
  x: number;
  y: number;
}

interface ImageCropModalProps {
  file: File;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}

export default function ImageCropModal({ file, onCancel, onConfirm }: ImageCropModalProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [baseScale, setBaseScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ pointer: Point; offset: Point } | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const clampOffset = (next: Point, scale: number, size: { w: number; h: number }) => {
    const displayW = size.w * scale;
    const displayH = size.h * scale;
    const minX = Math.min(0, VIEWPORT - displayW);
    const minY = Math.min(0, VIEWPORT - displayH);
    return {
      x: Math.min(0, Math.max(minX, next.x)),
      y: Math.min(0, Math.max(minY, next.y)),
    };
  };

  const handleImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const w = e.currentTarget.naturalWidth;
    const h = e.currentTarget.naturalHeight;
    const scale = Math.max(VIEWPORT / w, VIEWPORT / h);
    setNaturalSize({ w, h });
    setBaseScale(scale);
    setZoom(1);
    setOffset(clampOffset({ x: (VIEWPORT - w * scale) / 2, y: (VIEWPORT - h * scale) / 2 }, scale, { w, h }));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    dragStart.current = { pointer: { x: e.clientX, y: e.clientY }, offset };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging || !dragStart.current || !naturalSize) return;
    const dx = e.clientX - dragStart.current.pointer.x;
    const dy = e.clientY - dragStart.current.pointer.y;
    const scale = baseScale * zoom;
    const next = { x: dragStart.current.offset.x + dx, y: dragStart.current.offset.y + dy };
    setOffset(clampOffset(next, scale, naturalSize));
  };

  const handlePointerUp = () => {
    setDragging(false);
    dragStart.current = null;
  };

  const handleZoomChange = (nextZoom: number) => {
    if (!naturalSize) return;
    const oldScale = baseScale * zoom;
    const newScale = baseScale * nextZoom;

    // 확대/축소해도 지금 화면 정중앙에 보이던 지점이 계속 정중앙에 오도록 위치를 같이 보정해요.
    const centerImageX = (VIEWPORT / 2 - offset.x) / oldScale;
    const centerImageY = (VIEWPORT / 2 - offset.y) / oldScale;
    const nextOffset = {
      x: VIEWPORT / 2 - centerImageX * newScale,
      y: VIEWPORT / 2 - centerImageY * newScale,
    };

    setZoom(nextZoom);
    setOffset(clampOffset(nextOffset, newScale, naturalSize));
  };

  const handleConfirm = () => {
    if (!imageUrl || !naturalSize) return;
    const scale = baseScale * zoom;
    const cropX = -offset.x / scale;
    const cropY = -offset.y / scale;
    const cropSize = VIEWPORT / scale;

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, cropX, cropY, cropSize, cropSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
      canvas.toBlob(
        (blob) => {
          if (blob) onConfirm(blob);
        },
        "image/jpeg",
        0.92
      );
    };
    img.src = imageUrl;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-afterglow p-5">
        <p className="font-display text-lg text-backstage">사진 위치 조정</p>
        <p className="mt-1 text-xs text-mute">드래그해서 위치를 옮기고, 아래 슬라이더로 확대/축소하세요.</p>

        <div className="mt-4 flex justify-center">
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative touch-none overflow-hidden rounded-xl border-2 border-wind-gold"
            style={{
              width: VIEWPORT,
              height: VIEWPORT,
              cursor: dragging ? "grabbing" : "grab",
            }}
          >
            {imageUrl && naturalSize && (
              <img
                src={imageUrl}
                onLoad={handleImgLoad}
                alt=""
                draggable={false}
                className="pointer-events-none absolute select-none"
                style={{
                  left: offset.x,
                  top: offset.y,
                  width: naturalSize.w * baseScale * zoom,
                  height: naturalSize.h * baseScale * zoom,
                  maxWidth: "none",
                }}
              />
            )}
            {!naturalSize && imageUrl && (
              <img src={imageUrl} onLoad={handleImgLoad} alt="" className="hidden" />
            )}

            {/* 삼분할 안내선 */}
            <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
              {Array.from({ length: 9 }, (_, i) => (
                <div key={i} className="border border-white/15" />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-mute">
            <circle cx="10" cy="10" r="6" />
            <path d="M20 20l-4.5-4.5" strokeLinecap="round" />
          </svg>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => handleZoomChange(Number(e.target.value))}
            className="w-full accent-wind-gold"
          />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-mute">
            <circle cx="10" cy="10" r="7" />
            <path d="M10 7v6M7 10h6" strokeLinecap="round" />
            <path d="M20 20l-4.5-4.5" strokeLinecap="round" />
          </svg>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-lg border border-line px-4 py-2 text-sm text-mute">
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={!naturalSize}
            className="rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage disabled:opacity-50"
          >
            완료
          </button>
        </div>
      </div>
    </div>
  );
}