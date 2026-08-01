interface WindLineProps {
  variant?: "hero" | "divider";
  className?: string;
}

/**
 * 시그니처 요소 — "윈드라인"
 * 춤바람(바람)과 비트(리듬)를 동시에 표현하는 흐르는 곡선.
 * 사운드웨이브처럼 오르내리지만, 규칙적인 파형이 아니라
 * 바람이 옷깃을 스치듯 불규칙한 굴곡을 가진다.
 */
export default function WindLine({ variant = "divider", className = "" }: WindLineProps) {
  if (variant === "hero") {
    return (
      <svg
        viewBox="0 0 900 220"
        className={className}
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M0 140 C 90 60, 150 200, 240 110 S 400 20, 470 100 S 620 190, 700 90 S 850 30, 900 110"
          stroke="var(--color-wind-gold)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="10 8"
          className="motion-safe:animate-windline"
        />
        <path
          d="M0 170 C 100 120, 170 220, 260 160 S 420 90, 490 150 S 640 220, 720 140 S 860 90, 900 150"
          stroke="var(--color-dawn-teal)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.55"
          strokeDasharray="6 10"
          className="motion-safe:animate-windline"
          style={{ animationDuration: "11s", animationDirection: "reverse" }}
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 1200 40" className={className} fill="none" aria-hidden="true" preserveAspectRatio="none">
      <path
        d="M0 20 C 60 4, 100 36, 160 20 S 260 4, 320 20 S 420 36, 480 20 S 580 4, 640 20 S 740 36, 800 20 S 900 4, 960 20 S 1060 36, 1120 20 S 1200 4, 1200 20"
        stroke="var(--color-line)"
        strokeWidth="1.5"
      />
    </svg>
  );
}
