// src/components/Lightbox.tsx
import { useEffect } from "react";

interface LightboxProps {
  photoUrls: string[];
  index: number;
  onClose: () => void;
  onNavigate: (nextIndex: number) => void;
}

export default function Lightbox({ photoUrls, index, onClose, onNavigate }: LightboxProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNavigate((index + 1) % photoUrls.length);
      if (e.key === "ArrowLeft") onNavigate((index - 1 + photoUrls.length) % photoUrls.length);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [index, photoUrls.length, onClose, onNavigate]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stage/95 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full border border-line bg-afterglow p-2 text-backstage/80 hover:text-wind-gold"
        aria-label="닫기"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
        </svg>
      </button>

      <span className="absolute left-4 top-4 font-mono text-xs text-backstage/60">
        {index + 1} / {photoUrls.length}
      </span>

      {photoUrls.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate((index - 1 + photoUrls.length) % photoUrls.length);
          }}
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-line bg-afterglow/80 p-2.5 text-backstage/80 hover:text-wind-gold sm:left-6"
          aria-label="이전 사진"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      <img
        src={photoUrls[index]}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl shadow-black/60"
      />

      {photoUrls.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate((index + 1) % photoUrls.length);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-line bg-afterglow/80 p-2.5 text-backstage/80 hover:text-wind-gold sm:right-6"
          aria-label="다음 사진"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  );
}