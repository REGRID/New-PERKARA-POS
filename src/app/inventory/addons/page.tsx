"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Boxes,
  Layers,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Sparkles,
  Check,
  X
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth-context";

export default function AddonStockPage() {
  const { isAdmin } = useAuth();
  const [addonCategories, setAddonCategories] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);
  const [catForm, setCatForm] = useState({ name: "", isRequired: false, allowMultiple: true });

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [activeCatId, setActiveCatId] = useState<string>("");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemForm, setItemForm] = useState({
    name: "",
    price: 5000,
    ingredientId: "",
    quantityUsed: 1,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resAddons, resIngs] = await Promise.all([
        fetch("/api/data?type=addon_categories"),
        fetch("/api/data?type=ingredients"),
      ]);

      if (resAddons.ok) {
        const json = await resAddons.json();
        setAddonCategories(Array.isArray(json) ? json : []);
      } else {
        setAddonCategories([]);
      }

      if (resIngs.ok) {
        const ingsJson = await resIngs.json();
        setIngredients(Array.isArray(ingsJson) ? ingsJson : []);
      }
    } catch (e) {
      console.error(e);
      setAddonCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Category Handlers
  const openAddCat = () => {
    setEditingCat(null);
    setCatForm({ name: "", isRequired: false, allowMultiple: true });
    setIsCatModalOpen(true);
  };

  const openEditCat = (cat: any) => {
    setEditingCat(cat);
    setCatForm({ name: cat.name, isRequired: Boolean(cat.isRequired), allowMultiple: cat.allowMultiple !== false });
    setIsCatModalOpen(true);
  };

  const handleSaveCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/data?type=save_addon_category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCat?.id || undefined,
          ...catForm,
        }),
      });

      if (res.ok) {
        setIsCatModalOpen(false);
        await fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCat = async (id: string, name: string) => {
    if (!confirm(`Hapus kategori add-on "${name}" dan semua item di dalamnya?`)) return;
    try {
      const res = await fetch("/api/data?type=delete_addon_category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) await fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  // Item Handlers
  const openAddItem = (catId: string) => {
    setActiveCatId(catId);
    setEditingItem(null);
    setItemForm({
      name: "",
      price: 5000,
      ingredientId: ingredients[0]?.id || "",
      quantityUsed: 1,
    });
    setIsItemModalOpen(true);
  };

  const openEditItem = (catId: string, item: any) => {
    setActiveCatId(catId);
    setEditingItem(item);
    setItemForm({
      name: item.name,
      price: item.price || 0,
      ingredientId: item.recipes?.[0]?.ingredientId || item.recipes?.[0]?.ingredient?.id || ingredients[0]?.id || "",
      quantityUsed: item.recipes?.[0]?.quantityUsed || 1,
    });
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.name.trim() || !activeCatId) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/data?type=save_addon_item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingItem?.id || undefined,
          addonCategoryId: activeCatId,
          ...itemForm,
        }),
      });

      if (res.ok) {
        setIsItemModalOpen(false);
        await fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (!confirm(`Hapus opsi add-on "${name}"?`)) return;
    try {
      const res = await fetch("/api/data?type=delete_addon_item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) await fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">Menu Tambahan</h1>
                {isAdmin && (
                  <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold">
                    Admin
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">Pilihan topping dan varian tambahan yang memotong stok bahan baku secara otomatis.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={fetchData} className="text-xs gap-1.5 min-h-[40px] rounded-xl">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Segarkan</span>
            </Button>
            {isAdmin && (
              <Button
                onClick={openAddCat}
                className="bg-stone-800 hover:bg-stone-900 text-white font-semibold text-xs px-4 py-2 rounded-xl min-h-[40px] gap-2 shadow-xs shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Kategori</span>
              </Button>
            )}
          </div>
        </div>

        {/* Addon Categories Grid */}
        <div className="space-y-4">
          {addonCategories.map((category) => (
            <Card key={category.id} className="rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden bg-white">
              <CardHeader className="bg-slate-50/70 pb-3.5 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-bold text-slate-900">{category.name}</CardTitle>
                      <Badge variant="outline" className="font-semibold text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                        Potong Stok Otomatis
                      </Badge>
                    </div>
                    <CardDescription className="text-xs mt-0.5 text-slate-500 font-medium">
                      Pilihan varian menu di kasir POS
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAddItem(category.id)}
                          className="text-xs font-semibold rounded-xl min-h-[34px] gap-1 bg-white"
                        >
                          <Plus className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Tambah Menu</span>
                        </Button>
                        <button
                          onClick={() => openEditCat(category)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                          title="Edit Kategori"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCat(category.id, category.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Kategori"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {category.items && category.items.length > 0 ? (
                    category.items.map((item: any) => {
                      const recipe = item.recipes?.[0];
                      const rawMat = recipe?.ingredient?.name || (item.stockRecipe?.rawMaterialName) || "Bahan Baku";
                      const qty = recipe?.quantityUsed || item.stockRecipe?.qty || 1;
                      const unit = recipe?.ingredient?.unit || item.stockRecipe?.unit || "porsi";

                      return (
                        <div key={item.id} className="p-3.5 rounded-2xl border border-slate-200/90 bg-white space-y-2.5 shadow-2xs hover:border-amber-300 transition-colors">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm text-slate-900">{item.name}</h4>
                            <span className="font-extrabold text-xs text-indigo-600">
                              +Rp {Number(item.price || 0).toLocaleString("id-ID")}
                            </span>
                          </div>

                          <div className="p-2.5 rounded-xl border bg-amber-50/40 border-amber-100 text-xs text-slate-600 space-y-1">
                            <span className="text-[10px] uppercase font-bold text-amber-700 block">Potongan Bahan Baku:</span>
                            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                              <Boxes className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span className="truncate">{rawMat}</span>
                            </div>
                            <span className="font-mono text-emerald-600 font-bold block text-[11px]">
                              - {qty} {unit} / porsi
                            </span>
                          </div>

                          {isAdmin && (
                            <div className="pt-1 flex items-center justify-end gap-1 border-t border-slate-100">
                              <button
                                onClick={() => openEditItem(category.id, item)}
                                className="p-1 text-slate-400 hover:text-indigo-600 rounded-md transition-colors cursor-pointer"
                                title="Edit Item"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id, item.name)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                                title="Hapus Item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full p-6 text-center text-xs text-slate-400">
                      Belum ada opsi item di kategori ini. Klik "+ Tambah Item" untuk menambahkan.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>

      {/* Modal Add / Edit Addon Category */}
      <Dialog open={isCatModalOpen} onOpenChange={setIsCatModalOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingCat ? "Edit Kategori Add-on" : "Tambah Kategori Add-on"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Pengelompokan opsi ekstra seperti Topping, Sirup, Milk Swap, dll.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCat} className="space-y-3.5 py-2 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Nama Kategori *</label>
              <Input
                autoFocus
                placeholder="cth: Pilihan Topping Ekstra"
                value={catForm.name}
                onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                className="text-xs font-medium min-h-[38px] rounded-xl"
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCatModalOpen(false)}
                className="text-xs rounded-xl min-h-[38px]"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold rounded-xl min-h-[38px]"
              >
                {submitting ? "Menyimpan..." : "Simpan Kategori"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Add / Edit Addon Item */}
      <Dialog open={isItemModalOpen} onOpenChange={setIsItemModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingItem ? "Edit Opsi Add-on" : "Tambah Opsi Add-on Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Tentukan harga ekstra dan bahan baku yang akan dipotong saat dipesan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveItem} className="space-y-3.5 py-2 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Nama Opsi Add-on *</label>
              <Input
                placeholder="cth: Boba Brown Sugar"
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                className="text-xs font-medium min-h-[38px] rounded-xl"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Harga Tambahan (Rp) *</label>
              <Input
                type="number"
                placeholder="5000"
                value={itemForm.price}
                onChange={(e) => setItemForm({ ...itemForm, price: Number(e.target.value) })}
                className="text-xs font-bold text-slate-900 min-h-[38px] rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Potong Bahan Baku</label>
                <select
                  value={itemForm.ingredientId}
                  onChange={(e) => setItemForm({ ...itemForm, ingredientId: e.target.value })}
                  className="w-full min-h-[38px] px-3 rounded-xl border border-slate-200 text-xs bg-white font-medium"
                >
                  <option value="">-- Tanpa Potong Stok --</option>
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name} ({ing.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Takaran Digunakan</label>
                <Input
                  type="number"
                  placeholder="1"
                  value={itemForm.quantityUsed}
                  onChange={(e) => setItemForm({ ...itemForm, quantityUsed: Number(e.target.value) })}
                  className="text-xs font-medium min-h-[38px] rounded-xl"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsItemModalOpen(false)}
                className="text-xs rounded-xl min-h-[38px]"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold rounded-xl min-h-[38px]"
              >
                {submitting ? "Menyimpan..." : "Simpan Add-on"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
