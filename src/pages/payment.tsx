import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function Payment() {
  const navigate = useNavigate();
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
      if (!payload) {
        navigate("/cart");
        return;
      }

      const deliveryFee =
        payload.deliveryMode === "pickup" ? 0 : payload.totalPrice >= 50000 ? 0 : 2000;
      const grandTotal = (payload.totalPrice ?? 0) + deliveryFee;

      const formData = payload.formData;

      // IMPORTANT: mets ton vrai domaine prod en return_url (pas localhost en prod)
      const return_url = `${window.location.origin}/payment/return`;

      const first_name = String(formData.fullName ?? "").trim().split(" ")[0] || "Client";
      const last_name = String(formData.fullName ?? "").trim().split(" ").slice(1).join(" ") || " ";

      const { data, error } = await supabase.functions.invoke("moneroo_init", {
        body: {
          amount: Number(grandTotal),          // Moneroo attend integer :contentReference[oaicite:4]{index=4}
          currency: "XOF",                     // FCFA (Togo/Bénin => XOF)
          description: "Commande BelléaWigs",
          return_url,
          customer: {
            email: formData.email?.trim() || "client@belleawigs.com",
            first_name,
            last_name,
            phone: formData.phone ? String(formData.phone) : undefined,
          },
          metadata: {
            source: "belleawigs",
          },
          // methods: optionnel (sinon toutes les méthodes dispo) :contentReference[oaicite:5]{index=5}
        },
      });

      if (error) {
        console.error("moneroo_initialize error:", error);
        alert("Erreur paiement. Réessaie.");
        navigate("/checkout");
        return;
      }

      const checkoutUrl = data?.data?.checkout_url;
      if (!checkoutUrl) {
        console.error("No checkout_url:", data);
        alert("Lien de paiement indisponible.");
        navigate("/checkout");
        return;
      }

      // redirect vers la page Moneroo
      window.location.href = checkoutUrl;
    };

    run().finally(() => setLoading(false));
  }, [payload, navigate]);

  if (!payload) return null;

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold">Redirection vers le paiement...</h1>
      <p className="mt-2">Veuillez patienter.</p>
      {loading && <p className="mt-4">Chargement...</p>}
    </div>
  );
}
