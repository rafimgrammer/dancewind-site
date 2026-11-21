// src/data/concert2026.ts
//
// 2026 정기공연 「輪舞 윤무」 홍보 페이지에 들어가는 모든 문구/데이터.
// ⚠️ 지금 들어있는 내용은 전부 "초안용 예시"예요. 확정되면 이 파일만 고치면 페이지 전체에 반영됩니다.
//    (디자인 코드는 src/pages/Concert.tsx, 애니메이션은 src/pages/concert2026.css)

export interface ConcertTeam {
  /** 주소에 쓰여요 → hallymdancewind.com/2026concert/{id} (영문 소문자 · 숫자 · - 만) */
  id: string;
  name: string;
  /** 무대 세부정보에 "곡 제목 ······ 가수" 로 보여줘요 (링크 없음) */
  songs: { artist: string; title: string }[];
  members: string[];
  /** 팀장 이름 — members 안에 있는 이름과 똑같이 적어주세요. 팀장이 둘이면 둘 다 (없으면 생략) */
  leaders?: string[];
  /** 이 무대 다음에 게스트 무대가 있으면 true → 무대 순서 목록에 금색 "客 · 게스트 무대" 줄이 들어가요 */
  guestAfter?: boolean;
  /** 그 게스트의 이름 — 정해지면 적어 주세요. 비워 두면 "게스트 무대"로 보여요 */
  guestName?: string;
  /** 팀 상세 화면에서 팀명을 이 줄들로 나눠서 보여줘요. (줄마다 한 줄에 딱 맞게 글씨 크기가 맞춰져요)
   *  없으면 팀명 전체를 한 줄로 보여줘요. 무대 순서 목록에는 영향 없어요. */
  pageLines?: string[];
}

export interface ConcertPrize {
  rank: string;
  item: string;
  count: string;
}

/** 함께해 주신 곳 — 이름만 크레딧처럼 이어서 보여줘요 */
export interface ConcertSponsor {
  name: string;
}

/** 공연 소개 문단 한 개 — tone 으로 글씨 굵기를 정해요
 *  "bold" : 굵고 밝게 (강조 문장)
 *  "light": 얇고 옅게 (여운 남기는 마무리 문장)
 *  없으면 : 보통 본문 */
export interface ConcertParagraph {
  text: string;
  tone?: "bold" | "light";
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
  // ⚠️ 바뀌면 캘린더 파일 public/concert2026/dancewind-2026*.ics 의 DTSTART/DTEND 도 같이 고쳐 주세요.
  eventAt: "2026-12-01T18:30:00+09:00",
  runtimeMinutes: 120,
  runtimeText: "약 2시간 예상",
  priceText: "전석 무료",

  applyUrl: "https://forms.gle/BhaUdU4wccE2E5ah8",
  // 카카오톡 공유용 "초대장" 메시지 템플릿 ID (카카오 디벨로퍼스 > 도구 > 메시지 템플릿 에서 만든 피드형 A).
  // 0 이면 아직 템플릿을 안 만든 것 → 예전 공통 템플릿으로 보내요.
  kakaoTemplateId:138720,
  // 사전 신청 마감: 11월 30일(월) 오후 8시 (확정). 바뀌면 아래 두 줄을 같이 고쳐 주세요.
  //    applyDeadlineAt 은 "사전 신청 마감까지 N일" 숫자판과 마감 후 버튼 숨김에 쓰여요.
  applyDeadlineAt: "2026-11-30T20:00:00+09:00",
  applyDeadlineText: "11월 30일(월) 20:00 마감",

  greeting: {
    heading: "다시, 원을 그리며",
    body: [
      "안녕하세요, 한림대학교 댄스동아리 춤바람입니다.",
      "한 해 동안 거울 앞에서 수없이 연습하고 땀 흘리며 춤춰 온 부원들의 수많은 궤적들이 모여서 오늘 다채로운 무대가 됩니다.",
      "바쁜 연말에 귀한 걸음 해주신 모든 분들께 진심으로 감사드립니다. 무대 위 저희의 궤적이 여러분의 하루에 작은 바람이 되기를 바랍니다.",
    ],
    sign: "춤바람 회장단 일동",
  },

