import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Instagram, MessageCircle } from 'lucide-react';
import flooz from "@/assets/payments/flooz.svg";


const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">

          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="inline-block">
              <span className="font-serif text-2xl font-bold">
                Belléa<span className="text-primary">Wigs</span>
              </span>
            </Link>
            <p className="text-sm text-background/70 leading-relaxed">
              Votre destination premium pour des perruques et mèches de qualité au Togo et au Bénin.
              Beauté, élégance et confiance.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-background/70 hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-background/70 hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-background/70 hover:text-primary transition-colors">
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-serif text-lg font-semibold">Liens Rapides</h4>
            <ul className="space-y-2">
              {[
                'Boutique',
                'Perruques Naturelles',
                'Perruques Synthétiques',
                'Mèches Naturelles',
                'Mèches Synthétiques',
                'Mon Compte'
              ].map((item) => (
                <li key={item}>
                  <Link
                    to="/shop"
                    className="text-sm text-background/70 hover:text-primary transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
        <div className="space-y-4">
  <h4 className="font-serif text-lg font-semibold">Informations</h4>

  <ul className="space-y-2">
    {[
      { label: "Livraison", path: "/livraison" },
      { label: "Retours et Remboursements", path: "/retours-remboursements" },
      { label: "Guide des Tailles", path: "/guide-tailles" },
      { label: "Entretien des Perruques", path: "/entretien" },
      { label: "FAQ", path: "/faq" },
    ].map((item) => (
      <li key={item.path}>
        <Link
          to={item.path}
          className="text-sm text-background/70 hover:text-primary transition-colors"
        >
          {item.label}
        </Link>
      </li>
    ))}
  </ul>
</div>


          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-serif text-lg font-semibold">Contact</h4>
            <ul className="space-y-3">

              {/* Téléphone */}
              
               <li className="flex items-center gap-3 text-sm text-background/70">
                <Phone className="h-4 w-4 text-primary" />
                <span>+228 90 03 48 78 (Togo) / +229 66 34 56 95 (Bénin)</span>
              </li>

              {/* WhatsApp */}
              
               <li className="flex items-center gap-3 text-sm text-background/70">
                <MessageCircle className="h-4 w-4 text-primary" />
                <span>WhatsApp: +228 90 03 48 78 / +229 66 34 56 95 </span>
              </li>

              {/* Email */}
              <li className="flex items-center gap-3 text-sm text-background/70">
                <Mail className="h-4 w-4 text-primary" />
                <span>contact@belleawigs.com</span>
              </li>

              {/* Adresse */}
             

                <li className="flex items-start gap-3 text-sm text-background/70">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                <span>Lomé, Togo<br />Abomey-Calavi, Bénin</span>
              </li>

            </ul>
          </div>

        </div>
  

        {/* Bottom */}
       <div className="border-t border-background/20 mt-12 pt-6">
  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
    
    {/* Texte droits */}
    <p className="text-xs text-background/60">
      © {new Date().getFullYear()} BelléaWigs. Tous droits réservés.
    </p>

    {/* Logos paiement */}
    <div className="flex items-center gap-4">
      {[
        "/src/assets/payments/flooz.svg",
        "/src/assets/payments/mixx.svg",
        "/src/assets/payments/visa.svg",
        "/src/assets/payments/mastercard.svg",
        "/src/assets/payments/moov-money.svg",
        "/src/assets/payments/mtn-momo.svg"
      ].map((logo) => (
        <img
          key={logo}
          src={logo}
          alt="Moyen de paiement"
          className="h-6 opacity-80 hover:opacity-100 transition"
        />
      ))}
    </div>
  </div>
</div>


      </div>
    </footer>
  );
};

export default Footer;
