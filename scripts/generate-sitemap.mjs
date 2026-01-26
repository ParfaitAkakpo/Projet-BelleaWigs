// scripts/generate-sitemap.mjs
import "dotenv/config";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const SITE_URL = (process.env.SITE_URL || "https://www.belleawigs.com").replace(/\/+$/, "");

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

function isoDate() {
  return new Date().toISOString().slice(0, 10);
}

function urlTag(loc, opts = {}) {
  const lastmod = opts.lastmod || isoDate();
  const changefreq = opts.changefreq;
  const priority = opts.priority;

  return `
  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    ${changefreq ? `<changefreq>${changefreq}</changefreq>` : ""}
    ${priority ? `<priority>${priority}</priority>` : ""}
  </url>`;
}

async function main() {
  console.log("=== SITEMAP GENERATOR START ===");
  console.log("cwd:", process.cwd());
  console.log("SITE_URL:", SITE_URL);
  console.log("SUPABASE_URL present:", !!SUPABASE_URL);
  console.log("SUPABASE_ANON_KEY present:", !!SUPABASE_ANON_KEY);

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Missing env vars: SUPABASE_URL/SUPABASE_ANON_KEY (or VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY)");
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // pages statiques (au minimum)
  const staticUrls = [
    { path: "/", changefreq: "daily", priority: "1.0" },
    { path: "/shop", changefreq: "daily", priority: "0.9" },
    { path: "/cart", changefreq: "weekly", priority: "0.5" },
    { path: "/checkout", changefreq: "weekly", priority: "0.5" }
  ];

  // récupère les slugs produits
  const { data, error } = await supabase
    .from("product")
    .select("slug,updated_at");

  if (error) {
    console.error("Supabase fetch error:", error);
    throw error;
  }

  const products = (data || [])
    .filter((p) => p?.slug)
    .map((p) => ({
      slug: p.slug,
      lastmod: p.updated_at ? String(p.updated_at).slice(0, 10) : isoDate()
    }));

  console.log("Products found:", products.length);

  const urlsXml = [
    ...staticUrls.map((u) =>
      urlTag(`${SITE_URL}${u.path}`, { changefreq: u.changefreq, priority: u.priority })
    ),
    ...products.map((p) =>
      urlTag(`${SITE_URL}/product/${encodeURIComponent(p.slug)}`, {
        changefreq: "weekly",
        priority: "0.8",
        lastmod: p.lastmod
      })
    )
  ].join("\n");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>
`;

  const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;

  const publicDir = resolve(process.cwd(), "public");
  mkdirSync(publicDir, { recursive: true });

  writeFileSync(resolve(publicDir, "sitemap.xml"), sitemap, "utf8");
  writeFileSync(resolve(publicDir, "robots.txt"), robots, "utf8");

  console.log("✅ Written:", resolve(publicDir, "sitemap.xml"));
  console.log("✅ Written:", resolve(publicDir, "robots.txt"));
  console.log("=== SITEMAP GENERATOR DONE ===");
}

main().catch((e) => {
  console.error("❌ SITEMAP GENERATOR FAILED:", e?.message || e);
  process.exit(1);
});
