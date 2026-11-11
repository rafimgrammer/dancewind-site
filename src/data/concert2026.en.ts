// src/data/concert2026.en.ts
//
// 2026 정기공연 페이지의 "영어 버전".
//
// 어떻게 동작하나요?
//   1) 날짜 · 시각 · 좌표 · 신청 링크 · 팀 순서 · 멤버 이름 · 협찬 가게 목록 같은 "사실 정보"는
//      한국어 파일(concert2026.ts)의 값을 그대로 가져다 써요.
//   2) 문장은 아래 EN 사전에서 "한국어 문장 → 영어 문장"으로 찾아 바꿔요.
//   3) 사전에 없는 문장은 한국어 그대로 보여줘요. (= 번역 대기)
//
// 그래서 한국어 파일만 고쳐도 사이트는 항상 정상으로 돌아가요.
//   - 한국어 문장을 새로 쓰거나 고치면 → 사전에 그 문장이 없으니 영어 페이지엔 잠깐 한국어로 보여요.
//     (고치기 전 문장에 대한 낡은 영어가 남아서 틀린 정보가 나가는 일은 없어요)
//   - 나중에 한 번에 번역할 때 아래 사전에 "새 한국어 문장": "영어" 를 추가하면 끝.
//   - 개발 모드(npm run dev)에서는 번역 대기 중인 문장 목록이 브라우저 콘솔에 떠요.
//   - 이제 쓰지 않는 한국어 문장의 줄은 남아 있어도 아무 문제 없어요. (나중에 정리하면 돼요)

import { CONCERT_2026 } from "./concert2026";

