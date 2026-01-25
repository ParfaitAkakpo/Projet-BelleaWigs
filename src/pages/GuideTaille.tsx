import { Ruler, Info, Scissors, ShieldCheck } from "lucide-react";

export default function GuideTailles() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12 max-w-5xl">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-6">
          Guide des Tailles
        </h1>

        <p className="text-muted-foreground mb-10">
          Ce guide vous aide à choisir la bonne <strong>taille de bonnet</strong>, la bonne{" "}
          <strong>longueur</strong> et la bonne <strong>quantité</strong> (mèches / bundles).
        </p>

        {/* SECTION 1 */}
        <div className="rounded-2xl border border-border p-6 bg-muted/30 mb-10">
          <div className="flex items-start gap-3 mb-4">
            <Ruler className="h-6 w-6 text-primary mt-1" />
            <div>
              <h2 className="font-semibold text-lg">1) Mesurer votre tour de tête (bonnet)</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Utilisez un mètre ruban (ou une ficelle + règle) et mesurez le tour de tête{" "}
                <strong>au niveau du front</strong>, en passant derrière les oreilles.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border rounded-xl overflow-hidden">
              <thead className="bg-background">
                <tr className="text-left">
                  <th className="p-3 border-b border-border">Taille bonnet</th>
                  <th className="p-3 border-b border-border">Tour de tête (cm)</th>
                  <th className="p-3 border-b border-border">Recommandé pour</th>
                </tr>
              </thead>
              <tbody className="bg-card">
                <tr>
                  <td className="p-3 border-b border-border font-medium">Petit (S)</td>
                  <td className="p-3 border-b border-border">52 – 54 cm</td>
                  <td className="p-3 border-b border-border">Tête petite</td>
                </tr>
                <tr>
                  <td className="p-3 border-b border-border font-medium">Moyen (M) — Standard</td>
                  <td className="p-3 border-b border-border">55 – 57 cm</td>
                  <td className="p-3 border-b border-border">La majorité des clientes</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Grand (L)</td>
                  <td className="p-3">58 – 60 cm</td>
                  <td className="p-3">Tête plus large</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4 mt-0.5" />
            <p>
              Astuce : si vous êtes entre deux tailles, choisissez <strong>M</strong>. Les bonnets
              ont souvent des élastiques/ajusteurs.
            </p>
          </div>
        </div>

        {/* SECTION 2 */}
        <div className="rounded-2xl border border-border p-6 bg-muted/30 mb-10">
          <div className="flex items-start gap-3 mb-4">
            <Scissors className="h-6 w-6 text-primary mt-1" />
            <div>
              <h2 className="font-semibold text-lg">2) Comprendre les longueurs (pouces)</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Les longueurs sont souvent indiquées en <strong>pouces</strong> (inches).
                Voici une estimation en centimètres.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border rounded-xl overflow-hidden">
              <thead className="bg-background">
                <tr className="text-left">
                  <th className="p-3 border-b border-border">Longueur</th>
                  <th className="p-3 border-b border-border">≈ en cm</th>
                  <th className="p-3 border-b border-border">Rendu</th>
                </tr>
              </thead>
              <tbody className="bg-card">
                {[
                  { inch: '10" – 12"', cm: "25 – 30 cm", look: "Court / naturel" },
                  { inch: '14" – 16"', cm: "35 – 40 cm", look: "Mi-long" },
                  { inch: '18" – 20"', cm: "45 – 50 cm", look: "Long / glamour" },
                  { inch: '22" – 24"', cm: "55 – 60 cm", look: "Très long" },
                  { inch: '26" – 30"', cm: "65 – 75 cm", look: "Ultra long" },
                ].map((row) => (
                  <tr key={row.inch}>
                    <td className="p-3 border-b border-border font-medium">{row.inch}</td>
                    <td className="p-3 border-b border-border">{row.cm}</td>
                    <td className="p-3 border-b border-border">{row.look}</td>
                  </tr>
                ))}
                <tr>
                  <td className="p-3 font-medium">NB</td>
                  <td className="p-3" colSpan={2}>
                    Les cheveux bouclés paraissent plus courts : prenez souvent{" "}
                    <strong>2" à 4"</strong> de plus si vous voulez le même rendu.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 3 */}
        <div className="rounded-2xl border border-border p-6 bg-muted/30">
          <div className="flex items-start gap-3 mb-4">
            <ShieldCheck className="h-6 w-6 text-primary mt-1" />
            <div>
              <h2 className="font-semibold text-lg">3) Combien de mèches (bundles) faut-il ?</h2>
              <p className="text-sm text-muted-foreground mt-1">
                La quantité dépend de la longueur et du volume souhaité.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border rounded-xl overflow-hidden">
              <thead className="bg-background">
                <tr className="text-left">
                  <th className="p-3 border-b border-border">Longueur</th>
                  <th className="p-3 border-b border-border">Volume normal</th>
                  <th className="p-3 border-b border-border">Volume très fourni</th>
                </tr>
              </thead>
              <tbody className="bg-card">
                <tr>
                  <td className="p-3 border-b border-border font-medium">10" – 16"</td>
                  <td className="p-3 border-b border-border">2 bundles</td>
                  <td className="p-3 border-b border-border">3 bundles</td>
                </tr>
                <tr>
                  <td className="p-3 border-b border-border font-medium">18" – 22"</td>
                  <td className="p-3 border-b border-border">3 bundles</td>
                  <td className="p-3 border-b border-border">4 bundles</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">24" – 30"</td>
                  <td className="p-3">4 bundles</td>
                  <td className="p-3">5 bundles</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            Pour un <strong>closure</strong> ou une <strong>frontale</strong>, la quantité peut
            varier selon la pose. Si vous hésitez, écrivez-nous sur WhatsApp 💬
          </div>
        </div>

        <div className="mt-10 p-6 rounded-xl bg-muted/40 text-sm text-muted-foreground">
          ✅ Besoin d’aide ? Envoyez une photo / votre longueur souhaitée sur WhatsApp, on vous conseille
          gratuitement avant l’achat.
        </div>
      </div>
    </div>
  );
}
