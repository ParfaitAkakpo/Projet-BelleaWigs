import { useMemo, useState } from "react";
import { ChevronDown, HelpCircle, Truck, CreditCard, RefreshCcw, Phone } from "lucide-react";
import { Link } from "react-router-dom";

type FAQItem = {
  question: string;
  answer: string;
  icon?: React.ComponentType<{ className?: string }>;
};

export default function FAQ() {
  const faqs = useMemo<FAQItem[]>(
    () => [
      {
        question: "Quels sont les délais de livraison ?",
        answer:
          "Togo : 24–72h • Bénin : 48–96h (selon la zone). Pour Lomé et Calavi, la livraison peut se faire en 24h si le produit est disponible.",
        icon: Truck,
      },
      {
        question: "Puis-je venir récupérer ma commande ?",
        answer:
          "Oui. Lors du checkout, choisis l’option “Retrait”. Dans ce cas, les frais de livraison sont à 0 FCFA et on te confirme le point de retrait après la commande.",
        icon: Truck,
      },
      {
        question: "Quels moyens de paiement acceptez-vous ?",
        answer:
          "Mobile Money (Flooz, Mixx, etc.), carte bancaire (Visa / MasterCard) et paiement à la livraison (en espèces) selon la zone.",
        icon: CreditCard,
      },
      {
        question: "Comment choisir la bonne taille / longueur ?",
        answer:
          "Consulte notre “Guide des tailles”. Si tu hésites, écris-nous sur WhatsApp : on t’aide à choisir selon ton style et ton budget.",
        icon: HelpCircle,
      },
      {
        question: "Puis-je retourner ou échanger un produit ?",
        answer:
          "Oui, sous conditions : le produit doit être non utilisé, dans son état d’origine et avec l’emballage. Consulte la page “Retours et Remboursements” pour les détails.",
        icon: RefreshCcw,
      },
      {
        question: "Les perruques sont-elles 100% humaines ?",
        answer:
          "Nous proposons des perruques naturelles (100% cheveux humains) et des perruques synthétiques. La description de chaque produit indique clairement le type.",
        icon: HelpCircle,
      },
      {
        question: "Comment entretenir ma perruque ?",
        answer:
          "Nous avons une page complète “Entretien des perruques” (naturelles + synthétiques) avec les meilleures pratiques : lavage, séchage, chaleur, etc.",
        icon: HelpCircle,
      },
      {
        question: "Je n’ai pas reçu de confirmation, que faire ?",
        answer:
          "Vérifie ton numéro WhatsApp et ta connexion. Si besoin, contacte-nous sur WhatsApp avec ton nom + l’heure de la commande, on te confirme immédiatement.",
        icon: Phone,
      },
    ],
    []
  );

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12 max-w-4xl">
        <div className="flex items-start gap-3 mb-6">
          <HelpCircle className="h-7 w-7 text-primary mt-1" />
          <div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
              FAQ
            </h1>
            <p className="text-muted-foreground mt-2">
              Les réponses aux questions les plus fréquentes. Si tu ne trouves pas,
              écris-nous sur WhatsApp.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border overflow-hidden bg-card">
          {faqs.map((item, idx) => {
            const isOpen = openIndex === idx;
            const Icon = item.icon ?? HelpCircle;

            return (
              <div key={item.question} className="border-b border-border last:border-b-0">
                <button
                  type="button"
                  className="w-full text-left p-5 flex items-start gap-3 hover:bg-muted/30 transition-colors"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                >
                  <Icon className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{item.question}</p>
                    {isOpen && (
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                        {item.answer}
                      </p>
                    )}
                  </div>

                  <ChevronDown
                    className={`h-5 w-5 text-muted-foreground transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-border p-6 bg-muted/30">
          <p className="font-medium text-foreground mb-2">Liens utiles</p>
          <div className="flex flex-col sm:flex-row gap-3 text-sm">
            <Link className="text-primary hover:underline" to="/livraison">
              Livraison
            </Link>
            <Link className="text-primary hover:underline" to="/retours">
              Retours & Remboursements
            </Link>
            <Link className="text-primary hover:underline" to="/tailles">
              Guide des tailles
            </Link>
            <Link className="text-primary hover:underline" to="/entretien">
              Entretien des perruques
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
