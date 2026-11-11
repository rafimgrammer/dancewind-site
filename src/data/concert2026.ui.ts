// src/data/concert2026.ui.ts
//
// 공연 페이지의 버튼 · 안내 문구 · 알림(토스트) 같은 "화면 글씨"를 한국어/영어로 모아 둔 파일.
// (팀 · 인사말 · Q&A 같은 내용 문구는 concert2026.ts / concert2026.en.ts 에 있어요)
//
// - 새 문구는 ko 에만 추가하면 돼요. en 에 없는 문구는 한국어 그대로 보여요 (= 번역 대기).
//   나중에 한 번에 번역할 때 en 에 같은 이름으로 영어를 채우면 끝.
//   개발 모드(npm run dev)에서는 영어가 빠진 문구 이름이 브라우저 콘솔에 떠요.
// - 숫자가 들어가는 문구는 함수로 적어요. 예: daysToGo(23) → "공연까지 D-23"

export type ConcertLang = "ko" | "en";

const ko = {
  langName: "한국어",

  // 섹션 제목
  sections: {
    greeting: "인사말",
    about: "공연 소개",
    qna: "자주 묻는 질문",
    apply: "사전 신청",
    teams: "무대 순서",
    prizes: "경품 안내",
    share: "함께 보러 가요",
    sponsors: "함께해 주신 곳",
    location: "찾아오시는 길",
  },
  sectionIndexAria: "섹션 목차",
  goTo: (label: string) => `${label}로 이동`,

  // 첫 화면 · 카운트다운
  // 공연까지 남은 날 (d = 1 이상). 영어권엔 "D-23" 표기가 낯설어서 영어는 "23 DAYS TO GO"
  countdownLabel: (d: number): string => `공연까지 D-${d}`,
  /** 하단 신청 버튼 왼쪽 작은 칩 */
  ddayChip: (d: number): string => (d <= 0 ? "D-DAY" : `D-${d}`),
  countdownAria: (d: number, h: number, m: number) => `공연까지 ${d}일 ${h}시간 ${m}분 남음`,
  todayNote: (venue: string) => `오늘 18:30 · ${venue}`,
  liveNote: (minutesIn: number) => `지금 공연 중 · ${minutesIn < 1 ? "방금 막이 올랐어요" : `${minutesIn}분째`}`,
  liveAria: "지금 공연 중",
  afterNote: (handle: string) => `함께해 주셔서 감사합니다 · ${handle}`,
  afterAria: "공연이 끝났습니다. 함께해 주셔서 감사합니다",
  scrollAria: "아래로 스크롤해서 더 보기",
  applyCta: "사전 신청하기",
  lineupCta: "라인업 보기",
  langAria: "언어 선택",

  // 사전 신청
  deadlineClosedLabel: "신청",
  deadlineTodayLabel: "신청 마감",
  deadlineLabel: "신청 마감까지",
  deadlineUnit: (_days: number): string => "일",
  deadlineClosedAria: "사전 신청이 마감되었습니다",
  deadlineTodayAria: "오늘 사전 신청이 마감됩니다",
  deadlineAria: (days: number) => `사전 신청 마감까지 ${days}일 남음`,
  deadlineClosedNote: "사전 신청이 마감되었어요",
  deadlineTodayNote: "오늘 23:59까지 신청할 수 있어요",
  applyClosedLine1: "사전 신청은 마감되었지만,",
  applyClosedBold: "현장 입장",
  applyClosedLine2: "은 누구나 가능해요.",
  applyOpenLine1: "사전 신청하시면 공연 당일",
  applyOpenBold: "우선 입장",
  applyOpenLine2: "할 수 있어요.",
  applyGo: "사전 신청 바로가기",

  // 무대 순서 · 팀 페이지
  actLabel: (n: number) => `第${n}幕`,
  teamsHint: "팀을 누르면 곡과 출연진을 볼 수 있어요.",
  teamAria: (name: string) => `${name} 무대 정보`,
  backToLineup: "무대 순서로 돌아가기",
  shareStage: "이 무대 공유하기",
  songHint: "곡을 누르면 유튜브에서 들을 수 있어요",
  songAria: (artist: string, title: string) => `${artist} - ${title} 유튜브에서 듣기`,
  leader: "팀장",
  prevStage: "← 이전 무대",
  nextStage: "다음 무대 →",

  // 함께 보러 가요
  shareLead: "같이 보고 싶은 사람에게 공연 소식을 전해주세요.",
  shareKakao: "카카오톡으로 공유하기",
  shareStory: "인스타 스토리에 올리기",
  shareOther: "다른 앱으로 공유 · 링크 복사",

  // 인스타 스토리 고르기 창 + 그 자리에서 그리는 D-day 이미지
  storyAria: "인스타 스토리 이미지 고르기",
  storyTitle: "어떤 이미지로 올릴까요?",
  storySub: "링크는 복사해 뒀어요 · 스토리의 링크 스티커에 붙여넣기",
  storyCover: "표지",
  storyCoverSub: "輪舞 포스터",
  storyToday: (d: number) => (d > 0 ? `오늘의 D-${d}` : "오늘은 D-DAY"),
  storyTodaySub: "매일 숫자가 바뀌어요",
  storyMaking: "만드는 중…",
  storyImgTop: (d: number): string => (d > 0 ? "공연까지" : "바로 오늘이에요"),
  /** 가운데 큰 글씨와 그 크기 배율 (영어는 "23 DAYS" 로 길어서 작게) */
  storyImgBig: (d: number): string => (d > 0 ? `D-${d}` : "D-DAY"),
  storyImgBigScale: 1,
  storyImgDate: (dateText: string) => `${dateText} 18:30`,
  storyImgVenue: (venue: string) => `${venue} · 전석 무료`,

  // 협찬
  sponsorLead1: "이 무대를 함께 만들어 주신 분들",
  sponsorLead2: "공연 당일 사전 신청 화면을 보여주시면 혜택을 받을 수 있어요.",
  sponsorNameNote: "",
  sponsorHint: "이름을 누르면 혜택이 보여요",
  sponsorAria: (name: string) => `${name} 혜택`,
  sponsorSoon: "혜택은 곧 안내돼요.",
  sponsorShow: "공연 당일 사전 신청 화면을 보여주세요.",
  sponsorMore: "매장 정보 보기 →",
  sponsorCategory: {
    CAFE: "카페",
    FOOD: "식당",
    PUB: "술집",
    BEAUTY: "뷰티",
    PHOTO: "사진",
    PLAY: "놀거리",
    FITNESS: "운동",
    ETC: "기타",
  } as Record<string, string>,
  close: "닫기",

  // 찾아오시는 길
  mapApps: { kakao: "카카오맵", naver: "네이버지도", tmap: "티맵" },
  mapFailed: "지도를 불러오지 못했어요.",
  mapOpenKakao: "카카오맵에서 열기",
  copyAddress: "주소 복사",
  closingLine1: "12월 1일,",
  closingPre: "",
  closingVenue: "일송아트홀",
  closingLine2: "에서 만나요",
  closingSub: "18:30 · 전석 무료",

  // 알림(토스트)
  toastStageCopied: "이 무대 링크를 복사했어요.",
  toastCopyFail: "복사에 실패했어요.",
  toastCopyFailLong: "복사에 실패했어요. 길게 눌러 직접 복사해주세요.",
  toastLinkCopied: "링크를 복사했어요.",
  toastAddressCopied: "주소를 복사했어요.",
  toastStoryShared: "링크가 복사됐어요. 스토리에서 링크 스티커에 붙여넣어 주세요.",
  toastStoryFail: "스토리 이미지를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
  toastStorySaved: "스토리 이미지를 저장했어요. 링크도 복사됐으니 인스타 스토리에 올려 주세요.",
  kakaoFail: "카카오톡 공유를 불러오지 못했어요. 잠시 후 다시 시도해주세요.",

  posterAlt: (hanja: string) => `${hanja} 공연 포스터`,
};

