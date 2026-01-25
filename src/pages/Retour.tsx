import { RefreshCcw, ShieldCheck, Clock, AlertTriangle } from "lucide-react";

export default function Retours() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12 max-w-4xl">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-6">
          Retours & Remboursements
        </h1>

        <p className="text-muted-foreground mb-10">
          Chez BelléaWigs, votre satisfaction est une priorité. Voici notre politique de
          retours et remboursements, claire et transparente.
        </p>

        <div className="space-y-8">
          {/* Conditions générales */}
          <div className="flex gap-4">
            <ShieldCheck className="h-6 w-6 text-primary mt-1" />
            <div>
              <h2 className="font-semibold text-lg mb-1">Conditions générales</h2>
              <p className="text-sm text-muted-foreground">
                Pour des raisons d’hygiène, les perruques, mèches et accessoires{" "}
                <strong>ne peuvent pas être repris</strong> si le produit a été{" "}
                <strong>ouvert, porté, utilisé</strong> ou si l’emballage d’origine est endommagé.
              </p>
            </div>
          </div>

          {/* Délai */}
          <div className="flex gap-4">
            <Clock className="h-6 w-6 text-primary mt-1" />
            <div>
              <h2 className="font-semibold text-lg mb-1">Délai pour signaler un problème</h2>
              <p className="text-sm text-muted-foreground">
                Vous disposez de <strong>24 heures après réception</strong> pour signaler un
                problème (article manquant, erreur de produit, produit endommagé).
              </p>
            </div>
          </div>

          {/* Retours acceptés */}
          <div className="flex gap-4">
            <RefreshCcw className="h-6 w-6 text-primary mt-1" />
            <div>
              <h2 className="font-semibold text-lg mb-1">Cas où un retour est accepté</h2>
              <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                <li>Vous avez reçu le <strong>mauvais produit</strong>.</li>
                <li>Le produit est arrivé <strong>endommagé</strong> (preuve à l’appui).</li>
                <li>Il manque un article dans votre commande.</li>
              </ul>
            </div>
          </div>

          {/* Non acceptés */}
          <div className="flex gap-4">
            <AlertTriangle className="h-6 w-6 text-primary mt-1" />
            <div>
              <h2 className="font-semibold text-lg mb-1">Cas où un retour est refusé</h2>
              <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                <li>Le produit a été <strong>porté / testé / utilisé</strong>.</li>
                <li>L’emballage d’origine est <strong>absent</strong> ou abîmé.</li>
                <li>La demande est faite après <strong>24h</strong>.</li>
                <li>Changement d’avis (couleur/longueur) après ouverture.</li>
              </ul>
            </div>
          </div>

          {/* Remboursement */}
          <div className="rounded-xl border border-border p-6 bg-muted/30">
            <h2 className="font-semibold text-lg mb-2">Remboursements</h2>
            <p className="text-sm text-muted-foreground">
              Si votre demande est validée, nous proposons selon le cas :
            </p>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1 mt-2">
              <li><strong>Échange</strong> (si produit disponible)</li>
              <li><strong>Avoir</strong> / bon d’achat</li>
              <li><strong>Remboursement</strong> (cas exceptionnels)</li>
            </ul>

            <p className="text-sm text-muted-foreground mt-3">
              Les frais de retour peuvent être à la charge du client sauf erreur de notre part.
            </p>
          </div>
        </div>

        <div className="mt-12 p-6 rounded-xl bg-muted/40 text-sm text-muted-foreground">
          📩 Pour toute demande, contactez-nous via WhatsApp avec :
          <br />✅ Numéro de commande • ✅ Photos/vidéo • ✅ Description du problème
        </div>
      </div>
    </div>
  );
}
