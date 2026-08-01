import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="font-display text-5xl text-wind-gold">STEP MISSED</p>
      <p className="mt-3 text-sm text-backstage/70">이 박자에는 페이지가 없어요.</p>
      <Link to="/" className="mt-6 rounded-full bg-wind-gold px-6 py-3 text-sm font-semibold text-stage">
        홈으로 돌아가기
      </Link>
    </div>
  );
}
