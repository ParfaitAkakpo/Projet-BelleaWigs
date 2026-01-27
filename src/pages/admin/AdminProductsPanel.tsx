// src/pages/admin/AdminProductsPanel.tsx
import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, X, Save, Loader2, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  useProductsAdmin,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  ProductInsert,
  ProductUpdate,
} from "@/hooks/useProducts";

import { categories } from "@/database/static";
import { formatPrice } from "@/lib/formatPrice";
import type { Product, ID } from "@/types/product";

// helper slug (simple)
function slugify(s: string) {
  return String(s ?? "")
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

export default function AdminProductsPanel() {
  const { data: products, isLoading, error, refetch } = useProductsAdmin();
  const productsSafe = Array.isArray(products) ? products : [];

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [newDetail, setNewDetail] = useState("");

  const saving = createProduct.isLoading || updateProduct.isLoading;

  const stats = useMemo(() => {
    const total = productsSafe.length;
    const active = productsSafe.filter((p) => !!p.is_active).length;
    return { total, active };
  }, [productsSafe]);

  // IDs stables (labels + inputs)
  const ids = {
    modalTitle: "admin_product_modal_title",
    name: "admin_product_name",
    slug: "admin_product_slug",
    category: "admin_product_category",
    description: "admin_product_description",
    priceMin: "admin_product_price_min",
    priceOriginal: "admin_product_price_original",
    isActive: "admin_product_is_active",
    newDetail: "admin_product_new_detail",
  } as const;

  const openCreate = () => {
    setEditingProduct(null);
    setForm(emptyForm());
    setNewDetail("");
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);

    const baseMin =
      Number((p as any)?.base_price_min ?? (p as any)?.basePriceMin ?? p.price ?? 0) || 0;

    const detailsArr = Array.isArray((p as any)?.details) ? (p as any).details : [];

    setForm({
      name: p.name ?? "",
      slug: p.slug ?? "",
      description: String(p.description ?? ""),
      category: String(p.category ?? "natural-wigs"),
      base_price_min: baseMin,
      original_price: p.original_price != null ? Number(p.original_price) : null,
      is_active: p.is_active ?? true,
      details: detailsArr,
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
    if (saving) return;

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
        is_active: !!form.is_active,
        details: (form.details ?? []) as any,
        updated_at: new Date().toISOString(),
      };

      const updated = await updateProduct.update(editingProduct.id as ID, patch);
      if (!updated) return;

      closeForm();
      refetch?.();
      return;
    }

    const payload: ProductInsert = {
      name,
      slug,
      description: form.description?.trim() || null,
      category: form.category || null,
      base_price_min: Number(form.base_price_min ?? 0) as any,
      original_price: form.original_price != null ? (Number(form.original_price) as any) : null,
      is_active: !!form.is_active,
      details: (form.details ?? []) as any,
    };

    const created = await createProduct.create(payload);
    if (!created) return;

    closeForm();
    refetch?.();
  };

  const handleDelete = async (id: any) => {
    if (!confirm("Supprimer ce produit ?")) return;
    const ok = await deleteProduct.delete(id as ID);
    if (ok) refetch?.();
  };

  return (
    <div className="p-6 bg-card rounded-xl shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <h2 className="font-serif text-xl font-semibold">Produits (Admin)</h2>
          <span className="text-sm text-muted-foreground">
            ({stats.total} / actifs: {stats.active})
          </span>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch?.()} disabled={isLoading || saving}>
            Rafraîchir
          </Button>
          <Button variant="hero" onClick={openCreate} disabled={saving}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
          {String(error)}
        </div>
      )}

      {isLoading ? (
        <div className="mt-6 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement...
        </div>
      ) : (
        <div className="mt-6 bg-background rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th scope="col" className="text-left p-3">
                    Nom
                  </th>
                  <th scope="col" className="text-left p-3">
                    Catégorie
                  </th>
                  <th scope="col" className="text-left p-3">
                    Prix
                  </th>
                  <th scope="col" className="text-left p-3">
                    Statut
                  </th>
                  <th scope="col" className="text-left p-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {productsSafe.map((p) => (
                  <tr key={String(p.id)} className="border-t border-border">
                    <td className="p-3">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.slug}</div>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {categories?.find((c) => c.id === p.category)?.name ?? p.category ?? "-"}
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{formatPrice(p.price)}</div>
                      {p.original_price != null && (
                        <div className="text-xs text-muted-foreground line-through">
                          {formatPrice(Number(p.original_price))}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={p.is_active ? "text-green-600" : "text-red-600"}>
                        {p.is_active ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(p)}
                          disabled={saving}
                          aria-label={`Modifier ${p.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => handleDelete(p.id)}
                          disabled={saving}
                          aria-label={`Supprimer ${p.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {productsSafe.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-muted-foreground">
                      Aucun produit. Clique sur “Nouveau”.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeForm();
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") closeForm();
          }}
          role="presentation"
        >
          <div
            className="bg-card rounded-2xl shadow-xl w-full max-w-2xl mx-4 p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby={ids.modalTitle}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 id={ids.modalTitle} className="font-serif text-xl font-bold">
                {editingProduct ? "Modifier le produit" : "Nouveau produit"}
              </h3>

              <button
                onClick={closeForm}
                className="text-muted-foreground hover:text-foreground"
                type="button"
                aria-label="Fermer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor={ids.name}>Nom *</Label>
                <Input
                  id={ids.name}
                  name="name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      name: e.target.value,
                      slug: p.slug ? p.slug : slugify(e.target.value),
                    }))
                  }
                  required
                  autoComplete="off"
                />
              </div>

              <div>
                <Label htmlFor={ids.slug}>Slug</Label>
                <Input
                  id={ids.slug}
                  name="slug"
                  value={form.slug}
                  onChange={(e) => setForm((p) => ({ ...p, slug: slugify(e.target.value) }))}
                  placeholder="ex: perruque-lace-bresilienne"
                  autoComplete="off"
                />
              </div>

              <div>
                <Label htmlFor={ids.category}>Catégorie</Label>
                <select
                  id={ids.category}
                  name="category"
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
                <Label htmlFor={ids.description}>Description</Label>
                <Textarea
                  id={ids.description}
                  name="description"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={ids.priceMin}>Prix min</Label>
                  <Input
                    id={ids.priceMin}
                    name="base_price_min"
                    type="number"
                    inputMode="numeric"
                    value={form.base_price_min}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, base_price_min: Number(e.target.value || 0) }))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor={ids.priceOriginal}>Prix original</Label>
                  <Input
                    id={ids.priceOriginal}
                    name="original_price"
                    type="number"
                    inputMode="numeric"
                    value={form.original_price ?? ""}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        original_price: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  id={ids.isActive}
                  checked={form.is_active}
                  onCheckedChange={(checked) => setForm((p) => ({ ...p, is_active: checked }))}
                />
                <Label htmlFor={ids.isActive} className="text-sm">
                  Produit actif
                </Label>
              </div>

              <div>
                <Label htmlFor={ids.newDetail}>Détails</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    id={ids.newDetail}
                    name="new_detail"
                    value={newDetail}
                    onChange={(e) => setNewDetail(e.target.value)}
                    placeholder="Ex: Cheveux 100% humains"
                    autoComplete="off"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addDetail();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addDetail} aria-label="Ajouter un détail">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(form.details ?? []).map((d, idx) => (
                    <span
                      key={`${d}-${idx}`}
                      className="bg-muted px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {d}
                      <button type="button" onClick={() => removeDetail(idx)} aria-label={`Retirer: ${d}`}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeForm}
                  className="flex-1"
                  disabled={saving}
                >
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
    </div>
  );
}