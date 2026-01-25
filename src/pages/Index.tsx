// src/pages/Index.tsx
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Truck, Shield, Award, Headphones, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import { categories, testimonials } from "@/database/static";
import { formatPrice } from "@/lib/formatPrice";
import { useProducts } from "@/hooks/useProducts";
import { usePopularProducts } from "@/hooks/usePopularProduct";
import type { Product } from "@/types/product";

import heroImage from "@/assets/hero-model.jpg";
import categoryNatural from "@/assets/category-natural.jpg";
import categorySynthetic from "@/assets/category-synthetic.jpg";
import categoryExtensions from "@/assets/category-extensions.jpg";
import categoryExtensionse from "@/assets/category-extensionse.jpg"

// ✅ images par catégorie (fallback)
const categoryImages: Record<string, string> = {
  "natural-wigs": categoryNatural,
  "synthetic-wigs": categorySynthetic,
  "natural-weaves": categoryExtensions,
  "synthetic-weaves": categoryExtensionse,
};

// ✅ Prix cohérent avec Shop (base_price_min sinon price)
function getDisplayPrice(p: Product): number {
  if (typeof p.base_price_min === "number") return p.base_price_min;
  if (typeof p.price === "number") return p.price;
  return 0;
}

// ✅ Date de création safe
function getCreatedAtTime(p: Product): number {
  const raw = p?.created_at;
  const t = raw ? new Date(raw).getTime() : 0;
  return Number.isFinite(t) ? t : 0;
}

