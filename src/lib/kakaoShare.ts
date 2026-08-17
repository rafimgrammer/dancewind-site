// src/lib/kakaoShare.ts
//
// 카카오톡 "공유하기" 전용 유틸리티 (사용자 정의 메시지 템플릿 방식).
//
// - 춤바람 전용으로 새로 만든 카카오 앱의 JavaScript 키(VITE_KAKAO_SHARE_JS_KEY)를 씁니다.
//   카카오맵(Location.tsx)은 예전 개인 프로젝트 앱의 키(VITE_KAKAO_MAP_KEY)를 그대로 쓰고 있어서
//   두 기능이 서로 다른 카카오 앱으로 완전히 분리되어 있어요.
// - 카카오 지도 SDK는 window.kakao(소문자)를, 카카오 JS SDK(공유하기)는 window.Kakao(대문자)를
//   씁니다. 이름이 다른 별개의 전역 객체라 서로 충돌하지 않아요.
// - 카드 모양을 코드 안에서 직접 짜지 않고, 카카오 디벨로퍼스 콘솔의
//   [도구] > [메시지 템플릿]에서 디자인해둔 템플릿을 templateId로 참조해서 보냅니다.
//   템플릿 안의 ${title} 같은 사용자 인자는 templateArgs로 값을 채워 넣어요.

const KAKAO_SHARE_JS_KEY = import.meta.env.VITE_KAKAO_SHARE_JS_KEY;

/** 콘솔에서 만든 "메시지 템플릿"의 ID. 템플릿 하나를 여러 페이지에서 재사용합니다. */
export const KAKAO_SHARE_TEMPLATE_ID = Number(import.meta.env.VITE_KAKAO_SHARE_TEMPLATE_ID);

let kakaoReadyPromise: Promise<void> | null = null;

function loadKakaoSdk(): Promise<void> {
  if (kakaoReadyPromise) return kakaoReadyPromise;

  kakaoReadyPromise = new Promise((resolve, reject) => {
    const initIfNeeded = () => {
      if (!window.Kakao.isInitialized()) {
        window.Kakao.init(KAKAO_SHARE_JS_KEY);
      }
      resolve();
    };

    // 이미 다른 페이지에서 SDK가 로드되어 있으면 초기화 여부만 확인
    if (window.Kakao && window.Kakao.init) {
      initIfNeeded();
      return;
    }

    const scriptId = "kakao-share-sdk";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.8.0/kakao.min.js";
      script.async = true;
      document.head.appendChild(script);
    }

    script.addEventListener("load", initIfNeeded);
    script.addEventListener("error", () => reject(new Error("카카오 SDK를 불러오지 못했어요.")));
  });

  return kakaoReadyPromise;
}

export interface KakaoCustomShareOptions {
  /** 메시지 템플릿 ID. 생략하면 KAKAO_SHARE_TEMPLATE_ID(공통 템플릿)를 사용 */
  templateId?: number;
  /** 템플릿 안의 ${key} 사용자 인자에 채워 넣을 값들 */
  templateArgs: Record<string, string>;
}

/**
 * 카카오톡 공유하기 실행 (사용자 정의 템플릿 방식).
 * 버튼의 onClick 안에서 호출하세요. (자동 실행하면 팝업이 차단될 수 있어요)
 */
export async function shareToKakao({ templateId, templateArgs }: KakaoCustomShareOptions) {
  await loadKakaoSdk();

  window.Kakao.Share.sendCustom({
    templateId: templateId ?? KAKAO_SHARE_TEMPLATE_ID,
    templateArgs,
  });
}