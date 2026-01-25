import { Droplets, Wind, ShieldCheck, Flame, Sparkles, AlertTriangle } from "lucide-react";

export default function EntretienPerruques() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12 max-w-5xl">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-6">
          Entretien des Perruques
        </h1>

        <p className="text-muted-foreground mb-10">
          Ici, tu vas trouver des conseils simples pour garder tes perruques{" "}
          <strong>propres, brillantes</strong> et <strong>durables</strong> (naturelles & synthétiques).
        </p>

        {/* SECTION: GENERAL */}
        <div className="rounded-2xl border border-border p-6 bg-muted/30 mb-10">
          <div className="flex items-start gap-3 mb-4">
            <ShieldCheck className="h-6 w-6 text-primary mt-1" />
            <div>
              <h2 className="font-semibold text-lg">Règles générales (pour toutes les perruques)</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Ce sont les habitudes qui évitent 80% des problèmes (nœuds, frisottis, casse).
              </p>
            </div>
          </div>

          <ul className="list-disc pl-5 space-y-2 text-sm text-foreground">
            <li>Brosser doucement avant et après usage (peigne à dents larges conseillé).</li>
            <li>Éviter de dormir avec (ou alors bonnet en satin + tresses/attache légère).</li>
            <li>Limiter les produits lourds (gel, cire) : ça encrasse rapidement.</li>
            <li>Ranger sur un support / mannequin, à l’abri de la poussière et du soleil.</li>
          </ul>
        </div>

        {/* SECTION: NATURAL */}
        <div className="rounded-2xl border border-border p-6 bg-muted/30 mb-10">
          <div className="flex items-start gap-3 mb-4">
            <Droplets className="h-6 w-6 text-primary mt-1" />
            <div>
              <h2 className="font-semibold text-lg">Perruques naturelles (100% humaines)</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Elles se traitent presque comme tes propres cheveux : lavage + hydratation + protection.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-card border border-border">
              <h3 className="font-semibold mb-2">✅ Lavage (tous les 7 à 14 jours)</h3>
              <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground">
                <li>Démêler à sec, de la pointe vers la racine.</li>
                <li>Rincer à l’eau tiède.</li>
                <li>Shampoing doux (sans frotter fort) : lisser avec les mains.</li>
                <li>Après-shampoing / masque 5–10 min sur les longueurs.</li>
                <li>Rincer, essorer avec serviette (sans tordre).</li>
              </ol>
            </div>

            <div className="p-5 rounded-xl bg-card border border-border">
              <h3 className="font-semibold mb-2">✨ Séchage & coiffage</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                <li>Séchage à l’air libre recommandé.</li>
                <li>Si sèche-cheveux : chaleur moyenne + protecteur thermique.</li>
                <li>Huile légère uniquement sur les pointes (pas sur la lace).</li>
                <li>Éviter de peigner quand c’est trempé : attendre un peu.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* SECTION: SYNTHETIC */}
        <div className="rounded-2xl border border-border p-6 bg-muted/30 mb-10">
          <div className="flex items-start gap-3 mb-4">
            <Wind className="h-6 w-6 text-primary mt-1" />
            <div>
              <h2 className="font-semibold text-lg">Perruques synthétiques</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Le synthétique demande moins de lavage, mais plus de douceur (et moins de chaleur).
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-card border border-border">
              <h3 className="font-semibold mb-2">✅ Lavage (tous les 15 à 30 jours)</h3>
              <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground">
                <li>Démêler doucement à sec.</li>
                <li>Tremper 5–10 min dans eau froide/tiède + shampoing doux.</li>
                <li>Rincer sans frotter.</li>
                <li>Mettre un peu d’après-shampoing (optionnel) puis rincer.</li>
                <li>Essorer avec serviette, puis sécher à l’air libre.</li>
              </ol>
            </div>

            <div className="p-5 rounded-xl bg-card border border-border">
              <h3 className="font-semibold mb-2">🚫 Chaleur & lissage</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                <li>Ne pas utiliser de fer si la perruque n’est pas “heat friendly”.</li>
                <li>Éviter l’eau très chaude : ça peut déformer la fibre.</li>
                <li>Utiliser un spray démêlant spécial synthétique si possible.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* SECTION: HEAT */}
        <div className="rounded-2xl border border-border p-6 bg-muted/30 mb-10">
          <div className="flex items-start gap-3 mb-4">
            <Flame className="h-6 w-6 text-primary mt-1" />
            <div>
              <h2 className="font-semibold text-lg">Chaleur : ce que tu peux faire (et éviter)</h2>
              <p className="text-sm text-muted-foreground mt-1">
                La chaleur est la cause #1 des perruques abîmées (surtout sur les pointes).
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-card border border-border">
              <h3 className="font-semibold mb-2">✅ OK (naturelles)</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                <li>Protecteur thermique obligatoire.</li>
                <li>Chaleur moyenne, pas au max.</li>
                <li>Limiter les passages au fer (1–2 max).</li>
              </ul>
            </div>

            <div className="p-5 rounded-xl bg-card border border-border">
              <h3 className="font-semibold mb-2">🚫 À éviter</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                <li>Fer sur synthétique non “heat friendly”.</li>
                <li>Fer direct sur cheveux mouillés.</li>
                <li>Produits alcoolisés en excès (dessèchent).</li>
              </ul>
            </div>
          </div>
        </div>

        {/* SECTION: PROBLEMS */}
        <div className="rounded-2xl border border-border p-6 bg-muted/30">
          <div className="flex items-start gap-3 mb-4">
            <Sparkles className="h-6 w-6 text-primary mt-1" />
            <div>
              <h2 className="font-semibold text-lg">Problèmes fréquents + solutions rapides</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Les petits gestes qui sauvent la perruque.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: "Nœuds / cheveux qui s’emmêlent",
                tips: [
                  "Brosser de la pointe vers la racine",
                  "Spray démêlant (léger)",
                  "Attacher la perruque si vent / moto",
                ],
              },
              {
                title: "Frisottis sur les pointes",
                tips: [
                  "Huile légère sur pointes (naturelles)",
                  "Couper 0,5–1 cm si nécessaire",
                  "Réduire chaleur au fer",
                ],
              },
              {
                title: "Perte de brillance",
                tips: [
                  "Masque hydratant (naturelles)",
                  "Lavage plus doux, moins de produits",
                  "Séchage à l’air libre",
                ],
              },
              {
                title: "Lace fragile / déchirure",
                tips: [
                  "Manipuler doucement",
                  "Éviter colle trop agressive",
                  "Retirer avec dissolvant adapté",
                ],
              },
            ].map((box) => (
              <div key={box.title} className="p-5 rounded-xl bg-card border border-border">
                <h3 className="font-semibold mb-2">{box.title}</h3>
                <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                  {box.tips.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-start gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4 mt-0.5" />
            <p>
              Si tu n’es pas sûre du type (naturel/synthétique) ou du niveau de chaleur,
              écris-nous sur WhatsApp : on te conseille avant de faire une bêtise.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
