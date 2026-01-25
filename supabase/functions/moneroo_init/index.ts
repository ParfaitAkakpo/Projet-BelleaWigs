// supabase/functions/moneroo-init/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type InitBody = {
  amount: number;
  currency: string;
  email?: string;
  phone?: string;
  full_name?: string;
  order_id: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const MONEROO_SECRET_KEY = Deno.env.get("MONEROO_SECRET_KEY");
    const FRONTEND_RETURN_URL = Deno.env.get("FRONTEND_RETURN_URL");
    const WEBHOOK_URL = Deno.env.get("MONEROO_WEBHOOK_URL");

    if (!MONEROO_SECRET_KEY) return new Response("Missing MONEROO_SECRET_KEY", { status: 500, headers: corsHeaders });
    if (!FRONTEND_RETURN_URL) return new Response("Missing FRONTEND_RETURN_URL", { status: 500, headers: corsHeaders });
    if (!WEBHOOK_URL) return new Response("Missing MONEROO_WEBHOOK_URL", { status: 500, headers: corsHeaders });

    const body = (await req.json()) as InitBody;

    if (!body?.amount || body.amount <= 0) {
      return new Response(JSON.stringify({ error: "Invalid amount" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!body?.currency) {
      return new Response(JSON.stringify({ error: "Missing currency" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!body?.order_id) {
      return new Response(JSON.stringify({ error: "Missing order_id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const resp = await fetch("https://api.moneroo.io/v1/payments/initialize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${MONEROO_SECRET_KEY}`,
      },
      body: JSON.stringify({
        amount: body.amount,
        currency: body.currency,
        description: `Commande ${body.order_id}`,
        metadata: { order_id: body.order_id },

        return_url: `${FRONTEND_RETURN_URL}?order_id=${encodeURIComponent(body.order_id)}`,
        webhook_url: WEBHOOK_URL,

        customer: {
          email: body.email ?? undefined,
          phone: body.phone ?? undefined,
          name: body.full_name ?? undefined,
        },
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      return new Response(JSON.stringify({ error: "Moneroo init failed", details: data }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paymentUrl =
      data?.data?.payment_url ?? data?.data?.checkout_url ?? data?.payment_url ?? data?.checkout_url;

    const paymentId =
      data?.data?.id ?? data?.data?.payment_id ?? data?.id ?? data?.payment_id;

    if (!paymentUrl) {
      return new Response(JSON.stringify({ error: "Missing payment url in response", raw: data }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ paymentUrl, paymentId, raw: data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
