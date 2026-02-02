// src/pages/admin/AdminOrders.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, LogOut, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { formatPrice } from "@/lib/formatPrice";

type OrderRow = Record<string, any>;

export default function AdminOrders() {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading, signOut } = useAdmin();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [q, setQ] = useState("");

  // ✅ redirect safe (comme dans AdminCatalog)
  useEffect(() => {
    if (authLoading) return;
    if (!user || !isAdmin) navigate("/admin/login");
  }, [authLoading, user, isAdmin, navigate]);

  const fetchOrders = async () => {
    setError("");
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error("fetchOrders error:", e);
      setError(e?.message ?? "Erreur lors du chargement des commandes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user || !isAdmin) return;
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, isAdmin]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return orders;

    return orders.filter((o) => {
      const id = String(o.id ?? "");
      const email = String(o.email ?? o.customer_email ?? "");
      const status = String(o.status ?? o.payment_status ?? o.order_status ?? "");
      const ref = String(o.reference ?? o.ref ?? o.payment_intent ?? "");
      return (
        id.toLowerCase().includes(s) ||
        email.toLowerCase().includes(s) ||
        status.toLowerCase().includes(s) ||
        ref.toLowerCase().includes(s)
      );
    });
  }, [orders, q]);

  const handleLogout = async () => {
    await signOut();
    navigate("/admin/login");
  };

  const headerTitle = "Admin – Toutes les commandes";

  const showLoading = authLoading || loading;

  if (showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <div className="font-serif text-xl font-bold">{headerTitle}</div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex gap-2 items-center">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher (id, email, statut, ref...)"
              className="w-full md:w-96"
            />

            <Button variant="outline" onClick={fetchOrders}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Rafraîchir
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            Total: <span className="font-medium text-foreground">{filtered.length}</span>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left p-3">ID</th>
                  <th className="text-left p-3">Client</th>
                  <th className="text-left p-3">Montant</th>
                  <th className="text-left p-3">Statut</th>
                  <th className="text-left p-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const id = o.id ?? "-";
                  const email = o.email ?? o.customer_email ?? "-";
                  const amount =
                    o.total_amount ?? o.amount_total ?? o.total ?? o.amount ?? null;
                  const status = o.status ?? o.payment_status ?? o.order_status ?? "-";
                  const created = o.created_at ?? o.createdAt ?? null;

                  return (
                    <tr key={String(id)} className="border-t border-border">
                      <td className="p-3 font-medium">{String(id)}</td>
                      <td className="p-3 text-muted-foreground">{String(email)}</td>
                      <td className="p-3">
                        {amount == null ? "-" : formatPrice(Number(amount))}
                      </td>
                      <td className="p-3">{String(status)}</td>
                      <td className="p-3 text-muted-foreground">
                        {created ? new Date(created).toLocaleString() : "-"}
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-muted-foreground">
                      Aucune commande trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Note: si tu as RLS activé sur <code>orders</code>, il faut une policy qui autorise
          les admins à faire <code>select</code>.
        </div>
      </div>
    </div>
  );
}
