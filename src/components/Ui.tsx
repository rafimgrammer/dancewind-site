import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth, type Role } from "../context/AuthContext";
import WindLine from "./WindLine";

export function PageHeader({ eyebrow, title, desc }: { eyebrow: string; title: string; desc?: string }) {
  return (
    <header className="mb-8 animate-rise">
      <p className="font-mono text-xs tracking-[0.2em] text-dawn-teal uppercase">{eyebrow}</p>
      <h1 className="mt-2 font-display text-3xl text-backstage md:text-4xl">{title}</h1>
      {desc && <p className="mt-3 max-w-xl text-sm leading-relaxed text-backstage/70">{desc}</p>}
      <WindLine className="mt-6 h-6 w-full max-w-md opacity-70" />
    </header>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-line bg-afterglow p-5 transition-colors duration-200 hover:border-dawn-teal/40 ${className}`}
    >
      {children}
    </div>
  );
}

export function EmptyState({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-afterglow/50 px-6 py-14 text-center">
      <p className="font-display text-lg text-backstage/90">{title}</p>
      <p className="mt-2 text-sm text-mute">{desc}</p>
    </div>
  );
}

export function Pill({ children, tone = "gold" }: { children: ReactNode; tone?: "gold" | "teal" | "mute" }) {
  const toneClass =
    tone === "gold"
      ? "bg-wind-gold/15 text-wind-gold border-wind-gold/30"
      : tone === "teal"
        ? "bg-dawn-teal/15 text-dawn-teal border-dawn-teal/30"
        : "bg-afterglow-2 text-mute border-line";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[11px] ${toneClass}`}>
      {children}
    </span>
  );
}

/** 권한이 부족할 때 로그인 전환 방법을 안내 (실제 접근 제어는 서버 몫이지만, 디자인 검토용 목업) */
export function RequireRole({
  allow,
  children,
  what,
}: {
  allow: Role[];
  children: ReactNode;
  what: string;
}) {
  const { role } = useAuth();
  if (allow.includes(role)) return <>{children}</>;
  return (
    <div className="rounded-2xl border border-line bg-afterglow px-6 py-14 text-center">
      <p className="font-display text-lg text-backstage/90">{what}은 부원 전용 공간이에요</p>
      <p className="mt-2 text-sm text-mute">
        우측 상단의 테스트용 로그인 전환에서 권한을 바꿔보면 이 화면을 확인할 수 있어요.
      </p>
      <Link
        to="/recruit"
        className="mt-5 inline-flex rounded-full bg-wind-gold px-5 py-2 text-sm font-semibold text-stage transition-transform hover:-translate-y-0.5"
      >
        신입 부원 모집 안내 보기
      </Link>
    </div>
  );
}
