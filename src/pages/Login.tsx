// src/pages/Login.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

export default function Login() {
  const { user, profileStatus, loading } = useAuth();

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  };

  if (loading) return null;
  if (user && profileStatus === "none") return <Navigate to="/onboarding" replace />;
  if (user && profileStatus === "pending") return <Navigate to="/pending" replace />;
  if (user && profileStatus === "approved") return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-dawn-teal">Chumbaram</p>
        <h1 className="mt-3 font-display text-3xl text-backstage">춤바람에 오신 걸 환영해요</h1>
        <p className="mt-3 text-sm leading-relaxed text-backstage/70">
          구글 계정으로 간편하게 시작하고,
          <br />
          90명의 무대 위 이야기에 함께해요.
        </p>

        <button
          onClick={handleGoogleLogin}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-afterglow px-4 py-3 text-sm font-semibold text-backstage transition-colors hover:border-wind-gold/50 hover:bg-afterglow-2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.66-.22-2.45H12v4.63h6.48a5.54 5.54 0 0 1-2.4 3.64v3h3.87c2.27-2.09 3.57-5.17 3.57-8.82z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.87-3c-1.08.72-2.45 1.15-4.08 1.15-3.13 0-5.79-2.11-6.74-4.96H1.27v3.1A12 12 0 0 0 12 24z" />
            <path fill="#FBBC05" d="M5.26 14.28A7.2 7.2 0 0 1 4.88 12c0-.79.14-1.56.38-2.28v-3.1H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.38l3.99-3.1z" />
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.62l3.99 3.1C6.21 6.86 8.87 4.75 12 4.75z" />
          </svg>
          Google로 시작하기
        </button>

        <p className="mt-6 text-xs text-mute">
          로그인 시 개인정보처리방침 및 이용약관에 동의하는 것으로 간주돼요.
        </p>
      </div>
    </div>
  );
}