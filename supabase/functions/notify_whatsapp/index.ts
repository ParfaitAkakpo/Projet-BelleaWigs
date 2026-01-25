/// <reference lib="deno.ns" />

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  // ✅ IMPORTANT: on ajoute x-client-info (tu as déjà eu l’erreur CORS)
  "Access-Control-Allow-Headers": "content-type, authorization, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function corsEmpty(status = 204) {
  return new Response(null, { status, headers: corsHeaders });
}

function json(status: number, body: any) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function formatMoneyFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.max(0, Math.round(n))) + " FCFA";
}

// ✅ Twilio WhatsApp via fetch (compatible Deno)
async function sendWhatsAppViaTwilio(opts: {
  accountSid: string;
  authToken: string;
  from: string; // "whatsapp:+14155238886"
  to: string;   // "whatsapp:+22890000000"
  body: string;
}) {
  const { accountSid, authToken, from, to, body } = opts;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const form = new URLSearchParams();
  form.set("From", from);
  form.set("To", to);
  form.set("Body", body);

  const auth = btoa(`${accountSid}:${authToken}`);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Twilio error ${res.status}: ${text}`);
  return text;
}

function toWhatsAppNumber(raw: string | undefined | null) {
  const phone = String(raw ?? "").trim();
  if (!phone) return "";
  // Si déjà "whatsapp:+xxx" -> ok
  if (phone.toLowerCase().startsWith("whatsapp:")) return phone;
  // Si juste "+228..." -> on ajoute "whatsapp:"
  if (phone.startsWith("+")) return `whatsapp:${phone}`;
  // Sinon on tente quand même
  return `whatsapp:+${phone.replace(/^\+/, "")}`;
}

serve(async (req) => {
  // ✅ OPTIONS doit TOUJOURS répondre 204 + CORS
  if (req.method === "OPTIONS") return corsEmpty(204);
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const payload = await req.json().catch(() => null);
    const record = payload?.record;

    if (!record?.id) return json(400, { error: "Missing record.id" });

    // ✅ dynamic import => évite crash OPTIONS
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const from = Deno.env.get("TWILIO_WHATSAPP_FROM") ?? "whatsapp:+14155238886";

    // ✅ ton numéro (admin) en format whatsapp:+...
    const adminTo = Deno.env.get("ADMIN_WHATSAPP_TO");

    if (!supabaseUrl || !serviceRoleKey) return json(500, { error: "Supabase env vars missing" });
    if (!accountSid || !authToken) return json(500, { error: "Twilio env vars missing" });
    if (!adminTo) return json(500, { error: "ADMIN_WHATSAPP_TO missing" });

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // ✅ charger les items pour le message admin
    const { data: items, error: itemsErr } = await supabase
      .from("order_items")
      .select("product_id, quantity, unit_price, color, length")
      .eq("order_id", record.id);

    if (itemsErr) return json(500, { error: "Failed to load order items", details: itemsErr });

    const lines = (items ?? []).map((it: any) => {
      const qty = Math.max(1, Number(it.quantity || 1));
      const unit = Number(it.unit_price || 0);
      const variant =
        (it.color || it.length)
          ? ` (${it.color ?? "?"}${it.length != null ? ` - ${it.length}"` : ""})`
          : "";
      const priceText = unit > 0 ? ` — ${formatMoneyFCFA(unit)} x${qty}` : ` x${qty}`;
      return `• Produit #${it.product_id ?? "?"}${variant}${priceText}`;
    });

    const total = typeof record.total === "number" ? record.total : 0;

    // -------------------------
    // 1) MESSAGE ADMIN (détaillé)
    // -------------------------
    const adminMsg =
      `🛒 Nouvelle commande #${record.id}\n` +
      `Nom: ${record.full_name ?? "-"}\n` +
      `Téléphone client: ${record.phone ?? "-"}\n` +
      `Total: ${formatMoneyFCFA(total)}\n\n` +
      `📦 Détails:\n${lines.length ? lines.join("\n") : "— Aucun item trouvé"}`;

    // -------------------------
    // 2) MESSAGE CLIENT (simple + rassurant)
    // -------------------------
    const clientTo = toWhatsAppNumber(record.phone);
    const clientName = String(record.full_name ?? "").trim() || "Bonjour";

    const clientMsg =
      `Bonjour ${clientName} 👋\n\n` +
      `Votre commande *#${record.id}* a bien été reçue ✅\n` +
      `💰 Total : *${formatMoneyFCFA(total)}*\n\n` +
      `Nous vous contacterons très bientôt.\n` +
      `Merci pour votre confiance 💖\n\n` +
      `— BelléaWigs`;

    // ✅ envoi admin (obligatoire)
    const adminRes = await sendWhatsAppViaTwilio({
      accountSid,
      authToken,
      from,
      to: adminTo,
      body: adminMsg,
    });

    // ✅ envoi client (si numéro présent) — non bloquant
    let clientRes: string | null = null;
    let clientError: string | null = null;

    if (clientTo) {
      try {
        clientRes = await sendWhatsAppViaTwilio({
          accountSid,
          authToken,
          from,
          to: clientTo,
          body: clientMsg,
        });
      } catch (e) {
        clientError = String((e as any)?.message ?? e);
        console.error("Client WhatsApp send failed:", clientError);
      }
    }

    return json(200, {
      ok: true,
      admin_sent: true,
      client_sent: Boolean(clientRes),
      client_error: clientError,
    });
  } catch (e) {
    console.error("notify_whatsapp fatal:", e);
    return json(500, { error: "Internal error", details: String((e as any)?.message ?? e) });
  }
});
