// src/components/KakaoShareButton.tsx
import { useState } from "react";
import { shareToKakao, type KakaoCustomShareOptions } from "../lib/kakaoShare";

interface KakaoShareButtonProps extends KakaoCustomShareOptions {
  /** 버튼에 표시할 문구 */
  label?: string;
  className?: string;
}

export default function KakaoShareButton({
  label = "카카오톡으로 공유하기",
  className = "",
  ...shareOptions
}: KakaoShareButtonProps) {
  const [sharing, setSharing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleClick = async () => {
    setErrorMsg("");
    setSharing(true);
    try {
      await shareToKakao(shareOptions);
    } catch {
      setErrorMsg("카카오톡 공유를 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="inline-flex flex-col items-start gap-1.5">
      <button
        onClick={handleClick}
        disabled={sharing}
        className={`inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-medium text-backstage/85 transition-colors hover:border-dawn-teal/60 hover:text-dawn-teal disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 3C6.48 3 2 6.58 2 11c0 2.8 1.83 5.26 4.6 6.7-.2.75-.73 2.73-.84 3.15-.13.52.19.51.4.37.16-.11 2.6-1.77 3.66-2.49.7.1 1.42.16 2.18.16 5.52 0 10-3.58 10-8 0-4.42-4.48-8-10-8Z"
            fill="currentColor"
          />
        </svg>
        {sharing ? "공유 준비 중..." : label}
      </button>
      {errorMsg && <p className="text-xs text-red-300">{errorMsg}</p>}
    </div>
  );
}