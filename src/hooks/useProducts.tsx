import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/database.types";
import type { Product, ProductVariant, ID } from "@/types/product";

export type ProductInsert = Database["public"]["Tables"]["product"]["Insert"];
export type ProductUpdate = Database["public"]["Tables"]["product"]["Update"];

// ---- Helpers ----

function getProductDisplayPrice(row: Database["public"]["Tables"]["product"]["Row"]): number {
  // ✅ règle : prix boutique = base_price_min si variantes, sinon original_price si pas de variantes, sinon 0
  const bpm = row.base_price_min;
  if (typeof bpm === "number") return bpm;

  const op = row.original_price;
  if (typeof op === "number") return op;

  return 0;
}

function normalizeProduct(
  row: Database["public"]["Tables"]["product"]["Row"],
  defaultImageUrl: string | null
): Product {
  return {
    id: row.id as ID,
    name: row.name,
    slug: row.slug,
    description: row.description ?? null,
    category: row.category ?? null,
    is_active: row.is_active ?? true,
    created_at: row.created_at ?? null,
    updated_at: row.updated_at ?? null,

    base_price_min: row.base_price_min ?? null,
    original_price: row.original_price ?? null,

    // ✅ champ UI (pas en DB)
    price: getProductDisplayPrice(row),

    // ✅ image boutique (view product_default_media)
    image_url: defaultImageUrl,

    // optionnel
    details: Array.isArray((row as any)?.details) ? (row as any).details : [],
    images: undefined,
    variants: undefined,
  };
}

// ---- Hooks ----

/**
 * ✅ Liste des produits actifs + image par défaut via view product_default_media
 * - 2 requêtes rapides (products + default_media) puis merge
 */
export function useProducts() {
  const [data, setData] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ évite setState après unmount (et évite les effets “abort” masqués)
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      if (mountedRef.current) {
        setIsLoading(true);
        setError(null);
      }
      console.log("Testing raw fetch with apikey...");

fetch(import.meta.env.VITE_SUPABASE_URL + "/rest/v1/product?select=id", {
  headers: {
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    Authorization: "Bearer " + import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
})
  .then((r) => r.json())
  .then((j) => console.log("RAW REST OK:", j))
  .catch((e) => console.error("RAW REST FAIL:", e));


      // 1) produits
      const { data: productRows, error: pErr } = await supabase
        .from("product")
        .select("id,name,slug,description,category,is_active,created_at,updated_at,base_price_min,original_price,details")
        .order("created_at", { ascending: false });

      if (pErr) {
        console.error("Supabase product error:", pErr);
        if (mountedRef.current) {
          setError(pErr.message);
          setData([]);
        }
        return;
      }

      const productIds = (productRows ?? []).map((p) => p.id);

      // 2) images par défaut (1 image par produit)
      // si aucun produit, on évite l'appel inutile
      let defaultMediaMap = new Map<number, string | null>();

      if (productIds.length > 0) {
        const { data: mediaRows, error: mErr } = await supabase
          .from("product_default_media")
          .select("product_id,image_url")
          .in("product_id", productIds);

        if (mErr) {
          console.error("Supabase default media error:", mErr);
          if (mountedRef.current) {
            setError(mErr.message);
            setData([]);
          }
          return;
        }

        defaultMediaMap = new Map<number, string | null>(
          (mediaRows ?? []).map((r: any) => [Number(r.product_id), (r.image_url ?? null) as string | null])
        );
      }

      // 3) merge
      const normalized = (productRows ?? []).map((row) =>
        normalizeProduct(row, defaultMediaMap.get(Number(row.id)) ?? null)
      );

      if (mountedRef.current) setData(normalized);
    } catch (err) {
      console.error("useProducts fetchProducts exception:", err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
        setData([]);
      }
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  // ✅ remplace l'ancien useEffect par une version “safe”
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!cancelled) await fetchProducts();
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [fetchProducts]);

  return { data, isLoading, error, refetch: fetchProducts };
}

/**
 * ✅ Création produit (admin)
 */
export function useCreateProduct() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (product: ProductInsert) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: createError } = await supabase
        .from("product")
        .insert(product)
        .select("id,name,slug,description,category,is_active,created_at,updated_at,base_price_min,original_price,details")
        .single();

      if (createError) {
        setError(createError.message);
        return null;
      }

      // image default inconnue ici -> null (sera résolue au refresh)
      return normalizeProduct(data, null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { create, isLoading, error };
}

/**
 * ✅ Update produit (admin)
 */
export function useUpdateProduct() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (id: ID, patch: ProductUpdate) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: updateError } = await supabase
        .from("product")
        .update(patch)
        .eq("id", id)
        .select("id,name,slug,description,category,is_active,created_at,updated_at,base_price_min,original_price,details")
        .single();

      if (updateError) {
        setError(updateError.message);
        return null;
      }

      return normalizeProduct(data, null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { update, isLoading, error };
}

/**
 * ✅ Delete produit (admin) - suppression réelle
 * (Option pro: préférer is_active=false)
 */
export function useDeleteProduct() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteProduct = useCallback(async (id: ID) => {
    try {
      setIsLoading(true);
      setError(null);

      const { error: deleteError } = await supabase.from("product").delete().eq("id", id);

      if (deleteError) {
        setError(deleteError.message);
        return false;
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { delete: deleteProduct, isLoading, error };
}

/**
 * ✅ Variantes via view product_variants_full (default d'abord)
 */
type VariantsFullRow = Database["public"]["Views"]["product_variants_full"]["Row"];

export function useProductVariants(productId?: ID) {
  const [data, setData] = useState<ProductVariant[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      setData([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchVariants = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data: rows, error: fetchError } = await supabase
          .from("product_variants_full")
          .select("*")
          .eq("product_id", productId)
          .order("is_default", { ascending: false })
          .order("color", { ascending: true })
          .order("length", { ascending: true });

        if (fetchError) {
          if (!cancelled) setError(fetchError.message);
          return;
        }

        const formatted: ProductVariant[] = (rows ?? []).map((r: VariantsFullRow) => {
          const medias = Array.isArray(r.medias) ? (r.medias as string[]) : [];

          return {
            id: r.variant_id,
            product_id: r.product_id,

            product_color_id: r.product_color_id,
            is_default: r.is_default ?? false,

            color: r.color ?? "",
            color_hex: r.color_hex ?? null,

            length: Number(r.length ?? 0),
            length_id: r.length_id ?? null,

            price: Number(r.price ?? 0),
            stock_count: Number(r.stock_count ?? 0),

            sku: r.sku ?? null,
            is_active: r.is_active ?? true,

            medias,
            image_url: r.image_url ?? medias[0] ?? null,
          };
        });

        if (!cancelled) setData(formatted);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchVariants();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  return { data, isLoading, error };
}
