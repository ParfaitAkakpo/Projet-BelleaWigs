// src/types/product.ts

/**
 * Identifiant générique
 * (tes ids sont int8 côté DB → number en frontend)
 */
export type ID = number;

/* =========================
   Couleur
   ========================= */
export interface Color {
  id: ID;
  name: string;
  hex_code?: string | null;
}

/* =========================
   Image liée à une couleur
   ========================= */
export interface ProductColorImage {
  image_url: string;
  position?: number | null;
}

/* =========================
   Couleur disponible pour un produit
   ========================= */
export interface ProductColor {
  id: ID; // product_colors.id
  is_default?: boolean | null;
  color: Color;
  images: ProductColorImage[];
}

/* =========================
   Longueur
   ========================= */
export interface Length {
  id: ID;
  value: number;          // ex: 12
  unit?: string | null;   // inch / pouce
}

/* =========================
   Variante (VIEW product_variants_full)
   ========================= */
export interface ProductVariant {
  id: ID;
  product_id: ID;

  // optionnel selon ta view
  product_color_id?: ID | null;
  is_default?: boolean | null;

  color: string;
  color_hex?: string | null;

  length: number;
  length_id?: ID | null;

  price: number;

  // ⚠️ la view expose stock_count: number | null
  stock_count: number | null;

  sku?: string | null;

  image_url?: string | null;

  // conversion côté frontend: toujours array
  medias: string[];

  is_active?: boolean | null;
}

/* =========================
   Produit (boutique)
   ========================= */
export interface Product {
  id: ID;
  name: string;
  slug: string;
  description?: string | null;

  category?: string | null;
  is_active?: boolean | null;

  created_at?: string | null;
  updated_at?: string | null;

  /**
   * Prix affiché en boutique
   * = base_price_min si présent
   */
  price: number;

  base_price_min?: number | null;
  original_price?: number | null;

  image_url?: string | null;
  images?: string[];

  rating?: number | null;
  review_count?: number | null;
  details?: string[];

  variants?: ProductVariant[];
}

/* =========================
   Panier
   ========================= */
export interface CartItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

export type DeliveryMode = "delivery" | "pickup";

export type CartContextType = {
  items: CartItem[];
  addToCart: (product: Product, variant: ProductVariant, quantity?: number) => void;
  removeFromCart: (variantId: ID) => void;
  updateQuantity: (variantId: ID, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;

  // ✅ AJOUTE ÇA :
  deliveryMode: DeliveryMode;
  setDeliveryMode: (mode: DeliveryMode) => void;
};

