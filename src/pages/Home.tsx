// src/pages/Home.tsx
import { Link } from "react-router-dom";
import WindLine from "../components/WindLine";
import { Card, Pill } from "../components/Ui";
import Reveal from "../components/Reveal";
import VisitorCounter from "../components/VisitorCounter";
import history from "../data/history.json";
import schedule from "../data/schedule.json";

const CHANNELS = [
  {
    name: "Instagram",
    handle: "@hallym_dancewind",
    href: "https://www.instagram.com/hallym_dancewind?igsh=MWFweWs4cGVvcTNvYw==",
    desc: "연습 영상과 공연 스케치",
  },
  {
    name: "YouTube",
    handle: "한림대학교 중앙동아리 춤바람 [DANCEWIND]",
    href: "https://youtube.com/@2dancewind2023?si=jPvCFrEvj8KHF4H1",
    desc: "정기공연 풀영상 아카이브",
  },
];

export default function Home() {
  return (
    <div className="space-y-24">
      {/* 히어로 — 페이지의 첫인상이자 테제, 바로 보여야 하니 Reveal 미적용 */}
      <section className="relative overflow-hidden rounded-3xl border border-line bg-afterglow">
        <div className="grid gap-8 p-6 md:grid-cols-[1.1fr_0.9fr] md:p-10">
          <div className="flex flex-col justify-center animate-rise">
            <Pill tone="teal">2011 ~ NOW · 90+ CREW</Pill>
            <h1 className="mt-4 font-display text-4xl leading-tight text-backstage md:text-5xl">
              90명의 스텝이
              <br />
              하나의 박자로
              <br />
              <span className="text-wind-gold">모이는 곳.</span>
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-backstage/70">
              춤바람은 힙합, 왁킹, 팝핀, 걸스힙합까지 아우르는 대학 스트릿 댄스 크루입니다.
              연습 일정을 정리하는 것도, 무대에 오르는 것도 결국 같은 팀의 일이라고 믿어요.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/recruit"
                className="rounded-full bg-wind-gold px-6 py-3 text-sm font-semibold text-stage transition-transform hover:-translate-y-0.5"
              >
                신입 부원 모집 안내
              </Link>
              <Link
                to="/videos"
                className="rounded-full border border-line px-6 py-3 text-sm text-backstage/85 transition-colors hover:border-dawn-teal/60 hover:text-dawn-teal"
              >
                활동 영상 보기
              </Link>
            </div>
          </div>

          {/* 영상 자리 — 홍보영상 자동재생, 무대 조명처럼 살짝 기울인 비대칭 프레임 */}
          <div className="relative flex items-center justify-center">
            <div className="relative w-full max-w-sm -rotate-2 rounded-2xl border border-line bg-stage p-2 shadow-2xl shadow-black/40 transition-transform duration-500 hover:rotate-0">
              <div className="relative aspect-[9/13] overflow-hidden rounded-xl bg-stage">
                <iframe
                  className="pointer-events-none absolute left-1/2 top-1/2 h-[130%] w-[130%] -translate-x-1/2 -translate-y-1/2"
                  src="https://www.youtube.com/embed/Ehg9VxymfT4?autoplay=1&mute=1&loop=1&playlist=Ehg9VxymfT4&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1"
                  title="2026 춤바람 홍보영상"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              </div>
              <span className="absolute -bottom-3 left-4 rounded-full bg-dawn-teal px-3 py-1 font-mono text-[10px] text-stage">
                LIVE AT STAGE
              </span>

              {/* 이어폰 줄 디테일 */}
              <svg
                className="pointer-events-none absolute -bottom-24 right-6 h-28 w-16 overflow-visible"
                viewBox="0 0 60 100"
                fill="none"
              >
                <path
                  d="M10 0 C 10 30, 45 20, 40 50 S 15 75, 20 95"
                  stroke="var(--color-line)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle
                  cx="20"
                  cy="95"
                  r="6"
                  fill="var(--color-afterglow-2)"
                  stroke="var(--color-wind-gold)"
                  strokeWidth="1.5"
                />
                <circle cx="20" cy="95" r="2" fill="var(--color-wind-gold)" />
              </svg>
            </div>
          </div>
        </div>
        <WindLine variant="hero" className="h-24 w-full opacity-80" />
      </section>

      {/* 회장단 인삿말 */}
      <Reveal>
        <section className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div>
            <p className="font-mono text-xs tracking-[0.2em] text-dawn-teal uppercase">Greeting</p>
            <h2 className="mt-2 font-display text-2xl text-backstage md:text-3xl">회장단 인삿말</h2>
          </div>
          <Card>
            <p className="text-[15px] leading-relaxed text-backstage/85">
              안녕하세요, 춤바람 19대 회장 강지호입니다. 90명이 넘는 인원이 한 팀으로 움직인다는 건
              생각보다 훨씬 많은 조율이 필요한 일이더라고요. 그래도 매주 동방에 모여 몸을 풀고, 서로의
              동작을 봐주고, 무대 위에서 같은 박자를 나눌 때마다 이 규모가 오히려 우리의 힘이라는 걸
              느낍니다. 처음 스텝을 밟아보는 분이든, 오래된 부원이든 이 홈페이지에서 춤바람의 리듬을
              느껴보셨으면 해요.
            </p>
            <p className="mt-4 font-mono text-xs text-mute">— 19기 강지호, 춤바람 회장</p>
          </Card>
        </section>
      </Reveal>

      {/* 춤바람의 역사 — 실제 타임라인이므로 순서 장치 사용 */}
      <Reveal delay={100}>
        <section>
          <p className="font-mono text-xs tracking-[0.2em] text-dawn-teal uppercase">History</p>
          <h2 className="mt-2 font-display text-2xl text-backstage md:text-3xl">춤바람의 역사</h2>
          <div className="mt-8 space-y-0">
            {history.map((h, i) => (
              <div key={h.year} className="group flex gap-5 border-l border-line pl-6 pb-8 last:pb-0">
                <div className="relative -ml-[29px] flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line bg-stage font-mono text-[10px] text-wind-gold">
                  {i + 1}
                </div>
                <div>
                  <p className="font-display text-lg text-wind-gold">{h.year}</p>
                  <p className="mt-1 text-sm leading-relaxed text-backstage/75">{h.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* 일정 */}
      <Reveal delay={100}>
        <section>
          <p className="font-mono text-xs tracking-[0.2em] text-dawn-teal uppercase">Schedule</p>
          <h2 className="mt-2 font-display text-2xl text-backstage md:text-3xl">춤바람 일정</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {schedule.map((s) => (
              <Card key={s.id} className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-mute">{s.date}</p>
                  <p className="mt-1.5 text-[15px] font-medium text-backstage">{s.label}</p>
                </div>
                <Pill tone={s.type === "공연" ? "gold" : s.type === "모집" ? "teal" : "mute"}>{s.type}</Pill>
              </Card>
            ))}
          </div>
        </section>
      </Reveal>

      {/* 채널 */}
      <Reveal delay={100}>
        <section>
          <p className="font-mono text-xs tracking-[0.2em] text-dawn-teal uppercase">Channels</p>
          <h2 className="mt-2 font-display text-2xl text-backstage md:text-3xl">춤바람 채널</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {CHANNELS.map((c) => (
              <a
                key={c.name}
                href={c.href}
                target="_blank"
                rel="noreferrer"
                className="group rounded-2xl border border-line bg-afterglow p-5 transition-all hover:-translate-y-1 hover:border-dawn-teal/50"
              >
                <p className="font-display text-lg text-backstage group-hover:text-dawn-teal">{c.name}</p>
                <p className="mt-1 font-mono text-xs text-wind-gold">{c.handle}</p>
                <p className="mt-2 text-sm text-mute">{c.desc}</p>
              </a>
            ))}
          </div>
        </section>
      </Reveal>

      {/* 오늘 방문자수 */}
      <Reveal delay={100}>
        <VisitorCounter />
      </Reveal>

      {/* 모집 CTA 배너 */}
      <Reveal delay={100}>
        <section className="relative overflow-hidden rounded-3xl border border-wind-gold/30 bg-gradient-to-br from-afterglow to-stage p-8 text-center md:p-12">
          <p className="font-mono text-xs tracking-[0.2em] text-dawn-teal uppercase">Recruiting</p>
          <h2 className="mt-3 font-display text-3xl text-backstage md:text-4xl">
            이번 바람은, <span className="text-wind-gold">당신 차례.</span>
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-backstage/70">
            경험이 없어도 괜찮아요. 리듬을 즐기려는 마음이면 충분합니다.
          </p>
          <Link
            to="/recruit"
            className="mt-6 inline-flex rounded-full bg-wind-gold px-7 py-3 text-sm font-semibold text-stage transition-transform hover:-translate-y-0.5"
          >
            지원 방법 확인하기
          </Link>
        </section>
      </Reveal>
    </div>
  );
}