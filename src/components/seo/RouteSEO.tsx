// src/components/seo/RouteSEO.tsx
import { useLocation } from "react-router-dom";
import SEO from "./SEO";

export default function RouteSEO() {
  const { pathname } = useLocation();

  const isPrivate = pathname.startsWith("/admin") || pathname.startsWith("/account");

  switch (true) {
    case pathname === "/":
      return (
        <SEO
          title="Perruques et mèches premium au Togo & Bénin"
          description="BelléaWigs : perruques naturelles & synthétiques, mèches et tissages. Qualité premium, styles tendance, livraison au Togo et au Bénin."
          canonical="/"
          image="/og-home.jpg"
        />
      );

    case pathname === "/shop":
      return (
        <SEO
          title="Boutique"
          description="Découvrez nos perruques et mèches : naturelles & synthétiques. Choisissez votre style et commandez en ligne."
          canonical="/shop"
          image="/og-shop.jpg"
        />
      );

    case pathname === "/cart":
      return (
        <SEO
          title="Panier"
          description="Vérifiez votre panier avant de passer commande."
          canonical="/cart"
        />
      );

    case pathname === "/checkout":
      return (
        <SEO
          title="Paiement sécurisé"
          description="Finalisez votre commande BelléaWigs en toute sécurité."
          canonical="/checkout"
        />
      );

    case pathname === "/livraison":
      return (
        <SEO
          title="Livraison"
          description="Informations de livraison au Togo et au Bénin."
          canonical="/livraison"
        />
      );

    case pathname === "/retours-remboursements":
      return (
        <SEO
          title="Retours & remboursements"
          description="Politique de retours et remboursements BelléaWigs."
          canonical="/retours-remboursements"
        />
      );

    case pathname === "/guide-tailles":
      return (
        <SEO
          title="Guide des tailles"
          description="Choisissez la bonne taille de perruque avec notre guide."
          canonical="/guide-tailles"
        />
      );

    case pathname === "/entretien":
      return (
        <SEO
          title="Entretien des perruques"
          description="Conseils pour entretenir vos perruques et mèches."
          canonical="/entretien"
        />
      );

    case pathname === "/faq":
      return (
        <SEO
          title="FAQ"
          description="Questions fréquentes : livraison, paiement, produits, retours."
          canonical="/faq"
        />
      );

    // 🔒 Pages privées
    case isPrivate:
      return <SEO title="Espace privé" noindex canonical={pathname} />;

    default:
      return <SEO title="BelléaWigs" canonical={pathname} />;
  }
}
