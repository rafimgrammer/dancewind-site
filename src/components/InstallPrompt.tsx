// src/components/InstallPrompt.tsx
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "chumbaram_install_dismissed_at";
const DISMISS_DAYS = 14;

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari 전용 속성
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function recentlyDismissed() {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const elapsedDays = (Date.now() - Number(raw)) / (1000 * 60 * 60 * 24);
  return elapsedDays < DISMISS_DAYS;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

    if (isIos()) {
      setShowIosHint(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  if (dismissed || (!deferredPrompt && !showIosHint)) return null;

  return (
    <div
      className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-line bg-afterglow p-4 shadow-2xl shadow-black/40 sm:inset-x-auto sm:right-6"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-stage">
        <img src="/icons/icon-192.png" alt="" className="h-full w-full object-cover" />
      </div>

      <div className="min-w-0 flex-1">
        {showIosHint ? (
          <p className="text-xs text-backstage/85">
            <span className="font-semibold text-backstage">홈 화면에 추가</span>하면 앱처럼 써요 — 하단 공유
            버튼(
            <svg
              className="mx-0.5 inline-block -translate-y-0.5"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 3v12" strokeLinecap="round" />
              <path d="M8 7l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            ) → "홈 화면에 추가"를 눌러주세요.
          </p>
        ) : (
          <p className="text-xs text-backstage/85">
            <span className="font-semibold text-backstage">춤바람을 홈 화면에 추가</span>하고 앱처럼 빠르게
            접속해보세요.
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {!showIosHint && (
          <button
            onClick={handleInstall}
            className="rounded-full bg-wind-gold px-3 py-1.5 text-xs font-semibold text-stage"
          >
            설치
          </button>
        )}
        <button onClick={handleDismiss} className="p-1 text-mute hover:text-backstage" aria-label="닫기">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}