// src/components/Lightbox.tsx
import { useEffect } from "react";
import { createPortal } from "react-dom";

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
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [index, photoUrls.length, onClose, onNavigate]);

  // fixed 요소가 페이지 전환 애니메이션(transform)에 갇히지 않도록
  // body에 바로 그려요. 이렇게 안 하면 진짜 화면 전체가 아니라
  // 부모 컨테이너 기준으로 위치가 잡혀버려요.
  return createPortal(
    <div
      className="animate-lightbox-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm sm:p-10"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-white/5 p-2.5 text-backstage/80 backdrop-blur-sm transition-colors hover:border-wind-gold/50 hover:text-wind-gold"
        aria-label="닫기"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
        </svg>
      </button>

      <span className="absolute left-4 top-4 z-10 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[11px] text-backstage/70 backdrop-blur-sm">
        {index + 1} / {photoUrls.length}
      </span>

      {photoUrls.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate((index - 1 + photoUrls.length) % photoUrls.length);
          }}
          className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/10 bg-white/5 p-3 text-backstage/80 backdrop-blur-sm transition-colors hover:border-wind-gold/50 hover:text-wind-gold sm:left-6"
          aria-label="이전 사진"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      <img
        key={index}
        src={photoUrls[index]}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="animate-lightbox-in max-h-[85vh] max-w-[90vw] rounded-xl border border-white/15 object-contain shadow-2xl shadow-black/60"
      />

      {photoUrls.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate((index + 1) % photoUrls.length);
          }}
          className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/10 bg-white/5 p-3 text-backstage/80 backdrop-blur-sm transition-colors hover:border-wind-gold/50 hover:text-wind-gold sm:right-6"
          aria-label="다음 사진"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>,
    document.body
  );
}