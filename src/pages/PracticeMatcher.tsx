import { useMemo, useState } from "react";
import { PageHeader, RequireRole } from "../components/Ui";

const DAYS = ["월", "화", "수", "목", "금", "토", "일"];
const TIMES = ["10-12", "12-14", "14-16", "16-18", "18-20", "20-22"];

export default function PracticeMatcher() {
  const [selected, setSelected] = useState<Set<string>>(new Set(["화-18-20", "목-18-20", "토-14-16"]));

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // 목업: 셀마다 팀원 가능 인원 수를 시드값으로 결정 (실제로는 서버 집계)
  const heat = useMemo(() => {
    const map: Record<string, number> = {};
    DAYS.forEach((d, di) =>
      TIMES.forEach((t, ti) => {
        map[`${d}-${t}`] = (di * 3 + ti * 5) % 9;
      })
    );
    return map;
  }, []);

  return (
    <RequireRole allow={["member", "president"]} what="연습시간 마스터">
      <div>
        <PageHeader
          eyebrow="Practice Matcher"
          title="연습시간 마스터"
          desc="가능한 시간을 체크하면, 팀원들과 겹치는 시간대를 색으로 보여줘요."
        />

        <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-mute">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-afterglow-2" /> 가능 인원 적음
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-wind-gold/70" /> 가능 인원 많음
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border-2 border-dawn-teal" /> 내가 선택한 시간
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-line bg-afterglow p-4">
          <div className="grid min-w-[560px] grid-cols-[64px_repeat(7,1fr)] gap-1.5">
            <div />
            {DAYS.map((d) => (
              <div key={d} className="text-center font-mono text-xs text-mute pb-1">
                {d}
              </div>
            ))}
            {TIMES.map((t) => (
              <div key={t} className="contents">
                <div className="flex items-center justify-end pr-2 font-mono text-[11px] text-mute">{t}</div>
                {DAYS.map((d) => {
                  const key = `${d}-${t}`;
                  const count = heat[key];
                  const isSelected = selected.has(key);
                  const intensity = Math.min(count / 8, 1);
                  return (
                    <button
                      key={key}
                      onClick={() => toggle(key)}
                      className={[
                        "h-10 rounded-md border transition-all duration-150",
                        isSelected ? "border-dawn-teal border-2" : "border-line/60",
                      ].join(" ")}
                      style={{
                        backgroundColor: `color-mix(in oklab, var(--color-wind-gold) ${Math.round(intensity * 70)}%, var(--color-afterglow-2))`,
                      }}
                      aria-pressed={isSelected}
                      aria-label={`${d}요일 ${t}시 · 가능 인원 ${count}명`}
                      title={`가능 인원 ${count}명`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <p className="mt-4 text-sm text-backstage/60">
          선택한 시간: {selected.size === 0 ? "없음" : Array.from(selected).join(", ")}
        </p>
      </div>
    </RequireRole>
  );
}
