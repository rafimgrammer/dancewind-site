// src/context/PresenceContext.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

export interface OnlineUser {
  id: string;
  name: string;
  role: "member" | "president";
}

interface PresenceTrackPayload {
  name: string;
  role: "member" | "president";
  online_at: string;
}

interface PresenceContextType {
  onlineUsers: OnlineUser[];
  onlineCount: number;
}

const PresenceContext = createContext<PresenceContextType | null>(null);

export function PresenceProvider({ children }: { children: ReactNode }) {
  const { user, profile, role } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  const isApproved = role === "member" || role === "president";

  useEffect(() => {
    // 로그인 여부와 무관하게 채널에는 다 같이 참여해서 "접속 중" 상태를 조회함.
    // 실제로 track()으로 자기 상태를 등록하는 건 승인된 부원만.
    const channelKey = user?.id ?? `guest-${Math.random().toString(36).slice(2)}`;

    const channel = supabase.channel("online-users", {
      config: {
        presence: { key: channelKey },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceTrackPayload>();
        const users: OnlineUser[] = Object.entries(state)
          .map(([id, entries]) => {
            const latest = entries[entries.length - 1];
            if (!latest) return null;
            return { id, name: latest.name, role: latest.role };
          })
          .filter((u): u is OnlineUser => u !== null);
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED" && user && profile && isApproved) {
          await channel.track({
            name: `${profile.cohort} ${profile.name}`,
            role: profile.role,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, profile?.name, profile?.cohort, profile?.role, isApproved]);

  const onlineCount = onlineUsers.length;

  return (
    <PresenceContext.Provider value={{ onlineUsers, onlineCount }}>
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence() {
  const ctx = useContext(PresenceContext);
  if (!ctx) throw new Error("usePresence는 PresenceProvider 안에서만 사용할 수 있어요.");
  return ctx;
}