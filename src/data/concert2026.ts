// src/data/concert2026.ts
//
// 2026 정기공연 「輪舞 윤무」 홍보 페이지에 들어가는 모든 문구/데이터.
// ⚠️ 지금 들어있는 내용은 전부 "초안용 예시"예요. 확정되면 이 파일만 고치면 페이지 전체에 반영됩니다.
//    (디자인 코드는 src/pages/Concert.tsx, 애니메이션은 src/pages/concert2026.css)

export interface ConcertTeam {
  id: string;
  name: string;
  genre: string;
  songs: { artist: string; title: string }[];
  members: string[];
  /** 팀장 이름 — members 안에 있는 이름과 똑같이 적어주세요. (없으면 생략) */
  leader?: string;
}

export interface ConcertPrize {
  rank: string;
  item: string;
  count: string;
}

export interface ConcertSponsor {
  name: string;
  category: string;
  benefit: string;
  url?: string;
}

export interface ConcertQna {
  q: string;
  a: string;
}

export const CONCERT_2026 = {
  slug: "2026concert",
  titleHanja: "輪舞",
  titleKorean: "윤무",
  subtitle: "원을 그리며 하나되는 우리의 궤적",
  edition: "2026 춤바람 정기공연",

  dateText: "2026. 12. 01 (화)",
  timeText: "18:30 공연 시작",
  // 카운트다운 기준 시각 (한국시간 공연 시작)
  eventAt: "2026-12-01T18:30:00+09:00",
  runtimeMinutes: 120,
  runtimeText: "약 120분 (인터미션 10분)",
  priceText: "전석 무료",

  applyUrl: "https://forms.gle/",
  applyDeadlineText: "12월 3일(목) 23:59 마감",

  greeting: {
    heading: "다시, 원을 그리며",
    body: [
      "안녕하세요. 한림대학교 스트릿 댄스 동아리 춤바람입니다.",
      "한 해 동안 동방의 거울 앞에서 수없이 돌고, 넘어지고, 다시 일어섰습니다. 그렇게 그려온 수많은 원들이 모여 오늘 하나의 무대가 됩니다.",
      "바쁜 연말, 귀한 걸음 해주신 모든 분들께 진심으로 감사드립니다. 무대 위 저희의 궤적이 여러분의 하루에 작은 바람이 되기를 바랍니다.",
    ],
    sign: "춤바람 회장 OOO 올림",
  },

  description: {
    heading: "輪舞 — 둥글게 이어지는 춤",
    body: [
      "윤무(輪舞)는 여럿이 둥글게 원을 이루며 추는 춤을 뜻합니다. 손을 맞잡고 돌아가는 원 안에서는 처음과 끝이 따로 없습니다.",
      "이번 공연은 서로 다른 장르의 여덟 팀이 각자의 궤적을 그리다, 마지막에 하나의 원으로 모이는 구성으로 준비했습니다. 힙합, 걸스힙합, 코레오, 왁킹, 케이팝까지 — 춤바람의 1년이 한 바퀴로 이어집니다.",
    ],
    facts: [
      { label: "일시", value: "2026. 12. 01 (화) 18:30" },
      { label: "장소", value: "한림대학교 일송아트홀" },
      { label: "러닝타임", value: "약 120분" },
      { label: "관람료", value: "전석 무료" },
    ],
  },

  qna: [
    { q: "관람료가 있나요?", a: "전석 무료입니다. 사전 신청 없이도 현장 입장이 가능해요." },
    {
      q: "사전 신청은 꼭 해야 하나요?",
      a: "필수는 아니지만, 사전 신청자는 우선 입장과 함께 경품 추첨에 자동 응모돼요. 좌석이 한정되어 있어 사전 신청을 추천드려요.",
    },
    { q: "한림대 학생이 아니어도 볼 수 있나요?", a: "물론이에요! 누구나 관람할 수 있어요. 친구, 가족과 함께 오세요." },
    {
      q: "공연 중 촬영해도 되나요?",
      a: "개인 소장용 사진·영상 촬영은 가능해요. 다만 플래시와 삼각대 사용은 다른 관객과 공연자를 위해 삼가 주세요.",
    },
    { q: "공연 시작 후에 도착하면요?", a: "공연 중에는 무대 전환 시간에 맞춰 스태프 안내에 따라 입장할 수 있어요." },
    { q: "주차가 가능한가요?", a: "교내 주차장을 이용할 수 있지만 자리가 부족할 수 있어 대중교통 이용을 권장드려요." },
  ] satisfies ConcertQna[],

  teams: [
    {
      id: "opening",
      name: "OPENING : 輪",
      genre: "ALL",
      songs: [{ artist: "춤바람 Remix", title: "輪舞 Intro" }],
      members: ["춤바람 전원"],
    },
    {
      id: "hiphop",
      name: "BREEZE",
      genre: "HIPHOP",
      songs: [
        { artist: "Kendrick Lamar", title: "HUMBLE." },
        { artist: "Travis Scott", title: "SICKO MODE" },
      ],
      members: ["김하람", "이도윤", "박서진", "최유찬", "정우현"],
      leader: "김하람",
    },
    {
      id: "girlshiphop",
      name: "LUNA",
      genre: "GIRLS HIPHOP",
      songs: [
        { artist: "Doja Cat", title: "Paint The Town Red" },
        { artist: "Megan Thee Stallion", title: "Savage" },
      ],
      members: ["한지수", "오채원", "윤서아", "강민지"],
      leader: "한지수",
    },
    {
      id: "choreo",
      name: "DRAWING",
      genre: "CHOREOGRAPHY",
      songs: [{ artist: "Billie Eilish", title: "lovely" }],
      members: ["서다은", "임하윤", "조예린", "권태오", "신지호", "문가온"],
      leader: "서다은",
    },
    {
      id: "waacking",
      name: "SWIRL",
      genre: "WAACKING",
      songs: [{ artist: "Donna Summer", title: "I Feel Love" }],
      members: ["배수아", "황나연", "전소율"],
      leader: "배수아",
    },
    {
      id: "kpop1",
      name: "CIRCLE",
      genre: "K-POP",
      songs: [
        { artist: "aespa", title: "Supernova" },
        { artist: "NewJeans", title: "Super Shy" },
      ],
      members: ["유하린", "장서윤", "송예나", "남지우", "백채은"],
      leader: "유하린",
    },
    {
      id: "kpop2",
      name: "ORBIT",
      genre: "K-POP",
      songs: [
        { artist: "SEVENTEEN", title: "손오공" },
        { artist: "ATEEZ", title: "BOUNCY" },
      ],
      members: ["노준혁", "류시온", "안태양", "홍건우", "고은찬", "표민재"],
      leader: "노준혁",
    },
    {
      id: "finale",
      name: "FINALE : 舞",
      genre: "ALL",
      songs: [{ artist: "춤바람 Remix", title: "輪舞 Outro" }],
      members: ["춤바람 전원"],
    },
  ] satisfies ConcertTeam[],

  prizeHowTo: "사전 신청자 + 현장 응모권 제출자 대상으로 공연 마지막에 추첨해요.",
  prizes: [
    { rank: "1등", item: "무선 이어폰", count: "1명" },
    { rank: "2등", item: "배달앱 3만원 상품권", count: "2명" },
    { rank: "3등", item: "스폰서 매장 이용권", count: "5명" },
    { rank: "참여상", item: "춤바람 한정 스티커 세트", count: "선착순 50명" },
  ] satisfies ConcertPrize[],

  sponsors: [
    { name: "카페 달무리", category: "CAFE", benefit: "공연 당일 음료 10% 할인" },
    { name: "바람골 닭갈비", category: "FOOD", benefit: "4인 이상 방문 시 볶음밥 서비스" },
    { name: "헤어살롱 윤", category: "BEAUTY", benefit: "커트 20% 할인 쿠폰 제공" },
    { name: "원스텝 PC", category: "PC방", benefit: "신규 회원 2시간 무료" },
    { name: "회오리 분식", category: "FOOD", benefit: "튀김 1인분 서비스" },
    { name: "숨 필라테스", category: "FITNESS", benefit: "1회 무료 체험권" },
  ] satisfies ConcertSponsor[],

  location: {
    venueName: "한림대학교 일송아트홀",
    address: "강원특별자치도 춘천시 한림대학길 1",
    // 카카오맵 좌표 — 장소 확정되면 카카오맵에서 우클릭 > "좌표 복사"로 바꿔주세요.
    lat: 37.88651,
    lng: 127.74017,
    directions: [
      { label: "버스", text: "한림대 정문 하차 후 도보 약 5분" },
      { label: "기차", text: "춘천역 · 남춘천역에서 택시 약 10분" },
      { label: "주차", text: "교내 주차장 이용 가능 (혼잡 예상)" },
    ],
  },

  instagram: {
    handle: "@hallym_dancewind",
    url: "https://www.instagram.com/hallym_dancewind?igsh=MWFweWs4cGVvcTNvYw==",
  },
};