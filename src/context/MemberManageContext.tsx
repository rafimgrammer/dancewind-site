// src/context/MemberManageContext.tsx
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

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
  approvedBy: string[];
}

interface MemberManageContextType {
  pending: PendingApplicant[];
  members: Member[];
  kickRequests: KickRequest[];
  loading: boolean;
  approve: (id: string) => Promise<void>;
  reject: (id: string) => Promise<void>;
  requestKick: (targetId: string, requestedBy: string) => Promise<void>;
  approveKick: (requestId: string, approverName: string) => Promise<void>;
  cancelKickRequest: (requestId: string) => Promise<void>;
  presidentCount: number;
}

const MemberManageContext = createContext<MemberManageContextType | null>(null);

export function MemberManageProvider({ children }: { children: ReactNode }) {
  const { role } = useAuth();
  const [pending, setPending] = useState<PendingApplicant[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [kickRequests, setKickRequests] = useState<KickRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (role !== "president") {
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data: pendingData } = await supabase
      .from("members")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    const { data: memberData } = await supabase
      .from("members")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: true });

    const { data: kickData } = await supabase
      .from("kick_requests")
      .select("*")
      .order("requested_at", { ascending: true });

    setPending(
      (pendingData ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        studentId: p.student_id,
        department: p.department,
        cohort: p.cohort,
        appliedAt: p.created_at?.slice(0, 10) ?? "",
      }))
    );

    setMembers(
      (memberData ?? []).map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        studentId: m.student_id,
        department: m.department,
        cohort: m.cohort,
        role: m.role,
        joinedAt: m.created_at?.slice(0, 10) ?? "",
      }))
    );

    setKickRequests(
      (kickData ?? []).map((k) => ({
        id: k.id,
        targetId: k.target_id,
        targetName: k.target_name,
        requestedBy: k.requested_by_name,
        requestedAt: k.requested_at?.slice(0, 10) ?? "",
        approvedBy: k.approved_by ?? [],
      }))
    );

    setLoading(false);
  }, [role]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const presidentCount = members.filter((m) => m.role === "president").length;

  const approve = async (id: string) => {
    await supabase.from("members").update({ status: "approved" }).eq("id", id);
    await fetchAll();
  };

  const reject = async (id: string) => {
    await supabase.from("members").delete().eq("id", id);
    await fetchAll();
  };

  const requestKick = async (targetId: string, requestedBy: string) => {
    const target = members.find((m) => m.id === targetId);
    if (!target) return;

    const existing = kickRequests.find((r) => r.targetId === targetId);
    if (existing) return;

    await supabase.from("kick_requests").insert({
      target_id: targetId,
      target_name: target.name,
      requested_by_name: requestedBy,
      approved_by: [requestedBy],
    });
    await fetchAll();
  };

  const approveKick = async (requestId: string, approverName: string) => {
    const request = kickRequests.find((r) => r.id === requestId);
    if (!request || request.approvedBy.includes(approverName)) return;

    const nextApprovedBy = [...request.approvedBy, approverName];

    if (nextApprovedBy.length >= presidentCount) {
      // 전원 동의 완료 → 실제 강퇴 실행 + 요청 삭제
      await supabase.from("members").delete().eq("id", request.targetId);
      await supabase.from("kick_requests").delete().eq("id", requestId);
    } else {
      await supabase.from("kick_requests").update({ approved_by: nextApprovedBy }).eq("id", requestId);
    }
    await fetchAll();
  };

  const cancelKickRequest = async (requestId: string) => {
    await supabase.from("kick_requests").delete().eq("id", requestId);
    await fetchAll();
  };

  return (
    <MemberManageContext.Provider
      value={{
        pending,
        members,
        kickRequests,
        loading,
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