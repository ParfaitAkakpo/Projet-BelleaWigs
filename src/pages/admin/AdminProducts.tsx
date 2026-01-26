import { useMemo, useState } from "react";
import { Package, Plus, Pencil, Trash2, X, Save, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  ProductInsert,
  ProductUpdate,
} from "@/hooks/useProducts";

import { categories } from "@/database/static";
import { formatPrice } from "@/lib/formatPrice";
import type { Product, ID } from "@/types/product";

/* ---------------- slug helper ---------------- */
function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/* ---------------- form ---------------- */
type FormState = {
  name: string;
  slug: string;
  description: string;
  category: string;
  base_price_min: number;
  original_price: number | null;
  is_active: boolean;
  details: string[];
};

const emptyForm = (): FormState => ({
  name: "",
  slug: "",
  description: "",
  category: "natural-wigs",
  base_price_min: 0,
  original_price: null,
  is_active: true,
  details: [],
});

/* ========================================================= */

export default function AdminProducts() {
  const { data: products, isLoading, error, refetch } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [newDetail, setNewDetail] = useState("");

  const saving = createProduct.isLoading || updateProduct.isLoading;

  /* ---------------- handlers ---------------- */

  const openCreate = () => {
    setEditingProduct(null);
    setForm(emptyForm());
    setNewDetail("");
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({
      name: p.name ?? "",
      slug: p.slug ?? "",
      description: String(p.description ?? ""),
      category: p.category ?? "natural-wigs",
      base_price_min: Number(p.base_price_min ?? p.price ?? 0),
      original_price: p.original_price != null ? Number(p.original_price) : null,
      is_active: p.is_active ?? true,
      details: Array.isArray(p.details) ? p.details : [],
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    setForm(emptyForm());
    setNewDetail("");
  };

  const addDetail = () => {
    if (!newDetail.trim()) return;
    setForm((p) => ({ ...p, details: [...p.details, newDetail.trim()] }));
    setNewDetail("");
  };

  const removeDetail = (idx: number) => {
    setForm((p) => ({ ...p, details: p.details.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const slug = form.slug ? slugify(form.slug) : slugify(form.name);

    if (editingProduct) {
      const patch: ProductUpdate = {
        name: form.name.trim(),
        slug,
        description: form.description || null,
        category: form.category || null,
        base_price_min: form.base_price_min as any,
        original_price: form.original_price as any,
        is_active: form.is_active,
        details: form.details as any,
        updated_at: new Date().toISOString(),
      };

      await updateProduct.update(editingProduct.id as ID, patch);
    } else {
      const payload: ProductInsert = {
        name: form.name.trim(),
        slug,
        description: form.description || null,
        category: form.category || null,
        base_price_min: form.base_price_min as any,
        original_price: form.original_price as any,
        is_active: form.is_active,
        details: form.details as any,
      };

      await createProduct.create(payload);
    }

    closeForm();
    refetch();
  };

  const handleDelete = async (id: ID) => {
    if (!confirm("Supprimer ce produit ?")) return;
    await deleteProduct.delete(id);
    refetch();
  };

  const stats = useMemo(() => {
    const total = products?.length ?? 0;
    const active = (products ?? []).filter((p) => p.is_active).length;
    return { total, active };
  }, [products]);

  /* ---------------- render ---------------- */

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Produits</h2>
          <span className="text-muted-foreground">
            ({stats.total} / actifs {stats.active})
          </span>
        </div>

        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau produit
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded">
          {error}
        </div>
      )}

      {/* table */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="p-3 text-left">Nom</th>
              <th className="p-3 text-left">Catégorie</th>
              <th className="p-3 text-left">Prix</th>
              <th className="p-3 text-left">Statut</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.slug}</div>
                </td>
                <td className="p-3">
                  {categories.find((c) => c.id === p.category)?.name ?? p.category}
                </td>
                <td className="p-3">{formatPrice(p.price)}</td>
                <td className="p-3">
                  {p.is_active ? "Actif" : "Inactif"}
                </td>
                <td className="p-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive"
                    onClick={() => handleDelete(p.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}

            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  Aucun produit
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-card rounded-xl w-full max-w-2xl p-6">
            <div className="flex justify-between mb-4">
              <h3 className="text-xl font-bold">
                {editingProduct ? "Modifier produit" : "Nouveau produit"}
              </h3>
              <button onClick={closeForm}>
                <X />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Nom"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                required
              />

              <Textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
              />

              <Input
                type="number"
                placeholder="Prix minimum"
                value={form.base_price_min}
                onChange={(e) =>
                  setForm((p) => ({ ...p, base_price_min: Number(e.target.value) }))
                }
              />

              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v) =>
                    setForm((p) => ({ ...p, is_active: v }))
                  }
                />
                <span>Produit actif</span>
              </div>

              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
