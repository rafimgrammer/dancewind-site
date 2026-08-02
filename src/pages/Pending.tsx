// src/pages/Pending.tsx
import { Navigate } from "react-router-dom";
import { PageHeader, Card } from "../components/Ui";
import { useAuth } from "../context/AuthContext";

export default function Pending() {
  const { profileStatus, loading } = useAuth();

  if (loading) return null;
  if (profileStatus === "none") return <Navigate to="/onboarding" replace />;
  if (profileStatus === "approved") return <Navigate to="/" replace />;

  return (
    <div className="mx-auto max-w-md text-center">
      <PageHeader eyebrow="Pending" title="승인 대기 중이에요" desc="회장단이 확인 후 정식 부원으로 전환해드려요." />
      <Card>
        <p className="text-sm leading-relaxed text-backstage/75">
          가입 신청이 정상적으로 접수됐어요. 회장단이 확인하는 대로 알림 없이도 자동으로 활동
          권한이 열리니, 잠시 후 다시 로그인해서 확인해주세요.
        </p>
      </Card>
    </div>
  );
}