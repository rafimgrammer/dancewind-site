// src/components/Sidebar.tsx
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface NavItem {
  to: string;
  label: string;
  emphasize?: boolean;
}

const COMMON: NavItem[] = [
  { to: "/", label: "HOME" },
  { to: "/about", label: "춤바람 소개" },
  { to: "/videos", label: "춤바람 활동 영상" },
  { to: "/calendar", label: "춤바람 캘린더" },
  { to: "/officers", label: "회장단 프로필" },
  { to: "/location", label: "동방 찾아오시는 길" },
  { to: "/recruit", label: "신입 부원 모집 안내", emphasize: true },
  { to: "/gallery", label: "활동 갤러리" },
];

const MEMBER: NavItem[] = [
  { to: "/notices", label: "공지사항" },
  { to: "/board", label: "자유게시판" },
  { to: "/anonymous", label: "익명 건의·게시판" },
  { to: "/classes", label: "티칭 클래스" },
  { to: "/reels", label: "같이 릴스찍자!" },
  { to: "/practice-matcher", label: "연습시간 마스터" },
];

const PRESIDENT: NavItem[] = [
  { to: "/tracklist-master", label: "트랙리스트 마스터" },
  { to: "/member-manage", label: "전체 부원 관리" },
];

const SOCIAL_LINKS = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/hallym_dancewind?igsh=MWFweWs4cGVvcTNvYw==",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    name: "YouTube",
    href: "https://youtube.com/@2dancewind2023?si=jPvCFrEvj8KHF4H1",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
        <path d="M10.5 9.5l5 2.5-5 2.5v-5z" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

function GroupLabel({ children }: { children: string }) {
  return (
    <p className="px-3 pt-5 pb-1.5 text-[11px] tracking-[0.18em] text-mute font-mono uppercase">
      {children}
    </p>
  );
}

function Item({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          "group relative flex items-center gap-2 rounded-lg px-3 py-2.5 text-[15px] transition-all duration-200",
          "hover:translate-x-1 hover:bg-afterglow-2",
          isActive ? "bg-afterglow-2 text-wind-gold font-semibold" : "text-backstage/85",
          item.emphasize && !isActive ? "text-wind-gold" : "",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={[
              "h-1.5 w-1.5 shrink-0 rounded-full transition-all duration-200",
              isActive
                ? "bg-wind-gold scale-100"
                : "bg-transparent scale-0 group-hover:scale-100 group-hover:bg-dawn-teal/70",
            ].join(" ")}
          />
          {item.label}
        </>
      )}
    </NavLink>
  );
}

const ROLE_LABEL: Record<string, string> = {
  member: "부원",
  president: "회장단",
};

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { role, name } = useAuth();
  const isLoggedIn = role === "member" || role === "president";

  return (
    <nav className="flex h-full flex-col px-3 pb-6" aria-label="주요 메뉴">
      {isLoggedIn && (
        <Link
          to="/mypage"
          onClick={onNavigate}
          className="mb-4 mt-1 flex items-center gap-3 rounded-xl border border-line bg-afterglow p-3 transition-colors hover:border-wind-gold/40"
        >
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full ${role === "president" ? "bg-wind-gold/20" : "bg-dawn-teal/20"
              }`}
          >
            <img src="/dancewindlogo.png" alt="" className="h-full w-full object-contain p-1.5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-backstage">{name}</p>
            <p className="mt-0.5 font-mono text-[11px] text-mute">{ROLE_LABEL[role]} · 마이페이지</p>
          </div>
        </Link>
      )}

      <div className="space-y-0.5">
        {COMMON.map((item) => (
          <Item key={item.to} item={item} onNavigate={onNavigate} />
        ))}
      </div>

      {(role === "member" || role === "president") && (
        <>
          <GroupLabel>부원 전용</GroupLabel>
          <div className="space-y-0.5">
            {MEMBER.map((item) => (
              <Item key={item.to} item={item} onNavigate={onNavigate} />
            ))}
          </div>
        </>
      )}

      {role === "president" && (
        <>
          <GroupLabel>회장단 전용</GroupLabel>
          <div className="space-y-0.5">
            {PRESIDENT.map((item) => (
              <Item key={item.to} item={item} onNavigate={onNavigate} />
            ))}
          </div>
        </>
      )}

      <div className="mt-auto pt-6">
        <div className="mb-3 space-y-2">
          {SOCIAL_LINKS.map((s) => (
            <a
              key={s.name}
              href={s.href}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 rounded-xl border border-line bg-afterglow p-3 text-sm text-backstage/85 transition-colors hover:border-wind-gold/50 hover:text-wind-gold"
            >
              {s.icon}
              <span>춤바람 {s.name === "Instagram" ? "인스타그램" : "유튜브"}</span>
            </a>
          ))}
        </div>

        <div className="rounded-xl border border-line bg-afterglow p-3 text-xs text-mute">
          <p className="font-mono text-dawn-teal">CHUMBARAM CREW</p>
          <p className="mt-1 leading-relaxed">바람이 지나간 자리에 스텝이 남는다.</p>
        </div>
      </div>
    </nav>
  );
}