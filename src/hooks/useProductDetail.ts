// src/hooks/useProductDetail.ts
import { useCallback, useEffect, useMemo, useState } from "react";
import { useProducts, useProductVariants } from "@/hooks/useProducts";
import type { Product, ProductVariant } from "@/types/product";

export type CarouselItem = {
  colorKey: string; // ex "Noir"
  imageUrl: string; // url image/video
};

export type VariantsByColor = Record<
  string,
  {
    hex: string | null;
    variants: ProductVariant[];
  }
>;

export type UseProductDetailResult = {
  product?: Product;
  products: Product[];
  variants: ProductVariant[];

  variantsByColor: VariantsByColor;
  colorKeys: string[];

  carouselItems: CarouselItem[];
  selectedImageIndex: number;
  selectedColorKey: string | null;
  selectedLength: number | null;

  availableLengths: number[];
  currentVariant: ProductVariant | null;
  activePrice: number;

  isLoading: boolean;
  error: string | null;

  setSelectedImageIndex: React.Dispatch<React.SetStateAction<number>>;
  handleSelectImage: (index: number) => void;
  handleSelectColor: (ck: string) => void;
  handleSelectLength: (len: number) => void;
};

export function useProductDetail(productId?: string): UseProductDetailResult {
  const productIdNumber = productId ? Number(productId) : undefined;

  const {
    data: products = [],
    isLoading: productsLoading,
    error: productsError,
  } = useProducts();

  const {
    data: variants = [],
    isLoading: variantsLoading,
    error: variantsError,
  } = useProductVariants(productIdNumber);

  const product: Product | undefined = useMemo(() => {
    if (!productId) return undefined;
    return products.find((p) => String(p.id) === String(productId));
  }, [products, productId]);

  // ✅ group variants by color name + keep the real hex for that color
  const variantsByColor: VariantsByColor = useMemo(() => {
    const map: VariantsByColor = {};

    for (const v of variants) {
      if ((v.stock_count ?? 0) <= 0) continue;
      if (v.is_active === false) continue;  
      const key = v.color || "Autre";

      if (!map[key]) {
        map[key] = {
          hex: v.color_hex ?? null,
          variants: [],
        };
      } else {
        if (!map[key].hex && v.color_hex) map[key].hex = v.color_hex;
      }

      map[key].variants.push(v);
    }

    for (const key of Object.keys(map)) {
      map[key].variants = [...map[key].variants].sort(
        (a, b) => (a.length ?? 0) - (b.length ?? 0)
      );
    }

    return map;
  }, [variants]);

  const colorKeys = useMemo(() => Object.keys(variantsByColor), [variantsByColor]);

  // default color (if your view exposes is_default)
const defaultColorKey = useMemo(() => {
  const activeVariants = variants.filter(
    (v) => v.is_active !== false && (v.stock_count ?? 0) > 0
  );
  if (!activeVariants.length) return null;

  const vDefault = activeVariants.find((v: any) => (v as any).is_default === true);
  return (vDefault?.color || Object.keys(variantsByColor)[0] || null) as string | null;
}, [variants, variantsByColor]);


  // Build carousel items: all medias for each color (ordered)
  const carouselItems: CarouselItem[] = useMemo(() => {
    const items: CarouselItem[] = [];

    for (const ck of colorKeys) {
      const first = variantsByColor[ck]?.variants?.[0];

      const medias =
        first?.medias && first.medias.length > 0
          ? first.medias
          : first?.image_url
            ? [first.image_url]
            : [];

      for (const url of medias) items.push({ colorKey: ck, imageUrl: url });
    }

    if (items.length === 0) {
      items.push({ colorKey: "default", imageUrl: "/placeholder.svg" });
    }

    return items;
  }, [colorKeys, variantsByColor]);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColorKey, setSelectedColorKey] = useState<string | null>(null);
  const [selectedLength, setSelectedLength] = useState<number | null>(null);

  // init default selection
  useEffect(() => {
    if (!variants.length) {
      setSelectedColorKey(null);
      setSelectedLength(null);
      setSelectedImageIndex(0);
      return;
    }

    const initColor = defaultColorKey;
    if (!selectedColorKey && initColor) setSelectedColorKey(initColor);

    if (selectedLength == null && initColor) {
      const list = variantsByColor[initColor]?.variants || [];
      if (list.length) setSelectedLength(list[0].length);
    }
  }, [variants, defaultColorKey, variantsByColor, selectedColorKey, selectedLength]);

  const availableLengths = useMemo(() => {
    if (!selectedColorKey) return [];
    return (variantsByColor[selectedColorKey]?.variants || []).map((v) => v.length);
  }, [variantsByColor, selectedColorKey]);

  const currentVariant = useMemo(() => {
    if (!variants.length) return null;

    const ck = selectedColorKey || defaultColorKey || variants[0]?.color || null;
    if (!ck) return variants[0];

    const list = variantsByColor[ck]?.variants || [];
    if (!list.length) return variants[0];

    if (selectedLength != null) {
      const exact = list.find((v) => v.length === selectedLength);
      if (exact) return exact;
    }

    return list[0];
  }, [variants, variantsByColor, selectedColorKey, selectedLength, defaultColorKey]);

  const activePrice = currentVariant?.price ?? product?.price ?? 0;

  const handleSelectImage = useCallback(
    (index: number) => {
      setSelectedImageIndex(index);

      const item = carouselItems[index];
      if (!item?.colorKey) return;

      const ck = item.colorKey;
      setSelectedColorKey(ck);

      const list = variantsByColor[ck]?.variants || [];
      if (list.length) setSelectedLength(list[0].length);
    },
    [carouselItems, variantsByColor]
  );

  const handleSelectColor = useCallback(
    (ck: string) => {
      setSelectedColorKey(ck);

      const list = variantsByColor[ck]?.variants || [];
      if (list.length) setSelectedLength(list[0].length);

      const idx = carouselItems.findIndex((it) => it.colorKey === ck);
      if (idx >= 0) setSelectedImageIndex(idx);
    },
    [variantsByColor, carouselItems]
  );

  const handleSelectLength = useCallback((len: number) => setSelectedLength(len), []);

  const isLoading = productsLoading || variantsLoading;
  const error = productsError || variantsError || null;

  return {
    product,
    products,
    variants,

    variantsByColor,
    colorKeys,

    carouselItems,
    selectedImageIndex,
    selectedColorKey,
    selectedLength,
    availableLengths,
    currentVariant,
    activePrice,

    isLoading,
    error,

    setSelectedImageIndex,
    handleSelectImage,
    handleSelectColor,
    handleSelectLength,
  };
}
