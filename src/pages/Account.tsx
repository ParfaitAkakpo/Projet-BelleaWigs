// src/pages/Account.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Package,
  Heart,
  LogOut,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
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

export default function Account() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // auth state
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const isLoggedIn = !!session?.user;

  // tabs
  const [activeTab, setActiveTab] = useState<"profile" | "orders" | "favorites">("profile");

  // orders state
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string>("");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItemRow[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  // form
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState<Country>("togo");
  const [phone, setPhone] = useState(""); // sans indicatif
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  // --- session + listener ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // --- profil ---
  useEffect(() => {
   async function loadProfile() {
  if (!session?.user?.id) {
    setProfile(null);
    return;
  }

  // 1) essayer de lire
  const res = await sb
    .from("profiles")
    .select("id, full_name, phone, country, role")
    .eq("id", session.user.id)
    .maybeSingle();

  // 2) si pas de profil => on le crée
  if (!res.data) {
    await sb.from("profiles").upsert({
      id: session.user.id,
      full_name: "",
      phone: "",
      country: "togo",
      role: "customer",
      updated_at: new Date().toISOString(),
    });

    // relire
    const res2 = await sb
      .from("profiles")
      .select("id, full_name, phone, country, role")
      .eq("id", session.user.id)
      .single();

    setProfile(res2.data as any);

    setFullName(res2.data?.full_name ?? "");
    setCountry((res2.data?.country as Country) ?? "togo");

    const p = String(res2.data?.phone ?? "");
    const code = phoneCodes[(res2.data?.country as Country) ?? "togo"];
    setPhone(p.startsWith(code) ? p.replace(code, "").trim() : p);
    setEmail(session.user.email ?? "");
    return;
  }

  // 3) profil trouvé
  const data = res.data;

  setProfile(data as any);
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
            data: {
              full_name: fullName.trim(),
              phone: phoneFull,
              country,
            },
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

  // ===========================
  // LOAD ORDERS
  // ===========================
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

      // client: seulement ses commandes
      if (!isAdmin) {
        q = q.eq("user_id", session.user.id);
      }

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

  // auto-load orders quand on ouvre l’onglet
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
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-8">
            {isAdmin ? "Espace Admin" : "Mon Compte"}
          </h1>

          <div className="grid md:grid-cols-4 gap-8">
            {/* Sidebar */}
            <aside className="space-y-2">
              {[
                { key: "profile", icon: User, label: "Profil" },
                { key: "orders", icon: Package, label: isAdmin ? "Commandes (Admin)" : "Mes Commandes" },
                { key: "favorites", icon: Heart, label: "Favoris" },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key as any)}
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
              {/* TAB: PROFILE */}
              {activeTab === "profile" && (
                <div className="p-6 bg-card rounded-xl shadow-card">
                  <h2 className="font-serif text-xl font-semibold text-foreground mb-6">
                    Informations du profil
                  </h2>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Nom complet</Label>
                      <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label>Email</Label>
                      <Input value={email} disabled type="email" />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label>Pays</Label>
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value as Country)}
                        className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="togo">Togo</option>
                        <option value="benin">Bénin</option>
                      </select>
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label>Téléphone</Label>
                      <div className="flex gap-2">
                        <span className="px-2 py-2 bg-muted border rounded text-sm flex items-center min-w-[56px]">
                          {phoneCodes[country]}
                        </span>
                        <Input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" />
                      </div>
                    </div>
                  </div>

                  <Button className="mt-6" onClick={saveProfile} disabled={loading}>
                    {loading ? "Sauvegarde..." : "Sauvegarder"}
                  </Button>
                </div>
              )}

              {/* TAB: ORDERS */}
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

                  {ordersError && (
                    <p className="mt-4 text-sm text-destructive">
                      {ordersError}
                    </p>
                  )}

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
                                {formatDate(o.created_at)} •{" "}
                                {o.payment_method ?? "-"} •{" "}
                                {o.delivery_mode ?? "-"}
                                {o.status ? ` • ${o.status}` : ""}
                              </p>

                              {isAdmin && (
                                <p className="text-sm text-muted-foreground">
                                  Client: {o.full_name ?? "-"} • {o.phone ?? "-"}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center justify-between md:justify-end gap-4">
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">Total</p>
                                <p className="text-lg font-bold text-foreground">
                                  {formatMoneyFCFA(o.total)}
                                </p>
                              </div>

                              <Button
                                variant="outline"
                                onClick={() => toggleOrderDetails(o.id)}
                              >
                                {selectedOrderId === o.id ? "Fermer" : "Voir détails"}
                              </Button>
                            </div>
                          </div>

                          {/* DETAILS */}
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
                                        className="flex items-center justify-between text-sm"
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
                                        <div className="font-medium text-foreground">
                                          {formatMoneyFCFA(Number(it.unit_price ?? 0))}
                                        </div>
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

              {/* TAB: FAVORITES */}
              {activeTab === "favorites" && (
                <div className="p-6 bg-card rounded-xl shadow-card">
                  <h2 className="font-serif text-xl font-semibold text-foreground mb-2">
                    Favoris
                  </h2>
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
  // UI NON CONNECTÉ (LOGIN/REGISTER)
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
                <Label htmlFor="name">Nom complet</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
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
                <Label>Pays</Label>
                <select
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
                <Label htmlFor="phone">Téléphone</Label>
                <div className="flex gap-2">
                  <span className="px-2 py-2 bg-muted border rounded text-sm flex items-center min-w-[56px]">
                    {phoneCodes[country]}
                  </span>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="90 00 00 00"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  className="pl-10"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={cn(
                      "pl-10 pr-10",
                      passwordError && "border-destructive focus-visible:ring-destructive"
                    )}
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setPasswordError("");
                    }}
                  />
                  <button
                    type="button"
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
            <button
              type="button"
              onClick={handleToggleMode}
              className="text-primary font-medium hover:underline"
            >
              {isLogin ? "S'inscrire" : "Se connecter"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
