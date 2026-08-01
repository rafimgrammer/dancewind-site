import { useState } from "react";
import { PageHeader, Card, Pill, RequireRole } from "../components/Ui";
import { useAuth } from "../context/AuthContext";
import initialClasses from "../data/classes.json";

interface ClassItem {
  id: string;
  title: string;
  teacher: string;
  level: string;
  day: string;
  time: string;
  spots: string;
}

export default function Teaching() {
  const { role } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>(initialClasses);
  const isPresident = role === "president";

  return (
    <RequireRole allow={["member", "president"]} what="티칭 클래스">
      <div>
        <PageHeader eyebrow="Teaching" title="티칭 클래스" desc="선배가 여는 정규 클래스, 신청은 자유예요." />

        {isPresident && (
          <button
            onClick={() =>
              setClasses((prev) => [
                {
                  id: `c${Date.now()}`,
                  title: "새 클래스",
                  teacher: "미정",
                  level: "전체",
                  day: "요일 미정",
                  time: "시간 미정",
                  spots: "0 / 0",
                },
                ...prev,
              ])
            }
            className="mb-6 rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage"
          >
            + 클래스 등록
          </button>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {classes.map((c) => (
            <Card key={c.id}>
              <div className="flex items-start justify-between">
                <Pill tone="teal">{c.level}</Pill>
                {isPresident && (
                  <button
                    onClick={() => setClasses((prev) => prev.filter((x) => x.id !== c.id))}
                    className="text-[11px] text-mute hover:text-red-300"
                  >
                    삭제
                  </button>
                )}
              </div>
              <p className="mt-2 font-display text-lg text-backstage">{c.title}</p>
              <p className="mt-0.5 font-mono text-xs text-dawn-teal">{c.teacher}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-backstage/70">
                <span>{c.day}</span>
                <span>{c.time}</span>
                <span className="font-mono text-xs text-mute">신청 {c.spots}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </RequireRole>
  );
}
