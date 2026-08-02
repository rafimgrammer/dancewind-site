// src/components/Topbar.tsx
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLE_LABEL: Record<string, string> = {
  guest: "비로그인",
  member: "부원",
  president: "회장단",
};

export default function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { role, name, signOut } = useAuth();
  const isLoggedIn = role === "member" || role === "president";

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-line bg-stage/90 px-4 backdrop-blur md:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-backstage/80 hover:bg-afterglow-2 md:hidden"
          aria-label="메뉴 열기"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
          </svg>
        </button>
        <span className="font-display text-lg tracking-wide text-backstage md:hidden">춤바람</span>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {!isLoggedIn && (
          <Link
            to="/login"
            className="rounded-full bg-wind-gold px-3 py-1 text-xs font-semibold text-stage transition-opacity hover:opacity-90 sm:px-4 sm:py-1.5 sm:text-sm"
          >
            로그인
          </Link>
        )}

        {isLoggedIn && (
          <>
            <Link
              to="/mypage"
              className="rounded-full border border-line px-3 py-1 text-xs text-backstage/85 transition-colors hover:border-dawn-teal/60 hover:text-dawn-teal sm:px-4 sm:py-1.5 sm:text-sm"
            >
              마이페이지
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-full border border-line px-3 py-1 text-xs text-backstage/85 transition-colors hover:border-red-400/50 hover:text-red-300 sm:px-4 sm:py-1.5 sm:text-sm"
            >
              로그아웃
            </button>
            <div className="flex items-center gap-1.5 rounded-full border border-line bg-afterglow px-2 py-1 text-xs text-backstage/90 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm">
              <span
                className={`h-2 w-2 rounded-full ${role === "member" ? "bg-dawn-teal" : "bg-wind-gold"}`}
              />
              <span className="hidden sm:inline">{name}</span>
              <span className="rounded-full bg-afterglow-2 px-1.5 py-0.5 font-mono text-[10px] text-mute sm:px-2 sm:text-[11px]">
                {ROLE_LABEL[role]}
              </span>
            </div>
          </>
        )}
      </div>
    </header>
  );
}