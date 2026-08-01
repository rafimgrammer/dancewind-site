import { useState } from "react";
import { useAuth, type Role } from "../context/AuthContext";

const ROLE_LABEL: Record<Role, string> = {
  guest: "비로그인",
  member: "부원",
  president: "회장단",
};

export default function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { role, name, setRole } = useAuth();
  const [open, setOpen] = useState(false);

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

      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full border border-line bg-afterglow px-3 py-1.5 text-sm text-backstage/90 transition-colors hover:border-dawn-teal/60"
          aria-haspopup="true"
          aria-expanded={open}
        >
          <span
            className={[
              "h-2 w-2 rounded-full",
              role === "guest" ? "bg-mute" : role === "member" ? "bg-dawn-teal" : "bg-wind-gold",
            ].join(" ")}
          />
          <span className="hidden sm:inline">{name}</span>
          <span className="rounded-full bg-afterglow-2 px-2 py-0.5 font-mono text-[11px] text-mute">
            {ROLE_LABEL[role]}
          </span>
        </button>

        {open && (
          <div
            className="absolute right-0 mt-2 w-64 animate-rise rounded-xl border border-line bg-afterglow p-2 shadow-xl shadow-black/40"
            role="menu"
          >
            <p className="px-2 py-1.5 font-mono text-[11px] uppercase tracking-widest text-mute">
              테스트용 로그인 전환
            </p>
            {(["guest", "member", "president"] as Role[]).map((r) => (
              <button
                key={r}
                role="menuitem"
                onClick={() => {
                  setRole(r);
                  setOpen(false);
                }}
                className={[
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  role === r ? "bg-afterglow-2 text-wind-gold" : "text-backstage/85 hover:bg-afterglow-2",
                ].join(" ")}
              >
                {ROLE_LABEL[r]}
                {role === r && <span className="text-xs">현재</span>}
              </button>
            ))}
            <div className="mt-1 border-t border-line pt-2 px-2 text-[11px] leading-relaxed text-mute">
              실제 서비스에서는 Google 로그인 후 자동으로 권한이 부여됩니다. 이 버튼은 디자인 검토용입니다.
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
