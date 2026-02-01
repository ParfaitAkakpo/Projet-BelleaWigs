// src/pages/account/OrdersPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

const sb = supabase as any;

type OrderRow = {
  id: string;
  created_at?: string | null;
  status?: string | null;
  payment_method?: string | null;
  delivery_mode?: string | null;
  total?: number | null;
  user_id?: string | null;
};

type OrderItemRow = {
  order_id: string;
  product_id?: string | number | null;
  variant_id?: string | number | null;
  quantity?: number | null;
  unit_price?: number | null;
  color?: string | null;
  length?: string | number | null;
};

function formatMoneyFCFA(n: any) {
  const num = Number(n ?? 0);
  return new Intl.NumberFormat("fr-FR").format(Math.max(0, Math.round(num))) + " FCFA";
}

function formatDate(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

export default function OrdersPage() {
  const { addToCart } = useCart();

  const [session, setSession] = useState<any>(null);
  const userId = session?.user?.id as string | undefined;

  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [error, setError] = useState<string>("");

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItemRow[]>([]);

  // session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession));
    return () => sub.subscription.unsubscribe();
  }, []);

  const loadOrders = async () => {
    if (!userId) return;
    setLoading(true);
    setError("");

    try {
      const { data, error } = await sb
        .from("orders")
        .select("id, created_at, status, payment_method, delivery_mode, total, user_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setOrders((data ?? []) as any);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Erreur chargement commandes");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const toggleOrderDetails = async (orderId: string) => {
    if (selectedOrderId === orderId) {
      setSelectedOrderId(null);
      setOrderItems([]);
      return;
    }

    setSelectedOrderId(orderId);
    setItemsLoading(true);
    setOrderItems([]);

    try {
      const { data, error } = await sb
        .from("order_items")
        .select("order_id, product_id, variant_id, quantity, unit_price, color, length")
        .eq("order_id", orderId);

      if (error) throw error;
      setOrderItems((data ?? []) as any);
    } catch (e: any) {
      console.error(e);
      setOrderItems([]);
    } finally {
      setItemsLoading(false);
    }
  };

  // ✅ recommander 1 item (si produit actif + variant stock > 0)
  const reorderItem = async (it: OrderItemRow) => {
    const productId = it.product_id;
    const variantId = it.variant_id;
    const qty = Math.max(1, Number(it.quantity ?? 1));

    if (!productId || !variantId) {
      toast.error("Impossible de recommander cet article (infos manquantes).");
      return;
    }

    try {
      const { data: product, error: pErr } = await sb
        .from("product")
        .select("*")
        .eq("id", productId)
        .maybeSingle();

      if (pErr) throw pErr;

      if (!product || product.is_active === false) {
        toast.error("Cet article n’est plus disponible.");
        return;
      }

      const { data: variant, error: vErr } = await sb
        .from("product_variant")
        .select("*")
        .eq("id", variantId)
        .maybeSingle();

      if (vErr) throw vErr;

      if (!variant || Number(variant.stock_count ?? 0) <= 0) {
        toast.error("Variante en rupture de stock.");
        return;
      }

      const stock = Math.max(0, Number(variant.stock_count ?? 0));
      const finalQty = Math.min(qty, stock);

      addToCart(product, variant, finalQty);

      toast.success(finalQty < qty ? "Ajouté au panier (quantité ajustée au stock)." : "Ajouté au panier ✅");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Erreur lors de la recommandation");
    }
  };

  const hasOrders = useMemo(() => orders.length > 0, [orders.length]);

  return (
    <div className="p-6 bg-card rounded-xl shadow-card">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-serif text-xl font-semibold text-foreground">Mes commandes</h2>
        <Button variant="outline" onClick={loadOrders} disabled={loading}>
          {loading ? "Chargement..." : "Rafraîchir"}
        </Button>
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      {!loading && !hasOrders && (
        <div className="text-center py-10 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Aucune commande pour le moment</p>

          <Button className="mt-4" variant="hero" asChild>
            <Link to="/account/shop">Aller à la boutique</Link>
          </Button>
        </div>
      )}

      {hasOrders && (
        <div className="mt-6 space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="border border-border rounded-xl p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">
                    Commande <span className="text-primary">#{o.id}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(o.created_at)} • {o.payment_method ?? "-"} • {o.delivery_mode ?? "-"}
                    {o.status ? ` • ${o.status}` : ""}
                  </p>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-lg font-bold text-foreground">{formatMoneyFCFA(o.total)}</p>
                  </div>

                  <Button variant="outline" onClick={() => toggleOrderDetails(o.id)}>
                    {selectedOrderId === o.id ? "Fermer" : "Voir détails"}
                  </Button>
                </div>
              </div>

              {selectedOrderId === o.id && (
                <div className="mt-4 border-t border-border pt-4">
                  {itemsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Chargement des items...
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {orderItems.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Aucun item trouvé.</p>
                      ) : (
                        orderItems.map((it, idx) => (
                          <div
                            key={`${it.order_id}-${idx}`}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-border p-3"
                          >
                            <div className="text-sm">
                              <div className="text-muted-foreground">
                                Produit #{it.product_id ?? "?"}{" "}
                                {it.color || it.length ? (
                                  <span>
                                    ({it.color ?? "?"}
                                    {it.length != null ? ` - ${it.length}"` : ""})
                                  </span>
                                ) : null}
                                {" • "}x{Number(it.quantity ?? 1)}
                              </div>
                              <div className="font-medium text-foreground">{formatMoneyFCFA(Number(it.unit_price ?? 0))}</div>
                            </div>

                            <Button
                              variant="hero"
                              size="sm"
                              onClick={() => reorderItem(it)}
                              className="sm:w-auto w-full"
                            >
                              Recommander
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
