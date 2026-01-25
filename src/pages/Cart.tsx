import { Link } from "react-router-dom";
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/formatPrice";

function isVideo(url: string) {
  return /\.(mp4|webm|ogg)$/i.test(url);
}

function pickFirstImageMedia(medias?: string[]) {
  if (!Array.isArray(medias)) return undefined;
  return medias.find((m) => m && !isVideo(m));
}

const Cart = () => {
  const {
    items,
    updateQuantity,
    removeFromCart,
    totalPrice,
    totalItems,
    deliveryMode,
    setDeliveryMode,
  } = useCart();

  const deliveryFee = deliveryMode === "pickup" ? 0 : totalPrice >= 50000 ? 0 : 2000;
  const grandTotal = totalPrice + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-foreground mb-4">Votre panier est vide</h1>
            <p className="text-muted-foreground mb-8">Découvrez notre collection de perruques et mèches de qualité</p>
            <Link to="/shop">
              <Button variant="hero" size="lg">
                Découvrir la Boutique
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-8">
          Panier ({totalItems} article{totalItems > 1 ? "s" : ""})
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const stock = item.variant.stock_count ?? 0;
              const isOut = stock <= 0;
              const atMax = stock > 0 && item.quantity >= stock;

              const variantImg =
                item.variant.image_url ||
                pickFirstImageMedia(item.variant.medias) ||
                item.product.images?.[0] ||
                item.product.image_url ||
                "/placeholder.svg";

              return (
                <div key={item.variant.id} className="flex gap-4 p-4 bg-card rounded-xl shadow-card">
                  <Link to={`/product/${item.product.id}`} className="shrink-0">
                    <img
                      src={variantImg}
                      alt={item.product.name}
                      className="w-24 h-24 md:w-32 md:h-32 rounded-lg object-cover"
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (!img.src.endsWith("/placeholder.svg")) img.src = "/placeholder.svg";
                      }}
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <Link to={`/product/${item.product.id}`} className="min-w-0">
                        <h3 className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1">
                          {item.product.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          Couleur: <span className="font-medium">{item.variant.color}</span> • Longueur:{" "}
                          <span className="font-medium">{item.variant.length}"</span>
                        </p>
                      </Link>

                      {isOut && (
                        <span className="shrink-0 text-xs font-semibold px-2 py-1 rounded bg-destructive/10 text-destructive">
                          Rupture
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground mt-1">
                      {formatPrice(item.variant.price)} / unité
                      {stock > 0 && <span className="ml-2 text-xs text-muted-foreground">(Stock: {stock})</span>}
                    </p>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border border-input rounded-lg">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.variant.id, item.quantity - 1)}
                          className="p-2 hover:bg-muted transition-colors disabled:opacity-50"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </button>

                        <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>

                        <button
                          type="button"
                          onClick={() => updateQuantity(item.variant.id, item.quantity + 1)}
                          className="p-2 hover:bg-muted transition-colors disabled:opacity-50"
                          disabled={isOut || atMax}
                          title={atMax ? "Quantité max atteinte" : undefined}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-foreground">
                          {formatPrice(item.variant.price * item.quantity)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.variant.id)}
                          className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {atMax && !isOut && (
                      <p className="mt-2 text-xs text-muted-foreground">Quantité max atteinte (stock: {stock})</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 p-6 bg-card rounded-xl shadow-card space-y-4">
              <h3 className="font-serif text-xl font-semibold text-foreground">Résumé</h3>

              {/* Choix livraison / retrait */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Mode de réception</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryMode("delivery")}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      deliveryMode === "delivery"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <p className="text-sm font-semibold">Livraison</p>
                    <p className="text-xs text-muted-foreground">
                      {totalPrice >= 50000 ? "Gratuite dès 50 000" : "2 000 FCFA si < 50 000"}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMode("pickup")}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      deliveryMode === "pickup"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <p className="text-sm font-semibold">Retrait</p>
                    <p className="text-xs text-muted-foreground">Je viens récupérer (0 FCFA)</p>
                  </button>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span className="font-medium">{formatPrice(totalPrice)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frais</span>
                  <span className="font-medium">
                    {deliveryFee === 0 ? <span className="text-green-600">0 (gratuit)</span> : formatPrice(deliveryFee)}
                  </span>
                </div>

                {deliveryMode === "delivery" && totalPrice < 50000 && (
                  <p className="text-xs text-muted-foreground">
                    Ajoutez {formatPrice(50000 - totalPrice)} pour la livraison gratuite
                  </p>
                )}

                <div className="h-px bg-border" />

                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-foreground">{formatPrice(grandTotal)}</span>
                </div>
              </div>

              <Link to="/checkout" className="block">
                <Button variant="hero" size="lg" className="w-full">
                  Passer la commande
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>

              <Link to="/shop" className="block">
                <Button variant="ghost" className="w-full">
                  Continuer mes achats
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