  description: {
    heading: "輪舞 — 둥글게 이어지는 춤",
    body: [
      { text: "輪(바퀴 륜), 舞(춤출 무)." },
      { text: "윤무는 여러 사람이 하나의 원을 이루어 함께 춤추는 것을 의미합니다.", tone: "bold" },
      {
        text: "각자의 자리에서 서로 다른 색깔을 지닌 우리가 춤이라는 공통된 열정으로 만나 하나의 무대를 만들어 갑니다. 혼자가 아닌 함께이기에 더욱 빛나는 순간들, 수많은 연습과 노력으로 쌓아 온 시간들을 오늘 하나의 무대에 담았습니다.",
      },
      { text: "서로의 움직임이 연결되고, 각자의 열정이 하나의 흐름이 되는 순간인 지금 춤바람의 무대가 시작됩니다." },
    ] as ConcertParagraph[],
    // 공연 소개의 2×2 정보 카드 — value 안의 \n 은 카드 안에서 줄바꿈돼요. hanja 는 카드 구석에 옅게 깔리는 글자.
    facts: [
      { label: "일시", hanja: "日時", value: "12. 01 (화)\n18:30" },
      { label: "장소", hanja: "場所", value: "한림대학교\n일송아트홀" },
      { label: "러닝타임", hanja: "時間", value: "약 2시간\n(예상)" },
      { label: "관람료", hanja: "料金", value: "전석 무료" },
    ],
  },

  qna: [
    { q: "관람료가 있나요?", a: "전석 무료입니다. 사전 신청 없이도 현장 입장이 가능해요." },
    {
      q: "사전 신청은 꼭 해야 하나요?",
      a: "필수는 아니지만, 사전 신청자는 스폰 쿠폰 3장을, 현장 신청자는 스폰 쿠폰 2장을 받을 수 있어요!",
    },
    { q: "한림대 학생이 아니어도 볼 수 있나요?", a: "물론이에요! 누구나 관람할 수 있어요. 친구, 가족과 함께 오세요." },
    {
      q: "공연 중 촬영해도 되나요?",
      a: "개인 소장용 사진·영상 촬영은 가능해요. 다만 플래시와 삼각대 사용은 다른 관객과 공연자를 위해 삼가 주세요.",
    },
    { q: "공연 시작 후에 도착하면요?", a: "공연 중에는 무대 전환 시간에 맞춰 스태프 안내에 따라 입장할 수 있어요." },
    { q: "주차가 가능한가요?", a: "교내 주차장을 이용할 수 있지만 주차비가 발생합니다!" },
  ] satisfies ConcertQna[],

