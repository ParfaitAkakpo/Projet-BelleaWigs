// src/hooks/useCatalog.ts
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/database.types";

export type ColorRow = Database["public"]["Tables"]["colors"]["Row"];
export type LengthRow = Database["public"]["Tables"]["lengths"]["Row"];

export type ProductColorRow = Database["public"]["Tables"]["product_colors"]["Row"];
export type ProductColorInsert = Database["public"]["Tables"]["product_colors"]["Insert"];
export type ProductColorUpdate = Database["public"]["Tables"]["product_colors"]["Update"];

export type ProductColorImageRow = Database["public"]["Tables"]["product_color_images"]["Row"];
export type ProductColorImageInsert = Database["public"]["Tables"]["product_color_images"]["Insert"];
export type ProductColorImageUpdate = Database["public"]["Tables"]["product_color_images"]["Update"];

export type VariantRow = Database["public"]["Tables"]["product_variant"]["Row"];
export type VariantInsert = Database["public"]["Tables"]["product_variant"]["Insert"];
export type VariantUpdate = Database["public"]["Tables"]["product_variant"]["Update"];

// =========================
// COLORS
// =========================
export function useColors() {
  const [data, setData] = useState<ColorRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("colors")
        .select("id,name,hex_code,created_at")
        .order("name", { ascending: true });

      if (error) throw error;
      setData(data ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Erreur chargement colors");
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}

// =========================
// LENGTHS
// =========================
export function useLengths() {
  const [data, setData] = useState<LengthRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("lengths")
        .select("id,value,unit")
        .order("value", { ascending: true });

      if (error) throw error;
      setData(data ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Erreur chargement lengths");
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}

// =========================
// PRODUCT COLORS (liaison produit <-> couleur)
// =========================
export function useProductColors(productId?: number) {
  const [data, setData] = useState<(ProductColorRow & { color: ColorRow })[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!productId) {
      setData([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("product_colors")
        .select("id,product_id,color_id,is_default,created_at, colors(id,name,hex_code,created_at)")
        .eq("product_id", productId)
        .order("is_default", { ascending: false })
        .order("id", { ascending: true });

      if (error) throw error;

      const mapped =
        (data ?? []).map((r: any) => ({
          ...(r as ProductColorRow),
          color: r.colors as ColorRow,
        })) ?? [];

      setData(mapped);
    } catch (e: any) {
      setError(e?.message ?? "Erreur chargement product_colors");
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}

export function useCreateProductColor() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (payload: ProductColorInsert) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("product_colors")
        .insert(payload)
        .select("id,product_id,color_id,is_default,created_at")
        .single();

      if (error) throw error;
      return data ?? null;
    } catch (e: any) {
      setError(e?.message ?? "Erreur create product_color");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { create, isLoading, error };
}

// ✅ Important: 1 seule couleur “default” par produit
export function useSetDefaultProductColor() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setDefault = useCallback(async (productId: number, productColorId: number) => {
    try {
      setIsLoading(true);
      setError(null);

      // 1) reset tous à false
      const { error: e1 } = await supabase
        .from("product_colors")
        .update({ is_default: false } satisfies ProductColorUpdate)
        .eq("product_id", productId);

      if (e1) throw e1;

      // 2) set true sur celui-ci
      const { error: e2 } = await supabase
        .from("product_colors")
        .update({ is_default: true } satisfies ProductColorUpdate)
        .eq("id", productColorId);

      if (e2) throw e2;

      return true;
    } catch (e: any) {
      setError(e?.message ?? "Erreur set default color");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { setDefault, isLoading, error };
}

export function useDeleteProductColor() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase.from("product_colors").delete().eq("id", id);
      if (error) throw error;
      return true;
    } catch (e: any) {
      setError(e?.message ?? "Erreur delete product_color");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { remove, isLoading, error };
}

// =========================
// IMAGES par product_color_id
// =========================
export function useProductColorImages(productColorId?: number) {
  const [data, setData] = useState<ProductColorImageRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!productColorId) {
      setData([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("product_color_images")
        .select("id,product_color_id,image_url,position")
        .eq("product_color_id", productColorId)
        .order("position", { ascending: true });

      if (error) throw error;
      setData(data ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Erreur chargement images");
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [productColorId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}

export function useAddProductColorImage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = useCallback(async (payload: ProductColorImageInsert) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("product_color_images")
        .insert(payload)
        .select("id,product_color_id,image_url,position")
        .single();

      if (error) throw error;
      return data ?? null;
    } catch (e: any) {
      setError(e?.message ?? "Erreur add image");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { add, isLoading, error };
}

export function useDeleteProductColorImage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase.from("product_color_images").delete().eq("id", id);
      if (error) throw error;
      return true;
    } catch (e: any) {
      setError(e?.message ?? "Erreur delete image");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { remove, isLoading, error };
}

// =========================
// VARIANTS (table product_variant)
// =========================
export function useVariants(productId?: number) {
  const [data, setData] = useState<VariantRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!productId) {
      setData([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("product_variant")
        .select("id,product_id,product_color_id,length_id,price,stock,sku,is_active")
        .eq("product_id", productId)
        .order("product_color_id", { ascending: true })
        .order("length_id", { ascending: true });

      if (error) throw error;
      setData(data ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Erreur chargement variants");
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}

export function useCreateVariant() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (payload: VariantInsert) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("product_variant")
        .insert(payload)
        .select("id,product_id,product_color_id,length_id,price,stock,sku,is_active")
        .single();

      if (error) throw error;
      return data ?? null;
    } catch (e: any) {
      setError(e?.message ?? "Erreur create variant");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { create, isLoading, error };
}

export function useUpdateVariant() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (id: number, patch: VariantUpdate) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("product_variant")
        .update(patch)
        .eq("id", id)
        .select("id,product_id,product_color_id,length_id,price,stock,sku,is_active")
        .single();

      if (error) throw error;
      return data ?? null;
    } catch (e: any) {
      setError(e?.message ?? "Erreur update variant");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { update, isLoading, error };
}

export function useDeleteVariant() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase.from("product_variant").delete().eq("id", id);
      if (error) throw error;
      return true;
    } catch (e: any) {
      setError(e?.message ?? "Erreur delete variant");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { remove, isLoading, error };
}
