// src/components/Topbar.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { usePresence } from "../context/PresenceContext";
import { formatTimeAgo } from "../utils/timeAgo";

const ROLE_LABEL: Record<string, string> = {
  guest: "비로그인",
  member: "부원",
  president: "회장단",
};

function OnlineUsersButton() {
  const { role } = useAuth();
  const { onlineUsers, onlineCount } = usePresence();
  const isLoggedIn = role === "member" || role === "president";
  const [open, setOpen] = useState(false);

  if (onlineCount === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => isLoggedIn && setOpen((v) => !v)}
        className={`flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-backstage/85 transition-colors ${
          isLoggedIn ? "hover:border-dawn-teal/60 hover:text-dawn-teal cursor-pointer" : "cursor-default"
        }`}
        aria-label="접속중인 부원"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-dawn-teal opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-dawn-teal" />
        </span>
        <span className="hidden sm:inline">{onlineCount}명 접속 중</span>
        <span className="sm:hidden">{onlineCount}</span>
      </button>

      {open && isLoggedIn && (
        <div
          className="fixed inset-x-4 top-16 z-50 animate-rise rounded-xl border border-line bg-afterglow shadow-xl shadow-black/40 sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:z-auto sm:mt-2 sm:w-64"
          role="menu"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="font-display text-sm text-backstage">지금 접속 중인 부원</p>
          </div>
          <div className="max-h-80 overflow-y-auto py-1">
            {onlineUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-2.5 px-4 py-2">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full ${
                    u.role === "president" ? "bg-wind-gold/20" : "bg-dawn-teal/20"
                  }`}
                >
                  <img src="/dancewindlogo.png" alt="" className="h-full w-full object-contain p-1" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm text-backstage">{u.name}</p>
                  <p className="font-mono text-[11px] text-mute">{ROLE_LABEL[u.role]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { role, name, signOut } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const isLoggedIn = role === "member" || role === "president";
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/";
  };

  const handleNotificationClick = async (id: string, link: string) => {
    await markAsRead(id);
    setOpen(false);
    if (link) window.location.href = link;
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

      <div className="flex items-center gap-2">
        <OnlineUsersButton />

        {!isLoggedIn && (
          <Link
            to="/login"
            className="rounded-full bg-wind-gold px-4 py-1.5 text-sm font-semibold text-stage transition-opacity hover:opacity-90"
          >
            로그인
          </Link>
        )}

        {isLoggedIn && (
          <>
            <div className="relative">
              <button
                onClick={() => {
                  setOpen((v) => !v);
                  setShowAll(false);
                }}
                className="relative rounded-full border border-line p-2 text-backstage/85 transition-colors hover:border-dawn-teal/60 hover:text-dawn-teal"
                aria-label="알림"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path
                    d="M6 8a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 12 6 8Z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M9.5 17a2.5 2.5 0 0 0 5 0" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full border-2 border-stage bg-wind-gold" />
                )}
              </button>

              {open && (
                <div
                  className="absolute right-0 mt-2 w-80 animate-rise rounded-xl border border-line bg-afterglow shadow-xl shadow-black/40"
                  role="menu"
                >
                  <div className="flex items-center justify-between border-b border-line px-4 py-3">
                    <p className="font-display text-sm text-backstage">알림</p>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="text-xs text-mute hover:text-dawn-teal">
                        모두 읽음 처리
                      </button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-8 text-center text-sm text-mute">아직 알림이 없어요.</p>
                    ) : (
                      <>
                        {(showAll ? notifications : notifications.slice(0, 4)).map((n) => (
                          <button
                            key={n.id}
                            onClick={() => handleNotificationClick(n.id, n.link)}
                            className={`flex w-full flex-col items-start gap-0.5 border-b border-line/50 px-4 py-3 text-left transition-colors hover:bg-afterglow-2 ${n.read ? "opacity-60" : ""
                              }`}
                          >
                            <div className="flex w-full items-center gap-1.5">
                              {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-wind-gold" />}
                              <p className="truncate text-sm font-medium text-backstage">{n.title}</p>
                            </div>
                            <p className="truncate text-xs text-backstage/70">{n.body}</p>
                            <p className="font-mono text-[11px] text-mute">
                              {formatTimeAgo(new Date(n.createdAt).getTime())}
                            </p>
                          </button>
                        ))}

                        {!showAll && notifications.length > 4 && (
                          <button
                            onClick={() => setShowAll(true)}
                            className="w-full px-4 py-2.5 text-center text-xs font-medium text-dawn-teal hover:bg-afterglow-2"
                          >
                            더보기 ({notifications.length - 4}개 더 있어요)
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="rounded-full border border-line px-3 py-1.5 text-xs text-backstage/85 transition-colors hover:border-red-400/50 hover:text-red-300 sm:px-4 sm:text-sm"
            >
              로그아웃
            </button>

            <div
              className={`flex h-8 w-8 items-center justify-center overflow-hidden rounded-full ${role === "president" ? "bg-wind-gold/20" : "bg-dawn-teal/20"
                }`}
              title={`${name} (${ROLE_LABEL[role]})`}
            >
              <img src="/dancewindlogo.png" alt="" className="h-full w-full object-contain p-1" />
            </div>
          </>
        )}
      </div>
    </header>
  );
}