  // 무대 순서 그대로 (id 는 주소에 쓰여요 → /2026concert/1 · /2026concert/2 …)
  teams: [
    {
      id: "1",
      name: "덜컹덜컹달려간다댄스윈드야",
      pageLines: ["덜컹덜컹달려간다", "댄스윈드야"],
      songs: [
        { title: "With", artist: "리센느" },
      ],
      members: ["윤샛별", "김민주", "권도희", "하지원", "이서원"],
      leaders: ["윤샛별"],
    },
    {
      id: "2",
      name: "희희 몬스터",
      songs: [
        { title: "ICE", artist: "P1Harmony" },
        { title: "Monster", artist: "EXO" },
      ],
      members: ["한희정", "서희경"],
      leaders: ["한희정"],
    },
    {
      id: "3",
      name: "동금은서유빈 바짓가랑이 잡기",
      pageLines: ["동금은서유빈", "바짓가랑이 잡기"],
      songs: [
        { title: "Beggin'", artist: "Måneskin" },
      ],
      members: ["이동금", "주유정", "권현민", "전시연", "조은서", "maja", "김유빈"],
      leaders: ["이동금"],
    },
    {
      id: "4",
      name: "조카와 삼촌둘",
      songs: [
        { title: "Just the Two of Us", artist: "Luv Tina" },
        { title: "Superstar", artist: "Ayumu Imazu" },
        { title: "MOSHPIT", artist: "Reyrzy" },
        { title: "Plz tell me Y", artist: "mig.on" },
      ],
      members: ["김휘수", "김재승", "심예성"],
      leaders: ["김휘수"],
    },
    {
      id: "5",
      name: "걸스껄스껄스껄스껄",
      songs: [
        { title: "GRLS", artist: "TUIDE" },
        { title: "SUN KISS", artist: "TUIDE" },
      ],
      members: ["정은호", "이주은", "정예원", "조유빈", "조수아", "이새봄", "박하은"],
      leaders: ["정은호", "이주은"],
      guestAfter: true,
      guestName: "Co'k",
    },
    {
      id: "6",
      name: "안녕하세요예진입니다잘부탁드립니다",
      pageLines: ["안녕하세요예진입니다잘부탁", "드립니다"],
      songs: [
        { title: "Rope Burn", artist: "Janet Jackson" },
      ],
      members: ["임예진"],
      leaders: ["임예진"],
    },
    {
      id: "7",
      name: "나의 태용이 되어줘",
      songs: [
        { title: "Baggy Jeans", artist: "NCT U" },
      ],
      members: ["이주은", "김휘수", "이한송", "정우성", "심예성"],
      leaders: ["이주은"],
    },
    {
      id: "8",
      name: "얘들아 여기까지 오느라 수고했고 언니들이 재밌는 거 보여줄게 ㅋㅋ",
      pageLines: ["얘들아 여기까지 오느라 수고했고", "언니들이 재밌는 거 보여줄게 ㅋㅋ"],
      songs: [
        { title: "ICONIC BY MISTAKE", artist: "LE SSERAFIM, ILLIT, KATSEYE" },
      ],
      members: ["김유빈", "조은서", "고다연", "윤샛별", "deniz", "김민지", "권도희", "이새봄", "정은호", "전시연", "김별", "하지원", "남혜린", "정예원"],
      leaders: ["김유빈"],
    },
    {
      id: "9",
      name: "동금 : 언니 간다 잘있어라",
      songs: [
        { title: "SMF", artist: "창모" },
        { title: "Nothing Is Impossible", artist: "Planetshakers" },
      ],
      members: ["이동금", "한희정", "문승현", "제현진", "서승환"],
      leaders: ["이동금"],
    },
    {
      id: "10",
      name: "난왜이꿈이영원할것같지..영원할건가보다",
      pageLines: ["난왜이꿈이영원할것같지..", "영원할건가보다"],
      songs: [
        { title: "Dream of You", artist: "청하" },
      ],
      members: ["고다연", "남혜린", "조수아", "박하은", "김보민", "조유빈", "박서윤", "백윤지", "황유림"],
      leaders: ["고다연"],
      guestAfter: true,
      guestName: "해파리",
    },
    {
      id: "11",
      name: "졸업두달남은김유정조은서남윤하의인생최후의끌어치기",
      pageLines: ["졸업두달남은김유정조은서남윤하의", "인생최후의끌어치기"],
      songs: [
        { title: "Take Me Higher", artist: "Diana Ross" },
        { title: "Vroom Vroom", artist: "Charli XCX" },
        { title: "Beautiful Liar", artist: "Beyoncé, Shakira" },
      ],
      members: ["김유정", "이새봄", "남윤하", "김별", "정예원", "조은서"],
      leaders: ["김유정"],
    },
    {
      id: "12",
      name: "블러디 야르다이스~~~~",
      songs: [
        { title: "Big Girls Don't Cry", artist: "ENHYPEN" },
        { title: "Bloody Paradise", artist: "ENHYPEN" },
      ],
      members: ["전시연", "김유빈", "권현민", "정우성", "박하은", "장윤하"],
      leaders: ["전시연"],
    },
    {
      id: "13",
      name: "리한나선배 진짜 폼 미쳤다",
      songs: [
        { title: "Cockiness (Love It)", artist: "Rihanna" },
        { title: "S&M", artist: "Rihanna" },
      ],
      members: ["김준우", "밀리", "고다연", "김수민", "maja", "박서윤", "신비송"],
      leaders: ["김준우", "밀리"],
      guestAfter: true,
      guestName: "ZAP",
    },
    {
      id: "14",
      name: "안녕하세요 윤하찡입니다이거 제 이모지얌~🥴",
      pageLines: ["안녕하세요 윤하찡입니다", "이거 제 이모지얌~🥴"],
      songs: [
        { title: "NEON", artist: "A2O LITE" },
      ],
      members: ["김유빈", "전시연", "장윤하", "한희정", "정은호", "박하은", "조은서"],
      leaders: ["김유빈", "전시연"],
    },
    {
      id: "15",
      name: "너부턴 오만원",
      songs: [
        { title: "KISS KISS KISS", artist: "나우아임영, Royal 44" },
        { title: "Bitch Better Have My Money", artist: "Rihanna" },
      ],
      members: ["김준우", "이새봄"],
      leaders: ["김준우"],
    },
    {
      id: "16",
      name: "HOW MANY JENNIES?",
      songs: [
        { title: "Seoul City + like JENNIE (MMA ver.)", artist: "JENNIE" },
      ],
      members: ["장윤하", "조유빈", "문승현", "조수아", "강부호", "서희경", "김보민", "이한송", "joana", "김유정", "밀리", "maja", "권현민", "신비송", "이주은", "박민서", "deniz", "한희정", "김민지"],
      leaders: ["장윤하", "조유빈"],
    },
    {
      id: "17",
      name: "준우야 누나도 이제 한계다. 그냥 나가 살아라. 누나도 형도 충분히 기다려줬다. 당장 짐 싸라.",
      pageLines: ["준우야 누나도 이제 한계다. 그냥", "나가 살아라. 누나도 형도 충분히", "기다려줬다. 당장 짐 싸라."],
      songs: [
        { title: "XYZ", artist: "NiiHWA" },
        { title: "Birthday Suit", artist: "Mike Jay" },
      ],
      members: ["김준우", "김휘수", "이동금", "주유정", "임예진"],
      leaders: ["김준우"],
    },
  ] satisfies ConcertTeam[],

