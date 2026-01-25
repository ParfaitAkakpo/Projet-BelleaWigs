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

    // ✅ on lit profiles.role
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const u = session?.user ?? null;
        setUser(u);
        await checkAdmin(u);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      await checkAdmin(u);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, isAdmin, loading, signIn, signOut };
};
