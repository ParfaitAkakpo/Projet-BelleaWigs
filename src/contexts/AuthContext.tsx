import { createContext, useContext } from "react";
import { useAdmin } from "@/hooks/useAdmin";

type AuthCtx = ReturnType<typeof useAdmin>;

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAdmin();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
