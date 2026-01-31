import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { User, Package, ShoppingBag, ShoppingCart, LayoutDashboard, Heart } from "lucide-react";


import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Country = "togo" | "benin";
type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  country: Country | null;
  role: "customer" | "admin" | string;
};

const sb = supabase as any;

function firstName(fullName?: string | null) {
  const s = String(fullName ?? "").trim();
  if (!s) return "";
  return s.split(/\s+/)[0] ?? "";
}

export default function AccountShell() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const isLoggedIn = !!session?.user;

  const navigate = useNavigate();
  const location = useLocation();

  // session listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // protect routes
  useEffect(() => {
    if (session === null) return; // wait first fetch
    if (!isLoggedIn) navigate("/account/login", { replace: true, state: { from: location.pathname } });
 }, [isLoggedIn, session, navigate, location.pathname]);

  // load profile
  useEffect(() => {
    async function loadProfile() {
      if (!session?.user?.id) {
        setProfile(null);
        return;
      }

      const res = await sb
        .from("profiles")
        .select("id, full_name, phone, country, role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!res.data) {
        // create profile if missing
        await sb.from("profiles").upsert({
          id: session.user.id,
          full_name: "",
          phone: "",
          country: "togo",
          role: "customer",
          updated_at: new Date().toISOString(),
        });

        const res2 = await sb
          .from("profiles")
          .select("id, full_name, phone, country, role")
          .eq("id", session.user.id)
          .single();

        setProfile(res2.data as Profile);
        return;
      }

      setProfile(res.data as Profile);
    }

    loadProfile();
  }, [session?.user?.id]);

  const helloName = useMemo(() => firstName(profile?.full_name) || "👋", [profile?.full_name]);
const links = [
  { to: "/account/dashboard", label: "Tableau de bord", icon: LayoutDashboard, end: true },
  { to: "/account/orders", label: "Mes commandes", icon: Package },
  { to: "/account/shop", label: "Boutique", icon: ShoppingBag },
  { to: "/account/cart", label: "Panier", icon: ShoppingCart },
  { to: "/account/favorites", label: "Favoris", icon: Heart },
  // ✅ pas de /account/profile si tu n'as pas la page
];


  // If not logged yet, avoid rendering flicker
 if (!isLoggedIn) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center text-muted-foreground">
      Chargement...
    </div>
  );
}



  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
              Mon Compte
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Bonjour {helloName}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="space-y-2">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                  )
                }
              >
                <l.icon className="h-5 w-5" />
                {l.label}
              </NavLink>
            ))}

            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/", { replace: true });
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              Déconnexion
            </button>
          </aside>

          {/* Content */}
          <div className="md:col-span-3">
            <Outlet context={{ session, profile }} />
          </div>
        </div>
      </div>
    </div>
  );
}
