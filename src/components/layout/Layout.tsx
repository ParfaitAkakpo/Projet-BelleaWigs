// src/components/Layout.tsx
import type { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import WhatsAppFloating from "@/components/WhatsAppFloating";
interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main role="main" className="flex-1">
        {children}
      </main>
      <Footer />
      <WhatsAppFloating
        phoneNumber="14185089340"
        message="Bonjour ! Je viens de votre site et j’aimerais une information 🙂"
        />
      
    </div>
    
  );
};

export default Layout;
