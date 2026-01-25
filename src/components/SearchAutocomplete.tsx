// src/components/SearchAutocomplete.tsx
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";

interface SearchAutocompleteProps {
  onClose?: () => void;
  className?: string;
  inputClassName?: string;
  showCloseButton?: boolean;
  autoFocus?: boolean;
}

const SearchAutocomplete = ({
  onClose,
  className,
  inputClassName,
  showCloseButton = true,
  autoFocus = true,
}: SearchAutocompleteProps) => {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: dbProducts, isLoading } = useProducts();

  const allProducts: Product[] = useMemo(() => dbProducts ?? [], [dbProducts]);

  // ✅ Suggestions (nom + description + catégorie + détails)
 const suggestions = useMemo(() => {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const words = q.split(/\s+/);

  return allProducts
    // ✅ seulement produits actifs
    .filter((p) => p.is_active === true)
    .filter((p) => {
      const searchableText = [
        p.name ?? "",
        p.description ?? "",
        String(p.category ?? "").replace(/-/g, " "),
        ...(Array.isArray(p.details) ? p.details : []),
      ]
        .join(" ")
        .toLowerCase();

      return words.every((w) => searchableText.includes(w));
    })
    .slice(0, 6);
}, [query, allProducts]);


  // ✅ Submit recherche => Shop avec q=
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    navigate(`/shop?q=${encodeURIComponent(trimmed)}`);
    setQuery("");
    setIsFocused(false);
    setSelectedIndex(-1);
    onClose?.();
  };

  // ✅ Click suggestion => page produit
  const handleSuggestionClick = (productId: number | string) => {
    navigate(`/product/${encodeURIComponent(String(productId))}`);
    setQuery("");
    setIsFocused(false);
    setSelectedIndex(-1);
    onClose?.();
  };

  // ✅ Navigation clavier
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isFocused) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      return;
    }

    if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      const p = suggestions[selectedIndex];
      if (p) handleSuggestionClick(p.id);
      return;
    }

    if (e.key === "Escape") {
      setIsFocused(false);
      setSelectedIndex(-1);
      onClose?.();
      return;
    }
  };

  // reset index à chaque refresh suggestions
  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions]);

  // ✅ click outside pour fermer
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showSuggestions =
    isFocused && query.trim().length >= 2 && (suggestions.length > 0 || isLoading);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Rechercher perruque, mèche, couleur..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            className={cn("pr-10", inputClassName)}
            autoFocus={autoFocus}
          />

          {isLoading && query.trim().length >= 2 && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}

          {query.trim().length > 0 && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSelectedIndex(-1);
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Effacer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Button type="submit" size="icon" variant="ghost" aria-label="Rechercher">
          <Search className="h-5 w-5" />
        </Button>

        {showCloseButton && (
          <Button type="button" size="icon" variant="ghost" onClick={onClose} aria-label="Fermer">
            <X className="h-5 w-5" />
          </Button>
        )}
      </form>

      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-[100] overflow-hidden">
          {suggestions.length > 0 ? (
            <>
              <ul className="max-h-80 overflow-y-auto">
                {suggestions.map((product, index) => (
                  <li key={product.id}>
                    <button
                      type="button"
                      onClick={() => handleSuggestionClick(product.id)}
                      className={cn(
                        "w-full p-3 text-left hover:bg-muted transition-colors",
                        selectedIndex === index && "bg-muted"
                      )}
                    >
                      <p className="font-medium text-sm truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {String(product.category ?? "").replace(/-/g, " ")}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>

              <Link
                to={`/shop?q=${encodeURIComponent(query.trim())}`}
                onClick={() => {
                  setQuery("");
                  setIsFocused(false);
                  setSelectedIndex(-1);
                  onClose?.();
                }}
                className="block p-3 text-center text-sm text-primary font-medium border-t border-border hover:bg-muted"
              >
                Voir tous les résultats →
              </Link>
            </>
          ) : (
            <div className="p-4 text-center text-muted-foreground">Recherche…</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;
