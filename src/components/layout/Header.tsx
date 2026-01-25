// src/components/Header.tsx
import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { ShoppingBag, User, Menu, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";
import SearchAutocomplete from "@/components/SearchAutocomplete";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { totalItems } = useCart();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const closeSearch = () => setIsSearchOpen(false);

  const navLinks = [
    { href: "/", label: "Accueil" },
    { href: "/shop", label: "Boutique" },
    { href: "/shop?filter=meches", label: "Mèches" },
    { href: "/shop?filter=perruques", label: "Perruques" },
    { href: "/shop?filter=promotions", label: "Promotions" },
  ];

  // ✅ Auto-close menu/search on route change (pro polish)
  useEffect(() => {
    setIsMenuOpen(false);
    setIsSearchOpen(false);
  }, [location.pathname, location.search]);

  // ✅ Prevent menu + search open at same time (mobile UX)
  const toggleMenu = () => {
    setIsMenuOpen((v) => {
      if (!v) setIsSearchOpen(false);
      return !v;
    });
  };

  const toggleSearch = () => {
    setIsSearchOpen((v) => {
      if (!v) setIsMenuOpen(false);
      return !v;
    });
  };

  // ✅ Smarter active state: uses pathname + filter param (not exact full URL)
  const isActive = (href: string) => {
    const path = location.pathname;

    // Home
    if (href === "/") return path === "/";

    // Shop root (no filter)
    if (href === "/shop") {
      const filter = searchParams.get("filter");
      return path === "/shop" && !filter;
    }

    // Shop filter links
    if (href.startsWith("/shop?filter=")) {
      const expectedFilter = href.split("filter=")[1] ?? "";
      const currentFilter = searchParams.get("filter") ?? "";
      return path === "/shop" && currentFilter === expectedFilter;
    }

    // Fallback
    return location.pathname + location.search === href;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between md:h-20">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="font-serif text-2xl font-bold text-foreground">
            Belléa<span className="text-primary">Wigs</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary relative py-2",
                isActive(link.href)
                  ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full"
                  : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Search - Desktop Expandable */}
          <div className="hidden md:flex items-center">
            {isSearchOpen ? (
              <SearchAutocomplete
                onClose={closeSearch}
                className="animate-fade-in"
                inputClassName="w-64 h-9"
              />
            ) : (
              <Button variant="ghost" size="icon" onClick={toggleSearch}>
                <Search className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Search - Mobile Icon */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleSearch}
          >
            <Search className="h-5 w-5" />
          </Button>

          <Link to="/account">
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </Link>

          <Link to="/cart" className="relative">
            <Button variant="ghost" size="icon">
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {totalItems}
                </span>
              )}
            </Button>
          </Link>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={toggleMenu}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {isSearchOpen && (
        <div className="md:hidden border-t border-border animate-fade-in">
          <div className="container py-3">
            <SearchAutocomplete
              onClose={closeSearch}
              showCloseButton={false}
              inputClassName="flex-1"
            />
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-border animate-fade-in">
          <nav className="container py-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive(link.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
