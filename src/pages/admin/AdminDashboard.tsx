import { useState } from "react";
import AdminProducts from "./AdminProducts";
import AdminCatalog from "./AdminCatalog";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const [tab, setTab] = useState<"products" | "catalog">("products");

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container py-6 flex items-center gap-2">
        <Button
          variant={tab === "products" ? "default" : "outline"}
          onClick={() => setTab("products")}
        >
          Produits
        </Button>
        <Button
          variant={tab === "catalog" ? "default" : "outline"}
          onClick={() => setTab("catalog")}
        >
          Couleurs / Images / Variantes
        </Button>
      </div>

      {tab === "products" ? <AdminProducts /> : <AdminCatalog />}
    </div>
  );
}
