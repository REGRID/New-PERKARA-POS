"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ClipboardList, 
  ArrowLeft, 
  Plus, 
  Check, 
  Calculator,
  Percent,
  Edit3, 
  Trash2, 
  Boxes,
  SlidersHorizontal,
  RefreshCw,
  PlusCircle
} from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AppShell } from "@/components/layout/app-shell";

export default function RecipesAndMenuSettingsPage() {
  const [menus, setMenus] = useState<any[]>([]);
  const [allIngredients, setAllIngredients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Edit/Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    category: "Kopi",
    price: 20000,
    isActive: true,
    recipeIngredients: [] as Array<{ ingredientId: string; quantityUsed: number }>,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [menuRes, ingRes] = await Promise.all([
        fetch("/api/data?type=menus_with_recipes"),
        fetch("/api/data?type=ingredients"),
      ]);

      if (menuRes.ok) {
        const json = await menuRes.json();
        setMenus(json);
      }
      if (ingRes.ok) {
        const json = await ingRes.json();
        setAllIngredients(json);
      }
    } catch (err) {
      console.error("Error fetching menu settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingMenu(null);
    setFormData({
      id: "",
      name: "",
      category: "Kopi",
      price: 22000,
      isActive: true,
      recipeIngredients: [
        { ingredientId: allIngredients[0]?.id || "", quantityUsed: 1 },
      ],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (menu: any) => {
    setEditingMenu(menu);
    setFormData({
      id: menu.id,
      name: menu.name,
      category: menu.category || "Kopi",
      price: menu.price || 0,
      isActive: menu.isActive !== false,
      recipeIngredients: (menu.recipeItems || []).map((r: any) => ({
        ingredientId: r.ingredientId,
        quantityUsed: r.quantityUsed || 1,
      })),
    });
    setIsModalOpen(true);
  };

  const addIngredientRow = () => {
    setFormData({
      ...formData,
      recipeIngredients: [
        ...formData.recipeIngredients,
        { ingredientId: allIngredients[0]?.id || "", quantityUsed: 1 },
      ],
    });
  };

  const removeIngredientRow = (idx: number) => {
    const updated = [...formData.recipeIngredients];
    updated.splice(idx, 1);
    setFormData({ ...formData, recipeIngredients: updated });
  };

  const updateIngredientRow = (idx: number, field: string, value: any) => {
    const updated = [...formData.recipeIngredients];
    updated[idx] = { ...updated[idx], [field]: value };
    setFormData({ ...formData, recipeIngredients: updated });
  };

  const handleSaveMenuSettings = async () => {
    if (!formData.name) return;
    try {
      setSubmitting(true);
      const res = await fetch("/api/data?type=save_menu_settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        await fetchData();
      }
    } catch (err) {
      console.error("Error saving menu settings:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate estimated HPP for a menu
  const calculateMenuHpp = (recipeItems: any[]) => {
    if (!recipeItems || recipeItems.length === 0) return 0;
    return recipeItems.reduce((sum, r) => {
      const ing = allIngredients.find((i) => i.id === r.ingredientId) || r.ingredient;
      if (!ing) return sum;
      const unitCost = ing.costPerUseUnit || (ing.hargaBeli > 0 && ing.conversionRatio > 0 ? ing.hargaBeli / ing.conversionRatio : 0);
      return sum + (Number(r.quantityUsed || 0) * unitCost);
    }, 0);
  };

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-2xl border shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400 flex items-center justify-center border border-violet-100 dark:border-violet-900">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Pengaturan Menu & Komposisi Resep (BOM)</h1>
              <p className="text-xs text-muted-foreground">Konfigurasi menu jual dan takaran bahan baku yang otomatis dipotong saat transaksi</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={fetchData} className="min-h-[40px] text-xs font-medium gap-1.5">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>
            <Button 
              size="sm" 
              onClick={openCreateModal}
              className="min-h-[40px] bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Menu Baru</span>
            </Button>
          </div>
        </div>

        {/* Menu Cards Outer Container */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="border-b pb-3 flex items-center justify-between">
            <h3 className="font-extrabold text-base text-slate-900">Daftar Menu & Komposisi Resep (BOM)</h3>
            <span className="text-xs text-slate-500 font-medium">Total: {menus.length} Menu</span>
          </div>

          <div className="space-y-4">
          {menus.map((menu) => {
            const hpp = calculateMenuHpp(menu.recipeItems);
            const margin = (menu.price || 0) - hpp;
            const marginPct = menu.price > 0 ? ((margin / menu.price) * 100).toFixed(1) : 0;
            const recipes = menu.recipeItems || [];

            return (
              <Card key={menu.id} className="shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                <CardHeader className="bg-muted/20 pb-3 border-b">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-bold text-foreground">{menu.name}</CardTitle>
                        <Badge variant="outline" className="font-semibold text-xs bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 border-violet-200">
                          {menu.category || "Menu"}
                        </Badge>
                        {!menu.isActive && (
                          <Badge variant="destructive" className="text-[10px]">Non-Aktif</Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs mt-0.5">
                        Harga Jual: <strong className="text-foreground">Rp {Number(menu.price).toLocaleString("id-ID")}</strong>
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-3 bg-card px-3 py-1.5 rounded-xl border shadow-2xs">
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Estimasi HPP</span>
                          <span className="text-sm font-bold text-rose-600 dark:text-rose-400">Rp {Math.round(hpp).toLocaleString("id-ID")}</span>
                        </div>
                        <div className="border-l pl-3">
                          <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Margin Laba</span>
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Rp {Math.round(margin).toLocaleString("id-ID")} ({marginPct}%)</span>
                        </div>
                      </div>

                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => openEditModal(menu)}
                        className="min-h-[38px] text-xs font-semibold gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Setting Menu</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-2">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Komposisi Bahan Baku Terpotong ({recipes.length} Bahan):
                  </h4>
                  
                  {recipes.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-1">
                      Belum ada komposisi resep. Klik "Setting Menu" untuk menambahkan bahan yang terpotong.
                    </p>
                  ) : (
                    <div className="divide-y divide-border text-xs">
                        {recipes.map((r: any, idx: number) => {
                          const ing = allIngredients.find((i) => i.id === r.ingredientId) || r.ingredient;
                          const conversion = Number(ing?.conversionRatio || 1);
                          const hargaBeli = Number(ing?.hargaBeli || 0);
                          const unitCost = Number(ing?.costPerUseUnit) || (conversion > 0 ? hargaBeli / conversion : 0);
                          const ingHpp = Number(r.quantityUsed || 0) * unitCost;

                          return (
                            <div key={idx} className="py-2 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="font-semibold text-foreground">{ing?.name || "Bahan Baku"}</span>
                                <span className="text-[11px] text-muted-foreground">({ing?.category || "Bahan"})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  HPP: Rp {Math.round(ingHpp).toLocaleString("id-ID")}
                                </span>
                                <span className="font-mono bg-muted/60 px-2.5 py-0.5 rounded text-foreground font-bold">
                                  {Number(r.quantityUsed)} {ing?.unit || "ml"} / porsi
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          </div>
        </div>

        {/* Modal Setting / Edit Menu */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {editingMenu ? `Pengaturan Menu: ${editingMenu.name}` : "Tambah Menu Baru"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Atur nama menu, harga jual, dan komposisi takaran bahan baku yang terpotong dari stok saat menu ini dipesan.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Nama Menu *</label>
                  <Input 
                    placeholder="misal: Es Kopi Susu Gula Aren" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="min-h-[42px]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Kategori *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full min-h-[42px] rounded-lg border bg-card px-3 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Kopi">Kopi</option>
                    <option value="Non-Kopi">Non-Kopi</option>
                    <option value="Makanan">Makanan / Snack</option>
                    <option value="Signature">Signature</option>
                    <option value="Manual Brew">Manual Brew</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Harga Jual (Rp) *</label>
                  <Input 
                    type="text"
                    value={formData.price ? formData.price.toLocaleString("id-ID") : ""}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, "");
                      setFormData({ ...formData, price: Number(clean) || 0 });
                    }}
                    className="min-h-[42px] font-bold"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <label htmlFor="isActive" className="text-xs font-medium text-foreground cursor-pointer">
                    Menu Aktif di Kasir POS
                  </label>
                </div>
              </div>

              {/* Recipe Composition Section */}
              <div className="border-t pt-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-foreground">
                      Komposisi Bahan Baku (Pemotongan Otomatis)
                    </h4>
                    <p className="text-[11px] text-muted-foreground">Pilih bahan dari daftar stok & tentukan takaran per porsi</p>
                  </div>
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="outline" 
                    onClick={addIngredientRow}
                    className="min-h-[34px] text-xs gap-1 font-semibold border-indigo-200 text-indigo-700 dark:text-indigo-300"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Bahan</span>
                  </Button>
                </div>

                <div className="space-y-2">
                  {formData.recipeIngredients.map((row, idx) => {
                    const selectedIng = allIngredients.find((i) => i.id === row.ingredientId);

                    return (
                      <div key={idx} className="p-2.5 rounded-xl border bg-muted/20 flex items-center gap-2">
                        <select
                          value={row.ingredientId}
                          onChange={(e) => updateIngredientRow(idx, "ingredientId", e.target.value)}
                          className="flex-1 min-h-[38px] rounded-lg border bg-card px-2.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="">-- Pilih Bahan Baku --</option>
                          {allIngredients.map((ing) => (
                            <option key={ing.id} value={ing.id}>
                              {ing.name} ({ing.category || "Bahan"}) - Satuan: {ing.unit}
                            </option>
                          ))}
                        </select>

                        <div className="flex items-center gap-1.5">
                          <Input 
                            type="number"
                            placeholder="Takaran"
                            value={row.quantityUsed}
                            onChange={(e) => updateIngredientRow(idx, "quantityUsed", Number(e.target.value))}
                            className="w-20 min-h-[38px] text-xs font-bold text-center"
                          />
                          <span className="text-xs text-muted-foreground min-w-10">
                            {selectedIng?.unit || "unit"}
                          </span>
                        </div>

                        <Button 
                          type="button" 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => removeIngredientRow(idx)}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" className="min-h-[42px]" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button 
                disabled={submitting}
                className="min-h-[42px] bg-violet-600 hover:bg-violet-700 text-white font-semibold" 
                onClick={handleSaveMenuSettings}
              >
                {submitting ? "Menyimpan..." : "Simpan Pengaturan Menu"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </AppShell>
  );
}
