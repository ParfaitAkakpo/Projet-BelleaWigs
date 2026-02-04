import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

const sb = supabase as any;
type ProfileRole = "admin" | "customer" | string;

export const useAdmin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  async function checkAdmin(u: User | null) {
    if (!u) {
      setIsAdmin(false);
      return;
    }

    const { data, error } = await sb
      .from("profiles")
      .select("role")
      .eq("id", u.id)
      .maybeSingle();

    if (error) {
      console.error("checkAdmin error:", error);
      setIsAdmin(false);
      return;
    }

    const role: ProfileRole = (data?.role ?? "customer") as any;
    setIsAdmin(role === "admin");
  }

  useEffect(() => {
    let alive = true;

    // ✅ anti-loading infini
    const timer = setTimeout(() => {
      if (alive) setLoading(false);
    }, 4000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!alive) return;
        clearTimeout(timer);

        const u = session?.user ?? null;
        setUser(u);
        await checkAdmin(u);
        if (alive) setLoading(false);
      }
    );

    supabase.auth.getSession()
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
      await supabase.auth.signOut();
    } catch (e) {
      // fallback local si réseau instable
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