export type ConcertUI = typeof ko;

/** 안쪽까지 전부 "있어도 되고 없어도 되는" 모양 (en 은 빠진 문구가 있어도 괜찮게) */
type DeepPartial<T> = { [K in keyof T]?: T[K] extends (...args: never[]) => unknown ? T[K] : T[K] extends object ? DeepPartial<T[K]> : T[K] };

const en: DeepPartial<ConcertUI> = {
  langName: "English",

  sections: {
    greeting: "A Word from Us",
    about: "About the Show",
    qna: "FAQ",
    apply: "Pre-registration",
    teams: "Running Order",
    prizes: "Prize Draw",
    share: "Bring a Friend",
    sponsors: "With Thanks To",
    location: "Getting Here",
  },
  sectionIndexAria: "Sections",
  goTo: (label) => `Go to ${label}`,

  countdownLabel: (d) => (d === 1 ? "1 DAY TO GO" : `${d} DAYS TO GO`),
  ddayChip: (d) => (d <= 0 ? "TODAY" : d === 1 ? "1 DAY" : `${d} DAYS`),
  countdownAria: (d, h, m) => `${d} days, ${h} hours and ${m} minutes until the show`,
  todayNote: (venue) => `Tonight 6:30 PM · ${venue}`,
  liveNote: (minutesIn) => `On stage now · ${minutesIn < 1 ? "The curtain just went up" : `${minutesIn} min in`}`,
  liveAria: "The show is on now",
  afterNote: (handle) => `Thank you for being with us · ${handle}`,
  afterAria: "The show has ended. Thank you for being with us",
  scrollAria: "Scroll down for more",
  applyCta: "Pre-register",
  lineupCta: "See the Lineup",
  langAria: "Language",

  deadlineClosedLabel: "PRE-REGISTRATION",
  deadlineTodayLabel: "CLOSES",
  deadlineLabel: "CLOSES IN",
  deadlineUnit: (days) => (days === 1 ? "day" : "days"),
  deadlineClosedAria: "Pre-registration has closed",
  deadlineTodayAria: "Pre-registration closes today",
  deadlineAria: (days) => `Pre-registration closes in ${days} ${days === 1 ? "day" : "days"}`,
  deadlineClosedNote: "Pre-registration has closed",
  deadlineTodayNote: "Open until 11:59 PM tonight",
  applyClosedLine1: "Pre-registration has closed, but",
  applyClosedBold: "walk-in entry",
  applyClosedLine2: " is open to everyone.",
  applyOpenLine1: "Pre-register to get",
  applyOpenBold: "priority entry",
  applyOpenLine2: " on the day of the show.",
  applyGo: "Pre-register Now",

  actLabel: (n) => `Act ${n}`,
  teamsHint: "Tap a team to see its songs and members.",
  teamAria: (name) => `About ${name}`,
  backToLineup: "Back to the running order",
  shareStage: "Share this performance",
  songHint: "Tap a song to listen on YouTube",
  songAria: (artist, title) => `Listen to ${artist} - ${title} on YouTube`,
  leader: "Leader",
  prevStage: "← Previous",
  nextStage: "Next →",

  shareLead: "Know someone who'd love this show? Pass it along.",
  shareKakao: "Share on KakaoTalk",
  shareStory: "Post to Instagram Story",
  shareOther: "Share via other apps · Copy link",

  storyAria: "Choose an Instagram story image",
  storyTitle: "Which image would you like to post?",
  storySub: "Link copied · paste it into a link sticker on your story",
  storyCover: "Cover",
  storyCoverSub: "輪舞 poster",
  storyToday: (d) => (d > 0 ? (d === 1 ? "1 day to go" : `${d} days to go`) : "Showtime today"),
  storyTodaySub: "The number changes every day",
  storyMaking: "Creating…",
  storyImgTop: (d) => (d > 0 ? "SHOWTIME IN" : "IT'S SHOWTIME"),
  storyImgBig: (d) => (d > 0 ? (d === 1 ? "1 DAY" : `${d} DAYS`) : "TODAY"),
  storyImgBigScale: 0.6,
  storyImgDate: (dateText) => `${dateText} · 6:30 PM`,
  storyImgVenue: (venue) => `${venue} · Free admission`,

  sponsorLead1: "The people who helped make this stage happen",
  sponsorLead2: "Show your pre-registration confirmation on the day of the show to get their offers.",
  sponsorNameNote: "Store names are shown in Korean, just as they appear on their signs.",
  sponsorHint: "Tap a name to see the offer",
  sponsorAria: (name) => `Offer from ${name}`,
  sponsorSoon: "Details coming soon.",
  sponsorShow: "Show your pre-registration confirmation on the day of the show.",
  sponsorMore: "View store info →",
  sponsorCategory: {
    CAFE: "Café",
    FOOD: "Restaurant",
    PUB: "Bar",
    BEAUTY: "Beauty",
    PHOTO: "Photo",
    PLAY: "Fun & games",
    FITNESS: "Fitness",
    ETC: "Other",
  },
  close: "Close",

  mapApps: { kakao: "KakaoMap", naver: "Naver Map", tmap: "TMAP" },
  mapFailed: "Couldn't load the map.",
  mapOpenKakao: "Open in KakaoMap",
  copyAddress: "Copy address (in Korean)",
  closingLine1: "See you on Dec 1",
  closingPre: "at ",
  closingVenue: "Ilsong Art Hall",
  closingLine2: "",
  closingSub: "6:30 PM · Free admission",

  toastStageCopied: "Link to this performance copied.",
  toastCopyFail: "Couldn't copy the link.",
  toastCopyFailLong: "Couldn't copy. Press and hold to copy it yourself.",
  toastLinkCopied: "Link copied.",
  toastAddressCopied: "Address copied.",
  toastStoryShared: "Link copied. Paste it into a link sticker on your story.",
  toastStoryFail: "Couldn't load the story image. Please try again in a moment.",
  toastStorySaved: "Story image saved, and the link is copied. Go ahead and post it to your Instagram story.",
  kakaoFail: "Couldn't open KakaoTalk sharing. Please try again in a moment.",

  posterAlt: (hanja) => `Concert poster for ${hanja} (Yunmu, "Round Dance")`,
};

/** en 에 없는 칸은 ko 로 채워요. (sections 처럼 안에 칸이 있는 묶음은 그 안까지 하나씩) */
const missingUi: string[] = [];
function fillFromKo<T extends object>(base: T, over: DeepPartial<T> | undefined, path: string): T {
  const out = { ...base } as Record<string, unknown>;
  for (const key of Object.keys(base)) {
    const b = (base as Record<string, unknown>)[key];
    const o = (over as Record<string, unknown> | undefined)?.[key];
    if (b && typeof b === "object" && !Array.isArray(b)) {
      out[key] = fillFromKo(b as object, o as DeepPartial<object> | undefined, `${path}${key}.`);
    } else if (o === undefined) {
      if (b !== "") missingUi.push(path + key);
    } else {
      out[key] = o;
    }
  }
  return out as T;
}

export const CONCERT_UI: Record<ConcertLang, ConcertUI> = { ko, en: fillFromKo(ko, en, "") };

if (import.meta.env?.DEV && missingUi.length > 0) {
  console.info(`[영어 번역 대기 · 화면 문구 ${missingUi.length}개] concert2026.ui.ts 의 en 에 없어서 한국어로 보여요:\n- ` + missingUi.join("\n- "));
}