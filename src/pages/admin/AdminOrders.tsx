// src/pages/admin/AdminOrders.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, Loader2, LogOut, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { formatPrice } from "@/lib/formatPrice";

type OrderRow = Record<string, any>;
type OrderItemRow = Record<string, any>;

export default function AdminOrders() {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading, signOut } = useAdmin();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [q, setQ] = useState("");

  // détails
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState<string>("");
  // cache items par order_id
  const [itemsByOrder, setItemsByOrder] = useState<Record<string, OrderItemRow[]>>({});

  // ✅ redirect safe
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

  const fetchOrderItems = async (orderId: string) => {
    // si déjà en cache, pas besoin de re-fetch (tu peux enlever si tu veux toujours refresh)
    if (itemsByOrder[orderId]) return;

    setItemsError("");
    setItemsLoading(true);

    try {
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);

      if (error) throw error;

      setItemsByOrder((prev) => ({
        ...prev,
        [orderId]: Array.isArray(data) ? data : [],
      }));
    } catch (e: any) {
      console.error("fetchOrderItems error:", e);
      setItemsError(e?.message ?? "Erreur lors du chargement des items");
      setItemsByOrder((prev) => ({ ...prev, [orderId]: [] }));
    } finally {
      setItemsLoading(false);
    }
  };

  const toggleDetails = async (orderId: string) => {
    const id = String(orderId);
    if (openOrderId === id) {
      setOpenOrderId(null);
      return;
    }
    setOpenOrderId(id);
    await fetchOrderItems(id);
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
      const email = String(o.email ?? o.customer_email ?? o.full_name ?? "");
      const phone = String(o.phone ?? "");
      const status = String(o.status ?? o.payment_status ?? o.order_status ?? "");
      const ref = String(o.reference ?? o.ref ?? o.payment_intent ?? "");
      return (
        id.toLowerCase().includes(s) ||
        email.toLowerCase().includes(s) ||
        phone.toLowerCase().includes(s) ||
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
              placeholder="Rechercher (id, email/nom, téléphone, statut, ref...)"
              className="w-full md:w-96"
            />

            <Button
              variant="outline"
              onClick={() => {
                setItemsByOrder({});
                setOpenOrderId(null);
                fetchOrders();
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Rafraîchir
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            Total: <span className="font-medium text-foreground">{filtered.length}</span>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">{error}</div>
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
                  <th className="text-left p-3">Détails</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((o) => {
                  const id = String(o.id ?? "");
                  const client =
                    o.full_name ??
                    o.name ??
                    o.email ??
                    o.customer_email ??
                    o.customer_name ??
                    "-";
                  const phone = o.phone ?? o.customer_phone ?? "";
                  const amount = o.total_amount ?? o.amount_total ?? o.total ?? o.amount ?? null;
                  const status = o.status ?? o.payment_status ?? o.order_status ?? "-";
                  const created = o.created_at ?? o.createdAt ?? null;

                  const isOpen = openOrderId === id;
                  const items = itemsByOrder[id] ?? [];

                  return (
                    <>
                      <tr key={id} className="border-t border-border align-top">
                        <td className="p-3 font-medium">{id || "-"}</td>

                        <td className="p-3 text-muted-foreground">
                          <div className="text-foreground">{String(client)}</div>
                          {phone ? <div className="text-xs text-muted-foreground">{String(phone)}</div> : null}
                          {o.email ? <div className="text-xs text-muted-foreground">{String(o.email)}</div> : null}
                        </td>

                        <td className="p-3">{amount == null ? "-" : formatPrice(Number(amount))}</td>
                        <td className="p-3">{String(status)}</td>

                        <td className="p-3 text-muted-foreground">
                          {created ? new Date(created).toLocaleString() : "-"}
                        </td>

                        <td className="p-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleDetails(id)}
                          >
                            {isOpen ? (
                              <>
                                <ChevronUp className="h-4 w-4 mr-2" />
                                Fermer
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4 mr-2" />
                                Voir
                              </>
                            )}
                          </Button>
                        </td>
                      </tr>

                      {isOpen && (
                        <tr className="border-t border-border bg-muted/20">
                          <td colSpan={6} className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="font-medium">Articles de la commande</div>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  // refresh forcé
                                  setItemsByOrder((prev) => {
                                    const copy = { ...prev };
                                    delete copy[id];
                                    return copy;
                                  });
                                  await fetchOrderItems(id);
                                }}
                                disabled={itemsLoading}
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Rafraîchir items
                              </Button>
                            </div>

                            {itemsError && (
                              <div className="mt-3 bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
                                {itemsError}
                              </div>
                            )}

                            {itemsLoading && !itemsByOrder[id] ? (
                              <div className="mt-3 flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Chargement des articles…
                              </div>
                            ) : items.length === 0 ? (
                              <div className="mt-3 text-sm text-muted-foreground">
                                Aucun article trouvé pour cette commande.
                              </div>
                            ) : (
                              <div className="mt-3 overflow-x-auto">
                                <table className="w-full text-sm bg-card rounded-lg border border-border overflow-hidden">
                                  <thead className="bg-muted/40">
                                    <tr>
                                      <th className="text-left p-2">Produit</th>
                                      <th className="text-left p-2">Variante</th>
                                      <th className="text-left p-2">Couleur</th>
                                      <th className="text-left p-2">Longueur</th>
                                      <th className="text-left p-2">Qté</th>
                                      <th className="text-left p-2">PU</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {items.map((it, idx) => (
                                      <tr key={`${id}-${idx}`} className="border-t border-border">
                                        <td className="p-2 text-muted-foreground">
                                          {String(it.product_id ?? it.id_produit ?? "-")}
                                        </td>
                                        <td className="p-2 text-muted-foreground">
                                          {String(it.variant_id ?? it.id_variante ?? "-")}
                                        </td>
                                        <td className="p-2">{String(it.color ?? it.couleur ?? "-")}</td>
                                        <td className="p-2">
                                          {String(it.length ?? it.longueur ?? "-")}
                                        </td>
                                        <td className="p-2">{Number(it.quantity ?? it.quantite ?? 1)}</td>
                                        <td className="p-2">
                                          {it.unit_price ?? it.prix_unitaire
                                            ? formatPrice(Number(it.unit_price ?? it.prix_unitaire))
                                            : "-"}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground">
                      Aucune commande trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Note: si tu as RLS activé sur <code>orders</code> / <code>order_items</code>, il faut une policy
          qui autorise les admins à faire <code>select</code>.
        </div>
      </div>
    </div>
  );
}
