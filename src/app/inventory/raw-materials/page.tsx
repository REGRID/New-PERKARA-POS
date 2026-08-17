"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Tag, 
  Plus, 
  Search, 
  RefreshCw,
  SlidersHorizontal,
  Pencil,
  Trash2,
  Lock,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth-context";

export default function RawMaterialsPage() {
  const { user, isAdmin } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Warehouse edit modal (quick stock change)
  const [selectedWarehouseItem, setSelectedWarehouseItem] = useState<any>(null);
  const [warehouseQtyInput, setWarehouseQtyInput] = useState<number>(0);

  // Admin Granular Edit Modal State
  const [selectedAdminEditItem, setSelectedAdminEditItem] = useState<any>(null);
  const [adminEditForm, setAdminEditForm] = useState({
    name: "",
    category: "Bahan Baku",
    buyUnit: "Karton",
    unit: "gram",
    conversionRatio: 1000,
    hargaBeli: 50000,
    minStockAlert: 10,
    floorQuantity: 0,
    warehouseQuantity: 0,
    hasWarehouseStock: true,
  });

  // Locked notice dialog for Karyawan
  const [showLockedDialog, setShowLockedDialog] = useState(false);

  // Form State for new item
  const [formData, setFormData] = useState({
    name: "",
    category: "Bahan Baku",
    unit: "kg",
    buyUnit: "Karton",
    conversionRatio: 1,
    floorQuantity: 1,
    warehouseQuantity: 10,
    hasWarehouseStock: true,
    minStockAlert: 5,
    hargaBeli: 50000,
  });

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/data?type=ingredients");
      if (res.ok) {
        const json = await res.json();
        setMaterials(json);
      }
    } catch (err) {
      console.error("Error fetching ingredients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  // Update Floor Quantity (+ / -) with instant optimistic UI & DB persist
  const handleFloorStockChange = async (id: string, delta: number) => {
    const item = materials.find((m) => m.id === id);
    if (!item) return;

    const newQty = Math.max(0, (Number(item.floorQuantity) || 0) + delta);

    // Optimistic UI update
    setMaterials(materials.map((m) => m.id === id ? { ...m, floorQuantity: newQty } : m));

    // Save to Database
    try {
      await fetch("/api/data?type=update_stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, floorQuantity: newQty }),
      });
    } catch (err) {
      console.error("Failed to persist floor stock change:", err);
    }
  };

  // Direct input change for floor stock
  const handleFloorStockDirectInput = async (id: string, value: string) => {
    const numVal = Math.max(0, Number(value) || 0);
    setMaterials(materials.map((m) => m.id === id ? { ...m, floorQuantity: numVal } : m));

    try {
      await fetch("/api/data?type=update_stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, floorQuantity: numVal }),
      });
    } catch (err) {
      console.error("Failed to persist floor stock direct input:", err);
    }
  };

  // Save Warehouse Stock change
  const handleSaveWarehouseStock = async () => {
    if (!selectedWarehouseItem) return;
    const id = selectedWarehouseItem.id;
    const newQty = Math.max(0, Number(warehouseQtyInput) || 0);

    setMaterials(materials.map((m) => m.id === id ? { ...m, warehouseQuantity: newQty } : m));
    setSelectedWarehouseItem(null);

    try {
      await fetch("/api/data?type=update_stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, warehouseQuantity: newQty }),
      });
    } catch (err) {
      console.error("Failed to persist warehouse stock change:", err);
    }
  };

  // Open Admin Edit Modal
  const handleOpenAdminEdit = (item: any) => {
    if (!isAdmin) {
      setShowLockedDialog(true);
      return;
    }

    setSelectedAdminEditItem(item);
    setAdminEditForm({
      name: item.name || "",
      category: item.category || "Bahan Baku",
      buyUnit: item.buyUnit || "Karton",
      unit: item.unit || "gram",
      conversionRatio: Number(item.conversionRatio) || 1,
      hargaBeli: Number(item.hargaBeli) || 0,
      minStockAlert: Number(item.minStockAlert) || 10,
      floorQuantity: Number(item.floorQuantity) || 0,
      warehouseQuantity: Number(item.warehouseQuantity) || 0,
      hasWarehouseStock: item.hasWarehouseStock !== false,
    });
  };

  // Save Admin Granular Edits (Name, Units, Prices, Conversion, etc.)
  const handleSaveAdminEdit = async () => {
    if (!selectedAdminEditItem || !adminEditForm.name) return;
    try {
      setSubmitting(true);
      const res = await fetch("/api/data?type=update_ingredient_detail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedAdminEditItem.id,
          ...adminEditForm,
        }),
      });

      if (res.ok) {
        setSelectedAdminEditItem(null);
        await fetchIngredients();
      }
    } catch (err) {
      console.error("Error updating ingredient detail:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Ingredient (Admin Only)
  const handleDeleteIngredient = async () => {
    if (!selectedAdminEditItem || !isAdmin) return;
    if (!confirm(`Apakah Anda yakin ingin menghapus bahan baku "${selectedAdminEditItem.name}"?`)) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/data?type=delete_ingredient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedAdminEditItem.id }),
      });

      if (res.ok) {
        setSelectedAdminEditItem(null);
        await fetchIngredients();
      }
    } catch (err) {
      console.error("Error deleting ingredient:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Add new item
  const handleAddMaterial = async () => {
    if (!formData.name) return;
    try {
      setSubmitting(true);
      const res = await fetch("/api/data?type=ingredient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsAddModalOpen(false);
        setFormData({
          name: "",
          category: "Bahan Baku",
          unit: "kg",
          buyUnit: "Karton",
          conversionRatio: 1,
          floorQuantity: 1,
          warehouseQuantity: 10,
          hasWarehouseStock: true,
          minStockAlert: 5,
          hargaBeli: 50000,
        });
        await fetchIngredients();
      }
    } catch (err) {
      console.error("Error creating ingredient:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Group items by category
  const filtered = materials.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.category && m.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const categories = Array.from(new Set(filtered.map((m) => m.category || "Bahan Baku")));

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        
        {/* Top Header Bar with Active Role Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-2xl border shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">Daftar Stok Bahan & Kemasan</h1>
              {isAdmin ? (
                <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-2 py-0.5 gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Akses Admin (Full Edit)</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 font-medium text-xs px-2 py-0.5 gap-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Akses Karyawan</span>
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isAdmin 
                ? "Admin dapat mengubah detail nama item, satuan, rasio konversi, & harga beli" 
                : "Pengoperasian stok toko & gudang utama secara real-time"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={fetchIngredients} className="min-h-[40px] text-xs font-medium gap-1.5">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>

            <Button 
              size="sm" 
              onClick={() => {
                if (!isAdmin) {
                  setShowLockedDialog(true);
                  return;
                }
                setIsAddModalOpen(true);
              }}
              className={`min-h-[40px] text-xs font-semibold gap-1.5 shadow-xs text-white ${
                isAdmin ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-700 hover:bg-slate-800"
              }`}
            >
              {isAdmin ? <Plus className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5 text-amber-300" />}
              <span>Tambah Bahan</span>
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
          <Input 
            placeholder="Cari nama bahan baku, sirup, creamer, kemasan..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="min-h-[40px] pl-9 bg-card"
          />
        </div>

        {/* Stock List Table */}
        <div className="bg-card rounded-2xl border shadow-xs overflow-hidden">
          
          {/* Table Header Bar */}
          <div className="grid grid-cols-12 px-6 py-4 border-b text-xs font-bold text-slate-700 dark:text-slate-300 bg-muted/20">
            <div className="col-span-6 md:col-span-5">Bahan & Kemasan</div>
            <div className="col-span-4 md:col-span-4 text-center md:text-left">Stok Bar (Toko)</div>
            <div className="col-span-2 md:col-span-3 text-right">Stok Gudang Utama & Akses</div>
          </div>

          {/* Group by Category */}
          <div className="divide-y">
            {categories.map((catName) => {
              const catItems = filtered.filter((m) => (m.category || "Bahan Baku") === catName);

              return (
                <div key={catName} className="space-y-0">
                  
                  {/* Category Banner Header */}
                  <div className="bg-muted/40 px-6 py-3 flex items-center gap-2 border-y first:border-t-0">
                    <Tag className="w-4 h-4 text-orange-500" />
                    <span className="font-bold text-xs uppercase tracking-wider text-foreground">
                      {catName}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-semibold px-2 py-0 h-4 bg-card border-border text-muted-foreground">
                      {catItems.length} item
                    </Badge>
                  </div>

                  {/* Category Items Rows */}
                  <div className="divide-y divide-border/60">
                    {catItems.map((item) => {
                      const hasWarehouse = item.hasWarehouseStock !== false && item.hasWarehouseStock !== 0;

                      return (
                        <div 
                          key={item.id} 
                          className="grid grid-cols-12 items-center px-6 py-3.5 hover:bg-muted/20 transition-colors"
                        >
                          {/* Col 1: Bahan & Kemasan Name, Subtitle, & Admin Edit Button */}
                          <div className="col-span-6 md:col-span-5 pr-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-foreground leading-snug">{item.name}</h4>
                              
                              {/* Edit Detail Button (Pencil) */}
                              <button
                                type="button"
                                title={isAdmin ? "Edit Detail Bahan (Khusus Admin)" : "Detail Terkunci untuk Karyawan"}
                                onClick={() => handleOpenAdminEdit(item)}
                                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                  isAdmin 
                                    ? "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:border-indigo-800 dark:text-indigo-300"
                                    : "bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                                }`}
                              >
                                {isAdmin ? <Pencil className="w-3.5 h-3.5" /> : <Lock className="w-3 h-3 text-slate-400" />}
                              </button>
                            </div>

                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                              <span>Satuan Pakai: <strong className="text-foreground">{item.unit || "gram"}</strong></span>
                              {item.buyUnit && (
                                <span>&bull; Beli: <strong className="text-foreground">{item.buyUnit}</strong></span>
                              )}
                            </p>
                          </div>

                          {/* Col 2: Stok Bar (Toko) with [-] [input] [+] Unit */}
                          <div className="col-span-4 md:col-span-4 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleFloorStockChange(item.id, -1)}
                              className="w-7 h-7 rounded-md border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer shadow-2xs"
                            >
                              -
                            </button>

                            <input
                              type="number"
                              value={item.floorQuantity ?? 0}
                              onChange={(e) => handleFloorStockDirectInput(item.id, e.target.value)}
                              className="w-12 h-7 rounded-md border border-slate-300 dark:border-slate-700 bg-card text-center font-bold text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />

                            <button
                              type="button"
                              onClick={() => handleFloorStockChange(item.id, 1)}
                              className="w-7 h-7 rounded-md border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer shadow-2xs"
                            >
                              +
                            </button>

                            <span className="text-xs text-muted-foreground font-semibold min-w-8">
                              {item.unit || "pcs"}
                            </span>
                          </div>

                          {/* Col 3: Stok Gudang Utama & Admin Edit */}
                          <div className="col-span-2 md:col-span-3 flex items-center justify-end gap-2">
                            {hasWarehouse ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedWarehouseItem(item);
                                  setWarehouseQtyInput(item.warehouseQuantity || 0);
                                }}
                                className="inline-flex items-center justify-center px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-card hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-foreground shadow-2xs transition-colors cursor-pointer"
                              >
                                {Number(item.warehouseQuantity || 0)} {item.unit || "Pack"}
                              </button>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">
                                Tanpa Gudang
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              );
            })}
          </div>

        </div>

        {/* Dialog Edit Admin (Setiap Detail Bahan Baku: Nama, Satuan Beli, Satuan Pakai, Rasio Konversi, Harga) */}
        <Dialog open={!!selectedAdminEditItem} onOpenChange={() => setSelectedAdminEditItem(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <DialogTitle className="text-base font-bold">Edit Detail Bahan Baku (Role Admin)</DialogTitle>
              </div>
              <DialogDescription className="text-xs">
                Ubah nama item, satuan beli/pakai, harga beli, dan rasio konversi HPP.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              
              {/* Nama Item */}
              <div>
                <label className="font-semibold text-foreground block mb-1">Nama Item Bahan Baku *</label>
                <Input 
                  placeholder="misal: Creamer Premium / Susu UHT"
                  value={adminEditForm.name}
                  onChange={(e) => setAdminEditForm({ ...adminEditForm, name: e.target.value })}
                  className="min-h-[42px] font-bold text-sm"
                />
              </div>

              {/* Kategori & Satuan Beli */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground block mb-1">Kategori Item</label>
                  <select
                    value={adminEditForm.category}
                    onChange={(e) => setAdminEditForm({ ...adminEditForm, category: e.target.value })}
                    className="w-full min-h-[42px] rounded-lg border bg-card px-3 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Bahan Baku">Bahan Baku</option>
                    <option value="Kemasan">Kemasan</option>
                    <option value="Powder">Powder</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Operasional">Operasional</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">Satuan Beli (Buy Unit)</label>
                  <Input 
                    placeholder="misal: Karton / Dus / Pack / Kg"
                    value={adminEditForm.buyUnit}
                    onChange={(e) => setAdminEditForm({ ...adminEditForm, buyUnit: e.target.value })}
                    className="min-h-[42px]"
                  />
                </div>
              </div>

              {/* Satuan Pakai & Rasio Konversi */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground block mb-1">Satuan Pakai (Unit)</label>
                  <Input 
                    placeholder="misal: gram / ml / pcs"
                    value={adminEditForm.unit}
                    onChange={(e) => setAdminEditForm({ ...adminEditForm, unit: e.target.value })}
                    className="min-h-[42px]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">Rasio Konversi (1 BuyUnit = X Unit)</label>
                  <Input 
                    type="number"
                    value={adminEditForm.conversionRatio}
                    onChange={(e) => setAdminEditForm({ ...adminEditForm, conversionRatio: Number(e.target.value) })}
                    className="min-h-[42px]"
                  />
                </div>
              </div>

              {/* Harga Beli & Min Alert */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground block mb-1">Harga Beli per Satuan Beli (Rp)</label>
                  <Input 
                    type="number"
                    value={adminEditForm.hargaBeli}
                    onChange={(e) => setAdminEditForm({ ...adminEditForm, hargaBeli: Number(e.target.value) })}
                    className="min-h-[42px]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">Batas Minimum Alert Stok</label>
                  <Input 
                    type="number"
                    value={adminEditForm.minStockAlert}
                    onChange={(e) => setAdminEditForm({ ...adminEditForm, minStockAlert: Number(e.target.value) })}
                    className="min-h-[42px]"
                  />
                </div>
              </div>

              {/* Stok Toko & Gudang */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="font-semibold text-foreground block mb-1">Stok Bar (Toko)</label>
                  <Input 
                    type="number"
                    value={adminEditForm.floorQuantity}
                    onChange={(e) => setAdminEditForm({ ...adminEditForm, floorQuantity: Number(e.target.value) })}
                    className="min-h-[42px]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">Stok Gudang Utama</label>
                  <Input 
                    type="number"
                    value={adminEditForm.warehouseQuantity}
                    onChange={(e) => setAdminEditForm({ ...adminEditForm, warehouseQuantity: Number(e.target.value) })}
                    className="min-h-[42px]"
                  />
                </div>
              </div>

            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 justify-between border-t pt-3">
              <Button 
                type="button"
                variant="destructive" 
                size="sm" 
                onClick={handleDeleteIngredient}
                disabled={submitting}
                className="gap-1 text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Item</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedAdminEditItem(null)}>
                  Batal
                </Button>
                <Button 
                  size="sm"
                  disabled={submitting}
                  onClick={handleSaveAdminEdit}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  {submitting ? "Menyimpan..." : "Simpan Perubahan Admin"}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Notice jika Karyawan mencoba edit detail */}
        <Dialog open={showLockedDialog} onOpenChange={setShowLockedDialog}>
          <DialogContent className="sm:max-w-xs">
            <DialogHeader className="text-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 mx-auto flex items-center justify-center mb-2 border border-amber-300">
                <Lock className="w-6 h-6" />
              </div>
              <DialogTitle className="text-base font-bold">Fitur Terkunci (Role Admin)</DialogTitle>
              <DialogDescription className="text-xs pt-1 text-slate-600 dark:text-slate-400">
                Mengubah nama bahan baku, satuan beli/pakai, dan harga HPP membutuhkan wewenang **Role Admin**.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="pt-2">
              <Button 
                size="sm"
                className="w-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-medium"
                onClick={() => setShowLockedDialog(false)}
              >
                Saya Mengerti
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Edit Stok Gudang Quick */}
        <Dialog open={!!selectedWarehouseItem} onOpenChange={() => setSelectedWarehouseItem(null)}>
          <DialogContent className="sm:max-w-xs">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Edit Stok Gudang Utama</DialogTitle>
              <DialogDescription className="text-xs">
                {selectedWarehouseItem?.name} ({selectedWarehouseItem?.unit})
              </DialogDescription>
            </DialogHeader>

            <div className="py-2">
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Jumlah Stok Gudang:</label>
              <Input 
                type="number"
                value={warehouseQtyInput}
                onChange={(e) => setWarehouseQtyInput(Number(e.target.value))}
                className="min-h-[44px] text-base font-bold text-center"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" className="min-h-[40px]" onClick={() => setSelectedWarehouseItem(null)}>
                Batal
              </Button>
              <Button className="min-h-[40px] bg-indigo-600 hover:bg-indigo-700 text-white font-semibold" onClick={handleSaveWarehouseStock}>
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Tambah Bahan Baku Baru (Admin Only) */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Tambah Bahan Baku / Kemasan Baru</DialogTitle>
              <DialogDescription>Masukkan nama bahan, kategori, dan stok awal.</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-3 py-2 text-sm">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Nama Bahan *</label>
                <Input 
                  placeholder="misal: Susu UHT / Creamer / Es Batu" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Kategori *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full min-h-[44px] rounded-lg border bg-card px-3 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Bahan Baku">Bahan Baku</option>
                    <option value="Kemasan">Kemasan</option>
                    <option value="Powder">Powder</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Operasional">Operasional</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Satuan Pakai (Unit) *</label>
                  <Input 
                    placeholder="kg / Karton / Pack / galon / % / pcs" 
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="min-h-[44px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Stok Awal Bar (Toko)</label>
                  <Input 
                    type="number"
                    value={formData.floorQuantity}
                    onChange={(e) => setFormData({ ...formData, floorQuantity: Number(e.target.value) })}
                    className="min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Stok Gudang Utama</label>
                  <Input 
                    type="number"
                    value={formData.warehouseQuantity}
                    onChange={(e) => setFormData({ ...formData, warehouseQuantity: Number(e.target.value) })}
                    className="min-h-[44px]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="hasWarehouseStock"
                  checked={formData.hasWarehouseStock}
                  onChange={(e) => setFormData({ ...formData, hasWarehouseStock: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <label htmlFor="hasWarehouseStock" className="text-xs font-medium text-foreground cursor-pointer">
                  Item ini memiliki persediaan di Gudang Utama
                </label>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" className="min-h-[44px]" onClick={() => setIsAddModalOpen(false)}>
                Batal
              </Button>
              <Button 
                disabled={submitting}
                className="min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white font-semibold" 
                onClick={handleAddMaterial}
              >
                {submitting ? "Menyimpan..." : "Simpan Bahan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </AppShell>
  );
}
