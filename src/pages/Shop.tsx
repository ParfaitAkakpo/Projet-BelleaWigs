// src/pages/Shop.tsx
import SearchBarOnly from "@/components/SearchBarOnly";
import { useProducts } from "@/hooks/useProducts";
import type { Product } from "@/types/product";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Grid3X3, LayoutList, Loader2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import { categories } from "@/database/static";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

// ✅ Prix boutique = base_price_min si présent, sinon fallback UI price
function getDisplayPrice(p: Product): number {
  if (typeof p.base_price_min === "number") return p.base_price_min;
  if (typeof p.price === "number") return p.price;
  return 0;
}

// ✅ Header filters: meches / perruques / promotions
function getProductsByFilter(products: Product[], filter: string): Product[] {
  const f = (filter || "").toLowerCase();

  if (f === "meches") {
    // natural-weaves + synthetic-weaves
    return products.filter((p) => {
      const cat = (p.category || "").toLowerCase();
      return cat === "natural-weaves" || cat === "synthetic-weaves";
    });
  }

  if (f === "perruques") {
    // natural-wigs + synthetic-wigs
    return products.filter((p) => {
      const cat = (p.category || "").toLowerCase();
      return cat === "natural-wigs" || cat === "synthetic-wigs";
    });
  }

  if (f === "promotions") {
    // promo = original_price > prix affiché (base_price_min)
    return products.filter((p) => {
      const price = getDisplayPrice(p);
      return (
        typeof p.original_price === "number" &&
        p.original_price > price &&
        price > 0
      );
    });
  }

  return products;
}

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [sortBy, setSortBy] = useState<"price-low" | "price-high" | "newest">(
    "newest"
  );
  const [gridView, setGridView] = useState<"grid" | "list">("grid");

  // ✅ URL params
  const selectedCategory = searchParams.get("category") || "all";
  const selectedFilter = searchParams.get("filter") || "";
  const urlQ = searchParams.get("q") || "";

  // ✅ Local search state synchronized with URL
  const [searchQuery, setSearchQuery] = useState(urlQ);

  // Quand l’URL change (back/forward/reload), on met à jour l’input
  useEffect(() => {
    setSearchQuery(urlQ);
  }, [urlQ]);

  const { data: allProducts = [], isLoading } = useProducts();

  // ✅ Handler: update q= in URL while typing (and keep other params)
  const handleSearchChange = (q: string) => {
    setSearchQuery(q);

    const next = new URLSearchParams(searchParams);
    const trimmed = q.trim();

    if (trimmed) next.set("q", trimmed);
    else next.delete("q");

    setSearchParams(next, { replace: true });
  };

  // ✅ Category click: keep q + filter
  const handleCategoryClick = (categoryId: string) => {
    const next = new URLSearchParams(searchParams);

    if (categoryId === "all") next.delete("category");
    else next.set("category", categoryId);

    setSearchParams(next);
  };

  // ✅ Clear only search (keep category/filter)
  const clearSearch = () => {
    setSearchQuery("");
    const next = new URLSearchParams(searchParams);
    next.delete("q");
    setSearchParams(next);
  };

  const filteredProducts = useMemo(() => {
    let result: Product[] = [...allProducts];

    // Header filter
    if (selectedFilter) {
      result = getProductsByFilter(result, selectedFilter);
    }

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter((p) => (p.category || "") === selectedCategory);
    }

    // Search in name/description/category/details
    if (searchQuery.trim()) {
      const queryWords = searchQuery.toLowerCase().trim().split(/\s+/);
      result = result.filter((p) => {
        const searchableText = [
          p.name || "",
          p.description || "",
          (p.category || "").replace(/-/g, " "),
          ...(p.details || []),
        ]
          .join(" ")
          .toLowerCase();

        return queryWords.every((w) => searchableText.includes(w));
      });
    }

    // Sorting
    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => getDisplayPrice(a) - getDisplayPrice(b));
        break;
      case "price-high":
        result.sort((a, b) => getDisplayPrice(b) - getDisplayPrice(a));
        break;
      case "newest":
      default:
        result.sort((a, b) => {
          const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
          const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
          return tb - ta;
        });
        break;
    }

    return result;
  }, [allProducts, selectedFilter, selectedCategory, searchQuery, sortBy]);

  const isPromotionsPage = selectedFilter === "promotions";
  const hasNoPromotions = isPromotionsPage && !isLoading && filteredProducts.length === 0;

  const getPageTitle = () => {
    if (searchQuery.trim()) return `Résultats pour "${searchQuery.trim()}"`;
    if (selectedFilter === "meches") return "Toutes les Mèches";
    if (selectedFilter === "perruques") return "Toutes les Perruques";
    if (selectedFilter === "promotions") return "Promotions";

    if (selectedCategory !== "all") {
      const cat = categories.find((c) => c.id === selectedCategory);
      return cat?.name || "Boutique";
    }

    return "Tous les Produits";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-muted/30 py-8 md:py-12">
        <div className="container">
          <div className="flex items-center gap-3 mb-2">
            {isPromotionsPage && <Tag className="h-6 w-6 text-primary" />}
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <p className="text-muted-foreground">
              {isLoading
                ? "Chargement..."
                : `${filteredProducts.length} produit${
                    filteredProducts.length > 1 ? "s" : ""
                  } trouvé${filteredProducts.length > 1 ? "s" : ""}`}
            </p>

            {/* ✅ Search input (URL synced) */}
           <div className="w-full md:w-[420px]">
  <SearchBarOnly
    value={searchQuery}
    onChange={handleSearchChange} // ✅ garde la synchro q= dans l’URL
    placeholder="Rechercher… (nom, catégorie, description, détails)"
  />
</div>

          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Categories - Desktop */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24 space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-4">Catégories</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => handleCategoryClick("all")}
                    className={cn(
                      "block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                      selectedCategory === "all"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    Tous les Produits
                  </button>

                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryClick(cat.id)}
                      className={cn(
                        "block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                        selectedCategory === cat.id
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1">
            {/* Mobile categories */}
            <div className="lg:hidden mb-6 overflow-x-auto">
              <div className="flex gap-2 pb-2">
                <button
                  onClick={() => handleCategoryClick("all")}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors",
                    selectedCategory === "all"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  Tous
                </button>

                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors",
                      selectedCategory === cat.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-border">
              {/* Sort */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  Trier par:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="appearance-none bg-background border border-input rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="newest">Nouveautés</option>
                  <option value="price-low">Prix croissant</option>
                  <option value="price-high">Prix décroissant</option>
                </select>
              </div>

              {/* View toggle */}
              <div className="flex items-center gap-1 border border-input rounded-lg p-1">
                <button
                  onClick={() => setGridView("grid")}
                  className={cn(
                    "p-2 rounded transition-colors",
                    gridView === "grid"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setGridView("list")}
                  className={cn(
                    "p-2 rounded transition-colors",
                    gridView === "list"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <LayoutList className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {/* No Promotions */}
            {!isLoading && hasNoPromotions && (
              <div className="text-center py-16 px-4">
                <Tag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Aucune promotion disponible pour le moment
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Revenez bientôt pour découvrir nos offres spéciales !
                </p>
                <Button variant="outline" onClick={() => setSearchParams({})}>
                  Voir tous les produits
                </Button>
              </div>
            )}

            {/* Products */}
            {!isLoading && filteredProducts.length > 0 ? (
              <div
                className={cn(
                  "grid gap-6",
                  gridView === "grid"
                    ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                    : "grid-cols-1"
                )}
              >
                {filteredProducts.map((product, idx) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    className="animate-fade-in"
                    style={{ animationDelay: `${idx * 50}ms` } as CSSProperties}
                  />
                ))}
              </div>
            ) : (
              !isLoading &&
              !hasNoPromotions && (
                <div className="text-center py-16">
                  <p className="text-muted-foreground mb-4">
                    Aucun produit trouvé.
                  </p>
                  <Button variant="outline" onClick={clearSearch}>
                    Effacer la recherche
                  </Button>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;
