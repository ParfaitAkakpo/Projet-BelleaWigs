// supabase/functions/moneroo_verify/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const MONEROO_SECRET_KEY = Deno.env.get("MONEROO_SECRET_KEY");
    if (!MONEROO_SECRET_KEY) {
      return new Response(JSON.stringify({ error: "Missing MONEROO_SECRET_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { paymentId } = await req.json();
    if (!paymentId) {
      return new Response(JSON.stringify({ error: "paymentId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resp = await fetch(`https://api.moneroo.io/v1/payments/${paymentId}/verify`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${MONEROO_SECRET_KEY}`,
      },
    });

    const data = await resp.json();

    if (!resp.ok) {
      return new Response(JSON.stringify({ error: "Moneroo verify failed", details: data }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
