import { useState } from "react";
import { PageHeader, Pill, RequireRole } from "../components/Ui";

interface Member {
  id: string;
  name: string;
  gen: string;
  part: string;
  status: "가입 승인 대기" | "부원" | "회장단";
}

const INITIAL: Member[] = [
  { id: "m1", name: "김나윤", gen: "24기", part: "힙합", status: "가입 승인 대기" },
  { id: "m2", name: "이도윤", gen: "23기", part: "왁킹", status: "부원" },
  { id: "m3", name: "박서연", gen: "22기", part: "걸스힙합", status: "부원" },
  { id: "m4", name: "강지호", gen: "19기", part: "힙합", status: "회장단" },
];

export default function MemberManage() {
  const [members, setMembers] = useState<Member[]>(INITIAL);

  const setStatus = (id: string, status: Member["status"]) =>
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));

  return (
    <RequireRole allow={["president"]} what="전체 부원 관리">
      <div>
        <PageHeader eyebrow="Members" title="전체 부원 관리" desc="가입 승인과 권한 부여를 한곳에서." />

        <div className="overflow-hidden rounded-2xl border border-line bg-afterglow">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex flex-col gap-3 border-b border-line px-5 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium text-backstage">
                  {m.name} <span className="font-mono text-xs text-mute">{m.gen}</span>
                </p>
                <p className="mt-0.5 text-xs text-dawn-teal">{m.part}</p>
              </div>
              <div className="flex items-center gap-2">
                <Pill tone={m.status === "가입 승인 대기" ? "mute" : m.status === "회장단" ? "gold" : "teal"}>
                  {m.status}
                </Pill>
                {m.status === "가입 승인 대기" ? (
                  <button
                    onClick={() => setStatus(m.id, "부원")}
                    className="rounded-lg bg-wind-gold px-3 py-1.5 text-xs font-semibold text-stage"
                  >
                    승인
                  </button>
                ) : (
                  <button
                    onClick={() => setStatus(m.id, m.status === "회장단" ? "부원" : "회장단")}
                    className="rounded-lg border border-line px-3 py-1.5 text-xs text-backstage/75 hover:border-dawn-teal/50"
                  >
                    {m.status === "회장단" ? "일반 부원으로" : "회장단 권한 부여"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </RequireRole>
  );
}
