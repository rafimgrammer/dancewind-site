import { PageHeader, Card, Pill } from "../components/Ui";

const PARTS = [
  { name: "힙합", desc: "그루브와 파워를 오가는 춤바람의 기본기" },
  { name: "왁킹", desc: "팔의 표현력과 음악 해석이 중심" },
  { name: "팝핀", desc: "정확한 타이밍과 아이솔레이션" },
  { name: "걸스힙합", desc: "무대 위 존재감과 여성 파트 안무" },
];

export default function About() {
  return (
    <div>
      <PageHeader
        eyebrow="About"
        title="춤바람 소개"
        desc="2011년부터 이어져 온 대학 스트릿 댄스 크루. 규모는 커졌지만 기준은 그대로예요 — 각자의 자리에서 최선의 스텝을 밟을 것."
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <p className="font-display text-lg text-backstage">우리가 지키는 것</p>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-backstage/80">
            <li>· 실력보다 태도 — 처음 오는 사람도 눈치 보지 않게</li>
            <li>· 무대는 함께 만든다 — 개인기보다 합의 완성도</li>
            <li>· 90명 규모를 운영하는 실용성 — 일정과 소통은 투명하게</li>
          </ul>
        </Card>
        <Card>
          <p className="font-display text-lg text-backstage">활동 리듬</p>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-backstage/80">
            <li>· 매주 화·목 파트별 연습, 토요일 전체 합주</li>
            <li>· 학기당 1회 정기공연, 축제 기간 게스트 무대</li>
            <li>· 방학 중 신입 오디션 및 워크숍 MT</li>
          </ul>
        </Card>
      </div>

      <div className="mt-8">
        <p className="font-mono text-xs tracking-[0.2em] text-dawn-teal uppercase">Parts</p>
        <h2 className="mt-2 font-display text-2xl text-backstage">파트 구성</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PARTS.map((p) => (
            <Card key={p.name}>
              <Pill>{p.name}</Pill>
              <p className="mt-3 text-sm leading-relaxed text-backstage/75">{p.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
