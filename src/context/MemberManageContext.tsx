// src/context/MemberManageContext.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface PendingApplicant {
  id: string;
  name: string;
  email: string;
  studentId: string;
  department: string;
  cohort: string;
  appliedAt: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  studentId: string;
  department: string;
  cohort: string;
  role: "member" | "president";
  joinedAt: string;
}

export interface KickRequest {
  id: string;
  targetId: string;
  targetName: string;
  requestedBy: string;
  requestedAt: string;
  approvedBy: string[]; // 승인한 회장단 이름 목록
}

const STORAGE_KEY = "chumbaram_member_manage_v2";

const SEED_PENDING: PendingApplicant[] = [
  {
    id: "p1",
    name: "박서연",
    email: "seoyeon.park@hallym.ac.kr",
    studentId: "20261234",
    department: "경영학과",
    cohort: "30기",
    appliedAt: "2026-07-28",
  },
  {
    id: "p2",
    name: "이도윤",
    email: "doyoon.lee@hallym.ac.kr",
    studentId: "20265678",
    department: "컴퓨터공학과",
    cohort: "30기",
    appliedAt: "2026-07-30",
  },
];

const SEED_MEMBERS: Member[] = [
  {
    id: "m1",
    name: "강지호",
    email: "jiho.kang@hallym.ac.kr",
    studentId: "20221111",
    department: "체육학과",
    cohort: "19기",
    role: "president",
    joinedAt: "2023-03-02",
  },
  {
    id: "m2",
    name: "임예진",
    email: "yejin.lim@hallym.ac.kr",
    studentId: "20222222",
    department: "무용학과",
    cohort: "29기",
    role: "president",
    joinedAt: "2024-03-02",
  },
];

interface MemberManageContextType {
  pending: PendingApplicant[];
  members: Member[];
  kickRequests: KickRequest[];
  approve: (id: string) => void;
  reject: (id: string) => void;
  requestKick: (targetId: string, requestedBy: string) => void;
  approveKick: (requestId: string, approverName: string) => void;
  cancelKickRequest: (requestId: string) => void;
  presidentCount: number;
}

const MemberManageContext = createContext<MemberManageContextType | null>(null);

export function MemberManageProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingApplicant[]>(SEED_PENDING);
  const [members, setMembers] = useState<Member[]>(SEED_MEMBERS);
  const [kickRequests, setKickRequests] = useState<KickRequest[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setPending(parsed.pending ?? SEED_PENDING);
        setMembers(parsed.members ?? SEED_MEMBERS);
        setKickRequests(parsed.kickRequests ?? []);
      }
    } catch {
      // 저장된 값 없으면 무시
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ pending, members, kickRequests }));
    } catch {
      // 저장 실패해도 화면은 정상 동작
    }
  }, [pending, members, kickRequests]);

  const presidentCount = members.filter((m) => m.role === "president").length;

  const approve = (id: string) => {
    const applicant = pending.find((p) => p.id === id);
    if (!applicant) return;
    setMembers((prev) => [
      ...prev,
      {
        id: `m${Date.now()}`,
        name: applicant.name,
        email: applicant.email,
        studentId: applicant.studentId,
        department: applicant.department,
        cohort: applicant.cohort,
        role: "member",
        joinedAt: new Date().toISOString().slice(0, 10),
      },
    ]);
    setPending((prev) => prev.filter((p) => p.id !== id));
  };

  const reject = (id: string) => {
    setPending((prev) => prev.filter((p) => p.id !== id));
  };

  const requestKick = (targetId: string, requestedBy: string) => {
    const target = members.find((m) => m.id === targetId);
    if (!target) return;

    // 이미 이 사람에 대한 요청이 진행 중이면 중복 생성 안 함
    const existing = kickRequests.find((r) => r.targetId === targetId);
    if (existing) return;

    const request: KickRequest = {
      id: `kr${Date.now()}`,
      targetId,
      targetName: target.name,
      requestedBy,
      requestedAt: new Date().toISOString().slice(0, 10),
      approvedBy: [requestedBy], // 요청한 사람은 자동으로 첫 동의자가 됨
    };
    setKickRequests((prev) => [...prev, request]);
  };

  const approveKick = (requestId: string, approverName: string) => {
    setKickRequests((prev) => {
      const next = prev.map((r) => {
        if (r.id !== requestId) return r;
        if (r.approvedBy.includes(approverName)) return r;
        return { ...r, approvedBy: [...r.approvedBy, approverName] };
      });

      const target = next.find((r) => r.id === requestId);
      if (target && target.approvedBy.length >= presidentCount) {
        // 전원 동의 완료 → 실제 강퇴 실행
        setMembers((prevMembers) => prevMembers.filter((m) => m.id !== target.targetId));
        return next.filter((r) => r.id !== requestId);
      }

      return next;
    });
  };

  const cancelKickRequest = (requestId: string) => {
    setKickRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  return (
    <MemberManageContext.Provider
      value={{
        pending,
        members,
        kickRequests,
        approve,
        reject,
        requestKick,
        approveKick,
        cancelKickRequest,
        presidentCount,
      }}
    >
      {children}
    </MemberManageContext.Provider>
  );
}

export function useMemberManage() {
  const ctx = useContext(MemberManageContext);
  if (!ctx) throw new Error("useMemberManage는 MemberManageProvider 안에서만 써야 해요.");
  return ctx;
}