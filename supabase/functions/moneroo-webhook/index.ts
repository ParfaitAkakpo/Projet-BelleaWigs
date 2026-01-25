// supabase/functions/moneroo-webhook/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

async function hmacSha256Hex(secret: string, payload: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sigBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  const WEBHOOK_SIGNING_SECRET = Deno.env.get("MONEROO_WEBHOOK_SECRET");
  const MONEROO_SECRET_KEY = Deno.env.get("MONEROO_SECRET_KEY");

  if (!WEBHOOK_SIGNING_SECRET) return new Response("Missing MONEROO_WEBHOOK_SECRET", { status: 500 });
  if (!MONEROO_SECRET_KEY) return new Response("Missing MONEROO_SECRET_KEY", { status: 500 });

  // ⚠️ signature header: X-Moneroo-Signature (HMAC-SHA256) :contentReference[oaicite:5]{index=5}
  const headerSig = req.headers.get("X-Moneroo-Signature");
  const rawBody = await req.text();

  const computed = await hmacSha256Hex(WEBHOOK_SIGNING_SECRET, rawBody);

  if (!headerSig || headerSig !== computed) {
    return new Response("Invalid signature", { status: 403 });
  }

  const payload = JSON.parse(rawBody);

  // Exemple: payload.event === "payment.success" :contentReference[oaicite:6]{index=6}
  const event = payload?.event;
  const paymentId = payload?.data?.id ?? payload?.data?.payment_id ?? payload?.payment_id;
  const orderId = payload?.data?.metadata?.order_id ?? payload?.metadata?.order_id;

  // ✅ Best practice: toujours re-vérifier avec l’API Moneroo :contentReference[oaicite:7]{index=7}
  // Endpoint "Transaction verification" :contentReference[oaicite:8]{index=8}
  if (event === "payment.success" && paymentId && orderId) {
    const verifyResp = await fetch(`https://api.moneroo.io/v1/payments/${paymentId}/verify`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${MONEROO_SECRET_KEY}`,
      },
    });

    const verifyData = await verifyResp.json();
    if (!verifyResp.ok) {
      // On répond 200 quand même pour éviter retries inutiles, mais tu logs
      console.error("Verify failed", verifyData);
      return new Response("OK", { status: 200 });
    }

    // Ici:
    // - vérifier verifyData.data.status === "success" (ou équivalent)
    // - puis mettre à jour ta table orders (paid = true, status = 'paid', etc)
    // - option : vérifier le montant, la devise, etc.
  }

  return new Response("OK", { status: 200 });
});
