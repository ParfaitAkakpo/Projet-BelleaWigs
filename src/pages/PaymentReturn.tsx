import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";

const phoneCodes: Record<string, string> = { togo: "+228", benin: "+229" };

function normalizePhone(country: string, rawPhone: string) {
  const code = phoneCodes[country] ?? "";
  const digits = String(rawPhone ?? "").replace(/[^\d]/g, "").trim();
  const codeDigits = code.replace("+", "");
  const withoutCode = digits.startsWith(codeDigits) ? digits.slice(codeDigits.length) : digits;
  return `${code}${withoutCode}`;
}

export default function PaymentReturn() {
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(true);

  const payload = useMemo(() => {
    const raw = sessionStorage.getItem("checkout_payload_v1");
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      const monerooPaymentId = params.get("monerooPaymentId");
      const monerooPaymentStatus = params.get("monerooPaymentStatus"); // ex: success/failed (à vérifier)

      if (!payload || !monerooPaymentId) {
        navigate("/cart");
        return;
      }

      // 1) Vérifier côté serveur (obligatoire)
      const { data: verifyData, error: verifyErr } = await supabase.functions.invoke("moneroo_verify", {
        body: { paymentId: monerooPaymentId },
      });

      if (verifyErr) {
        console.error("verifyErr", verifyErr);
        alert("Paiement non vérifié. Merci de réessayer.");
        navigate("/cart");
        return;
      }

      // Selon la réponse Moneroo, adapte le test ci-dessous.
      // Ici on check: success + status "success" ou "paid"
      const ok =
        verifyData?.success === true &&
        ["success", "paid", "completed"].includes(String(verifyData?.data?.status ?? "").toLowerCase());

      if (!ok) {
        console.warn("Moneroo status:", verifyData, "redirectStatus:", monerooPaymentStatus);
        alert("Paiement non validé.");
        navigate("/cart");
        return;
      }

      // 2) Créer order + items comme tu fais déjà (mais maintenant c’est vérifié)
      const deliveryFee =
        payload.deliveryMode === "pickup" ? 0 : payload.totalPrice >= 50000 ? 0 : 2000;
      const grandTotal = (payload.totalPrice ?? 0) + deliveryFee;

      // user_id si dispo
      let userId: string | null = payload?.user_id ?? null;
      if (!userId) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          userId = user?.id ?? null;
        } catch {
          userId = null;
        }
      }

      const { formData, paymentMethod, deliveryMode } = payload;
      const phoneWithCode = normalizePhone(formData.country, formData.phone);

      // 2.1 order
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          user_id: userId,
          full_name: String(formData.fullName ?? "").trim(),
          phone: phoneWithCode,
          email: formData.email?.trim() || null,
          country: formData.country,

          region: deliveryMode === "delivery" ? formData.region : null,
          city: deliveryMode === "delivery" ? formData.city?.trim() : null,
          address: deliveryMode === "delivery" ? formData.address?.trim() : null,

          notes: formData.notes?.trim() || null,
          payment_method: paymentMethod,
          delivery_mode: deliveryMode,
          delivery_fee: deliveryFee,
          total: grandTotal,

          // utile à stocker:
          payment_provider: "moneroo",
          payment_id: monerooPaymentId,
          payment_status: "paid",
          status: "paid",
        } as any)
        .select()
        .single();

      if (orderErr || !order) {
        console.error("orderErr", orderErr);
        alert("Erreur création commande après paiement.");
        navigate("/cart");
        return;
      }

      // 2.2 items
      const payloadItems = (payload.items || []).map((it: any) => ({ order_id: order.id, ...it }));
      const { error: itemsErr } = await supabase.from("order_items").insert(payloadItems as any);
      if (itemsErr) {
        console.error("itemsErr", itemsErr);
        alert("Erreur enregistrement produits.");
        navigate("/cart");
        return;
      }

      // 2.3 WhatsApp (non bloquant)
      try {
        await supabase.functions.invoke("notify_whatsapp", {
          body: { record: { id: order.id, full_name: order.full_name, phone: order.phone, total: order.total } },
        });
      } catch {}

      // 3) clean + redirect
      sessionStorage.removeItem("checkout_payload_v1");
      navigate("/order-confirmation", { state: { orderId: order.id } });
      setTimeout(() => clearCart(), 0);
      setLoading(false);
    };

    run();
  }, [params, payload, navigate, clearCart]);

  if (loading) return <div className="container py-10">Validation du paiement...</div>;
  return null;
}