/** 한국어 문장 → 영어 문장 (key 는 concert2026.ts 의 문장과 글자 하나까지 똑같아야 해요) */
const EN: Record<string, string> = {
  // ── 기본 정보
  "윤무":
    "Yunmu",
  "원을 그리며 하나되는 우리의 궤적":
    "Our paths, circling into one",
  "2026 춤바람 정기공연":
    "Chumbaram 2026 Annual Concert",
  "2026. 12. 01 (화)":
    "Tue, Dec 1, 2026",
  "18:30 공연 시작":
    "Show starts at 6:30 PM",
  "약 120분 (인터미션 10분)":
    "About 120 min (incl. a 10-min intermission)",
  "전석 무료":
    "Free admission",
  "11월 30일(월) 23:59 마감":
    "Closes Mon, Nov 30, 11:59 PM",

  // ── 인사말
  "다시, 원을 그리며":
    "Once More, in a Circle",
  "안녕하세요. 한림대학교 스트릿 댄스 동아리 춤바람입니다.":
    "Hello! We are Chumbaram, the street dance club of Hallym University.",
  "한 해 동안 동방의 거울 앞에서 수없이 돌고, 넘어지고, 다시 일어섰습니다. 그렇게 그려온 수많은 원들이 모여 오늘 하나의 무대가 됩니다.":
    "All year long, in front of the mirror in our club room, we spun, fell, and got back up more times than we can count. On this stage, all the circles we have drawn finally come together as one.",
  "바쁜 연말, 귀한 걸음 해주신 모든 분들께 진심으로 감사드립니다. 무대 위 저희의 궤적이 여러분의 하루에 작은 바람이 되기를 바랍니다.":
    "Thank you so much for making time for us in the busy end-of-year season. We hope what we share on stage feels like a fresh breeze in your day.",
  "춤바람 회장 OOO 올림":
    "OOO, President of Chumbaram",

  // ── 공연 소개
  "輪舞 — 둥글게 이어지는 춤":
    "輪舞 — A Dance in an Unbroken Circle",
  "윤무(輪舞)는 여럿이 둥글게 원을 이루며 추는 춤을 뜻합니다. 손을 맞잡고 돌아가는 원 안에서는 처음과 끝이 따로 없습니다.":
    "Yunmu (輪舞) is a dance performed by many people moving together in a circle. In a ring of joined hands, there is no beginning and no end.",
  "이번 공연은 서로 다른 장르의 여덟 팀이 각자의 궤적을 그리다, 마지막에 하나의 원으로 모이는 구성으로 준비했습니다. 힙합, 걸스힙합, 코레오, 왁킹, 케이팝까지 — 춤바람의 1년이 한 바퀴로 이어집니다.":
    "In this show, eight teams from different genres each trace their own path, then come together as one circle at the end. Hip-hop, girls' hip-hop, choreo, waacking, and K-pop — a whole year of Chumbaram, coming full circle.",

  // ── 공연 소개 카드
  "일시":
    "Date",
  "12. 01 (화)\n18:30":
    "Tue, Dec 1\n6:30 PM",
  "장소":
    "Venue",
  "한림대학교\n일송아트홀":
    "Ilsong Art Hall,\nHallym Univ.",
  "러닝타임":
    "Running time",
  "약 120분":
    "About\n120 min",
  "관람료":
    "Admission",

  // ── 자주 묻는 질문
  "관람료가 있나요?":
    "Is there an admission fee?",
  "전석 무료입니다. 사전 신청 없이도 현장 입장이 가능해요.":
    "No, all seats are free. You can also walk in on the day without pre-registering.",
  "사전 신청은 꼭 해야 하나요?":
    "Do I have to pre-register?",
  "필수는 아니지만, 사전 신청자는 우선 입장할 수 있어요. 좌석이 한정되어 있어 사전 신청을 추천드려요.":
    "It's not required, but pre-registered guests get priority entry. Seating is limited, so we recommend it.",
  "한림대 학생이 아니어도 볼 수 있나요?":
    "Can I come if I'm not a Hallym student?",
  "물론이에요! 누구나 관람할 수 있어요. 친구, 가족과 함께 오세요.":
    "Of course! The show is open to everyone. Bring your friends and family.",
  "공연 중 촬영해도 되나요?":
    "Can I take photos or videos during the show?",
  "개인 소장용 사진·영상 촬영은 가능해요. 다만 플래시와 삼각대 사용은 다른 관객과 공연자를 위해 삼가 주세요.":
    "Yes, for personal use. Out of respect for other guests and the performers, please don't use flash or tripods.",
  "공연 시작 후에 도착하면요?":
    "What if I arrive after the show has started?",
  "공연 중에는 무대 전환 시간에 맞춰 스태프 안내에 따라 입장할 수 있어요.":
    "You can still come in. Our staff will let you in during a break between performances.",
  "주차가 가능한가요?":
    "Is there parking?",
  "교내 주차장을 이용할 수 있지만 자리가 부족할 수 있어 대중교통 이용을 권장드려요.":
    "You can park on campus, but spaces may run out, so we recommend taking public transport.",

  // ── 경품
  "현장 응모권을 제출하신 분들을 대상으로 공연 마지막에 추첨해요.":
    "At the end of the show, we'll draw winners from the entry slips handed in at the venue.",
  "1등":
    "1st",
  "무선 이어폰":
    "Wireless earbuds",
  "1명":
    "1 winner",
  "2등":
    "2nd",
  "배달앱 3만원 상품권":
    "₩30,000 food delivery app voucher",
  "2명":
    "2 winners",
  "3등":
    "3rd",
  "스폰서 매장 이용권":
    "Voucher for a sponsor store",
  "5명":
    "5 winners",
  "참여상":
    "Bonus",
  "춤바람 한정 스티커 세트":
    "Limited-edition Chumbaram sticker set",
  "선착순 50명":
    "First 50 to arrive",

  // ── 협찬 혜택
  "공연 당일 음료 10% 할인":
    "10% off drinks on the day of the show",
  "아메리카노 1+1":
    "Buy one Americano, get one free",
  "케이크 주문 시 음료 사이즈 업":
    "Free drink size upgrade with any cake",
  "전 메뉴 500원 할인":
    "₩500 off every menu item",
  "쿠키 1개 서비스":
    "A free cookie with your order",
  "빵 2개 구매 시 1개 증정":
    "Buy 2 pastries, get 1 free",
  "음료 15% 할인":
    "15% off drinks",
  "4인 이상 방문 시 볶음밥 서비스":
    "Free fried rice for groups of 4 or more",
  "튀김 1인분 서비스":
    "A free serving of fried snacks (twigim) with your order",
  "공깃밥 무료":
    "A free extra bowl of rice with your meal",
  "메밀전 1장 서비스":
    "A free buckwheat pancake with your order",
  "음료 1캔 서비스":
    "A free canned drink with your order",
  "치즈 추가 무료":
    "Free extra cheese topping",
  "1만원 이상 10% 할인":
    "10% off orders of ₩10,000 or more",
  "감자튀김 사이즈 업":
    "Free fries size upgrade",
  "미니 우동 서비스":
    "A free mini udon with your order",
  "김밥 2줄 이상 라면 반값":
    "Half-price ramyeon when you order 2 or more gimbap rolls",
  "콜라 1.25L 서비스":
    "A free 1.25L bottle of Coke with your pizza order",
  "안주 주문 시 계란말이 서비스":
    "A free rolled omelette with any food order",
  "생맥주 첫 잔 50% 할인":
    "50% off your first draft beer",
  "하이볼 1잔 서비스":
    "A free highball with your order",
  "커트 20% 할인 쿠폰 제공":
    "A 20%-off haircut coupon",
  "젤네일 5천원 할인":
    "₩5,000 off gel nails",
  "눈썹 정리 무료":
    "Free eyebrow trim",
  "1회 촬영 1천원 할인":
    "₩1,000 off one photo booth session",
  "신규 회원 2시간 무료":
    "2 hours of free PC time when you sign up as a new member",
  "30분 추가 서비스":
    "30 extra minutes free",
  "1시간 무료 연장":
    "A free 1-hour extension",
  "1회 무료 체험권":
    "One free trial class",
  "일일권 50% 할인":
    "50% off a day pass",
  "꽃다발 10% 할인 (공연 꽃다발 예약 가능)":
    "10% off bouquets (you can pre-order a bouquet for the show)",
  "컬러 출력 20% 할인":
    "20% off color printing",

  // ── 찾아오시는 길
  "한림대학교 일송아트홀":
    "Ilsong Art Hall, Hallym University",
  "강원특별자치도 춘천시 한림대학길 1":
    "1 Hallymdaehak-gil, Chuncheon, Gangwon State",
  "버스":
    "Bus",
  "한림대 정문 하차 후 도보 약 5분":
    "Get off at the Hallym Univ. Main Gate stop (한림대 정문), then walk about 5 min",
  "기차":
    "Train",
  "춘천역 · 남춘천역에서 택시 약 10분":
    "About 10 min by taxi from Chuncheon or Namchuncheon Station",
  "주차":
    "Parking",
  "교내 주차장 이용 가능 (혼잡 예상)":
    "On-campus parking available (may be crowded)",
};

