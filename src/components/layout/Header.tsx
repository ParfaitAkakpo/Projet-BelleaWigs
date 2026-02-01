// src/components/Header.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ShoppingBag, User, Menu, X, Search, LogOut, Package, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";
import SearchAutocomplete from "@/components/SearchAutocomplete";
import { supabase } from "@/integrations/supabase/client";

type Profile = {
  id: string;
  role?: string | null;
};

const sb = supabase as any;

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [session, setSession] = useState<any>(null);
  const isLoggedIn = !!session?.user;

  const [profile, setProfile] = useState<Profile | null>(null);
  const isAdmin = (profile?.role ?? "") === "admin";
  const isCustomer = isLoggedIn && !isAdmin;

  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const { totalItems } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const closeSearch = () => setIsSearchOpen(false);

  // Session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Profile (role)
  useEffect(() => {
    async function loadProfile() {
      if (!session?.user?.id) {
        setProfile(null);
        return;
      }
      const res = await sb
        .from("profiles")
        .select("id, role")
        .eq("id", session.user.id)
        .maybeSingle();

      setProfile(res.data ?? null);
    }
    loadProfile();
  }, [session?.user?.id]);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsSearchOpen(false);
    setAccountMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!accountMenuOpen) return;

    const onDown = (e: MouseEvent) => {
      const el = dropdownRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) setAccountMenuOpen(false);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAccountMenuOpen(false);
    };

    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [accountMenuOpen]);

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

  // ✅ liens publics VS liens "dans le compte"
  const navLinks = useMemo(() => {
    if (isCustomer) {
      return [
        { href: "/account/dashboard", label: "Tableau de bord" },
        { href: "/account/shop", label: "Boutique" },
        { href: "/account/shop?filter=meches", label: "Mèches" },
        { href: "/account/shop?filter=perruques", label: "Perruques" },
        { href: "/account/shop?filter=promotions", label: "Promotions" },
      ];
    }

    // admin OU non connecté = header public normal
    return [
      { href: "/", label: "Accueil" },
      { href: "/shop", label: "Boutique" },
      { href: "/shop?filter=meches", label: "Mèches" },
      { href: "/shop?filter=perruques", label: "Perruques" },
      { href: "/shop?filter=promotions", label: "Promotions" },
    ];
  }, [isCustomer]);

  const isActive = (href: string) => {
    const path = location.pathname;

    // handle /shop filters
    if (href === "/shop") {
      const filter = searchParams.get("filter");
      return path === "/shop" && !filter;
    }
    if (href.startsWith("/shop?filter=")) {
      const expectedFilter = href.split("filter=")[1] ?? "";
      const currentFilter = searchParams.get("filter") ?? "";
      return path === "/shop" && currentFilter === expectedFilter;
    }

    // handle /account/shop filters
    if (href === "/account/shop") {
      const filter = searchParams.get("filter");
      return path === "/account/shop" && !filter;
    }
    if (href.startsWith("/account/shop?filter=")) {
      const expectedFilter = href.split("filter=")[1] ?? "";
      const currentFilter = searchParams.get("filter") ?? "";
      return path === "/account/shop" && currentFilter === expectedFilter;
    }

    // default
    return location.pathname + location.search === href;
  };

  const accountLabel = useMemo(() => (isLoggedIn ? "Mon compte" : "Connexion"), [isLoggedIn]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setAccountMenuOpen(false);
      navigate("/");
    } catch (e) {
      console.error("logout error", e);
    }
  };

  // ✅ Logo : client connecté => dashboard compte
  const logoTo = isCustomer ? "/account/dashboard" : "/";

  // ✅ Cart : client connecté => panier dans compte
  const cartTo = isCustomer ? "/account/cart" : "/cart";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between md:h-20">
        <Link to={logoTo} className="flex items-center gap-2">
          <span className="font-serif text-2xl font-bold text-foreground">
            Belléa<span className="text-primary">Wigs</span>
          </span>
        </Link>

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

        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden md:flex items-center">
            {isSearchOpen ? (
              <SearchAutocomplete onClose={closeSearch} className="animate-fade-in" inputClassName="w-64 h-9" />
            ) : (
              <Button variant="ghost" size="icon" onClick={toggleSearch} aria-label="Rechercher">
                <Search className="h-5 w-5" />
              </Button>
            )}
          </div>

          <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleSearch} aria-label="Rechercher">
            <Search className="h-5 w-5" />
          </Button>

          {/* Account */}
          <div className="relative" ref={dropdownRef}>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label={accountLabel}
              aria-haspopup="menu"
              aria-expanded={accountMenuOpen}
              onClick={() => {
                if (!isLoggedIn) return navigate("/account");
                setAccountMenuOpen((v) => !v);
              }}
            >
              <User className="h-5 w-5" />
              {isLoggedIn && (
                <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-primary ring-2 ring-background" />
              )}
            </Button>

            {isLoggedIn && accountMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium text-foreground">{isAdmin ? "Admin" : "Connecté"}</p>
                  <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
                </div>

                <div className="p-2 flex flex-col gap-1">
                  {!isAdmin && (
                    <>
                      <button
                        type="button"
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted text-foreground"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          navigate("/account/dashboard");
                        }}
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Tableau de bord
                      </button>

                      <button
                        type="button"
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted text-foreground"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          navigate("/account/orders");
                        }}
                      >
                        <Package className="h-4 w-4" />
                        Mes commandes
                      </button>
                    </>
                  )}

                  {isAdmin && (
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted text-foreground"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        navigate("/admin");
                      }}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard admin
                    </button>
                  )}

                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-destructive hover:text-destructive-foreground text-destructive"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Cart */}
          <Link to={cartTo} className="relative">
            <Button variant="ghost" size="icon" className="relative" aria-label="Panier">
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {totalItems}
                </span>
              )}
            </Button>
          </Link>

          <Button variant="ghost" size="icon" className="lg:hidden" onClick={toggleMenu} aria-label="Menu">
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {isSearchOpen && (
        <div className="md:hidden border-t border-border animate-fade-in">
          <div className="container py-3">
            <SearchAutocomplete onClose={closeSearch} showCloseButton={false} inputClassName="flex-1" />
          </div>
        </div>
      )}

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
                  isActive(link.href) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                )}
              >
                {link.label}
              </Link>
            ))}

            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                navigate(isLoggedIn ? (isAdmin ? "/admin" : "/account/dashboard") : "/account");
              }}
              className="text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-muted"
            >
              {isLoggedIn ? (isAdmin ? "Admin" : "Mon compte") : "Connexion"}
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
