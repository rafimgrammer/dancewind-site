import { createContext, useContext, useState, type ReactNode } from "react";

export type Role = "guest" | "member" | "president";

interface AuthState {
  role: Role;
  name: string;
}

interface AuthContextValue extends AuthState {
  setRole: (role: Role) => void;
}

const ROLE_NAMES: Record<Role, string> = {
  guest: "게스트",
  member: "23기 이도윤",
  president: "19기 강지호 (회장)",
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>("guest");

  const setRole = (next: Role) => setRoleState(next);

  return (
    <AuthContext.Provider value={{ role, name: ROLE_NAMES[role], setRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth는 AuthProvider 안에서만 사용할 수 있어요.");
  return ctx;
}
