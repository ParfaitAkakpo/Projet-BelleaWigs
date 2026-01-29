// src/pages/ProductDetail.tsx
import { useMemo, useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  ShoppingBag,
  Truck,
  Shield,
} from "lucide-react";

import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/formatPrice";
import { useCart } from "@/contexts/CartContext";
import { useProductDetail } from "@/hooks/useProductDetail";
import SEO from "@/components/seo/SEO";

const categoryLabels: Record<string, string> = {
  "natural-wigs": "Perruque naturelle",
  "synthetic-wigs": "Perruque synthétique",
  "natural-weaves": "Mèche naturelle",
  "synthetic-weaves": "Mèche synthétique",
};

function categoryFamily(cat?: string | null) {
  const c = String(cat || "").toLowerCase();
  if (c.includes("wigs")) return "wigs";
  if (c.includes("weaves")) return "weaves";
  return "other";
}

export default function ProductDetail() {
  const { id } = useParams();
  const safeId = id ?? "";
  const { addToCart } = useCart();

  const {
    product,
    products,
    carouselItems,
    colorKeys,
    variantsByColor,
    selectedImageIndex,
    selectedColorKey,
    selectedLength,
    availableLengths,
    currentVariant,
    activePrice,
    isLoading,
    error,
    handleSelectImage,
    handleSelectColor,
    handleSelectLength,
  } = useProductDetail(id);

  const isVideo = (url?: string | null) => {
    if (!url) return false;
    return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
  };

  const medias = useMemo(
    () => carouselItems.map((it) => it.imageUrl),
    [carouselItems]
  );
  const currentMedia = medias[selectedImageIndex] || "/placeholder.svg";

  const hasVariants = !!currentVariant && colorKeys.length > 0;
  const [quantity, setQuantity] = useState(1);

  const currentStock = currentVariant?.stock_count ?? 0;
  const maxQty = Math.max(1, currentStock);

  // quand la variante change, reset qty
  useEffect(() => {
    setQuantity(1);
  }, [currentVariant?.id]);

  const clampQty = (value: number) => {
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n)) return 1;
    return Math.min(Math.max(1, n), maxQty);
  };

  const handleQtyInputChange = (raw: string) => {
    if (raw.trim() === "") {
      setQuantity(1);
      return;
    }
    setQuantity(clampQty(raw as unknown as number));
  };

  const handleQtyBlur = () => {
    setQuantity((q) => clampQty(q));
  };

  const isInStock = currentVariant ? currentVariant.stock_count > 0 : false;
  const canAddToCart = !!product && !!currentVariant && isInStock;

  const addToCartMessage = useMemo(() => {
    if (!product) return "";
    if (!currentVariant) return "Variantes indisponibles pour ce produit";
    if (!selectedColorKey) return "Veuillez sélectionner une couleur";
    if (selectedLength == null) return "Veuillez sélectionner une longueur";
    if (!isInStock) return "Cette variante est en rupture de stock";
    return "";
  }, [product, currentVariant, selectedColorKey, selectedLength, isInStock]);

  const handleAdd = () => {
    if (!product || !currentVariant) return;
    if (currentVariant.stock_count <= 0) return;
    addToCart(product, currentVariant, quantity);
    setQuantity(1);
  };

  const nextImage = () => {
    if (!medias.length) return;
    const next = (selectedImageIndex + 1) % medias.length;
    handleSelectImage(next);
  };

  const prevImage = () => {
    if (!medias.length) return;
    const prev = (selectedImageIndex - 1 + medias.length) % medias.length;
    handleSelectImage(prev);
  };

  const relatedProducts = useMemo(() => {
    if (!product) return [];

    const basePrice = Number(product.base_price_min ?? product.price ?? 0);
    const fam = categoryFamily(product.category);

    const scored = products
      .filter((p) => String(p.id) !== String(product.id))
      .map((p) => {
        const pPrice = Number(p.base_price_min ?? p.price ?? 0);
        const sameCat =
          p.category && product.category && p.category === product.category;
        const sameFam = categoryFamily(p.category) === fam;

        const within20 =
          basePrice > 0 ? Math.abs(pPrice - basePrice) / basePrice <= 0.2 : false;

        const score =
          (sameCat ? 3 : 0) + (!sameCat && sameFam ? 2 : 0) + (within20 ? 1 : 0);

        return { p, score, diff: Math.abs(pPrice - basePrice) };
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.diff - b.diff;
      })
      .map((x) => x.p);

    return scored.slice(0, 8);
  }, [products, product]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Chargement du produit...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-8 w-8 mx-auto text-destructive" />
          <h1 className="font-serif text-2xl font-bold text-foreground">
            Produit non trouvé
          </h1>
          <p className="text-muted-foreground">
            {error || "Ce produit n'existe pas."}
          </p>
          <Link to="/shop">
            <Button className="mt-2">Retour à la boutique</Button>
          </Link>
        </div>
      </div>
    );
  }

  const categoryText = product.category
    ? categoryLabels[product.category] ||
      String(product.category).replace(/-/g, " ")
    : "";

  // image principale SEO (préférence: image_url -> carousel -> placeholder)
  const mainImage =
    (product as any)?.image_url ||
    (product as any)?.imageUrl ||
    (product as any)?.image ||
    (carouselItems[0]?.imageUrl ?? undefined);

  // SEO: canonical + description
  const canonicalPath = `/product/${safeId}`;
  const seoTitle = `${product.name} | BelléaWigs`;
  const seoDescription =
    String(product.description ?? "").trim() ||
    "Découvrez nos perruques et mèches de qualité premium : styles tendance, cheveux 100% humains.";

  // ✅ JSON-LD Product (Rich Results)
  // Notes:
  // - priceCurrency: j'ai mis XOF par défaut (FCFA). Change si tu utilises autre.
  // - url: utilise la canonical URL.
  // - sku: si tu as un SKU dans currentVariant, sinon fallback.
  // - brand: BelléaWigs (ok pour ta boutique).
  const productJsonLd = useMemo(() => {
    const origin =
      (import.meta as any)?.env?.VITE_SITE_URL ||
      "https://www.belleawigs.com";

    const cleanOrigin = String(origin).replace(/\/+$/, "");
    const url = `${cleanOrigin}${canonicalPath}`;

    const priceNumber = Number(activePrice ?? 0);
    const inStock = (currentVariant?.stock_count ?? 0) > 0;

    // images: si tu as plusieurs images, c'est encore mieux
    const images = [
      mainImage,
      ...medias.filter(Boolean),
    ].filter(Boolean) as string[];

    // SKU (optionnel)
    const sku = (currentVariant as any)?.sku || String((product as any)?.id || safeId);

    // category (optionnel)
    const cat = categoryText ? String(categoryText) : undefined;

    return {
      "@context": "https://schema.org",
      "@type": "Product",
      name: String(product.name),
      description: seoDescription,
      image: images.length ? images : undefined,
      sku,
      brand: {
        "@type": "Brand",
        name: "BelléaWigs",
      },
      category: cat,
      url,
      offers: {
        "@type": "Offer",
        url,
        price: Number.isFinite(priceNumber) ? priceNumber.toFixed(2) : "0.00",
        priceCurrency: "XOF",
        availability: inStock
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
      },
    };
  }, [
    canonicalPath,
    activePrice,
    currentVariant?.stock_count,
    currentVariant,
    mainImage,
    medias,
    product.name,
    seoDescription,
    categoryText,
    product,
    safeId,
  ]);

  return (
    <>
      {/* ✅ Meta tags SEO (title, description, canonical, og, etc.) */}
      <SEO
        title={seoTitle}
        description={seoDescription}
        canonical={canonicalPath}
        image={mainImage}
        type="product"
      />

      {/* ✅ JSON-LD Rich Results */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      <div className="min-h-screen bg-background">
        <div className="container py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-primary transition-colors">
              Accueil
            </Link>
            <span>/</span>
            <Link to="/shop" className="hover:text-primary transition-colors">
              Boutique
            </Link>
            {product.category && (
              <>
                <span>/</span>
                <Link
                  to={`/shop?category=${encodeURIComponent(product.category)}`}
                  className="hover:text-primary transition-colors"
                >
                  {categoryText}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-foreground line-clamp-1">{product.name}</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* ===== MEDIA GALLERY ===== */}
            <div className="space-y-4">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted group">
                {isVideo(currentMedia) ? (
                  <video
                    src={currentMedia}
                    controls
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={currentMedia}
                    alt={product.name}
                    className="w-full h-full object-cover transition-all duration-300"
                  />
                )}

                {medias.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}

                {medias.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-background/80 backdrop-blur-sm text-sm">
                    {selectedImageIndex + 1} / {medias.length}
                  </div>
                )}

                {selectedColorKey && (
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    {selectedColorKey}
                  </div>
                )}
              </div>

              {medias.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {medias.map((img, idx) => (
                    <button
                      key={`${img}-${idx}`}
                      type="button"
                      onClick={() => handleSelectImage(idx)}
                      className={cn(
                        "flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all",
                        selectedImageIndex === idx
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-transparent hover:border-muted-foreground/30"
                      )}
                    >
                      {isVideo(img) ? (
                        <video
                          src={img}
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ===== PRODUCT INFO ===== */}
            <div className="space-y-6">
              {categoryText && (
                <span className="inline-block px-3 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-full uppercase tracking-wide">
                  {categoryText}
                </span>
              )}

              <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
                {product.name}
              </h1>

              {product.description && (
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              )}

              <div className="flex items-baseline gap-3 py-4 border-y border-border">
                <span className="font-serif text-3xl font-bold text-foreground">
                  {formatPrice(activePrice)}
                </span>

                {typeof product.original_price === "number" &&
                  product.original_price > activePrice && (
                    <span className="text-lg text-muted-foreground line-through">
                      {formatPrice(product.original_price)}
                    </span>
                  )}
              </div>

              {hasVariants ? (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">
                        Couleur{" "}
                        {selectedColorKey && (
                          <span className="text-primary">: {selectedColorKey}</span>
                        )}
                      </label>
                      {!selectedColorKey && (
                        <span className="text-xs text-muted-foreground">
                          Sélectionnez une couleur
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {colorKeys.map((ck) => {
                        const isSelected = selectedColorKey === ck;
                        const hex = variantsByColor[ck]?.hex ?? "#ccc";

                        return (
                          <button
                            key={ck}
                            type="button"
                            onClick={() => handleSelectColor(ck)}
                            className={cn(
                              "relative w-14 h-14 rounded-lg border-2 transition-all overflow-hidden",
                              isSelected
                                ? "border-primary ring-2 ring-primary/20 scale-105"
                                : "border-border hover:border-primary/50"
                            )}
                            title={ck}
                          >
                            <div className="w-full h-full" style={{ backgroundColor: hex }} />
                            {isSelected && (
                              <Check className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow-md" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {selectedColorKey && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">
                          Longueur{" "}
                          {selectedLength != null && (
                            <span className="text-primary">: {selectedLength}"</span>
                          )}
                        </label>
                        {selectedLength == null && (
                          <span className="text-xs text-muted-foreground">
                            Sélectionnez une longueur
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {availableLengths.map((len) => {
                          const isSelected = selectedLength === len;
                          return (
                            <button
                              key={len}
                              type="button"
                              onClick={() => handleSelectLength(len)}
                              className={cn(
                                "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                                isSelected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border hover:border-primary hover:bg-primary/5"
                              )}
                            >
                              {len}"
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                  Variantes indisponibles pour ce produit.
                </div>
              )}

              <div className="flex items-center gap-2">
                {isInStock ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm text-green-600 font-medium">
                      En stock ({currentStock})
                    </span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-sm text-red-600 font-medium">
                      Rupture de stock
                    </span>
                  </>
                )}
              </div>

              {Array.isArray((product as any).details) &&
                (product as any).details.length > 0 && (
                  <div className="space-y-3 py-4 border-y border-border">
                    <h3 className="text-sm font-medium">Caractéristiques :</h3>
                    {(product as any).details.map((detail: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>
                )}

              <div className="space-y-4">
                {addToCartMessage && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm">
                    <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">{addToCartMessage}</span>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Quantité :</span>
                  <div className="flex items-center border border-input rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="p-3 hover:bg-muted transition-colors disabled:opacity-50"
                      disabled={quantity <= 1}
                      aria-label="Diminuer la quantité"
                    >
                      <Minus className="h-4 w-4" />
                    </button>

                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={maxQty}
                      value={quantity}
                      onChange={(e) => handleQtyInputChange(e.target.value)}
                      onBlur={handleQtyBlur}
                      className="w-16 text-center font-medium bg-background outline-none border-x border-input py-2"
                      disabled={!currentVariant || currentStock <= 0}
                    />

                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(q + 1, maxQty))}
                      className="p-3 hover:bg-muted transition-colors disabled:opacity-50"
                      disabled={!currentVariant || quantity >= maxQty}
                      aria-label="Augmenter la quantité"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {currentVariant && currentStock > 0 && (
                    <p className="text-xs text-muted-foreground">Max: {maxQty}</p>
                  )}
                </div>

                <Button
                  variant="hero"
                  size="lg"
                  className="w-full"
                  onClick={handleAdd}
                  disabled={!canAddToCart}
                >
                  <ShoppingBag className="h-5 w-5" />
                  Ajouter au panier
                </Button>

                {currentVariant && (
                  <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                    <span className="font-medium">Sélection :</span> {selectedColorKey}
                    {selectedLength != null ? ` - ${selectedLength}"` : ""}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                  <Truck className="h-6 w-6 text-primary" />
                  <div className="text-sm">
                    <p className="font-medium">Livraison rapide</p>
                    <p className="text-muted-foreground">Togo: 24-72h • Bénin: 48-96h</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                  <Shield className="h-6 w-6 text-primary" />
                  <div className="text-sm">
                    <p className="font-medium">Paiement sécurisé</p>
                    <p className="text-muted-foreground">Mobile Money & Carte</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {relatedProducts.length > 0 && (
            <div className="mt-16 md:mt-24">
              <div className="flex items-end justify-between gap-4 mb-8">
                <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
                  Produits similaires
                </h2>

                {product.category && (
                  <Link to={`/shop?category=${encodeURIComponent(product.category)}`}>
                    <Button variant="outline" size="sm">
                      Voir plus
                    </Button>
                  </Link>
                )}
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
