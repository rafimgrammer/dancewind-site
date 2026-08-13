// src/components/Layout.tsx
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import PageTransition from "./PageTransition";
import { useNearBottom } from "../hooks/useNearBottom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import InstallPrompt from "./InstallPrompt";

export default function Layout({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const nearBottom = useNearBottom();

  return (
    <div className="min-h-screen bg-stage">
      <div className="mx-auto flex max-w-[1400px]">
        {/* 데스크톱 사이드바 */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-line md:flex md:flex-col">
          <Link
            to="/"
            className="flex flex-col items-center gap-3 px-5 py-8 transition-opacity hover:opacity-80"
          >
            <img src="/dancewindlogo.png" alt="춤바람 로고" className="h-24 w-auto" />
            <span className="font-display text-4xl tracking-wide text-backstage">춤바람</span>
          </Link>
          <div className="flex-1 overflow-y-auto">
            <Sidebar />
          </div>
        </aside>

        {/* 모바일 드로어 */}
        {drawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />
            <aside className="absolute left-0 top-0 h-full w-72 animate-rise bg-stage border-r border-line">
              <div className="flex items-center justify-between px-5 py-6">
                <Link
                  to="/"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
                >
                  <span className="font-display text-2xl text-backstage">춤바람</span>
                </Link>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-lg p-2 text-backstage/80 hover:bg-afterglow-2"
                  aria-label="메뉴 닫기"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="h-[calc(100%-88px)] overflow-y-auto">
                <Sidebar onNavigate={() => setDrawerOpen(false)} />
              </div>
            </aside>
          </div>
        )}

        {/* 오른쪽 본문 컬럼 — 사이드바를 제외한 영역이라, 이 안에 넣는 건 뭐든 사이드바를 침범 못 함 */}
        <div className="flex min-h-screen flex-1 flex-col">
          <Topbar onMenuClick={() => setDrawerOpen(true)} />
          <main className="flex-1 px-4 py-8 md:px-10 md:py-10">
            <PageTransition>{children}</PageTransition>
          </main>
          <footer className="border-t border-line px-4 py-6 text-center font-mono text-xs text-mute md:px-10">
            © 춤바람 — 바람이 지나간 자리에 스텝이 남는다.
          </footer>

          {/* "더 있어요" 힌트 그라데이션 — 이 컬럼 폭 안에서만 하단에 붙음 */}
          <div
            className={`pointer-events-none sticky bottom-0 -mt-24 h-24 bg-gradient-to-t from-stage to-transparent transition-opacity duration-300 ${
              nearBottom ? "opacity-0" : "opacity-100"
            }`}
            aria-hidden="true"
          />
        </div>
      </div>

      <InstallPrompt />
    </div>
  );
}