const Index = () => {
  const { data: products = [], isLoading } = useProducts();

  // ✅ produits populaires via RPC
  const {
    data: popularProducts = [],
    isLoading: isPopularLoading,
    error: popularError,
  } = usePopularProducts(4);

  // ✅ Produits actifs uniquement
  const activeProducts = useMemo(() => {
    return (products ?? []).filter((p) => p?.is_active !== false);
  }, [products]);

  // ✅ min price perruques actives (natural-wigs + synthetic-wigs)
  const wigsMinPrice = useMemo(() => {
    const wigs = activeProducts.filter((p) => {
      const cat = String(p.category || "").toLowerCase();
      return cat === "natural-wigs" || cat === "synthetic-wigs";
    });

    const prices = wigs.map(getDisplayPrice).filter((x) => x > 0);
    return prices.length ? Math.min(...prices) : 0;
  }, [activeProducts]);

  // ✅ récents : on prend + que 4 pour pouvoir compléter sans doublons
  const recentProducts = useMemo(() => {
    return [...activeProducts]
      .sort((a, b) => getCreatedAtTime(b) - getCreatedAtTime(a))
      .slice(0, 8);
  }, [activeProducts]);

  // ✅ 4 affichés = populaires + compléter avec récents (sans doublons)
  const homeProducts = useMemo(() => {
    const popularActive = (popularProducts ?? []).filter((p) => p?.is_active !== false);

    // si pas de populaires => 4 récents
    if (!popularActive.length) return recentProducts.slice(0, 4);

    // compléter avec récents (différents)
    const popularIds = new Set(popularActive.map((p) => p.id));
    const fill = recentProducts.filter((p) => !popularIds.has(p.id));

    return [...popularActive, ...fill].slice(0, 4);
  }, [popularProducts, recentProducts]);

  // ✅ 3 avis
  const displayedTestimonials = useMemo(() => testimonials.slice(0, 3), []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-hero-gradient">
        <div className="container py-12 md:py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-6 animate-slide-up">
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                ✨ Nouvelle Collection Disponible
              </span>

              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Révélez Votre <span className="text-gradient">Beauté Naturelle</span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-lg">
                Découvrez notre collection exclusive de perruques et mèches de qualité premium.
                Livraison rapide partout au Togo et au Bénin.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/shop">
                  <Button variant="hero" size="lg" className="w-full sm:w-auto">
                    Découvrir la Boutique
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>

                <Link to="/shop?category=natural-wigs">
                  <Button variant="outline-primary" size="lg" className="w-full sm:w-auto">
                    Perruques Naturelles
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-6 pt-4">
                <div className="text-center">
                  <p className="font-serif text-2xl font-bold text-foreground">500+</p>
                  <p className="text-xs text-muted-foreground">Clientes Satisfaites</p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center">
                  <p className="font-serif text-2xl font-bold text-foreground">100%</p>
                  <p className="text-xs text-muted-foreground">Qualité Premium</p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center">
                  <p className="font-serif text-2xl font-bold text-foreground">24h</p>
                  <p className="text-xs text-muted-foreground">Livraison Lomé, Calavi</p>
                </div>
              </div>
            </div>

            <div className="relative animate-fade-in">
              <div className="relative rounded-2xl overflow-hidden shadow-glow">
                <img
                  src={heroImage}
                  alt="Belle femme avec perruque naturelle"
                  className="w-full h-auto object-cover"
                />
              </div>

              <div className="absolute -bottom-4 -left-4 bg-card p-4 rounded-xl shadow-card hidden md:block">
                <p className="font-serif text-lg font-semibold text-foreground">
                  Perruques à partir de
                </p>
                <p className="text-2xl font-bold text-primary">
                  {wigsMinPrice > 0 ? formatPrice(wigsMinPrice) : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              Nos Catégories
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explorez notre sélection de perruques et mèches pour tous les styles et budgets
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, idx) => {
              const img = categoryImages[category.id] || categoryExtensions;
              return (
                <Link
                  key={category.id}
                  to={`/shop?category=${category.id}`}
                  className="group relative overflow-hidden rounded-2xl aspect-[3/4] animate-slide-up"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <img
                    src={img}
                    alt={category.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-background">
                    <h3 className="font-serif text-lg font-bold mb-1">{category.name}</h3>
                    <p className="text-sm text-background/80 mb-3">{category.description}</p>
                    <span className="inline-flex items-center text-sm font-medium text-primary group-hover:gap-2 transition-all">
                      Voir la collection <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Popular Products (toujours ce titre) */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">
                Produits populaires
              </h2>
              <p className="text-muted-foreground">Les favoris de nos clientes</p>
            </div>

            <Link to="/shop">
              <Button variant="outline-primary">
                Voir tout
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading || isPopularLoading ? (
              <p className="text-muted-foreground">Chargement des produits...</p>
            ) : homeProducts.length > 0 ? (
              homeProducts.map((product, idx) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  className="animate-slide-up"
                  style={{ animationDelay: `${idx * 100}ms` } as React.CSSProperties}
                />
              ))
            ) : (
              <div className="text-muted-foreground">
                <p>Aucun produit disponible.</p>
                {popularError ? (
                  <p className="text-xs mt-2">
                    Info: {typeof popularError === "string" ? popularError : (popularError as any)?.message ?? "Erreur"}
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              Pourquoi Nous Choisir?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Votre satisfaction est notre priorité
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Award, title: "Qualité Premium", desc: "Cheveux 100% naturels et fibres de haute qualité" },
              { icon: Truck, title: "Livraison Rapide", desc: "Togo: 24-72h • Bénin: 48-96h. Lomé & Calavi en 24h!" },
              { icon: Shield, title: "Paiement Sécurisé", desc: "Mobile Money (Togo/Bénin), carte bancaire ou à la livraison" },
              { icon: Headphones, title: "Service Client", desc: "Assistance WhatsApp 7j/7" },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-card shadow-card hover:shadow-card-hover transition-shadow text-center group"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <item.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ce Que Disent Nos Clientes
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Rejoignez des centaines de femmes satisfaites au Togo et au Bénin
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {displayedTestimonials.map((testimonial, idx) => (
              <div
                key={testimonial.id}
                className="p-6 rounded-2xl bg-card shadow-card animate-slide-up"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < testimonial.rating ? "text-accent fill-accent" : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>

                <p className="text-foreground mb-4 italic">"{testimonial.comment}"</p>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-foreground text-background">
        <div className="container text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            Prête à Transformer Votre Look?
          </h2>
          <p className="text-background/70 max-w-2xl mx-auto mb-8">
            Découvrez notre collection et trouvez la perruque parfaite pour sublimer votre beauté naturelle
          </p>
          <Link to="/shop">
            <Button variant="hero" size="xl">
              Explorer la Boutique
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
