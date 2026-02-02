// src/pages/account/EmailConfirmed.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Loader2, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const sb = supabase as any;
type Role = "admin" | "customer" | string;

export default function EmailConfirmed() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  const goTarget = async (uid: string) => {
    const { data } = await sb.from("profiles").select("role").eq("id", uid).maybeSingle();
    const role: Role = (data?.role ?? "customer") as any;
    navigate(role === "admin" ? "/admin" : "/account/dashboard", { replace: true });
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // Permet à Supabase de finaliser la session après redirect
        const { data } = await supabase.auth.getSession();
        const session = data?.session ?? null;

        if (!mounted) return;

        if (session?.user?.id) {
          setHasSession(true);

          // Petite pause UX avant redirect
          setTimeout(() => {
            goTarget(session.user.id);
          }, 1500);

          return;
        }

        setHasSession(false);
      } finally {
        if (mounted) setChecking(false);
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subtitle = useMemo(() => {
    if (checking) return "Validation en cours…";
    if (hasSession) return "Email confirmé. Redirection vers ton espace…";
    return "Email confirmé. Tu peux maintenant te connecter.";
  }, [checking, hasSession]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-16">
      {/* ✅ Animations CSS local */}
      <style>{`
        @keyframes pop {
          0% { transform: scale(.6); opacity: 0; }
          60% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); }
        }
        @keyframes ring {
          0% { transform: scale(1); opacity: .7; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes floatDown {
          0% { transform: translateY(-10px); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateY(18px); opacity: 0; }
        }
      `}</style>

      <div className="w-full max-w-md mx-4">
        <div className="p-6 bg-card rounded-xl shadow-card border border-border relative overflow-hidden">
          {/* Confettis léger */}
          {!checking && (
            <div aria-hidden className="pointer-events-none absolute inset-0">
              {Array.from({ length: 18 }).map((_, i) => (
                <span
                  key={i}
                  className="absolute block h-2 w-2 rounded-sm opacity-80"
                  style={{
                    left: `${(i * 13) % 100}%`,
                    top: `${(i * 7) % 35}%`,
                    animation: `floatDown ${900 + (i % 6) * 120}ms ease-out ${i * 30}ms 1`,
                    background: i % 3 === 0 ? "currentColor" : "rgba(0,0,0,0.25)",
                  }}
                />
              ))}
            </div>
          )}

          <div className="flex items-start gap-4 relative">
            {/* Badge success animé */}
            <div className="relative h-14 w-14 shrink-0">
              {checking ? (
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* ring pulse */}
                  <div
                    className="absolute inset-0 rounded-2xl bg-primary/20"
                    style={{ animation: "ring 900ms ease-out 1" }}
                  />
                  <div
                    className="h-14 w-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm"
                    style={{ animation: "pop 420ms ease-out 1" }}
                  >
                    <Check className="h-7 w-7" />
                  </div>
                </>
              )}
            </div>

            <div className="flex-1">
              <h1 className="font-serif text-2xl font-bold text-foreground">
                Email confirmé ✅
              </h1>
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>

              {hasSession && !checking && (
                <div className="mt-3 text-xs text-muted-foreground">
                  Redirection automatique…
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2 relative">
            <Button
              variant="hero"
              onClick={() => navigate("/account/login", { replace: true })}
              disabled={checking && hasSession}
            >
              Me connecter
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>

            <Link to="/" className="w-full">
              <Button variant="outline" className="w-full">
                Retour à l’accueil
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground mt-4 relative">
            Si tu n’es pas redirigé automatiquement, clique sur “Me connecter”.
          </p>
        </div>
      </div>
    </div>
  );
}
