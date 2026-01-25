export type ProductCategory =

  | 'natural-wigs'

  | 'synthetic-wigs'

  | 'natural-weaves'

  | 'synthetic-weaves'

  | string;
 
/**

* 🔹 Variante d'un produit (liée à product_variant + couleurs + lengths)

*/

export interface ProductVariant {

  id: string;

  product_id: string;
 
  // Couleur de la variante

  color: string;

  color_hex?: string;
 
  // Longueur en unit

  length: number;
 
  // Prix & stock

  price: number;

  stock_count: number;

  sku: string;
 
  // Médias (images par couleur)

  image_url?: string | null;

  medias?: string[] | null;
 
  is_active: boolean;
 
  created_at?: string;

  updated_at?: string;

}
 
/**

* 🔹 Produit principal (table product)

*/

export interface Product {

  id: string;

  name: string;

  slug?: string;

  description?: string | null;

  category?: ProductCategory;

  base_price_min?: number | null;
 
  // Pour compatibilité avec l'ancien frontend

  price: number;
 
  featured?: boolean;

  in_stock?: boolean;
 
  images?: string[] | null;

  details?: string[] | null;
 
  rating?: number;

  review_count?: number;
 
  created_at?: string;

  updated_at?: string;
 
  is_active?: boolean;

  original_price?: number;

  is_promo?: boolean;
 
  image_url?: string; // fallback ancien système
 
  variants?: ProductVariant[]; // relation optionnelle

}

 