import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import Layout from "@/components/layout/Layout";
import RequireAdmin from "@/components/auth/RequireAdmin";
import PaymentReturn from "./pages/PaymentReturn";

import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminCatalog";

import Index from "./pages/Index";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Account from "./pages/Account";
import NotFound from "./pages/NotFound";
import Livraison from "./pages/Livraison";
import Retours from "./pages/Retour";
import GuideTailles from "./pages/GuideTaille";
import EntretienPerruques from "./pages/EntretienPerruques";
import FAQ from "@/pages/FAQ";


// ⚠️ mets le bon chemin selon ton projet
import Payment from "./pages/payment"; // ou "./pages/payment" si ton fichier s'appelle payment.tsx

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CartProvider>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Layout>
            <Routes>
              
              <Route path="/" element={<Index />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/admin/login" element={<AdminLogin />} />

               {/* admin protégé */}
             <Route path="/admin/login" element={<AdminLogin />} />

               <Route element={<RequireAdmin />}>
               <Route path="/admin" element={<AdminDashboard />} />
               </Route>

              {/* ✅ AJOUTE ICI */}
              <Route path="/payment" element={<Payment />} />
              <Route path="/payment/return" element={<PaymentReturn />} />

              <Route path="/order-confirmation" element={<OrderConfirmation />} />
              <Route path="/account" element={<Account />} />
              <Route path="*" element={<NotFound />} />
              <Route path="/livraison" element={<Livraison />} />
              <Route path="/retours-remboursements" element={<Retours />} />
              <Route path="/guide-tailles" element={<GuideTailles />} />
              <Route path="/entretien" element={<EntretienPerruques />} />
              <Route path="/faq" element={<FAQ />} />

            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </CartProvider>
  </QueryClientProvider>
);

export default App;
