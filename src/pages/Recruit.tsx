import { PageHeader, Card, Pill } from "../components/Ui";

const STEPS = [
  { title: "지원서 제출", desc: "온라인 지원서에 간단한 자기소개와 원하는 역할(댄서, 스태프), 각오를 적어주세요. 춤 경력은 필요 없어요." },
  { title: "면접", desc: "자유곡을 추시거나 영상으로 대체 가능합니다. 완성도보다 에너지를 봐요." },
  { title: "함께 배우는 워크숍", desc: "합격자 대상, 파트 선배들과 반나절 동안 기본기를 나눠요." },
];

export default function Recruit() {
  return (
    <div>
      <PageHeader eyebrow="Recruiting" title="신입 부원 모집 안내" desc="이번 바람은 여러분 차례입니다." />

      <div className="rounded-2xl border border-wind-gold/30 bg-gradient-to-br from-afterglow to-stage p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <Pill tone="gold">2026 2학기 모집</Pill>
          <Pill tone="teal">경력 무관</Pill>
        </div>
        <p className="mt-4 font-display text-2xl text-backstage">지원 기간 8/18 - 9/1</p>
        <p className="mt-1 text-sm text-backstage/70">오디션 9/5(토) · 발표 9/8(화)</p>
        <button className="mt-6 rounded-full bg-wind-gold px-6 py-3 text-sm font-semibold text-stage transition-transform hover:-translate-y-0.5">
          지원서 작성하기
        </button>
      </div>

      <div className="mt-10">
        <p className="font-mono text-xs tracking-[0.2em] text-dawn-teal uppercase">Process</p>
        <h2 className="mt-2 font-display text-2xl text-backstage">지원 방법</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Card key={s.title} className="relative">
              <span className="font-mono text-xs text-wind-gold">STEP {i + 1}</span>
              <p className="mt-2 font-display text-lg text-backstage">{s.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-backstage/70">{s.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
