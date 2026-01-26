import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, LogOut, Plus, Trash2, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

import { useAdmin } from "@/hooks/useAdmin";
import { formatPrice } from "@/lib/formatPrice";

// ✅ Admin products: idéalement utilise useProductsAdmin (tous les produits)
import { useProducts } from "@/hooks/useProducts";

import {
  useColors,
  useLengths,
  useProductColors,
  useCreateProductColor,
  useSetDefaultProductColor,
  useDeleteProductColor,
  useProductColorImages,
  useAddProductColorImage,
  useDeleteProductColorImage,
  useVariants,
  useCreateVariant,
  useUpdateVariant,
  useDeleteVariant,
} from "@/hooks/useCatalog";

export default function AdminCatalog() {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading, signOut } = useAdmin();

  const { data: products, isLoading: productsLoading, refetch: refetchProducts } = useProducts();

  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const { data: colors } = useColors();
  const { data: lengths } = useLengths();

  const { data: productColors, isLoading: pcLoading, refetch: refetchPC } = useProductColors(selectedProductId ?? undefined);
  const createProductColor = useCreateProductColor();
  const setDefaultColor = useSetDefaultProductColor();
  const deleteProductColor = useDeleteProductColor();

  const [selectedProductColorId, setSelectedProductColorId] = useState<number | null>(null);
  const { data: colorImages, isLoading: imgLoading, refetch: refetchImgs } = useProductColorImages(selectedProductColorId ?? undefined);
  const addColorImage = useAddProductColorImage();
  const deleteColorImage = useDeleteProductColorImage();

  const { data: variants, isLoading: vLoading, refetch: refetchVariants } = useVariants(selectedProductId ?? undefined);
  const createVariant = useCreateVariant();
  const updateVariant = useUpdateVariant();
  const deleteVariant = useDeleteVariant();

  const [newColorId, setNewColorId] = useState<number | "">("");
  const [newImageUrl, setNewImageUrl] = useState("");

  const [variantForm, setVariantForm] = useState({
    product_color_id: 0,
    length_id: 0,
    price: 0,
    stock: 0,
    sku: "",
    is_active: true,
  });

  // redirect si pas admin
  if (!authLoading && (!user || !isAdmin)) {
    navigate("/admin/login");
    return null;
  }

  const loading = authLoading || productsLoading;
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut();
    navigate("/admin/login");
  };

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId) ?? null,
    [products, selectedProductId]
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <div className="font-serif text-xl font-bold">Admin (V2) – BelléaWigs</div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* LEFT: products */}
        <div className="bg-card rounded-xl border border-border p-4 md:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <div className="font-medium">Produits</div>
            <Button size="sm" variant="outline" onClick={refetchProducts}>
              Rafraîchir
            </Button>
          </div>

          <div className="space-y-2 max-h-[70vh] overflow-auto pr-1">
            {products.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedProductId(p.id);
                  setSelectedProductColorId(null);
                }}
                className={[
                  "w-full text-left p-3 rounded-lg border",
                  selectedProductId === p.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30",
                ].join(" ")}
              >
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.slug}</div>
                <div className="text-xs mt-1">{formatPrice(p.price)}</div>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: product management */}
        <div className="bg-card rounded-xl border border-border p-4 md:col-span-2">
          {!selectedProduct ? (
            <div className="text-muted-foreground">Sélectionne un produit à gauche.</div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold">{selectedProduct.name}</div>
                  <div className="text-xs text-muted-foreground">{selectedProduct.slug}</div>
                </div>
              </div>

              {/* COLORS */}
              <section className="border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-medium">Couleurs du produit</div>
                  <div className="flex gap-2 items-center">
                    <select
                      className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
                      value={newColorId}
                      onChange={(e) => setNewColorId(e.target.value ? Number(e.target.value) : "")}
                    >
                      <option value="">Choisir une couleur…</option>
                      {colors.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      onClick={async () => {
                        if (!selectedProductId || !newColorId) return;
                        await createProductColor.create({
                          product_id: selectedProductId,
                          color_id: Number(newColorId),
                          is_default: false,
                        });
                        setNewColorId("");
                        refetchPC();
                      }}
                      disabled={!newColorId || createProductColor.isLoading}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter
                    </Button>
                  </div>
                </div>

                {pcLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <div className="space-y-2">
                    {productColors.map((pc) => (
                      <div
                        key={pc.id}
                        className={[
                          "p-3 rounded-lg border flex items-center justify-between",
                          selectedProductColorId === pc.id ? "border-primary bg-primary/5" : "border-border",
                        ].join(" ")}
                      >
                        <button
                          className="text-left flex-1"
                          onClick={() => setSelectedProductColorId(pc.id)}
                        >
                          <div className="font-medium">{pc.color.name}</div>
                          <div className="text-xs text-muted-foreground">{pc.color.hex_code}</div>
                        </button>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant={pc.is_default ? "secondary" : "outline"}
                            onClick={async () => {
                              if (!selectedProductId) return;
                              await setDefaultColor.setDefault(selectedProductId, pc.id);
                              refetchPC();
                            }}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            {pc.is_default ? "Default" : "Mettre default"}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive"
                            onClick={async () => {
                              await deleteProductColor.remove(pc.id);
                              if (selectedProductColorId === pc.id) setSelectedProductColorId(null);
                              refetchPC();
                              refetchVariants();
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {productColors.length === 0 && (
                      <div className="text-sm text-muted-foreground">
                        Aucune couleur liée à ce produit.
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* IMAGES for selected color */}
              <section className="border border-border rounded-xl p-4">
                <div className="font-medium mb-3">Images (par couleur)</div>

                {!selectedProductColorId ? (
                  <div className="text-sm text-muted-foreground">
                    Sélectionne une couleur ci-dessus pour gérer ses images.
                  </div>
                ) : imgLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="URL image (pour test)"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                      />
                      <Button
                        onClick={async () => {
                          if (!selectedProductColorId) return;
                          const url = newImageUrl.trim();
                          if (!url) return;
                          await addColorImage.add({
                            product_color_id: selectedProductColorId,
                            image_url: url,
                            position: colorImages.length,
                          });
                          setNewImageUrl("");
                          refetchImgs();
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {colorImages.map((img) => (
                        <div key={img.id} className="relative w-24 h-24 border rounded-lg overflow-hidden">
                          <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                          <button
                            className="absolute top-1 right-1 bg-black/60 text-white rounded px-2 text-xs"
                            onClick={async () => {
                              await deleteColorImage.remove(img.id);
                              refetchImgs();
                            }}
                          >
                            X
                          </button>
                        </div>
                      ))}
                    </div>

                    {colorImages.length === 0 && (
                      <div className="text-sm text-muted-foreground">Aucune image pour cette couleur.</div>
                    )}
                  </div>
                )}
              </section>

              {/* VARIANTS */}
              <section className="border border-border rounded-xl p-4">
                <div className="font-medium mb-3">Variantes (couleur + longueur)</div>

                {/* Create variant */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end mb-4">
                  <div className="md:col-span-2">
                    <label className="text-xs text-muted-foreground">Couleur</label>
                    <select
                      className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                      value={variantForm.product_color_id || ""}
                      onChange={(e) => setVariantForm((p) => ({ ...p, product_color_id: Number(e.target.value) }))}
                    >
                      <option value="">Choisir…</option>
                      {productColors.map((pc) => (
                        <option key={pc.id} value={pc.id}>
                          {pc.color.name}{pc.is_default ? " (default)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-1">
                    <label className="text-xs text-muted-foreground">Longueur</label>
                    <select
                      className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                      value={variantForm.length_id || ""}
                      onChange={(e) => setVariantForm((p) => ({ ...p, length_id: Number(e.target.value) }))}
                    >
                      <option value="">Choisir…</option>
                      {lengths.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.value}{l.unit ? ` ${l.unit}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-1">
                    <label className="text-xs text-muted-foreground">Prix</label>
                    <Input
                      type="number"
                      value={variantForm.price}
                      onChange={(e) => setVariantForm((p) => ({ ...p, price: Number(e.target.value || 0) }))}
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="text-xs text-muted-foreground">Stock</label>
                    <Input
                      type="number"
                      value={variantForm.stock}
                      onChange={(e) => setVariantForm((p) => ({ ...p, stock: Number(e.target.value || 0) }))}
                    />
                  </div>

                  <div className="md:col-span-1 flex items-center gap-2">
                    <Switch
                      checked={variantForm.is_active}
                      onCheckedChange={(v) => setVariantForm((p) => ({ ...p, is_active: v }))}
                    />
                    <span className="text-xs">Actif</span>
                  </div>

                  <div className="md:col-span-6">
                    <label className="text-xs text-muted-foreground">SKU (optionnel)</label>
                    <Input
                      value={variantForm.sku}
                      onChange={(e) => setVariantForm((p) => ({ ...p, sku: e.target.value }))}
                    />
                  </div>

                  <div className="md:col-span-6">
                    <Button
                      onClick={async () => {
                        if (!selectedProductId) return;
                        if (!variantForm.product_color_id || !variantForm.length_id) return;

                        await createVariant.create({
                          product_id: selectedProductId,
                          product_color_id: variantForm.product_color_id,
                          length_id: variantForm.length_id,
                          price: Number(variantForm.price),
                          stock: Number(variantForm.stock),
                          sku: variantForm.sku || null,
                          is_active: variantForm.is_active,
                        });

                        setVariantForm({
                          product_color_id: 0,
                          length_id: 0,
                          price: 0,
                          stock: 0,
                          sku: "",
                          is_active: true,
                        });

                        refetchVariants();
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Créer variante
                    </Button>
                  </div>
                </div>

                {/* List variants */}
                {vLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40">
                        <tr>
                          <th className="text-left p-2">Couleur</th>
                          <th className="text-left p-2">Longueur</th>
                          <th className="text-left p-2">Prix</th>
                          <th className="text-left p-2">Stock</th>
                          <th className="text-left p-2">Actif</th>
                          <th className="text-left p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {variants.map((v) => {
                          const pc = productColors.find((x) => x.id === v.product_color_id);
                          const len = lengths.find((l) => l.id === v.length_id);

                          return (
                            <tr key={v.id} className="border-t">
                              <td className="p-2">{pc?.color.name ?? v.product_color_id}</td>
                              <td className="p-2">{len ? `${len.value}${len.unit ? ` ${len.unit}` : ""}` : v.length_id}</td>
                              <td className="p-2">{formatPrice(Number(v.price))}</td>
                              <td className="p-2">{v.stock ?? 0}</td>
                              <td className="p-2">
                                <Switch
                                  checked={!!v.is_active}
                                  onCheckedChange={async (checked) => {
                                    await updateVariant.update(v.id, { is_active: checked });
                                    refetchVariants();
                                  }}
                                />
                              </td>
                              <td className="p-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-destructive"
                                  onClick={async () => {
                                    if (!confirm("Supprimer cette variante ?")) return;
                                    await deleteVariant.remove(v.id);
                                    refetchVariants();
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}

                        {variants.length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-4 text-muted-foreground">
                              Aucune variante.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { refetchPC(); refetchImgs(); refetchVariants(); }}>
                  Rafraîchir sections
                </Button>
                <Button variant="outline" onClick={() => { setSelectedProductId(null); setSelectedProductColorId(null); }}>
                  Désélectionner
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
