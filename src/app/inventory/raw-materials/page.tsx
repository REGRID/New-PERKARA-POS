"use client";

import React, { useState, useEffect } from "react";
import { 
  Store, 
  Send, 
  Tag, 
  Plus, 
  RefreshCw, 
  Search, 
  Pencil, 
  Boxes, 
  Warehouse, 
  SlidersHorizontal,
  Trash2,
  Calculator,
  Percent
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth-context";

const formatRupiahDisplay = (val: number | string) => {
  if (val === "" || val === null || val === undefined) return "";
  if (val === 0 || val === "0") return "";
  const num = typeof val === "number" ? val : Number(val.toString().replace(/\D/g, ""));
  if (isNaN(num) || num === 0) return "";
  return num.toLocaleString("id-ID");
};

const parseRupiahInput = (val: string) => {
  const clean = val.replace(/\D/g, "");
  if (clean === "") return "" as any;
  return Number(clean);
};

export default function RawMaterialsPage() {
  const { user, isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryTab, setSelectedCategoryTab] = useState("Semua");
  const [activeSubMode, setActiveSubMode] = useState<"bar" | "warehouse">("bar");
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // WhatsApp & Category State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoriesList, setCategoriesList] = useState<string[]>(["Semua", "Bahan Baku", "Kemasan", "Operasional", "Powder", "Syrup"]);

  // Admin Edit Modal State
  const [selectedAdminEditItem, setSelectedAdminEditItem] = useState<any>(null);

  const handleSendStockWa = () => {
    const todayStr = new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    let message = `*📊 LAPORAN STOK FISIK OUTLET*\nTanggal: ${todayStr}\n\n`;
    
    materials.forEach((m, idx) => {
      const isPercent = m.isPercentageMode || m.unit === "%";
      const unit = isPercent ? "%" : (m.buyUnit || m.unit || "Pcs");
      message += `${idx + 1}. *${m.name}*: ${m.floorQuantity || 0} ${unit}\n`;
    });

    message += `\n_Dikirim otomatis dari Perkara POS Superapp_`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    if (!categoriesList.includes(newCategoryName.trim())) {
      setCategoriesList([...categoriesList, newCategoryName.trim()]);
    }
    setNewCategoryName("");
    setIsCategoryModalOpen(false);
  };
  const [adminEditForm, setAdminEditForm] = useState({
    name: "",
    category: "Bahan Baku",
    buyUnit: "Pcs",
    unit: "ml",
    conversionRatio: 1000,
    hargaBeli: 100000,
    minStockAlert: 10,
    floorQuantity: 0,
    warehouseQuantity: 0,
    isPercentageMode: false,
  });

  // Restock Modal
  const [restockItem, setRestockItem] = useState<any>(null);
  const [restockQty, setRestockQty] = useState<number>(1);

  // Form State for New Item
  const [formData, setFormData] = useState({
    name: "",
    category: "Bahan Baku",
    buyUnit: "Pcs",
    unit: "ml",
    conversionRatio: 1000,
    floorQuantity: 1,
    warehouseQuantity: 0,
    hargaBeli: 100000,
    isPercentageMode: false,
  });

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/data?type=ingredients");
      if (res.ok) {
        const json = await res.json();
        setMaterials(Array.isArray(json) ? json : []);
      } else {
        setMaterials([]);
      }
    } catch (err) {
      console.error("Error fetching ingredients:", err);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  // Update Floor Quantity (+ / -)
  const handleFloorStockChange = async (id: string, delta: number) => {
    const item = materials.find((m) => m.id === id);
    if (!item) return;

    const newQty = Math.max(0, (Number(item.floorQuantity) || 0) + delta);
    setMaterials(materials.map((m) => m.id === id ? { ...m, floorQuantity: newQty } : m));

    try {
      await fetch("/api/data?type=update_stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, floorQuantity: newQty }),
      });
    } catch (err) {
      console.error("Failed to update floor stock:", err);
    }
  };

  // Direct Input for Floor Stock
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
      console.error("Failed to update floor stock input:", err);
    }
  };

  // Handle Restock Action
  const handleConfirmRestock = async () => {
    if (!restockItem) return;
    const newFloorQty = (Number(restockItem.floorQuantity) || 0) + restockQty;
    setMaterials(materials.map((m) => m.id === restockItem.id ? { ...m, floorQuantity: newFloorQty } : m));
    setRestockItem(null);

    try {
      await fetch("/api/data?type=update_stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: restockItem.id, floorQuantity: newFloorQty }),
      });
    } catch (err) {
      console.error("Failed to restock:", err);
    }
  };

  // Save Admin Granular Edits
  const handleSaveAdminEdit = async () => {
    if (!selectedAdminEditItem || !adminEditForm.name) return;
    try {
      setSubmitting(true);
      const conversion = Number(adminEditForm.conversionRatio) || 1;
      const hargaBeli = Number(adminEditForm.hargaBeli) || 0;
      const costPerUseUnit = conversion > 0 ? hargaBeli / conversion : 0;

      const res = await fetch("/api/data?type=update_ingredient_detail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedAdminEditItem.id,
          ...adminEditForm,
          costPerUseUnit,
        }),
      });

      if (res.ok) {
        setSelectedAdminEditItem(null);
        await fetchIngredients();
      }
    } catch (err) {
      console.error("Error updating ingredient:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Add New Ingredient
  const handleAddMaterial = async () => {
    if (!formData.name) return;
    try {
      setSubmitting(true);
      const conversion = Number(formData.conversionRatio) || 1;
      const hargaBeli = Number(formData.hargaBeli) || 0;
      const costPerUseUnit = conversion > 0 ? hargaBeli / conversion : 0;

      const res = await fetch("/api/data?type=ingredient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          costPerUseUnit,
        }),
      });

      if (res.ok) {
        setIsAddModalOpen(false);
        setFormData({
          name: "",
          category: "Bahan Baku",
          buyUnit: "Pcs",
          unit: "ml",
          conversionRatio: 1000,
          floorQuantity: 1,
          warehouseQuantity: 0,
          hargaBeli: 100000,
          isPercentageMode: false,
        });
        await fetchIngredients();
      }
    } catch (err) {
      console.error("Error creating ingredient:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenAdminEdit = (item: any) => {
    setSelectedAdminEditItem(item);
    setAdminEditForm({
      name: item.name || "",
      category: item.category || "Bahan Baku",
      buyUnit: item.buyUnit || "Pcs",
      unit: item.unit || "ml",
      conversionRatio: Number(item.conversionRatio) || 1000,
      hargaBeli: Number(item.hargaBeli) || 100000,
      minStockAlert: Number(item.minStockAlert) || 10,
      floorQuantity: Number(item.floorQuantity) || 0,
      warehouseQuantity: Number(item.warehouseQuantity) || 0,
      isPercentageMode: item.isPercentageMode || (item.unit === "%"),
    });
  };

  // Filter items
  const filtered = materials.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.category && m.category.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (selectedCategoryTab === "Semua") return matchesSearch;
    return matchesSearch && (m.category || "Bahan Baku") === selectedCategoryTab;
  });

  const categories = Array.from(new Set(materials.map((m) => m.category || "Bahan Baku")));

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto text-slate-900 space-y-6">
        
        {/* 1. Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Stok Bahan Baku</h1>
              <p className="text-xs text-slate-500 font-medium">
                {isAdmin ? "Kelola stok fisik bahan baku, konversi HPP, dan batas minimum peringatan." : "Input dan verifikasi stok fisik bahan baku outlet."}
              </p>
            </div>
          </div>

          {/* Action Buttons Top Right */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={handleSendStockWa}
              className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-semibold text-xs px-3.5 py-2 min-h-[40px] rounded-xl gap-1.5 shadow-2xs cursor-pointer"
            >
              <Send className="w-4 h-4 text-emerald-600" />
              <span>Kirim Rekap WA</span>
            </Button>

            {isAdmin && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="border-amber-500 text-amber-700 hover:bg-amber-50 font-semibold text-xs px-3.5 py-2 min-h-[40px] rounded-xl gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Tag className="w-4 h-4 text-amber-600" />
                  <span>Kategori Bahan</span>
                </Button>

                <Button
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 min-h-[40px] rounded-xl gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Bahan</span>
                </Button>
              </>
            )}

            <Button
              variant="outline"
              onClick={fetchIngredients}
              className="p-2.5 min-h-[40px] rounded-xl border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
              title="Segarkan Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* 2. Sub Header Mode Selector Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubMode("bar")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubMode === "bar"
                ? "bg-[#0f172a] text-white shadow-2xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Stok Bar</span>
          </button>

          <button
            onClick={() => setActiveSubMode("warehouse")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubMode === "warehouse"
                ? "bg-[#0f172a] text-white shadow-2xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Pengaturan Gudang</span>
            <Badge className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0 border-none font-bold">
              Lokal Outlet
            </Badge>
          </button>
        </div>

        {/* 3. Top 3 Summary Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Total Bahan Baku</span>
              <div className="text-2xl font-extrabold text-slate-900">{materials.length} Bahan</div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Stok Tersedia</span>
              <div className="text-2xl font-extrabold text-slate-900">
                {materials.filter((m) => (m.floorQuantity || 0) > 0).length} Siap
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Tipe Penyimpanan</span>
              <div className="text-xl font-extrabold text-slate-900">Lokal Outlet</div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
              <Warehouse className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* 4. Category Filter Pills & Search Input Row (Card Box Container) */}
        <div className="bg-white p-3.5 md:p-4 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            {["Semua", "Bahan Baku", "Kemasan", "Operasional", "Powder", "Syrup"].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedCategoryTab(tab)}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategoryTab === tab
                    ? "bg-[#0f172a] text-white shadow-2xs"
                    : "bg-slate-100/70 text-slate-600 border border-slate-200/60 hover:bg-slate-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <Input
              placeholder="Cari nama bahan baku..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-50/70 pl-9 min-h-[40px] text-xs rounded-xl border-slate-200/80"
            />
          </div>
        </div>

        {/* 5. Daftar Stok Bahan & Kemasan Main Outer Container */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="border-b pb-4">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-slate-900">Daftar Bahan Baku</h3>
              <Badge className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 border-none">
                Stok Bar
              </Badge>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Seluruh bahan baku langsung dipantau melalui stok bar outlet.
            </p>
          </div>

          {/* Table Container */}
          <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
            <div className="grid grid-cols-12 px-6 py-3.5 bg-slate-50/70 border-b text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
              <div className="col-span-6">NAMA BAHAN BAKU</div>
              <div className="col-span-3 text-center">STOK FISIK</div>
              <div className="col-span-3 text-right">AKSI</div>
            </div>

            {/* Group Items by Category */}
            <div className="divide-y divide-slate-100">
              {categories.map((catName) => {
                const catItems = filtered.filter((m) => (m.category || "Bahan Baku") === catName);
                if (catItems.length === 0) return null;

                return (
                  <div key={catName} className="space-y-0">
                    <div className="bg-slate-50/90 px-6 py-3 flex items-center gap-2 border-y border-slate-200/80">
                      <Tag className="w-3.5 h-3.5 text-amber-600" />
                      <span className="font-extrabold text-xs uppercase tracking-wider text-slate-900">
                        {catName}
                      </span>
                      <Badge className="bg-white text-slate-600 text-[10px] font-bold px-2 py-0.5 border border-slate-200">
                        {catItems.length} Item
                      </Badge>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {catItems.map((item) => {
                        const hargaBeli = Number(item.hargaBeli || 100000);
                        const conversion = Number(item.conversionRatio || 1000);
                        const costPerUnit = Number(item.costPerUseUnit) || (conversion > 0 ? hargaBeli / conversion : 0);
                        const isPercent = item.isPercentageMode || item.unit === "%";

                        return (
                          <div key={item.id} className="grid grid-cols-12 px-6 py-3.5 items-center text-xs hover:bg-slate-50/60 transition-colors">
                            
                             {/* Col 1: Name & Satuan Beli (Harga Beli hidden for cashier) */}
                            <div className="col-span-6 space-y-0.5">
                              <h4 className="font-extrabold text-slate-900 text-sm">{item.name}</h4>
                              <p className="text-slate-500 font-medium text-xs">
                                {isAdmin ? `Rp ${hargaBeli.toLocaleString("id-ID")} / ${item.buyUnit || "Pcs"}` : `Kemasan Beli: ${item.buyUnit || "Pcs"}`}
                              </p>
                            </div>

                            {/* Col 2: Stock Bar Controls [-] [input] [+] Unit */}
                            <div className="col-span-3 flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleFloorStockChange(item.id, -1)}
                                className="w-7 h-7 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
                              >
                                -
                              </button>

                              <input
                                type="number"
                                value={item.floorQuantity ?? 0}
                                onChange={(e) => handleFloorStockDirectInput(item.id, e.target.value)}
                                className="w-14 h-7 rounded-lg border border-slate-200 bg-white text-center font-extrabold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />

                              <button
                                onClick={() => handleFloorStockChange(item.id, 1)}
                                className="w-7 h-7 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
                              >
                                +
                              </button>

                              <span className="text-xs text-slate-600 font-semibold min-w-[36px]">
                                {isPercent ? "%" : (item.buyUnit || item.unit || "Pcs")}
                              </span>
                            </div>

                            {/* Col 3: Admin / Cashier Options (Restock + Edit Pencil for Admin) */}
                            <div className="col-span-3 flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => { setRestockItem(item); setRestockQty(1); }}
                                className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs font-semibold rounded-xl min-h-[34px] px-3 cursor-pointer"
                              >
                                Restock
                              </Button>

                              {isAdmin && (
                                <button
                                  onClick={() => handleOpenAdminEdit(item)}
                                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                  title="Edit Detail Bahan & Konversi HPP"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
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
        </div>

        {/* Modal Dialog Restock */}
        {restockItem && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-3xl border shadow-2xl p-6 space-y-4">
              <h3 className="font-bold text-sm text-slate-900">Restock Stok Bar: {restockItem.name}</h3>
              <p className="text-xs text-slate-500">
                Masukkan jumlah penambahan ({restockItem.buyUnit || restockItem.unit}):
              </p>
              <Input
                type="number"
                value={restockQty}
                onChange={(e) => setRestockQty(Number(e.target.value))}
                className="min-h-[42px] text-center text-base font-bold"
              />
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setRestockItem(null)} className="text-xs rounded-xl">
                  Batal
                </Button>
                <Button onClick={handleConfirmRestock} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl px-4">
                  Tambah Stok
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Dialog Edit Admin Detail & Konversi HPP */}
        {selectedAdminEditItem && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl border shadow-2xl p-6 space-y-4">
              <h3 className="font-bold text-sm text-slate-900">Edit Detail Bahan & Konversi HPP: {selectedAdminEditItem.name}</h3>
              
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nama Bahan Baku *</label>
                  <Input
                    value={adminEditForm.name}
                    onChange={(e) => setAdminEditForm({ ...adminEditForm, name: e.target.value })}
                    className="min-h-[38px] font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Kategori</label>
                    <select
                      value={adminEditForm.category}
                      onChange={(e) => setAdminEditForm({ ...adminEditForm, category: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 min-h-[38px] text-xs font-semibold"
                    >
                      <option value="Bahan Baku">Bahan Baku</option>
                      <option value="Kemasan">Kemasan</option>
                      <option value="Powder">Powder</option>
                      <option value="Syrup">Syrup</option>
                      <option value="Operasional">Operasional</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Satuan Beli / Kemasan</label>
                    <select
                      value={adminEditForm.buyUnit}
                      onChange={(e) => setAdminEditForm({ ...adminEditForm, buyUnit: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 min-h-[38px] text-xs font-semibold"
                    >
                      <option value="Pcs">Pcs / Botol</option>
                      <option value="Botol">Botol (Sirup / Saus)</option>
                      <option value="Pack">Pack / Slop (Cup / Sedotan)</option>
                      <option value="Sak">Sak (Bubuk Curah 25kg)</option>
                      <option value="Karton">Karton / Dus (Grosir)</option>
                      <option value="Kg">Kg (Berat)</option>
                      <option value="Liter">Liter (Volume)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Harga Beli per Satuan Beli (Rp)</label>
                    <Input
                      type="text"
                      placeholder="e.g. 1.000.000"
                      value={formatRupiahDisplay(adminEditForm.hargaBeli)}
                      onChange={(e) => setAdminEditForm({ ...adminEditForm, hargaBeli: parseRupiahInput(e.target.value) })}
                      className="min-h-[38px] font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Isi Netto per Satuan Beli</label>
                    <Input
                      type="number"
                      placeholder="misal: 1000 untuk 1L Sirup"
                      value={adminEditForm.conversionRatio || ""}
                      onChange={(e) => setAdminEditForm({ ...adminEditForm, conversionRatio: e.target.value === "" ? ("" as any) : Number(e.target.value) })}
                      className="min-h-[38px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Satuan Takaran Resep / HPP</label>
                  <Input
                    placeholder="misal: ml / gram / pcs / cup"
                    value={adminEditForm.unit}
                    onChange={(e) => setAdminEditForm({ ...adminEditForm, unit: e.target.value })}
                    className="min-h-[38px]"
                  />
                </div>

                {/* HPP Live Badge Preview */}
                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center justify-between text-xs font-semibold text-emerald-800">
                  <div className="flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-emerald-600" />
                    <span>HPP Dasar Terhitung:</span>
                  </div>
                  <strong className="text-sm font-extrabold text-emerald-700">
                    Rp {adminEditForm.conversionRatio > 0 
                      ? Math.round(adminEditForm.hargaBeli / adminEditForm.conversionRatio).toLocaleString("id-ID")
                      : 0} / {adminEditForm.unit || "unit"}
                  </strong>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t">
                  <input
                    type="checkbox"
                    id="editIsPercentageMode"
                    checked={adminEditForm.isPercentageMode}
                    onChange={(e) => setAdminEditForm({ ...adminEditForm, isPercentageMode: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="editIsPercentageMode" className="text-xs font-medium text-slate-800 cursor-pointer">
                    Tampilkan Stok dalam Satuan Persentase (%) <span className="text-slate-400">(Khusus bahan curah besar seperti Creamer 25kg)</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setSelectedAdminEditItem(null)} className="text-xs rounded-xl">
                  Batal
                </Button>
                <Button onClick={handleSaveAdminEdit} disabled={submitting} className="bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold rounded-xl px-4">
                  {submitting ? "Menyimpan..." : "Simpan Perubahan HPP"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Dialog Tambah Bahan Baru */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl border shadow-2xl p-6 space-y-4">
              <h3 className="font-bold text-sm text-slate-900">Tambah Bahan Baku & Konversi HPP</h3>
              <form onSubmit={(e) => { e.preventDefault(); handleAddMaterial(); }} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nama Bahan Baku *</label>
                  <Input
                    placeholder="misal: Sirup Hazelnut / Creamer / Susu UHT"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="min-h-[38px] font-bold"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Kategori *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 min-h-[38px] text-xs font-semibold"
                    >
                      <option value="Bahan Baku">Bahan Baku</option>
                      <option value="Kemasan">Kemasan</option>
                      <option value="Powder">Powder</option>
                      <option value="Syrup">Syrup</option>
                      <option value="Operasional">Operasional</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Satuan Beli / Kemasan</label>
                    <select
                      value={formData.buyUnit}
                      onChange={(e) => setFormData({ ...formData, buyUnit: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 min-h-[38px] text-xs font-semibold"
                    >
                      <option value="Pcs">Pcs / Botol</option>
                      <option value="Botol">Botol (Sirup / Saus)</option>
                      <option value="Pack">Pack / Slop (Cup / Sedotan)</option>
                      <option value="Sak">Sak (Bubuk Curah 25kg)</option>
                      <option value="Karton">Karton / Dus (Grosir)</option>
                      <option value="Kg">Kg (Berat)</option>
                      <option value="Liter">Liter (Volume)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Harga Beli per Satuan (Rp)</label>
                    <Input
                      type="text"
                      placeholder="e.g. 1.000.000"
                      value={formatRupiahDisplay(formData.hargaBeli)}
                      onChange={(e) => setFormData({ ...formData, hargaBeli: parseRupiahInput(e.target.value) })}
                      className="min-h-[38px] font-semibold"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Isi Netto per Satuan Beli</label>
                    <Input
                      type="number"
                      placeholder="1000 untuk 1L Sirup"
                      value={formData.conversionRatio || ""}
                      onChange={(e) => setFormData({ ...formData, conversionRatio: e.target.value === "" ? ("" as any) : Number(e.target.value) })}
                      className="min-h-[38px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Satuan Takaran Resep / HPP *</label>
                  <Input
                    placeholder="ml / gram / pcs / cup"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="min-h-[38px]"
                    required
                  />
                </div>

                {/* HPP Live Badge Preview */}
                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center justify-between text-xs font-semibold text-emerald-800">
                  <div className="flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-emerald-600" />
                    <span>HPP Dasar Terhitung:</span>
                  </div>
                  <strong className="text-sm font-extrabold text-emerald-700">
                    Rp {formData.conversionRatio > 0 
                      ? Math.round(formData.hargaBeli / formData.conversionRatio).toLocaleString("id-ID")
                      : 0} / {formData.unit || "unit"}
                  </strong>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t">
                  <input
                    type="checkbox"
                    id="addIsPercentageMode"
                    checked={formData.isPercentageMode}
                    onChange={(e) => setFormData({ ...formData, isPercentageMode: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="addIsPercentageMode" className="text-xs font-medium text-slate-800 cursor-pointer">
                    Tampilkan Stok dalam Satuan Persentase (%) <span className="text-slate-400">(Khusus Creamer 25kg sak)</span>
                  </label>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="text-xs rounded-xl">
                    Batal
                  </Button>
                  <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl px-4">
                    {submitting ? "Menyimpan..." : "Simpan Bahan"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Dialog Kelola Kategori */}
        {isCategoryModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-3xl border shadow-2xl p-6 space-y-4">
              <h3 className="font-bold text-sm text-slate-900">Kelola Kategori Bahan Baku</h3>
              
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 block">Daftar Kategori Aktif:</label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border rounded-xl">
                  {categoriesList.map((c) => (
                    <Badge key={c} variant="secondary" className="text-xs font-semibold px-2 py-0.5">
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 block">Tambah Kategori Baru:</label>
                <Input
                  placeholder="misal: Packaging / Saus / Topik"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="min-h-[38px] text-xs font-semibold"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setIsCategoryModalOpen(false)} className="text-xs rounded-xl">
                  Batal
                </Button>
                <Button onClick={handleAddCategory} className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl px-4">
                  Tambah Kategori
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
