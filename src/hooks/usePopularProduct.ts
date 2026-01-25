// @ts-nocheck
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";

function normalizeProducts(rows: any[]): Product[] {
  return (rows || []).map((row) => {
    const basePriceMin = row?.base_price_min;
    const existingPrice = row?.price;

    return {
      ...row,
      price:
        typeof existingPrice === "number"
          ? existingPrice
          : typeof basePriceMin === "number"
          ? basePriceMin
          : 0,
    } as Product;
  });
}

export function usePopularProducts(limit = 4) {
  const [data, setData] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPopular = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc("get_popular_products", {
        p_limit: limit,
      });

      if (error) {
        setError(error.message);
        setData([]);
        return;
      }

      setData(normalizeProducts(data || []));
    } catch (e: any) {
      setError(e?.message || "Erreur inconnue");
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchPopular();
  }, [fetchPopular]);

  return { data, isLoading, error, refetch: fetchPopular };
}
