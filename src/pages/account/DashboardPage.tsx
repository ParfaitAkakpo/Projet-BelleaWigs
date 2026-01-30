import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, ShoppingCart, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

// Optionnel : si tu veux récupérer profile depuis Outlet context
import { useOutletContext } from "react-router-dom";

type Profile = {
  full_name: string | null;
};

function firstName(fullName?: string | null) {
  const s = String(fullName ?? "").trim();
  if (!s) return "";
  return s.split(/\s+/)[0] ?? "";
}

export default function DashboardPage() {
  const { profile } = useOutletContext<{ profile: Profile | null }>();

  const hello = useMemo(() => {
    const fn = firstName(profile?.full_name);
    return fn ? `Bonjour ${fn} 👋` : "Bonjour 👋";
  }, [profile?.full_name]);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="p-6 bg-card rounded-xl shadow-card">
        <h2 className="font-serif text-2xl font-bold text-foreground">{hello}</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Retrouvez vos commandes, votre panier et continuez vos achats ici.
        </p>
      </div>

      {/* Shortcuts */}
      <div className="p-6 bg-card rounded-xl shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-xl font-semibold text-foreground">Raccourcis</h3>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <Link to="/account/shop" className="block">
            <div className="p-4 rounded-xl border border-border hover:bg-muted transition-colors">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                <p className="font-medium">Continuer achats</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Revenir à la boutique dans votre espace.
              </p>
            </div>
          </Link>

          <Link to="/account/cart" className="block">
            <div className="p-4 rounded-xl border border-border hover:bg-muted transition-colors">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <p className="font-medium">Voir panier</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Finaliser votre commande rapidement.
              </p>
            </div>
          </Link>

          <Link to="/account/orders" className="block">
            <div className="p-4 rounded-xl border border-border hover:bg-muted transition-colors">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <p className="font-medium">Mes commandes</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Suivi + recommander vos articles.
              </p>
            </div>
          </Link>
        </div>

        <div className="mt-4">
          <Link to="/account/shop">
            <Button variant="hero">Aller à la boutique</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
