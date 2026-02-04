import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

const sb = supabase as any;
type ProfileRole = "admin" | "customer" | string;

type ProfileRoleRow = { role: ProfileRole } | null;

// ✅ Type propre : on garde le type du promise
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("timeout")), ms);
    promise
      .then((value) => {
        clearTimeout(id);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(id);
        reject(err);
      });
  });
}

export const useAdmin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  async function checkAdmin(u: User | null) {
    if (!u) {
      setIsAdmin(false);
      return;
    }

    try {
      // ✅ on force le type de retour attendu
      const res = await withTimeout<{ data: ProfileRoleRow; error: any }>(
        sb.from("profiles").select("role").eq("id", u.id).maybeSingle(),
        2500
      );

      if (res?.error) throw res.error;

      const role: ProfileRole = (res.data?.role ?? "customer") as any;
      setIsAdmin(role === "admin");
    } catch (e) {
      console.warn("checkAdmin timeout/error => fallback customer", e);
      setIsAdmin(false);
    }
  }

  useEffect(() => {
    let alive = true;

    const timer = setTimeout(() => {
      if (alive) setLoading(false);
    }, 4000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!alive) return;
      clearTimeout(timer);

      const u = session?.user ?? null;
      setUser(u);

      await checkAdmin(u);

      if (alive) setLoading(false);
    });

    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        if (!alive) return;
        clearTimeout(timer);

        const u = session?.user ?? null;
        setUser(u);

        await checkAdmin(u);

        if (alive) setLoading(false);
      })
      .catch((e) => {
        console.error("getSession error:", e);
        clearTimeout(timer);
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    try {
      // @ts-ignore
      await supabase.auth.signOut({ scope: "global" });
    } catch (e) {
      try {
        // @ts-ignore
        await supabase.auth.signOut({ scope: "local" });
      } catch {}
    } finally {
      setUser(null);
      setIsAdmin(false);
      setLoading(false);
    }
  };

  return { user, isAdmin, loading, signIn, signOut };
};
