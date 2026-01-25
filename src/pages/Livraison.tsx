import { Truck, Clock, MapPin, ShieldCheck } from "lucide-react";

export default function Livraison() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12 max-w-4xl">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-6">
          Livraison
        </h1>

        <p className="text-muted-foreground mb-10">
          Nous faisons de notre mieux pour vous livrer rapidement et en toute sécurité.
          Voici tout ce que vous devez savoir concernant nos livraisons.
        </p>

        <div className="space-y-8">
          {/* Zones */}
          <div className="flex gap-4">
            <MapPin className="h-6 w-6 text-primary mt-1" />
            <div>
              <h2 className="font-semibold text-lg mb-1">Zones de livraison</h2>
              <p className="text-sm text-muted-foreground">
                Nous livrons actuellement au <strong>Togo</strong> et au <strong>Bénin</strong>.
                Les livraisons sont disponibles à Lomé, Calavi et dans plusieurs autres villes.
              </p>
            </div>
          </div>

          {/* Délais */}
          <div className="flex gap-4">
            <Clock className="h-6 w-6 text-primary mt-1" />
            <div>
              <h2 className="font-semibold text-lg mb-1">Délais de livraison</h2>
              <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                <li>Lomé & Calavi : <strong>24h</strong></li>
                <li>Autres villes : <strong>48 à 96h</strong></li>
              </ul>
            </div>
          </div>

          {/* Frais */}
          <div className="flex gap-4">
            <Truck className="h-6 w-6 text-primary mt-1" />
            <div>
              <h2 className="font-semibold text-lg mb-1">Frais de livraison</h2>
              <p className="text-sm text-muted-foreground">
                Les frais de livraison dépendent de votre zone.
                <br />
                <strong>Livraison gratuite</strong> pour les commandes importantes ou selon les promotions en cours.
              </p>
            </div>
          </div>

          {/* Sécurité */}
          <div className="flex gap-4">
            <ShieldCheck className="h-6 w-6 text-primary mt-1" />
            <div>
              <h2 className="font-semibold text-lg mb-1">Sécurité & responsabilité</h2>
              <p className="text-sm text-muted-foreground">
                Nous vous contactons toujours avant la livraison.
                Merci de fournir un numéro de téléphone valide et une adresse correcte.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 p-6 rounded-xl bg-muted/40 text-sm text-muted-foreground">
          Une question sur votre livraison ?
          <br />
          Contactez-nous directement via WhatsApp, nous sommes disponibles 7j/7.
        </div>
      </div>
    </div>
  );
}