  // ⚠️ 사전 신청은 경품 응모와 상관없어요. 실제 응모 방법이 정해지면 이 문장을 고쳐 주세요.
  prizeHowTo: "현장 응모권을 제출하신 분들을 대상으로 공연 마지막에 추첨해요.",
  prizes: [
    { rank: "1등", item: "에어팟 5세대", count: "1명" },
    { rank: "2등", item: "무신사 5만원권", count: "2명" },
    { rank: "3등", item: "배민 2만원권", count: "3명" },
  ] satisfies ConcertPrize[],

  // 함께해 주신 곳 (실제 협찬처 명단) — 적힌 순서대로 " · " 로 이어서 보여줘요
  sponsors: [
    { name: "미성카츠" },
    { name: "일과사랑" },
    { name: "대암왕감자탕" },
    { name: "돼학로" },
    { name: "빙동댕" },
    { name: "꼴두바우" },
    { name: "아이스플라워" },
    { name: "한림양장" },
    { name: "이삭토스트" },
    { name: "한솥" },
    { name: "부자네토종순대국" },
    { name: "메가혼밥" },
    { name: "봉구스밥버거" },
    { name: "두스쿱" },
    { name: "비바라비다" },
    { name: "화산마라탕" },
    { name: "파닭에파무쳐" },
    { name: "푸릉" },
    { name: "팔공티" },
    { name: "꿀돼지" },
    { name: "투썸플레이스" },
    { name: "병훈이네" },
    { name: "병천순대" },
    { name: "한림포차" },
    { name: "오일장 햄버거" },
    { name: "진스바베큐족발" },
    { name: "삽자루든돼지" },
    { name: "와플칸" },
  ] satisfies ConcertSponsor[],

  location: {
    venueName: "한림대학교 일송아트홀",
    address: "강원특별자치도 춘천시 한림대학길 1",
    // 일송아트홀 좌표 (지도 검색으로 확인한 건물 위치). 핀이 어긋나 보이면
    // 카카오맵에서 건물을 우클릭 > "좌표 복사"한 값으로 바꿔주세요.
    lat: 37.88687,
    lng: 127.73697,
    directions: [
      { label: "버스", text: "한림대 정문 하차 후 도보 약 5분" },
      { label: "기차", text: "춘천역 · 남춘천역에서 택시 약 10분" },
      { label: "주차", text: "교내 주차장 이용 가능 (주차비 발생)" },
    ],
  },

  instagram: {
    handle: "@hallym_dancewind",
    url: "https://www.instagram.com/hallym_dancewind?igsh=MWFweWs4cGVvcTNvYw==",
  },

  // 공연이 끝난 뒤(eventAt + runtimeMinutes 이후) 페이지가 바뀌면서 쓰는 문구.
  //   - 인사말 자리에 아래 heading/body/sign 이 들어가요.
  //   - 자주 묻는 질문 · 사전 신청 · 함께 보러 가요 · 찾아오시는 길 섹션은 사라져요.
  //   - 미리 보기: 주소 뒤에 ?preview=after 를 붙이면 지금 바로 "공연 끝난 화면"을 볼 수 있어요.
  afterShow: {
    heading: "함께 그린 원, 고맙습니다",
    body: [
      "2026 정기공연 「輪舞」를 찾아 주신 모든 분들께 진심으로 감사드립니다.",
      "객석에서 보내 주신 함성과 박수 덕분에 저희의 궤적이 하나의 원으로 완성될 수 있었어요.",
      "오늘의 무대가 여러분의 연말에 오래 남는 장면이 되었기를 바랍니다. 다음 무대에서 또 만나요.",
    ],
    sign: "춤바람 회장단 일동",
    prizeNote: "경품 추첨이 모두 끝났어요. 당첨되신 분들 축하드려요!",
    // 공연 영상 · 사진이 올라오면 그 주소를 넣어 주세요 (유튜브 재생목록, 인스타 게시물 등).
    // 비워 두면 첫 화면 버튼이 인스타그램으로 연결돼요.
    recapUrl: "",
  },
};