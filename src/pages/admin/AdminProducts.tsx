// src/pages/admin/AdminProducts.tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  type ProductInsert,
  type ProductUpdate,
} from "@/hooks/useProducts";

import { categories } from "@/database/static";
import { formatPrice } from "@/lib/formatPrice";
import type { Product, ID } from "@/types/product";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

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

export default function AdminProducts() {
  const navigate = useNavigate();

  const { data: products, isLoading, error, refetch } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [newDetail, setNewDetail] = useState("");

  const saving = createProduct.isLoading || updateProduct.isLoading;

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
      category: String(p.category ?? "natural-wigs"),
      base_price_min: Number(p.base_price_min ?? p.price ?? 0),
      original_price: p.original_price != null ? Number(p.original_price) : null,
      is_active: p.is_active ?? true,
      details: Array.isArray(p.details) ? p.details : [],
    });
    setNewDetail("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    setForm(emptyForm());
    setNewDetail("");
  };

  const addDetail = () => {
    const d = newDetail.trim();
    if (!d) return;
    setForm((prev) => ({ ...prev, details: [...(prev.details || []), d] }));
    setNewDetail("");
  };

  const removeDetail = (idx: number) => {
    setForm((prev) => ({ ...prev, details: prev.details.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const name = form.name.trim();
    if (!name) return;

    const slug = form.slug.trim() ? slugify(form.slug) : slugify(name);

    if (editingProduct) {
      const patch: ProductUpdate = {
        name,
        slug,
        description: form.description?.trim() || null,
        category: form.category || null,
        base_price_min: Number(form.base_price_min ?? 0) as any,
        original_price: form.original_price != null ? (Number(form.original_price) as any) : null,
        is_active: form.is_active,
        details: (form.details ?? []) as any,
        updated_at: new Date().toISOString(),
      };

      const updated = await updateProduct.update(editingProduct.id as ID, patch);
      if (!updated) return;

      closeForm();
      refetch();
      return;
    }

    const payload: ProductInsert = {
      name,
      slug,
      description: form.description?.trim() || null,
      category: form.category || null,
      base_price_min: Number(form.base_price_min ?? 0) as any,
      original_price: form.original_price != null ? (Number(form.original_price) as any) : null,
      is_active: form.is_active,
      details: (form.details ?? []) as any,
    };

    const created = await createProduct.create(payload);
    if (!created) return;

    closeForm();
    refetch();
  };

  const handleDelete = async (id: ID) => {
    if (!confirm("Supprimer ce produit ?")) return;
    const ok = await deleteProduct.delete(id);
    if (ok) refetch();
  };

  const stats = useMemo(() => {
    const total = products?.length ?? 0;
    const active = (products ?? []).filter((p) => p.is_active).length;
    return { total, active };
  }, [products]);

  return (
    <div className="space-y-6">
      {/* Title + actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          <h2 className="font-serif text-2xl font-bold">Produits</h2>
          <span className="text-muted-foreground">
            ({stats.total} / actifs: {stats.active})
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={refetch}>
            Rafraîchir
          </Button>
          <Button onClick={openCreate} variant="hero">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau produit
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">{error}</div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-2xl mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-xl font-bold">
                {editingProduct ? "Modifier le produit" : "Nouveau produit"}
              </h3>
              <button onClick={closeForm} className="text-muted-foreground hover:text-foreground">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Nom *</label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      name: e.target.value,
                      slug: p.slug ? p.slug : slugify(e.target.value),
                    }))
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Slug (auto si vide)</label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm((p) => ({ ...p, slug: slugify(e.target.value) }))}
                  placeholder="ex: perruque-lace-bresilienne"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Catégorie</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Prix min</label>
                  <Input
                    type="number"
                    value={form.base_price_min}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, base_price_min: parseInt(e.target.value) || 0 }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Prix original</label>
                  <Input
                    type="number"
                    value={form.original_price ?? ""}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        original_price: e.target.value ? parseInt(e.target.value) : null,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(checked) => setForm((p) => ({ ...p, is_active: checked }))}
                />
                <span className="text-sm">Produit actif (visible en boutique)</span>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Détails</label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newDetail}
                    onChange={(e) => setNewDetail(e.target.value)}
                    placeholder="Ex: Cheveux 100% humains"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addDetail();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addDetail}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(form.details ?? []).map((d, idx) => (
                    <span
                      key={idx}
                      className="bg-muted px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {d}
                      <button type="button" onClick={() => removeDetail(idx)}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={closeForm} className="flex-1">
                  Annuler
                </Button>
                <Button type="submit" variant="hero" className="flex-1" disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {editingProduct ? "Mettre à jour" : "Créer"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">Nom</th>
                <th className="text-left p-4 font-medium">Catégorie</th>
                <th className="text-left p-4 font-medium">Prix affiché</th>
                <th className="text-left p-4 font-medium">Statut</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(products ?? []).map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                  <td className="p-4">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.slug}</div>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {categories.find((c) => c.id === p.category)?.name ?? p.category ?? "-"}
                  </td>
                  <td className="p-4">
                    <div className="font-medium">{formatPrice(p.price)}</div>
                    {p.original_price != null && (
                      <div className="text-xs text-muted-foreground line-through">
                        {formatPrice(Number(p.original_price))}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={p.is_active ? "text-green-600" : "text-red-600"}>
                      {p.is_active ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleDelete(p.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {(!products || products.length === 0) && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    Aucun produit. Clique sur “Nouveau produit”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        Astuce: utilise ensuite “AdminCatalog” pour gérer couleurs/images/variantes des produits.
      </div>
    </div>
  );
}