/** 사람 · 곡 이름 — 대부분 그대로 두고, 바꿀 것만 (번역 대기 목록엔 안 잡혀요) */
const NAME_EN: Record<string, string> = {
  "춤바람 전원": "All Chumbaram members",
  "춤바람 Remix": "Chumbaram Remix",
  손오공: "Super", // SEVENTEEN '손오공'의 공식 영어 제목
};

const missing = new Set<string>();
/** 사전에서 찾고, 없으면 한국어 그대로 (+ 번역 대기 목록에 기록) */
const t = (ko: string): string => {
  if (!ko) return ko;
  const en = EN[ko];
  if (en === undefined) {
    missing.add(ko);
    return ko;
  }
  return en;
};
const name = (ko: string): string => NAME_EN[ko] ?? ko;

const K = CONCERT_2026;

export const CONCERT_2026_EN: typeof CONCERT_2026 = {
  ...K,
  titleKorean: t(K.titleKorean),
  subtitle: t(K.subtitle),
  edition: t(K.edition),
  dateText: t(K.dateText),
  timeText: t(K.timeText),
  runtimeText: t(K.runtimeText),
  priceText: t(K.priceText),
  applyDeadlineText: t(K.applyDeadlineText),

  greeting: {
    heading: t(K.greeting.heading),
    body: K.greeting.body.map(t),
    sign: t(K.greeting.sign),
  },

  description: {
    heading: t(K.description.heading),
    body: K.description.body.map(t),
    facts: K.description.facts.map((f) => ({ ...f, label: t(f.label), value: t(f.value) })),
  },

  qna: K.qna.map((x) => ({ q: t(x.q), a: t(x.a) })),

  teams: K.teams.map((team) => ({
    ...team,
    songs: team.songs.map((s) => ({ ...s, artist: name(s.artist), title: name(s.title) })),
    members: team.members.map(name),
  })),

  prizeHowTo: t(K.prizeHowTo),
  prizes: K.prizes.map((p) => ({ rank: t(p.rank), item: t(p.item), count: t(p.count) })),

  sponsors: K.sponsors.map((s) => ({ ...s, benefit: t(s.benefit) })),

  location: {
    ...K.location,
    venueName: t(K.location.venueName),
    address: t(K.location.address),
    directions: K.location.directions.map((d) => ({ label: t(d.label), text: t(d.text) })),
  },
};

/** 번역 대기 중인 한국어 문장들 */
export const EN_MISSING: string[] = [...missing];

if (import.meta.env?.DEV && EN_MISSING.length > 0) {
  console.info(`[영어 번역 대기 ${EN_MISSING.length}개] 영어 페이지에 한국어로 보이는 문장이에요:\n- ` + EN_MISSING.join("\n- "));
}