// src/pages/Account.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { User, Package, Heart, LogOut, Mail, Lock, Eye, EyeOff, ShoppingBag, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";

import AdminProductsPanel from "@/pages/admin/AdminProductsPanel";
import AdminCatalog from "@/pages/admin/AdminCatalog";

const sb = supabase as any;

type Country = "togo" | "benin";
const phoneCodes: Record<Country, string> = { togo: "+228", benin: "+229" };

type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  country: Country | null;
  role: "customer" | "admin" | string;
};

type OrderRow = {
  id: string;
  created_at?: string | null;
  status?: string | null;
  payment_method?: string | null;
  delivery_mode?: string | null;
  delivery_fee?: number | null;
  total?: number | null;
  full_name?: string | null;
  phone?: string | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  address?: string | null;
  user_id?: string | null;
};

type OrderItemRow = {
  id?: string;
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
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

type TabKey = "profile" | "orders" | "favorites" | "admin_products" | "admin_catalog";

export default function Account() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const { addToCart } = useCart();

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // auth
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const isLoggedIn = !!session?.user;

  // tabs
  const [activeTab, setActiveTab] = useState<TabKey>("profile");

  // orders
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string>("");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItemRow[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  // reorder
  const [reorderLoading, setReorderLoading] = useState<string | null>(null);

  // form
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState<Country>("togo");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // IDs stables (labels + autofill)
  const ids = {
    profileFullName: "profile_full_name",
    profileEmail: "profile_email",
    profileCountry: "profile_country",
    profilePhone: "profile_phone",

    authFullName: "auth_full_name",
    authCountry: "auth_country",
    authPhone: "auth_phone",
    authEmail: "auth_email",
    authPassword: "auth_password",
    authConfirmPassword: "auth_confirm_password",
  } as const;

  // session listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // tab from query ?tab=orders etc.
  useEffect(() => {
    if (!isLoggedIn) return;
    const tab = (searchParams.get("tab") || "").toLowerCase();
    const allowed: TabKey[] = ["profile", "orders", "favorites", "admin_products", "admin_catalog"];
    if (allowed.includes(tab as TabKey)) setActiveTab(tab as TabKey);
  }, [location.search, isLoggedIn, searchParams]);

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

        const data2 = res2.data as Profile;
        setProfile(data2);

        setFullName(data2?.full_name ?? "");
        setCountry((data2?.country as Country) ?? "togo");

        const p = String(data2?.phone ?? "");
        const code = phoneCodes[(data2?.country as Country) ?? "togo"];
        setPhone(p.startsWith(code) ? p.replace(code, "").trim() : p);

        setEmail(session.user.email ?? "");
        return;
      }

      const data = res.data as Profile;
      setProfile(data);

      setFullName(data?.full_name ?? "");
      setCountry((data?.country as Country) ?? "togo");

      const p = String(data?.phone ?? "");
      const code = phoneCodes[(data?.country as Country) ?? "togo"];
      setPhone(p.startsWith(code) ? p.replace(code, "").trim() : p);

      setEmail(session.user.email ?? "");
    }

    loadProfile();
  }, [session?.user?.id]);

  const isAdmin = useMemo(() => profile?.role === "admin", [profile?.role]);

  const displayName = useMemo(() => {
    const raw = (profile?.full_name || "").trim();
    if (raw) return raw.split(" ")[0]; // prénom si "Parfait AKAKPO"
    const metaName = String(session?.user?.user_metadata?.full_name || "").trim();
    if (metaName) return metaName.split(" ")[0];
    const mail = String(session?.user?.email || "");
    return mail ? mail.split("@")[0] : "👋";
  }, [profile?.full_name, session?.user?.email, session?.user?.user_metadata]);

  const handleToggleMode = () => {
    setIsLogin((v) => !v);
    setPassword("");
    setConfirmPassword("");
    setPasswordError("");
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");

    if (!email.trim() || !password.trim()) return;

    if (!isLogin) {
      if (!fullName.trim() || !phone.trim()) {
        setPasswordError("Nom complet et téléphone requis.");
        return;
      }
      if (password !== confirmPassword) {
        setPasswordError("Les mots de passe ne correspondent pas");
        return;
      }
      if (password.length < 6) {
        setPasswordError("Le mot de passe doit contenir au moins 6 caractères");
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      } else {
        const phoneFull = `${phoneCodes[country]}${phone.trim()}`;

        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim(), phone: phoneFull, country },
          },
        });
        if (error) throw error;

        alert("Compte créé. Vérifie tes emails si une confirmation est requise.");
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setPasswordError(err?.message ?? "Erreur de connexion/inscription");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setActiveTab("profile");
    setOrders([]);
    setSelectedOrderId(null);
    setOrderItems([]);
  }

  async function saveProfile() {
    if (!session?.user?.id) return;
    setLoading(true);

    try {
      const phoneFull = `${phoneCodes[country]}${phone.trim()}`;

      const { error } = await sb
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          country,
          phone: phoneFull,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", session.user.id);

      if (error) throw error;

      alert("Profil sauvegardé ✅");
    } catch (e: any) {
      console.error("saveProfile error:", e);
      alert("Erreur sauvegarde profil");
    } finally {
      setLoading(false);
    }
  }

  async function loadOrders() {
    if (!session?.user?.id) return;

    setOrdersLoading(true);
    setOrdersError("");
    setSelectedOrderId(null);
    setOrderItems([]);

    try {
      let q = sb
        .from("orders")
        .select(
          "id, created_at, status, payment_method, delivery_mode, delivery_fee, total, full_name, phone, country, region, city, address, user_id"
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (!isAdmin) q = q.eq("user_id", session.user.id);

      const { data, error } = await q;
      if (error) throw error;

      setOrders((data ?? []) as any);
    } catch (e: any) {
      console.error("loadOrders error:", e);
      setOrdersError(e?.message ?? "Erreur chargement commandes");
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }

  async function toggleOrderDetails(orderId: string) {
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
      console.error("loadOrderItems error:", e);
      setOrderItems([]);
    } finally {
      setItemsLoading(false);
    }
  }

  // ✅ RECOMMANDER : ajoute au panier si produit/variante existent et stock > 0
  async function reorderFromOrder(orderId: string) {
    if (!orderId) return;
    setReorderLoading(orderId);

    try {
      const { data: items, error: itemsErr } = await sb
        .from("order_items")
        .select("product_id, variant_id, quantity")
        .eq("order_id", orderId);

      if (itemsErr) throw itemsErr;

      const safeItems: any[] = Array.isArray(items) ? items : [];
      const variantIds = safeItems.map((it) => it.variant_id).filter(Boolean);
      const productIds = safeItems.map((it) => it.product_id).filter(Boolean);

      if (variantIds.length === 0 || productIds.length === 0) {
        alert("Aucun article à recommander.");
        return;
      }

      // Récupère variants
      const { data: variants, error: vErr } = await sb
        .from("product_variant")
        .select("id, product_id, stock_count, is_active, price, color, length, image_url")
        .in("id", variantIds);

      if (vErr) throw vErr;

      // Récupère products
      const { data: prods, error: pErr } = await sb
        .from("product")
        .select("id, name, slug, description, category, is_active, base_price_min, original_price, details, image_url")
        .in("id", productIds);

      if (pErr) throw pErr;

      const prodMap = new Map<string, any>();
      (prods ?? []).forEach((p: any) => prodMap.set(String(p.id), p));

      const varMap = new Map<string, any>();
      (variants ?? []).forEach((v: any) => varMap.set(String(v.id), v));

      let added = 0;
      let skipped = 0;

      for (const it of safeItems) {
        const v = varMap.get(String(it.variant_id));
        const p = prodMap.get(String(it.product_id));

        const qty = Math.max(1, Number(it.quantity ?? 1));

        // conditions dispo
        if (!p || !v) {
          skipped++;
          continue;
        }
        if (p.is_active === false || v.is_active === false) {
          skipped++;
          continue;
        }
        const stock = Number(v.stock_count ?? 0);
        if (stock <= 0) {
          skipped++;
          continue;
        }

        const qtyToAdd = Math.min(qty, stock);

        // ⚠️ addToCart attend (product, variant, qty)
        addToCart(p, v, qtyToAdd);
        added++;
      }

      if (added > 0) {
        alert(`✅ ${added} article(s) ajouté(s) au panier.${skipped ? ` (${skipped} indisponible(s))` : ""}`);
        navigate("/cart");
      } else {
        alert("Aucun article n'est disponible pour recommander cette commande.");
      }
    } catch (e: any) {
      console.error("reorder error:", e);
      alert("Erreur lors de la recommandation.");
    } finally {
      setReorderLoading(null);
    }
  }

  useEffect(() => {
    if (!isLoggedIn) return;
    if (activeTab !== "orders") return;
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isLoggedIn, isAdmin, session?.user?.id]);

  // ===========================
  // UI CONNECTÉ
  // ===========================
  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          {/* ✅ Header pro */}
          <div className="flex flex-col gap-2 mb-6">
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
              Bonjour {displayName} 👋
            </h1>
            <p className="text-sm text-muted-foreground">
              {isAdmin ? "Vous êtes connecté en admin." : "Bienvenue dans votre espace client."}
            </p>
          </div>

          {/* ✅ Raccourcis (niveau pro) */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <button
              type="button"
              onClick={() => navigate("/shop")}
              className="p-5 bg-card rounded-xl border border-border hover:bg-muted/40 transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Continuer mes achats</p>
                    <p className="text-xs text-muted-foreground">Retour à la boutique</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate("/cart")}
              className="p-5 bg-card rounded-xl border border-border hover:bg-muted/40 transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Voir mon panier</p>
                    <p className="text-xs text-muted-foreground">Finaliser ma commande</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("orders");
                navigate("/account?tab=orders");
              }}
              className="p-5 bg-card rounded-xl border border-border hover:bg-muted/40 transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Mes commandes</p>
                    <p className="text-xs text-muted-foreground">Suivre / recommander</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </button>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {/* Sidebar */}
            <aside className="space-y-2">
              {(
                [
                  { key: "profile", icon: User, label: "Profil" },
                  { key: "orders", icon: Package, label: isAdmin ? "Commandes (Admin)" : "Mes Commandes" },
                  ...(isAdmin
                    ? [
                        { key: "admin_products", icon: Package, label: "Produits (Admin)" },
                        { key: "admin_catalog", icon: Package, label: "Catalogue (Admin)" },
                      ]
                    : []),
                  { key: "favorites", icon: Heart, label: "Favoris" },
                ] as { key: TabKey; icon: any; label: string }[]
              ).map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    setActiveTab(item.key);
                    navigate(item.key === "orders" ? "/account?tab=orders" : "/account");
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    activeTab === item.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                  type="button"
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </button>
              ))}

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                type="button"
              >
                <LogOut className="h-5 w-5" />
                Déconnexion
              </button>
            </aside>

            {/* Content */}
            <div className="md:col-span-3 space-y-6">
              {activeTab === "profile" && (
                <div className="p-6 bg-card rounded-xl shadow-card">
                  <h2 className="font-serif text-xl font-semibold text-foreground mb-6">
                    Informations du profil
                  </h2>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor={ids.profileFullName}>Nom complet</Label>
                      <Input
                        id={ids.profileFullName}
                        name="profile_full_name"
                        autoComplete="name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor={ids.profileEmail}>Email</Label>
                      <Input
                        id={ids.profileEmail}
                        name="profile_email"
                        autoComplete="email"
                        inputMode="email"
                        value={email}
                        disabled
                        type="email"
                      />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor={ids.profileCountry}>Pays</Label>
                      <select
                        id={ids.profileCountry}
                        name="profile_country"
                        autoComplete="country-name"
                        value={country}
                        onChange={(e) => setCountry(e.target.value as Country)}
                        className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="togo">Togo</option>
                        <option value="benin">Bénin</option>
                      </select>
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor={ids.profilePhone}>Téléphone</Label>
                      <div className="flex gap-2">
                        <span className="px-2 py-2 bg-muted border rounded text-sm flex items-center min-w-[56px]">
                          {phoneCodes[country]}
                        </span>
                        <Input
                          id={ids.profilePhone}
                          name="profile_phone"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel-national"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <Button className="mt-6" onClick={saveProfile} disabled={loading}>
                    {loading ? "Sauvegarde..." : "Sauvegarder"}
                  </Button>
                </div>
              )}

              {activeTab === "admin_products" && isAdmin && <AdminProductsPanel />}
              {activeTab === "admin_catalog" && isAdmin && <AdminCatalog />}

              {activeTab === "orders" && (
                <div className="p-6 bg-card rounded-xl shadow-card">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="font-serif text-xl font-semibold text-foreground">
                      {isAdmin ? "Toutes les commandes" : "Mes commandes"}
                    </h2>

                    <Button variant="outline" onClick={loadOrders} disabled={ordersLoading}>
                      {ordersLoading ? "Chargement..." : "Rafraîchir"}
                    </Button>
                  </div>

                  {ordersError && <p className="mt-4 text-sm text-destructive">{ordersError}</p>}

                  {!ordersLoading && orders.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucune commande pour le moment</p>
                      <Link to="/shop">
                        <Button variant="outline" className="mt-4">
                          Découvrir nos produits
                        </Button>
                      </Link>
                    </div>
                  )}

                  {orders.length > 0 && (
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
                              {isAdmin && (
                                <p className="text-sm text-muted-foreground">
                                  Client: {o.full_name ?? "-"} • {o.phone ?? "-"}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center justify-between md:justify-end gap-3">
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">Total</p>
                                <p className="text-lg font-bold text-foreground">{formatMoneyFCFA(o.total)}</p>
                              </div>

                              <div className="flex gap-2">
                                {!isAdmin && (
                                  <Button
                                    variant="hero"
                                    onClick={() => reorderFromOrder(o.id)}
                                    disabled={reorderLoading === o.id}
                                  >
                                    {reorderLoading === o.id ? "..." : "Recommander"}
                                  </Button>
                                )}

                                <Button variant="outline" onClick={() => toggleOrderDetails(o.id)}>
                                  {selectedOrderId === o.id ? "Fermer" : "Voir détails"}
                                </Button>
                              </div>
                            </div>
                          </div>

                          {selectedOrderId === o.id && (
                            <div className="mt-4 border-t border-border pt-4">
                              <p className="text-sm text-muted-foreground mb-3">
                                Livraison: {o.country ?? "-"} {o.region ? `• ${o.region}` : ""}{" "}
                                {o.city ? `• ${o.city}` : ""} {o.address ? `• ${o.address}` : ""}
                              </p>

                              {itemsLoading ? (
                                <p className="text-sm text-muted-foreground">Chargement des items...</p>
                              ) : (
                                <div className="space-y-2">
                                  {orderItems.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Aucun item trouvé.</p>
                                  ) : (
                                    orderItems.map((it, idx) => (
                                      <div
                                        key={`${it.order_id}-${idx}`}
                                        className="flex items-center justify-between text-sm border border-border rounded-lg px-3 py-2"
                                      >
                                        <div className="text-muted-foreground">
                                          Produit #{it.product_id ?? "?"}
                                          {it.color || it.length ? (
                                            <span>
                                              {" "}
                                              ({it.color ?? "?"}
                                              {it.length != null ? ` - ${it.length}"` : ""})
                                            </span>
                                          ) : null}
                                          {" • "}x{Number(it.quantity ?? 1)}
                                        </div>

                                        {!isAdmin && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => reorderFromOrder(o.id)}
                                            disabled={reorderLoading === o.id}
                                          >
                                            {reorderLoading === o.id ? "..." : "Recommander"}
                                          </Button>
                                        )}
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
              )}

              {activeTab === "favorites" && (
                <div className="p-6 bg-card rounded-xl shadow-card">
                  <h2 className="font-serif text-xl font-semibold text-foreground mb-2">Favoris</h2>
                  <p className="text-sm text-muted-foreground">
                    On branchera les favoris plus tard (quand on aura la table favorites).
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===========================
  // UI NON CONNECTÉ
  // ===========================
  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-16">
      <div className="w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-6">
            <span className="font-serif text-3xl font-bold text-foreground">
              Belléa<span className="text-primary">Wigs</span>
            </span>
          </Link>
          <h1 className="font-serif text-2xl font-bold text-foreground">
            {isLogin ? "Connexion" : "Créer un compte"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isLogin
              ? "Connectez-vous pour accéder à votre compte"
              : "Rejoignez-nous pour une expérience shopping personnalisée"}
          </p>
        </div>

        <div className="p-6 bg-card rounded-xl shadow-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor={ids.authFullName}>Nom complet</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id={ids.authFullName}
                    name="full_name"
                    autoComplete="name"
                    placeholder="Votre nom"
                    className="pl-10"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>
            )}

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor={ids.authCountry}>Pays</Label>
                <select
                  id={ids.authCountry}
                  name="country"
                  autoComplete="country-name"
                  value={country}
                  onChange={(e) => setCountry(e.target.value as Country)}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="togo">Togo</option>
                  <option value="benin">Bénin</option>
                </select>
              </div>
            )}

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor={ids.authPhone}>Téléphone</Label>
                <div className="flex gap-2">
                  <span className="px-2 py-2 bg-muted border rounded text-sm flex items-center min-w-[56px]">
                    {phoneCodes[country]}
                  </span>
                  <Input
                    id={ids.authPhone}
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    placeholder="90 00 00 00"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor={ids.authEmail}>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id={ids.authEmail}
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="votre@email.com"
                  className="pl-10"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={ids.authPassword}>Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id={ids.authPassword}
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor={ids.authConfirmPassword}>Confirmer le mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id={ids.authConfirmPassword}
                    name="confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className={cn("pl-10 pr-10", passwordError && "border-destructive focus-visible:ring-destructive")}
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setPasswordError("");
                    }}
                  />
                  <button
                    type="button"
                    aria-label={showConfirmPassword ? "Masquer la confirmation" : "Afficher la confirmation"}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}

            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
              {loading ? "Veuillez patienter..." : isLogin ? "Se connecter" : "Créer mon compte"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">
              {isLogin ? "Pas encore de compte?" : "Déjà un compte?"}
            </span>{" "}
            <button type="button" onClick={handleToggleMode} className="text-primary font-medium hover:underline">
              {isLogin ? "S'inscrire" : "Se connecter"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
