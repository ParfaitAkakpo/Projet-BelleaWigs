// src/App.tsx
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import Layout from "@/components/layout/Layout";
import RequireAdmin from "@/components/auth/RequireAdmin";
import EmailConfirmed from "@/pages/account/EmailConfirmed";

import { AuthProvider } from "@/contexts/AuthContext";

import { HelmetProvider } from "react-helmet-async";
import RouteSEO from "@/components/seo/RouteSEO";

import PaymentReturn from "./pages/PaymentReturn";
import Payment from "./pages/payment";

import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminProducts from "@/pages/admin/AdminProductsPanel";
import AdminCatalog from "@/pages/admin/AdminCatalog";
import AdminOrders from "@/pages/admin/AdminOrders";

// ✅ Account
import Account from "./pages/Account";
import AccountShell from "@/pages/account/AccountShell";
import AccountShop from "@/pages/account/AccountShop";
import AccountCart from "@/pages/account/AccountCart";
import AccountCheckout from "@/pages/account/AccountCheckout";
import AccountProductDetail from "@/pages/account/AccountProduitDetail";
import OrdersPage from "@/pages/account/OrdersPage";
import DashboardPage from "@/pages/account/DashboardPage";

import Index from "./pages/Index";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import NotFound from "./pages/NotFound";
import Livraison from "./pages/Livraison";
import Retours from "./pages/Retour";
import GuideTailles from "./pages/GuideTaille";
import EntretienPerruques from "./pages/EntretienPerruques";
import FAQ from "@/pages/FAQ";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <TooltipProvider>
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <RouteSEO />

            <AuthProvider>
              <Layout>
                <Routes>
                  {/* =======================
                      PUBLIC
                  ======================= */}
                  <Route path="/" element={<Index />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />

                  <Route path="/payment" element={<Payment />} />
                  <Route path="/payment/return" element={<PaymentReturn />} />
                  <Route path="/order-confirmation" element={<OrderConfirmation />} />

                  <Route path="/livraison" element={<Livraison />} />
                  <Route path="/retours-remboursements" element={<Retours />} />
                  <Route path="/guide-tailles" element={<GuideTailles />} />
                  <Route path="/entretien" element={<EntretienPerruques />} />
                  <Route path="/faq" element={<FAQ />} />

                  {/* =======================
                      AUTH
                  ======================= */}
                  <Route path="/account/login" element={<Account />} />
                  <Route path="/account/confirmed" element={<EmailConfirmed />} />

                  {/* =======================
                      ESPACE CLIENT
                  ======================= */}
                  <Route path="/account" element={<AccountShell />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="orders" element={<OrdersPage />} />

                    <Route path="shop" element={<AccountShop />} />
                    <Route path="product/:id" element={<AccountProductDetail />} />
                    <Route path="cart" element={<AccountCart />} />
                    <Route path="checkout" element={<AccountCheckout />} />

                    <Route path="favorites" element={<div>Favoris (à venir)</div>} />
                  </Route>

                  {/* =======================
                      ADMIN
                  ======================= */}
                  <Route path="/admin/login" element={<AdminLogin />} />

                  <Route element={<RequireAdmin />}>
                    <Route path="/admin">
                      <Route index element={<AdminDashboard />} />
                      <Route path="orders" element={<AdminOrders />} />
                      <Route path="products" element={<AdminProducts />} />
                      <Route path="catalog" element={<AdminCatalog />} />
                    </Route>
                  </Route>

                  {/* =======================
                      404
                  ======================= */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
