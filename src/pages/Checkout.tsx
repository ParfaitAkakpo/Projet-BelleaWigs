import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Smartphone, Banknote, Truck, Lock, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { useCart } from "@/contexts/CartContext";
import { regions } from "@/database/static";
import { formatPrice } from "@/lib/formatPrice";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type PaymentMethod = "mobile" | "card" | "cash";

const phoneCodes: Record<string, string> = {
  togo: "+228",
  benin: "+229",
};

const Checkout = () => {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart, deliveryMode } = useCart();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mobile");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const deliveryFee = deliveryMode === "pickup" ? 0 : totalPrice >= 50000 ? 0 : 2000;
  const grandTotal = totalPrice + deliveryFee;

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    country: "togo" as "togo" | "benin",
    region: "",
    city: "",
    address: "",
    notes: "",
  });

  // ✅ rediriger si panier vide (mais PAS pendant soumission)
  useEffect(() => {
    if (!items.length && !isSubmitting) navigate("/cart");
  }, [items.length, isSubmitting, navigate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      if (name === "country") return { ...prev, country: value as "togo" | "benin", region: "" };
      return { ...prev, [name]: value };
    });
  };

  const orderItems = useMemo(() => {
    return items.map((item) => ({
      product_id: item.product.id,
      variant_id: item.variant.id,
      color: item.variant.color,
      length: item.variant.length,
      quantity: item.quantity,
      unit_price: item.variant.price,
    }));
  }, [items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!items.length) return;

    // ✅ validations rapides
    if (!formData.fullName.trim() || !formData.phone.trim()) {
      alert("Nom complet et téléphone sont obligatoires.");
      return;
    }

    // ✅ si livraison: adresse obligatoire
    if (deliveryMode === "delivery") {
      if (!formData.region || !formData.city.trim() || !formData.address.trim()) {
        alert("Veuillez remplir la région, la ville et l’adresse pour la livraison.");
        return;
      }
    }

    // ✅ sécurité variantes
    const invalid = items.some((i) => !i.variant?.id);
    if (invalid) {
      alert("Erreur: une variante est manquante. Revenez au panier et réessayez.");
      return;
    }

    setIsSubmitting(true);

    // ✅ récupérer user connecté (peut être null si achat invité)
    let userId: string | null = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    } catch {
      userId = null;
    }

    // ✅ payload pour mobile/card (on stocke aussi user_id)
    const checkoutPayload = {
      user_id: userId,
      formData,
      paymentMethod,
      deliveryMode,
      items: orderItems,
      totalPrice,
    };

    // =========================
    // 1) CASH => on enregistre direct
    // =========================
    if (paymentMethod === "cash") {
      try {
        // 1) créer order
        const { data: order, error: orderErr } = await supabase
          .from("orders")
          .insert({
            user_id: userId, // ✅ NOUVEAU (lié au compte si connecté)
            full_name: formData.fullName.trim(),
            phone: phoneCodes[formData.country] + formData.phone.trim(),
            email: formData.email.trim() || null,
            country: formData.country,

            region: deliveryMode === "delivery" ? formData.region : null,
            city: deliveryMode === "delivery" ? formData.city.trim() : null,
            address: deliveryMode === "delivery" ? formData.address.trim() : null,

            notes: formData.notes.trim() || null,
            payment_method: paymentMethod,
            total: grandTotal,

            // ⚠️ seulement si tu as créé ces colonnes dans orders
            delivery_mode: deliveryMode,
            delivery_fee: deliveryFee,
          } as any)
          .select()
          .single();

        if (orderErr || !order) throw new Error(orderErr?.message || "Commande non créée");

        // 2) créer order_items
        const payload = orderItems.map((it) => ({ order_id: order.id, ...it }));
        const { error: itemsErr } = await supabase.from("order_items").insert(payload as any);
        if (itemsErr) throw new Error(itemsErr.message);

        // 3) notif WhatsApp (non bloquant)
        try {
          const { data, error } = await supabase.functions.invoke("notify_whatsapp", {
            body: {
              record: {
                id: order.id,
                full_name: formData.fullName.trim(),
                phone: phoneCodes[formData.country] + formData.phone.trim(),
                total: grandTotal,
              },
            },
          });
          console.log("notify_whatsapp data:", data);
          console.log("notify_whatsapp error:", error);
          if (error) console.error("invoke notify_whatsapp error:", error);
        } catch (e) {
          console.error("notify_whatsapp error:", e);
        }

        // ✅ IMPORTANT: navigate d'abord, puis clearCart après
        navigate("/order-confirmation", { state: { orderId: order.id } });
        setTimeout(() => clearCart(), 0);

        return; // stop ici
      } catch (err) {
        console.error("Checkout cash error:", err);
        setIsSubmitting(false);
        alert("Erreur lors de la création de la commande. Merci de réessayer.");
        return;
      }
    }

    // =========================
    // 2) MOBILE/CARD => paiement d'abord
    // =========================
    try {
      sessionStorage.setItem("checkout_payload_v1", JSON.stringify(checkoutPayload));
      setIsSubmitting(false);
      navigate("/payment");
    } catch (err) {
      console.error("Checkout save payload error:", err);
      setIsSubmitting(false);
      alert("Erreur. Merci de réessayer.");
    }
  };

  if (!items.length) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <button
          onClick={() => navigate("/cart")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          type="button"
          disabled={isSubmitting}
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au panier
        </button>

        <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-8">
          Finaliser la commande
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* LEFT */}
            <div className="lg:col-span-2 space-y-8">
              {/* Contact */}
              <div className="p-6 bg-card rounded-xl shadow-card space-y-4">
                <h2 className="font-serif text-xl font-semibold text-foreground">
                  Informations de contact
                </h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nom complet *</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      placeholder="Votre nom complet"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone *</Label>
                    <div className="flex gap-2">
                      <span className="px-2 py-2 bg-muted border rounded text-sm flex items-center min-w-[56px]">
                        {phoneCodes[formData.country]}
                      </span>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        placeholder="90 00 00 00"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="email">Email (optionnel)</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="votre@email.com"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="country">Pays</Label>
                    <select
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="togo">Togo</option>
                      <option value="benin">Bénin</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Address seulement si livraison */}
              {deliveryMode === "delivery" && (
                <div className="p-6 bg-card rounded-xl shadow-card space-y-4">
                  <h2 className="font-serif text-xl font-semibold text-foreground flex items-center gap-2">
                    <Truck className="h-5 w-5 text-primary" />
                    Adresse de livraison
                  </h2>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="region">Région *</Label>
                      <select
                        id="region"
                        name="region"
                        value={formData.region}
                        onChange={handleChange}
                        required
                        className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">Sélectionnez une région</option>
                        {(formData.country === "togo" ? regions.togo : regions.benin).map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">Ville / Quartier *</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        placeholder="Votre ville ou quartier"
                      />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="address">Adresse complète *</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        required
                        placeholder="Rue, numéro, repère..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Payment + Notes */}
              <div className="p-6 bg-card rounded-xl shadow-card space-y-4">
                <h2 className="font-serif text-xl font-semibold text-foreground flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Mode de paiement
                </h2>

                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { id: "mobile", label: "Mobile Money", desc: "Flooz, Mixx", icon: Smartphone },
                    { id: "card", label: "Carte Bancaire", desc: "Visa, MasterCard", icon: CreditCard },
                    { id: "cash", label: "À la Livraison", desc: "Paiement en espèces", icon: Banknote },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                      className={cn(
                        "p-4 rounded-xl border-2 text-left transition-all",
                        paymentMethod === m.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50",
                      )}
                    >
                      <m.icon
                        className={cn(
                          "h-6 w-6 mb-2",
                          paymentMethod === m.id ? "text-primary" : "text-muted-foreground",
                        )}
                      />
                      <p className="font-medium text-foreground">{m.label}</p>
                      <p className="text-xs text-muted-foreground">{m.desc}</p>
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optionnel)</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Instructions spéciales..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 p-6 bg-card rounded-xl shadow-card space-y-4">
                <h3 className="font-serif text-xl font-semibold text-foreground">Votre commande</h3>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sous-total</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {deliveryMode === "pickup" ? "Retrait" : "Livraison"}
                    </span>
                    <span>{deliveryFee === 0 ? "Gratuite" : formatPrice(deliveryFee)}</span>
                  </div>

                  <div className="h-px bg-border" />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-foreground">{formatPrice(grandTotal)}</span>
                  </div>
                </div>

                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Traitement..." : `Confirmer • ${formatPrice(grandTotal)}`}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  En confirmant, vous acceptez nos conditions générales de vente.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
