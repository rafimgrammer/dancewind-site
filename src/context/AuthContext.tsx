// src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export type Role = "guest" | "member" | "president";
export type ProfileStatus = "none" | "pending" | "approved";

export interface MemberProfile {
  id: string;
  email: string;
  name: string;
  student_id: string;
  department: string;
  cohort: string;
  role: "member" | "president";
  status: "pending" | "approved";
  is_staff_head: boolean;
  is_site_admin: boolean;
}

interface AuthContextValue {
  role: Role;
  name: string;
  isStaffHead: boolean;
  // 사이트 업데이트 로그를 작성할 수 있는 숨겨진 권한이에요.
  // role/화면에 보이는 표시는 그대로 "부원"이고, 회장단 권한과는 완전히 별개예요.
  isSiteAdmin: boolean;
  user: User | null;
  profile: MemberProfile | null;
  profileStatus: ProfileStatus;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from("members").select("*").eq("id", userId).maybeSingle();
    setProfile(data as MemberProfile | null);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      if (data.session?.user) fetchProfile(data.session.user.id);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const profileStatus: ProfileStatus = !user ? "none" : !profile ? "none" : profile.status;

  const role: Role =
    profile && profile.status === "approved"
      ? profile.role === "president"
        ? "president"
        : "member"
      : "guest";

  const name = profile ? `${profile.cohort} ${profile.name}` : "게스트";
  const isStaffHead = profile?.is_staff_head ?? false;
  const isSiteAdmin = profile?.is_site_admin ?? false;

  return (
    <AuthContext.Provider
      value={{ role, name, isStaffHead, isSiteAdmin, user, profile, profileStatus, loading, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth는 AuthProvider 안에서만 사용할 수 있어요.");
  return ctx;
}