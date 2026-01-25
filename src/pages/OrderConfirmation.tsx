import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { CheckCircle, Package, Phone, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const OrderConfirmation = () => {
  const { clearCart } = useCart();
  useEffect(() => { clearCart(); }, []);
  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-16">
      <div className="container max-w-lg text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center animate-scale-in">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4 animate-slide-up">
          Commande Confirmée!
        </h1>
        
        <p className="text-muted-foreground mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
          Merci pour votre commande. Vous recevrez bientôt un appel ou un message WhatsApp pour confirmer les détails de livraison.
        </p>

        <div className="p-6 bg-card rounded-xl shadow-card mb-8 text-left animate-slide-up" style={{ animationDelay: '200ms' }}>
          <h3 className="font-serif text-lg font-semibold text-foreground mb-4">Prochaines étapes</h3>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Confirmation par téléphone</p>
                <p className="text-sm text-muted-foreground">
                  Notre équipe vous contactera dans les 30 minutes pour confirmer votre commande.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Préparation et livraison</p>
                <p className="text-sm text-muted-foreground">
                  Votre commande sera préparée et livrée dans les 24-72h selon votre localisation.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '300ms' }}>
          <Link to="/shop">
            <Button variant="hero" size="lg">
              Continuer mes achats
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline" size="lg">
              Retour à l'accueil
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
