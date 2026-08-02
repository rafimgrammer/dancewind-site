// src/pages/Onboarding.tsx
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { PageHeader, Card } from "../components/Ui";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

export default function Onboarding() {
  const { user, profileStatus, loading, refreshProfile } = useAuth();

  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [department, setDepartment] = useState("");
  const [cohort, setCohort] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (profileStatus === "pending") return <Navigate to="/pending" replace />;
  if (profileStatus === "approved") return <Navigate to="/" replace />;

  const handleSubmit = async () => {
    if (!name.trim() || !studentId.trim() || !department.trim() || !cohort.trim()) {
      setError("모든 항목을 입력해주세요.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase.from("members").insert({
      id: user.id,
      email: user.email,
      name: name.trim(),
      student_id: studentId.trim(),
      department: department.trim(),
      cohort: cohort.trim(),
      role: "member",
      status: "pending",
    });

    setSubmitting(false);

    if (insertError) {
      setError("제출 중 문제가 발생했어요: " + insertError.message);
      return;
    }

    await refreshProfile();
  };

  const inputClass =
    "w-full rounded-lg border border-line bg-stage px-3 py-2 text-sm text-backstage placeholder:text-mute outline-none focus:border-dawn-teal";

  return (
    <div className="mx-auto max-w-md">
      <PageHeader
        eyebrow="Onboarding"
        title="프로필을 완성해주세요"
        desc="회장단 승인 후 정식 부원으로 활동하실 수 있어요."
      />

      <Card className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs text-mute">이름</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="홍길동" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-mute">학번</label>
          <input
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className={inputClass}
            placeholder="20261234"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-mute">학과</label>
          <input
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className={inputClass}
            placeholder="경영학과"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-mute">춤바람 가입 기수</label>
          <input value={cohort} onChange={(e) => setCohort(e.target.value)} className={inputClass} placeholder="30기" />
        </div>

        {error && <p className="text-xs text-red-300">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full rounded-lg bg-wind-gold py-2.5 text-sm font-semibold text-stage disabled:opacity-50"
        >
          {submitting ? "제출 중..." : "가입 신청하기"}
        </button>
      </Card>
    </div>
  );
}