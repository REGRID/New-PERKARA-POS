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
  Percent,
  AlertTriangle,
  History,
  TrendingDown,
  TrendingUp,
  AlertOctagon,
  FileSpreadsheet,
  CheckCircle2,
  PackageX,
  ArrowDownRight,
  ArrowUpRight,
  ShieldAlert,
  ShoppingCart
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
  const [activeMainTab, setActiveMainTab] = useState<"inventory" | "movements" | "spillage">("inventory");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryTab, setSelectedCategoryTab] = useState("Semua");
  const [activeSubMode, setActiveSubMode] = useState<"bar" | "warehouse">("bar");
  
  // Data States
  const [materials, setMaterials] = useState<any[]>([]);
  const [stockMovements, setStockMovements] = useState<any[]>([]);
  const [spillageLogs, setSpillageLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [loadingSpillage, setLoadingSpillage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filter for Stock Movements
  const [movementFilterType, setMovementFilterType] = useState<string>("SEMUA");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoriesList, setCategoriesList] = useState<string[]>(["Semua", "Bahan Baku", "Kemasan", "Operasional", "Powder", "Syrup"]);
  const [selectedAdminEditItem, setSelectedAdminEditItem] = useState<any>(null);
  const [restockItem, setRestockItem] = useState<any>(null);
  const [restockQty, setRestockQty] = useState<number>(1);

  // Spillage / Waste Modal
  const [isSpillageModalOpen, setIsSpillageModalOpen] = useState(false);
  const [spillageForm, setSpillageForm] = useState({
    ingredientId: "",
    quantity: 1,
    location: "floor" as "floor" | "warehouse",
    reason: "Tumpah saat pembuatan pesanan",
    customReason: "",
    reportedBy: user?.name || "Staf Outlet",
  });

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
    minStockAlert: 10,
    isPercentageMode: false,
  });

  const DEFAULT_FALLBACK_MATERIALS = [
    { id: "ing-1", sku: "RAW-KOPI-001", name: "Biji Kopi Espresso Blend", category: "Bahan Baku", buyUnit: "Kg", unit: "gram", conversionRatio: 1000, floorQuantity: 5000, warehouseQuantity: 10000, minStockAlert: 2000, hargaBeli: 180000, costPerUseUnit: 180 },
    { id: "ing-2", sku: "RAW-SUSU-002", name: "Susu UHT Full Cream 1L", category: "Bahan Baku", buyUnit: "Karton", unit: "ml", conversionRatio: 12000, floorQuantity: 2000, warehouseQuantity: 0, minStockAlert: 5000, hargaBeli: 210000, costPerUseUnit: 17.5 },
    { id: "ing-3", sku: "RAW-SIRU-003", name: "Sirup Gula Aren Premium 1L", category: "Bahan Baku", buyUnit: "Botol", unit: "ml", conversionRatio: 1000, floorQuantity: 3000, warehouseQuantity: 6000, minStockAlert: 1000, hargaBeli: 65000, costPerUseUnit: 65 },
    { id: "ing-4", sku: "RAW-MATC-004", name: "Powder Matcha Uji Pure 500g", category: "Bahan Baku", buyUnit: "Pack", unit: "gram", conversionRatio: 500, floorQuantity: 250, warehouseQuantity: 0, minStockAlert: 500, hargaBeli: 145000, costPerUseUnit: 290 },
    { id: "ing-5", sku: "RAW-CUP1-005", name: "Cup Plastik PET 16oz + Lid", category: "Operasional", buyUnit: "Karton", unit: "pcs", conversionRatio: 1000, floorQuantity: 150, warehouseQuantity: 0, minStockAlert: 300, hargaBeli: 350000, costPerUseUnit: 350 },
  ];

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/data?type=ingredients");
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json) && json.length > 0) {
          setMaterials(json);
        } else {
          setMaterials(DEFAULT_FALLBACK_MATERIALS);
        }
      } else {
        setMaterials(DEFAULT_FALLBACK_MATERIALS);
      }
    } catch (err) {
      console.error("Error fetching ingredients:", err);
      setMaterials(DEFAULT_FALLBACK_MATERIALS);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockMovements = async () => {
    try {
      setLoadingMovements(true);
      const res = await fetch("/api/data?type=stock_movements");
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json)) setStockMovements(json);
      }
    } catch (err) {
      console.error("Error fetching stock movements:", err);
    } finally {
      setLoadingMovements(false);
    }
  };

  const fetchSpillageLogs = async () => {
    try {
      setLoadingSpillage(true);
      const res = await fetch("/api/data?type=spillage_logs");
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json)) setSpillageLogs(json);
      }
    } catch (err) {
      console.error("Error fetching spillage logs:", err);
    } finally {
      setLoadingSpillage(false);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  useEffect(() => {
    if (activeMainTab === "movements") {
      fetchStockMovements();
    } else if (activeMainTab === "spillage") {
      fetchSpillageLogs();
    }
  }, [activeMainTab]);

  // Critical Low Stock Items (Reorder Point Alert)
  const criticalStockItems = materials.filter((m) => {
    const totalQty = (Number(m.floorQuantity) || 0) + (Number(m.warehouseQuantity) || 0);
    const minAlert = Number(m.minStockAlert) || 10;
    return totalQty <= minAlert;
  });

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

  const handleSendReorderWa = () => {
    const todayStr = new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    let message = `*🚨 REKAP PERMINTAAN REORDER BAHAN KRITIS*\nTanggal: ${todayStr}\n\n`;
    message += `Mohon pengadaan/pengiriman segera untuk bahan baku berikut:\n`;

    criticalStockItems.forEach((m, idx) => {
      const totalStock = (Number(m.floorQuantity) || 0) + (Number(m.warehouseQuantity) || 0);
      const unit = m.buyUnit || m.unit || "Pcs";
      message += `${idx + 1}. *${m.name}* (Sisa: ${totalStock} ${unit}, Min: ${m.minStockAlert} ${unit})\n`;
    });

    message += `\n_Dikirim dari Modul Manajemen Stok Perkara POS_`;
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
        body: JSON.stringify({ 
          id, 
          floorQuantity: newQty,
          employeeName: user?.name || "Staf Outlet",
          note: `Quick Adjust ${delta > 0 ? "+" : ""}${delta}`
        }),
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
        body: JSON.stringify({ 
          id, 
          floorQuantity: numVal,
          employeeName: user?.name || "Staf Outlet",
          note: "Input Opname Manual"
        }),
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
        body: JSON.stringify({ 
          id: restockItem.id, 
          floorQuantity: newFloorQty,
          employeeName: user?.name || "Staf Outlet",
          note: `Restock Cepat +${restockQty}`
        }),
      });
      await fetchIngredients();
    } catch (err) {
      console.error("Failed to restock:", err);
    }
  };

  // Handle Spillage / Waste Submit
  const handleSaveSpillage = async () => {
    if (!spillageForm.ingredientId || spillageForm.quantity <= 0) return;
    try {
      setSubmitting(true);
      const finalReason = spillageForm.reason === "Lainnya" 
        ? spillageForm.customReason || "Waste Lainnya"
        : spillageForm.reason;

      const res = await fetch("/api/data?type=save_spillage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredientId: spillageForm.ingredientId,
          quantity: Number(spillageForm.quantity),
          location: spillageForm.location,
          reason: finalReason,
          reportedBy: spillageForm.reportedBy || user?.name || "Staf Outlet",
        }),
      });

      if (res.ok) {
        setIsSpillageModalOpen(false);
        setSpillageForm({
          ingredientId: "",
          quantity: 1,
          location: "floor",
          reason: "Tumpah saat pembuatan pesanan",
          customReason: "",
          reportedBy: user?.name || "Staf Outlet",
        });
        await fetchIngredients();
        if (activeMainTab === "spillage") await fetchSpillageLogs();
        if (activeMainTab === "movements") await fetchStockMovements();
      }
    } catch (err) {
      console.error("Error saving spillage:", err);
    } finally {
      setSubmitting(false);
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
          minStockAlert: 10,
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

  // Open Spillage Modal for specific item
  const handleOpenSpillageModal = (item?: any) => {
    setSpillageForm({
      ingredientId: item?.id || materials[0]?.id || "",
      quantity: 1,
      location: "floor",
      reason: "Tumpah saat pembuatan pesanan",
      customReason: "",
      reportedBy: user?.name || "Staf Outlet",
    });
    setIsSpillageModalOpen(true);
  };

  // Filter items for Materials View
  const filtered = materials.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.category && m.category.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (selectedCategoryTab === "Semua") return matchesSearch;
    return matchesSearch && (m.category || "Bahan Baku") === selectedCategoryTab;
  });

  const categories = Array.from(new Set(materials.map((m) => m.category || "Bahan Baku")));

  // Filter Stock Movements
  const filteredMovements = stockMovements.filter((mov) => {
    const matchesType = movementFilterType === "SEMUA" || mov.type === movementFilterType;
    const ingName = mov.ingredient?.name || "";
    const note = mov.note || "";
    const refId = mov.referenceId || "";
    const matchesSearch = ingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.toLowerCase().includes(searchQuery.toLowerCase()) ||
      refId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Calculate Total Spillage Loss in Rupiah
  const totalSpillageLoss = spillageLogs.reduce((acc, log) => {
    const costPerUnit = Number(log.ingredient?.costPerUseUnit) || 0;
    return acc + (Number(log.quantity || 0) * costPerUnit);
  }, 0);

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
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Manajemen Stok &amp; Bahan Baku</h1>
              <p className="text-xs text-slate-500 font-medium">
                Pantau mutasi bahan baku, alert stok kritis (reorder), dan pelacakan waste/spillage.
              </p>
            </div>
          </div>

          {/* Action Buttons Top Right */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => handleOpenSpillageModal()}
              className="border-rose-300 text-rose-700 bg-rose-50/50 hover:bg-rose-100 font-semibold text-xs px-3.5 py-2 min-h-[40px] rounded-xl gap-1.5 shadow-2xs cursor-pointer"
            >
              <AlertOctagon className="w-4 h-4 text-rose-600" />
              <span>Catat Waste / Tumpah</span>
            </Button>

            <Button
              variant="outline"
              onClick={handleSendStockWa}
              className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-semibold text-xs px-3.5 py-2 min-h-[40px] rounded-xl gap-1.5 shadow-2xs cursor-pointer"
            >
              <Send className="w-4 h-4 text-emerald-600" />
              <span>Rekap Stok WA</span>
            </Button>

            {isAdmin && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="border-amber-500 text-amber-700 hover:bg-amber-50 font-semibold text-xs px-3.5 py-2 min-h-[40px] rounded-xl gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Tag className="w-4 h-4 text-amber-600" />
                  <span>Kategori</span>
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
              onClick={() => {
                fetchIngredients();
                if (activeMainTab === "movements") fetchStockMovements();
                if (activeMainTab === "spillage") fetchSpillageLogs();
              }}
              className="p-2.5 min-h-[40px] rounded-xl border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
              title="Segarkan Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading || loadingMovements || loadingSpillage ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* 2. CRITICAL LOW STOCK ALERT BANNER (REORDER POINT) */}
        {criticalStockItems.length > 0 && (
          <div className="p-4 md:p-5 bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border border-rose-200/90 rounded-3xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in duration-300">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-rose-950">
                    Peringatan: {criticalStockItems.length} Bahan Baku Mencapai Batas Kritis (Reorder Point)
                  </h3>
                  <Badge className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0 border-none">
                    Perlu Restock
                  </Badge>
                </div>
                <p className="text-xs text-rose-900/80 font-medium mt-1">
                  Bahan baku berikut stoknya hampir habis:{" "}
                  <span className="font-bold text-rose-950">
                    {criticalStockItems.map((m) => `${m.name} (${(Number(m.floorQuantity) || 0) + (Number(m.warehouseQuantity) || 0)} ${m.buyUnit || m.unit})`).join(", ")}
                  </span>
                </p>
              </div>
            </div>

            <Button
              onClick={handleSendReorderWa}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-xl shrink-0 gap-1.5 shadow-2xs cursor-pointer w-full md:w-auto"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Pesan Ulang ke Vendor (WA)</span>
            </Button>
          </div>
        )}

        {/* 3. MAIN NAVIGATION TABS */}
        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveMainTab("inventory")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeMainTab === "inventory"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Stok Bahan &amp; Bar</span>
            <Badge className={`text-[10px] px-2 py-0 border-none font-bold ${
              activeMainTab === "inventory" ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-600"
            }`}>
              {materials.length}
            </Badge>
          </button>

          <button
            onClick={() => setActiveMainTab("movements")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeMainTab === "movements"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Riwayat Mutasi Stok</span>
            <Badge className={`text-[10px] px-2 py-0 border-none font-bold ${
              activeMainTab === "movements" ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-600"
            }`}>
              Audit Log
            </Badge>
          </button>

          <button
            onClick={() => setActiveMainTab("spillage")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeMainTab === "spillage"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
            }`}
          >
            <AlertOctagon className="w-4 h-4 text-rose-500" />
            <span>Log Waste &amp; Kerugian</span>
            {spillageLogs.length > 0 && (
              <Badge className="bg-rose-100 text-rose-700 text-[10px] px-2 py-0 border-none font-bold">
                {spillageLogs.length}
              </Badge>
            )}
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: INVENTORY & STOCK MANAGEMENT */}
        {/* ========================================================================= */}
        {activeMainTab === "inventory" && (
          <div className="space-y-6">
            {/* Top 3 Summary Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Total Item Bahan Baku</span>
                  <div className="text-2xl font-extrabold text-slate-900">{materials.length} Bahan</div>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
                  <Boxes className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Stok Aman</span>
                  <div className="text-2xl font-extrabold text-emerald-600">
                    {materials.filter((m) => {
                      const qty = (Number(m.floorQuantity) || 0) + (Number(m.warehouseQuantity) || 0);
                      return qty > (Number(m.minStockAlert) || 10);
                    }).length} Bahan
                  </div>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Stok Kritis / Perlu Beli</span>
                  <div className="text-2xl font-extrabold text-rose-600">
                    {criticalStockItems.length} Bahan
                  </div>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Category Filter Pills & Search Input Row */}
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

            {/* Main Materials Table */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
              <div className="border-b pb-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-slate-900">Daftar Stok Bahan &amp; Takaran</h3>
                    <Badge className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 border-none">
                      Stok Bar &amp; Gudang
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Setiap penjualan kasir otomatis memotong stok bahan sesuai resep minuman.
                  </p>
                </div>
              </div>

              <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
                <div className="grid grid-cols-12 px-6 py-3.5 bg-slate-50/70 border-b text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
                  <div className="col-span-5">NAMA BAHAN BAKU</div>
                  <div className="col-span-2 text-center">STATUS STOK</div>
                  <div className="col-span-3 text-center">STOK FISIK BAR</div>
                  <div className="col-span-2 text-right">AKSI</div>
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
                            const isPercent = item.isPercentageMode || item.unit === "%";
                            const floorQty = Number(item.floorQuantity) || 0;
                            const whQty = Number(item.warehouseQuantity) || 0;
                            const totalQty = floorQty + whQty;
                            const minAlert = Number(item.minStockAlert) || 10;
                            const isCritical = totalQty <= minAlert;
                            const isLow = !isCritical && totalQty <= minAlert * 1.5;

                            return (
                              <div key={item.id} className="grid grid-cols-12 px-6 py-3.5 items-center text-xs hover:bg-slate-50/60 transition-colors">
                                
                                {/* Col 1: Name & Price */}
                                <div className="col-span-5 space-y-0.5">
                                  <h4 className="font-extrabold text-slate-900 text-sm">{item.name}</h4>
                                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                                    <span>{isAdmin ? `Rp ${hargaBeli.toLocaleString("id-ID")} / ${item.buyUnit || "Pcs"}` : `Kemasan: ${item.buyUnit || "Pcs"}`}</span>
                                    <span>•</span>
                                    <span>Min Alert: {minAlert} {item.buyUnit || item.unit}</span>
                                  </div>
                                </div>

                                {/* Col 2: Stock Level Status Badge */}
                                <div className="col-span-2 flex justify-center">
                                  {isCritical ? (
                                    <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-extrabold text-[10px] flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3" />
                                      <span>Kritis</span>
                                    </span>
                                  ) : isLow ? (
                                    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center gap-1">
                                      <span>Menipis</span>
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[10px] flex items-center gap-1">
                                      <span>Aman</span>
                                    </span>
                                  )}
                                </div>

                                {/* Col 3: Stock Bar Controls [-] [input] [+] Unit */}
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
                                    className="w-16 h-7 rounded-lg border border-slate-200 bg-white text-center font-extrabold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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

                                {/* Col 4: Action Buttons */}
                                <div className="col-span-2 flex items-center justify-end gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => { setRestockItem(item); setRestockQty(1); }}
                                    className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs font-semibold rounded-xl min-h-[32px] px-2.5 cursor-pointer"
                                  >
                                    Restock
                                  </Button>

                                  <button
                                    onClick={() => handleOpenSpillageModal(item)}
                                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Catat Barang Rusak / Tumpah"
                                  >
                                    <AlertOctagon className="w-4 h-4" />
                                  </button>

                                  {isAdmin && (
                                    <button
                                      onClick={() => handleOpenAdminEdit(item)}
                                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
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
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: RIWAYAT MUTASI STOK (STOCK MOVEMENTS AUDIT LOG) */}
        {/* ========================================================================= */}
        {activeMainTab === "movements" && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Type Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { label: "Semua Mutasi", val: "SEMUA" },
                  { label: "Penjualan POS", val: "SALE" },
                  { label: "Pembelian", val: "PURCHASE" },
                  { label: "Waste / Tumpah", val: "SPILLAGE" },
                  { label: "Penyesuaian Opname", val: "OPNAME_ADJUSTMENT" },
                  { label: "Retur / Refund", val: "REFUND_RETURN" },
                  { label: "Void Order", val: "CANCEL_RETURN" },
                ].map((t) => (
                  <button
                    key={t.val}
                    onClick={() => setMovementFilterType(t.val)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      movementFilterType === t.val
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <Input
                  placeholder="Cari nama bahan / ref..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-50/70 pl-9 min-h-[38px] text-xs rounded-xl border-slate-200"
                />
              </div>
            </div>

            <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Bahan Baku</th>
                    <th className="py-3 px-4 text-center">Tipe Mutasi</th>
                    <th className="py-3 px-4 text-right">Perubahan Qty</th>
                    <th className="py-3 px-4 text-right">Sisa Stok</th>
                    <th className="py-3 px-4">Petugas &amp; Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredMovements.length > 0 ? (
                    filteredMovements.map((mov: any) => {
                      const isNegative = Number(mov.quantity) < 0;
                      const unit = mov.ingredient?.unit || mov.ingredient?.buyUnit || "unit";

                      return (
                        <tr key={mov.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {new Date(mov.timestamp || mov.createdAt).toLocaleString("id-ID", {
                              day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                            })} WIB
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {mov.ingredient?.name || "Bahan Baku"}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge className={`text-[10px] font-bold ${
                              mov.type === "SALE" ? "bg-indigo-100 text-indigo-800" :
                              mov.type === "PURCHASE" ? "bg-emerald-100 text-emerald-800" :
                              mov.type === "SPILLAGE" ? "bg-rose-100 text-rose-800" :
                              mov.type === "REFUND_RETURN" || mov.type === "CANCEL_RETURN" ? "bg-amber-100 text-amber-800" :
                              "bg-slate-100 text-slate-800"
                            }`}>
                              {mov.type === "SALE" ? "Penjualan POS" :
                               mov.type === "PURCHASE" ? "Pembelian" :
                               mov.type === "SPILLAGE" ? "Waste / Tumpah" :
                               mov.type === "REFUND_RETURN" ? "Retur Refund" :
                               mov.type === "CANCEL_RETURN" ? "Retur Void" :
                               "Opname Stok"}
                            </Badge>
                          </td>
                          <td className={`py-3 px-4 text-right font-extrabold ${isNegative ? "text-rose-600" : "text-emerald-600"}`}>
                            {isNegative ? "" : "+"}{Number(mov.quantity || 0).toLocaleString("id-ID")} {unit}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-800">
                            {Number(mov.balanceAfter || 0).toLocaleString("id-ID")} {unit}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            <div className="font-semibold text-slate-900">{mov.employeeName || "Sistem"}</div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[220px]" title={mov.note || ""}>
                              {mov.note || "-"}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-bold text-xs text-slate-700">Belum ada catatan mutasi stok</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Semua pergerakan stok penjualan, pembelian, dan waste akan tercatat di sini.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: LOG WASTE & KERUGIAN (SPILLAGE LOGS) */}
        {/* ========================================================================= */}
        {activeMainTab === "spillage" && (
          <div className="space-y-6">
            {/* Top Waste Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Total Kejadian Waste</span>
                  <div className="text-2xl font-extrabold text-slate-900">{spillageLogs.length} Insiden</div>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <PackageX className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Estimasi Kerugian Finansial (HPP)</span>
                  <div className="text-2xl font-extrabold text-rose-600">
                    Rp {Math.round(totalSpillageLoss).toLocaleString("id-ID")}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Pencegahan Kerugian</span>
                  <div className="text-xs font-semibold text-slate-600 mt-1">
                    Wajib catat barang tumpah &amp; expired untuk analisa SOP bar.
                  </div>
                </div>
                <Button 
                  onClick={() => handleOpenSpillageModal()} 
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl"
                >
                  + Catat Waste
                </Button>
              </div>
            </div>

            {/* Spillage Table */}
            <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Bahan Baku</th>
                    <th className="py-3 px-4 text-center">Jumlah Waste</th>
                    <th className="py-3 px-4 text-right">Estimasi Kerugian (HPP)</th>
                    <th className="py-3 px-4">Alasan &amp; Keterangan</th>
                    <th className="py-3 px-4">Pelapor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {spillageLogs.length > 0 ? (
                    spillageLogs.map((log: any) => {
                      const costPerUnit = Number(log.ingredient?.costPerUseUnit) || 0;
                      const lossTotal = Number(log.quantity || 0) * costPerUnit;
                      const unit = log.ingredient?.unit || log.ingredient?.buyUnit || "unit";

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString("id-ID", {
                              day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                            })} WIB
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {log.ingredient?.name || "Bahan Baku"}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-rose-600">
                            {Number(log.quantity || 0).toLocaleString("id-ID")} {unit}
                          </td>
                          <td className="py-3 px-4 text-right font-extrabold text-rose-700">
                            Rp {Math.round(lossTotal).toLocaleString("id-ID")}
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            {log.reason}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                              {log.reportedBy || "Staf Outlet"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                        <p className="font-bold text-xs text-slate-700">Belum ada barang rusak atau tumpah</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Semua catatan kerugian bahan baku akan otomatis tertera di sini.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Dialog Catat Waste / Spillage */}
        {isSpillageModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl border shadow-2xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-base text-slate-900">Catat Barang Rusak / Tumpah (Waste)</h3>
              </div>
              <p className="text-xs text-slate-500">
                Stok bahan baku akan otomatis dipotong dan dicatat ke log audit kerugian F&amp;B.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Pilih Bahan Baku *</label>
                  <select
                    value={spillageForm.ingredientId}
                    onChange={(e) => setSpillageForm({ ...spillageForm, ingredientId: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 min-h-[38px] text-xs font-semibold"
                  >
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} (Sisa Stok: {(Number(m.floorQuantity) || 0) + (Number(m.warehouseQuantity) || 0)} {m.buyUnit || m.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Jumlah Terbuang / Rusak *</label>
                    <Input
                      type="number"
                      min={0.1}
                      step="any"
                      value={spillageForm.quantity}
                      onChange={(e) => setSpillageForm({ ...spillageForm, quantity: Number(e.target.value) })}
                      className="min-h-[38px] font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Lokasi Stok</label>
                    <select
                      value={spillageForm.location}
                      onChange={(e) => setSpillageForm({ ...spillageForm, location: e.target.value as any })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 min-h-[38px] text-xs font-semibold"
                    >
                      <option value="floor">Stok Bar / Outlet</option>
                      <option value="warehouse">Stok Gudang</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Alasan Waste / Kerusakan *</label>
                  <select
                    value={spillageForm.reason}
                    onChange={(e) => setSpillageForm({ ...spillageForm, reason: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 min-h-[38px] text-xs font-semibold"
                  >
                    <option value="Tumpah saat pembuatan pesanan">Tumpah saat pembuatan pesanan</option>
                    <option value="Bahan kadaluarsa / expired">Bahan kadaluarsa / expired</option>
                    <option value="Kemasan bocor / rusak / pecah">Kemasan bocor / rusak / pecah</option>
                    <option value="Kualitas rasa rusak / basi">Kualitas rasa rusak / basi</option>
                    <option value="Salah takaran saat kalibrasi mesin">Salah takaran saat kalibrasi mesin</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                {spillageForm.reason === "Lainnya" && (
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Keterangan Tambahan</label>
                    <Input
                      placeholder="Jelaskan alasan kerusakan..."
                      value={spillageForm.customReason}
                      onChange={(e) => setSpillageForm({ ...spillageForm, customReason: e.target.value })}
                      className="min-h-[38px]"
                    />
                  </div>
                )}

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nama Staf Pelapor</label>
                  <Input
                    placeholder="Nama staf yang bertugas"
                    value={spillageForm.reportedBy}
                    onChange={(e) => setSpillageForm({ ...spillageForm, reportedBy: e.target.value })}
                    className="min-h-[38px]"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t">
                <Button variant="outline" onClick={() => setIsSpillageModalOpen(false)} className="text-xs rounded-xl">
                  Batal
                </Button>
                <Button 
                  onClick={handleSaveSpillage} 
                  disabled={submitting || !spillageForm.ingredientId || spillageForm.quantity <= 0}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl px-4 cursor-pointer"
                >
                  {submitting ? "Menyimpan..." : "Simpan & Kurangi Stok"}
                </Button>
              </div>
            </div>
          </div>
        )}

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
              <h3 className="font-bold text-sm text-slate-900">Edit Detail Bahan &amp; Konversi HPP: {selectedAdminEditItem.name}</h3>
              
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Satuan Takaran Resep / HPP</label>
                    <Input
                      placeholder="misal: ml / gram / pcs / cup"
                      value={adminEditForm.unit}
                      onChange={(e) => setAdminEditForm({ ...adminEditForm, unit: e.target.value })}
                      className="min-h-[38px]"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Batas Minimum Peringatan (Reorder Point)</label>
                    <Input
                      type="number"
                      value={adminEditForm.minStockAlert}
                      onChange={(e) => setAdminEditForm({ ...adminEditForm, minStockAlert: Number(e.target.value) })}
                      className="min-h-[38px]"
                    />
                  </div>
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
                    Tampilkan Stok dalam Satuan Persentase (%) <span className="text-slate-400">(Khusus bahan curah besar)</span>
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
              <h3 className="font-bold text-sm text-slate-900">Tambah Bahan Baku &amp; Konversi HPP</h3>
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

                <div className="grid grid-cols-2 gap-3">
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
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Batas Minimum Peringatan</label>
                    <Input
                      type="number"
                      value={formData.minStockAlert}
                      onChange={(e) => setFormData({ ...formData, minStockAlert: Number(e.target.value) })}
                      className="min-h-[38px]"
                    />
                  </div>
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
                    Tampilkan Stok dalam Satuan Persentase (%)
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
