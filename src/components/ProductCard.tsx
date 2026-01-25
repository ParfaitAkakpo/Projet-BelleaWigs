// src/components/ProductCard.tsx

import { Link } from "react-router-dom";

import type { HTMLAttributes } from "react";

import { Eye } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { Product } from "@/types/product";

import { cn } from "@/lib/utils";

import { formatPrice } from "@/lib/formatPrice";

interface ProductCardProps extends HTMLAttributes<HTMLDivElement> {

  product: Product;

}

const categoryLabels: Record<string, string> = {

  "natural-wigs": "Perruque naturelle",

  "synthetic-wigs": "Perruque synthétique",

  "natural-weaves": "Mèche naturelle",

  "synthetic-weaves": "Mèche synthétique",

};

function getDisplayPrice(product: Product): number {

  if (typeof product.base_price_min === "number") return product.base_price_min;

  if (typeof product.price === "number") return product.price;

  return 0;

}

const ProductCard = ({ product, className, ...props }: ProductCardProps) => {

  // ✅ On garde la carte mais on indique "Indisponible"

  const isInactive = product.is_active === false;

  const displayPrice = getDisplayPrice(product);

  // ✅ Promo = original_price > prix affiché

  const hasSale =

    typeof product.original_price === "number" &&

    product.original_price > displayPrice &&

    displayPrice > 0;

  const discountPct =

    hasSale && typeof product.original_price === "number"

      ? Math.round((1 - displayPrice / product.original_price) * 100)

      : 0;

  const imageSrc = product.image_url || "/placeholder.svg";

  const rawCat = product.category ?? "";

  const categoryText = rawCat

    ? categoryLabels[rawCat] || String(rawCat).replace(/-/g, " ")

    : "";

  return (
<div

      className={cn(

        "group relative bg-card rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300",

        isInactive && "opacity-80",

        className

      )}

      {...props}
>

      {/* Image */}
<Link

        to={`/product/${product.id}`}

        className="block relative aspect-[3/4] overflow-hidden bg-muted"

        aria-disabled={isInactive}
>
<img

          src={imageSrc}

          alt={product.name}

          loading="lazy"

          className={cn(

            "w-full h-full object-cover transition-transform duration-500 group-hover:scale-105",

            isInactive && "grayscale"

          )}

          onError={(e) => {

            const img = e.currentTarget;

            if (img.src.endsWith("/placeholder.svg")) return;

            img.src = "/placeholder.svg";

          }}

        />

        {/* ✅ Overlay si indisponible */}

        {isInactive && (
<div className="absolute inset-0 bg-background/60 backdrop-blur-[1px]" />

        )}

        {/* Badge promo */}

        {hasSale && discountPct > 0 && (
<div className="absolute top-3 left-3">
<span className="px-2 py-1 text-xs font-semibold bg-primary text-primary-foreground rounded">

              -{discountPct}%
</span>
</div>

        )}

        {/* ✅ Badge indisponible */}

        {isInactive && (
<div className="absolute top-3 right-3">
<span className="px-2 py-1 text-xs font-semibold bg-destructive text-destructive-foreground rounded">

              Indisponible
</span>
</div>

        )}
</Link>

      {/* Info */}
<div className="p-4 space-y-3">

        {/* Category */}

        {categoryText && (
<span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">

            {categoryText}
</span>

        )}

        {/* Name */}
<Link to={`/product/${product.id}`}>
<h3 className="font-medium text-foreground line-clamp-2 hover:text-primary transition-colors min-h-[2.5rem]">

            {product.name}
</h3>
</Link>

        {/* Price */}
<div className="flex items-baseline gap-2">
<span className="font-semibold text-foreground">

            {displayPrice > 0

              ? `À partir de ${formatPrice(displayPrice)}`

              : "Prix sur demande"}
</span>

          {hasSale && typeof product.original_price === "number" && (
<span className="text-sm text-muted-foreground line-through">

              {formatPrice(product.original_price)}
</span>

          )}
</div>

        {/* CTA */}
<Link to={`/product/${product.id}`} className="block pt-2">
<Button

            variant="outline"

            size="sm"

            className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"

            disabled={isInactive}
>
<Eye className="h-4 w-4 mr-2" />

            Voir les détails
</Button>
</Link>
</div>
</div>

  );

};

export default ProductCard;
 