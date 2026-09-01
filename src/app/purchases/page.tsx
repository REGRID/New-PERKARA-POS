"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Plus, 
  ShoppingBag, 
  Search, 
  Sparkles, 
  Calendar as CalendarIcon, 
  Pencil, 
  Trash2, 
  RefreshCw, 
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FilterX,
  Store,
  Truck,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  Phone,
  Tag,
  PackageCheck,
  Building2,
  DollarSign,
  FileText
} from "lucide-react";
import { type DateRange } from "react-day-picker";
import { startOfDay, endOfDay, isWithinInterval, isSameDay } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth-context";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";

const formatRupiahDisplay = (val: number | string) => {
  if (val === "" || val === null || val === undefined) return "";
  if (val === 0 || val === "0") return "";
  const num = typeof val === "number" ? val : Number(val.toString().replace(/\D/g, ""));
  if (isNaN(num) || num === 0) return "";
  return num.toLocaleString("id-ID");
};

const parseRupiahInput = (val: string) => {
  const clean = val.replace(/\D/g, "");
  if (clean === "") return 0;
  return Number(clean);
};

export default function PurchasesPage() {
  const { user, isAdmin } = useAuth();
  const [activeMainTab, setActiveMainTab] = useState<"purchases" | "vendors">("purchases");

  // Data States
  const [purchases, setPurchases] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("SEMUA");
  const [submitting, setSubmitting] = useState(false);

  // Date Filter State
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<any>(null);
  
  // Purchase Form State
  const [form, setForm] = useState({
    id: "",
    ingredientId: "",
    vendorId: "",
    itemName: "",
    quantity: 1,
    unitPrice: 0,
    supplierName: "",
    status: "RECEIVED" as "DRAFT" | "ORDERED" | "RECEIVED" | "CANCELLED",
    paymentStatus: "PAID" as "PAID" | "UNPAID" | "PARTIAL",
    approvedBy: user?.name || "Admin",
    recordCashOut: true,
    notes: "",
  });

  // Vendor Modal State
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<any>(null);
  const [vendorForm, setVendorForm] = useState({
    id: "",
    name: "",
    phone: "",
    category: "Supplier Bahan Baku",
    messageTemplate: "",
  });

  // Fetch Purchases
  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/data?type=purchases");
      if (res.ok) {
        const json = await res.json();
        setPurchases(Array.isArray(json) ? json : []);
      } else {
        setPurchases([]);
      }
    } catch (e) {
      console.error("Error fetching purchases:", e);
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Ingredients for ID-based dropdown
  const fetchIngredients = async () => {
    try {
      const res = await fetch("/api/data?type=ingredients");
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json)) setIngredients(json);
      }
    } catch (e) {
      console.error("Error fetching ingredients:", e);
    }
  };

  // Fetch Vendors
  const fetchVendors = async () => {
    try {
      setLoadingVendors(true);
      const res = await fetch("/api/data?type=vendors");
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json)) setVendors(json);
      }
    } catch (e) {
      console.error("Error fetching vendors:", e);
    } finally {
      setLoadingVendors(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
    fetchIngredients();
    fetchVendors();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateRange, statusFilter, pageSize]);

  // Open Add Modal
  const openAddModal = () => {
    setEditingPurchase(null);
    setForm({
      id: "",
      ingredientId: ingredients[0]?.id || "",
      vendorId: vendors[0]?.id || "",
      itemName: ingredients[0]?.name || "",
      quantity: 1,
      unitPrice: Number(ingredients[0]?.hargaBeli) || 0,
      supplierName: vendors[0]?.name || "",
      status: "RECEIVED",
      paymentStatus: "PAID",
      approvedBy: user?.name || "Admin",
      recordCashOut: true,
      notes: "",
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (p: any) => {
    setEditingPurchase(p);
    setForm({
      id: p.id,
      ingredientId: p.ingredientId || "",
      vendorId: p.vendorId || "",
      itemName: p.itemName || "",
      quantity: Number(p.quantity) || 1,
      unitPrice: Number(p.unitPrice) || 0,
      supplierName: p.supplierName || "",
      status: p.status || "RECEIVED",
      paymentStatus: p.paymentStatus || "PAID",
      approvedBy: p.approvedBy || user?.name || "Admin",
      recordCashOut: true,
      notes: p.notes || "",
    });
    setIsModalOpen(true);
  };

  // Handle Select Ingredient
  const handleSelectIngredient = (ingId: string) => {
    if (!ingId) {
      setForm((prev) => ({ ...prev, ingredientId: "", itemName: "" }));
      return;
    }
    const found = ingredients.find((i) => i.id === ingId);
    if (found) {
      setForm((prev) => ({
        ...prev,
        ingredientId: found.id,
        itemName: found.name,
        unitPrice: Number(found.hargaBeli) || prev.unitPrice,
      }));
    }
  };

  // Handle Select Vendor
  const handleSelectVendor = (vId: string) => {
    if (!vId) {
      setForm((prev) => ({ ...prev, vendorId: "", supplierName: "" }));
      return;
    }
    const found = vendors.find((v) => v.id === vId);
    if (found) {
      setForm((prev) => ({
        ...prev,
        vendorId: found.id,
        supplierName: found.name,
      }));
    }
  };

  // Handle Save Purchase
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.itemName.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/data?type=save_purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setIsModalOpen(false);
        await fetchPurchases();
        await fetchVendors();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Receive Goods (Update Status to RECEIVED)
  const handleReceiveGoods = async (p: any) => {
    if (!confirm(`Konfirmasi penerimaan barang untuk "${p.itemName}"? Stok bahan baku akan otomatis ditambahkan.`)) return;
    try {
      const res = await fetch("/api/data?type=update_purchase_status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: p.id,
          status: "RECEIVED",
          approvedBy: user?.name || "Admin",
          recordCashOut: p.paymentStatus === "PAID",
        }),
      });
      if (res.ok) {
        await fetchPurchases();
        await fetchIngredients();
        await fetchVendors();
      }
    } catch (e) {
      console.error("Error receiving goods:", e);
    }
  };

  // Handle Delete Purchase
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus catatan pembelian "${name}"?`)) return;
    try {
      const res = await fetch("/api/data?type=delete_purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        await fetchPurchases();
        await fetchVendors();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Save Vendor
  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorForm.name.trim()) return;
    try {
      setSubmitting(true);
      const res = await fetch("/api/data?type=save_vendor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vendorForm),
      });
      if (res.ok) {
        setIsVendorModalOpen(false);
        setVendorForm({ id: "", name: "", phone: "", category: "Supplier Bahan Baku", messageTemplate: "" });
        await fetchVendors();
      }
    } catch (e) {
      console.error("Error saving vendor:", e);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Vendor
  const handleDeleteVendor = async (id: string, name: string) => {
    if (!confirm(`Hapus supplier "${name}"?`)) return;
    try {
      const res = await fetch("/api/data?type=delete_vendor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) await fetchVendors();
    } catch (e) {
      console.error("Error deleting vendor:", e);
    }
  };

  // Open WhatsApp to Vendor
  const handleChatVendor = (vendor: any) => {
    const phoneClean = (vendor.phone || "").replace(/\D/g, "");
    let phoneFormatted = phoneClean;
    if (phoneFormatted.startsWith("0")) {
      phoneFormatted = "62" + phoneFormatted.substring(1);
    }
    const template = vendor.messageTemplate || `Halo ${vendor.name}, saya dari outlet Perkara POS ingin konfirmasi pesanan pengadaan bahan baku.`;
    const encoded = encodeURIComponent(template);
    window.open(`https://wa.me/${phoneFormatted}?text=${encoded}`, "_blank");
  };

  // Filtered Purchases with Date Range & Status Filter
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q ||
        (p.itemName || "").toLowerCase().includes(q) ||
        (p.supplierName || "").toLowerCase().includes(q) ||
        (p.notes || "").toLowerCase().includes(q);

      let matchStatus = true;
      if (statusFilter === "UNPAID") {
        matchStatus = p.paymentStatus === "UNPAID";
      } else if (statusFilter !== "SEMUA") {
        matchStatus = (p.status || "RECEIVED") === statusFilter;
      }

      let matchDate = true;
      if (dateRange?.from) {
        const itemDate = new Date(p.purchaseDate || p.createdAt);
        if (dateRange.to) {
          matchDate = isWithinInterval(itemDate, {
            start: startOfDay(dateRange.from),
            end: endOfDay(dateRange.to),
          });
        } else {
          matchDate = isSameDay(itemDate, dateRange.from);
        }
      }

      return matchQuery && matchStatus && matchDate;
    });
  }, [purchases, searchQuery, statusFilter, dateRange]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredPurchases.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  
  const paginatedPurchases = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * pageSize;
    return filteredPurchases.slice(startIndex, startIndex + pageSize);
  }, [filteredPurchases, validCurrentPage, pageSize]);

  // Financial Stats
  const totalSpent = filteredPurchases.reduce((sum, p) => sum + (Number(p.totalPrice) || (Number(p.quantity) * Number(p.unitPrice)) || 0), 0);
  const unpaidTotal = purchases.filter((p) => p.paymentStatus === "UNPAID").reduce((sum, p) => sum + (Number(p.totalPrice) || 0), 0);
  const pendingOrdersCount = purchases.filter((p) => p.status === "ORDERED" || p.status === "DRAFT").length;

  const startRecord = filteredPurchases.length > 0 ? (validCurrentPage - 1) * pageSize + 1 : 0;
  const endRecord = Math.min(validCurrentPage * pageSize, filteredPurchases.length);

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto text-slate-900 space-y-6">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Pembelian &amp; Pengadaan (Purchasing)</h1>
              <p className="text-xs text-slate-500 font-medium">
                Kelola pesanan PO, sinkronisasi stok bahan baku, dan riwayat supplier.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditingVendor(null);
                setVendorForm({ id: "", name: "", phone: "", category: "Supplier Bahan Baku", messageTemplate: "" });
                setIsVendorModalOpen(true);
              }}
              className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs font-semibold rounded-xl min-h-[40px] px-3.5 gap-1.5 cursor-pointer shadow-2xs"
            >
              <Truck className="w-4 h-4 text-indigo-600" />
              <span>+ Supplier Baru</span>
            </Button>

            <Button
              onClick={openAddModal}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl min-h-[40px] px-4 gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Pembelian</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                fetchPurchases();
                fetchVendors();
                fetchIngredients();
              }}
              className="p-2.5 min-h-[40px] rounded-xl border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
              title="Segarkan Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 border-b border-slate-200/80 pb-3">
          <button
            onClick={() => setActiveMainTab("purchases")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between sm:justify-start gap-2 cursor-pointer active:scale-[0.98] ${
              activeMainTab === "purchases"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span>Transaksi &amp; PO Pembelian</span>
            </div>
            <Badge className={`text-[10px] px-2 py-0 border-none font-bold ${
              activeMainTab === "purchases" ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-600"
            }`}>
              {purchases.length}
            </Badge>
          </button>

          <button
            onClick={() => setActiveMainTab("vendors")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between sm:justify-start gap-2 cursor-pointer active:scale-[0.98] ${
              activeMainTab === "vendors"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4" />
              <span>Data Supplier (Vendors)</span>
            </div>
            <Badge className={`text-[10px] px-2 py-0 border-none font-bold ${
              activeMainTab === "vendors" ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-600"
            }`}>
              {vendors.length}
            </Badge>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: PURCHASES TRANSACTIONS */}
        {/* ========================================================================= */}
        {activeMainTab === "purchases" && (
          <div className="space-y-6">
            
            {/* Top Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Total Pembelian (Tampil)</span>
                  <div className="text-2xl font-extrabold text-slate-900">
                    Rp {totalSpent.toLocaleString("id-ID")}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Total Tagihan Tempo / Hutang</span>
                  <div className="text-2xl font-extrabold text-amber-600">
                    Rp {unpaidTotal.toLocaleString("id-ID")}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">PO Menunggu Diterima</span>
                  <div className="text-2xl font-extrabold text-indigo-600">
                    {pendingOrdersCount} Pesanan
                  </div>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <PackageCheck className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Filter Pills & Date Picker Row */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { label: "Semua Status", val: "SEMUA" },
                  { label: "Diterima (Stok Masuk)", val: "RECEIVED" },
                  { label: "Dipesan (PO)", val: "ORDERED" },
                  { label: "Draft Rencana", val: "DRAFT" },
                  { label: "Tempo / Hutang", val: "UNPAID" },
                ].map((s) => (
                  <button
                    key={s.val}
                    onClick={() => setStatusFilter(s.val)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      statusFilter === s.val
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <DatePickerWithRange date={dateRange} setDate={setDateRange} />
                <div className="relative min-w-[200px]">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <Input
                    placeholder="Cari item / supplier..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-50 pl-9 min-h-[38px] text-xs rounded-xl border-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* Purchases Table */}
            <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
              <table className="w-full text-left border-collapse min-w-[750px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Nama Barang &amp; Bahan</th>
                    <th className="py-3 px-4">Supplier (Vendor)</th>
                    <th className="py-3 px-4 text-center">Status PO</th>
                    <th className="py-3 px-4 text-center">Status Bayar</th>
                    <th className="py-3 px-4 text-right">Total Biaya</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginatedPurchases.length > 0 ? (
                    paginatedPurchases.map((p) => {
                      const total = Number(p.totalPrice) || (Number(p.quantity) * Number(p.unitPrice)) || 0;
                      const isReceived = (p.status || "RECEIVED") === "RECEIVED";
                      const isUnpaid = p.paymentStatus === "UNPAID";

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {new Date(p.purchaseDate || p.createdAt).toLocaleDateString("id-ID", {
                              day: "numeric", month: "short", year: "numeric"
                            })}
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{p.itemName}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span>{p.quantity} item @ Rp {Number(p.unitPrice || 0).toLocaleString("id-ID")}</span>
                              {p.ingredientId && (
                                <Badge className="bg-emerald-50 text-emerald-700 text-[9px] px-1.5 py-0 border-emerald-200">
                                  Bahan Resmi
                                </Badge>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-800">{p.supplierName || "-"}</div>
                            {p.notes && <div className="text-[11px] text-slate-400 truncate max-w-[180px]" title={p.notes}>{p.notes}</div>}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <Badge className={`text-[10px] font-bold ${
                              isReceived ? "bg-emerald-100 text-emerald-800" :
                              p.status === "ORDERED" ? "bg-indigo-100 text-indigo-800" :
                              p.status === "DRAFT" ? "bg-slate-100 text-slate-700" :
                              "bg-rose-100 text-rose-800"
                            }`}>
                              {isReceived ? "✓ Diterima" :
                               p.status === "ORDERED" ? "Dipesan (PO)" :
                               p.status === "DRAFT" ? "Draft Rencana" : "Dibatalkan"}
                            </Badge>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <Badge className={`text-[10px] font-bold ${
                              isUnpaid ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                            }`}>
                              {isUnpaid ? "Tempo (Hutang)" : "Lunas"}
                            </Badge>
                          </td>

                          <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                            Rp {total.toLocaleString("id-ID")}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {!isReceived && (
                                <Button
                                  size="sm"
                                  onClick={() => handleReceiveGoods(p)}
                                  className="h-7 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2 rounded-lg gap-1 cursor-pointer"
                                  title="Terima Barang & Masukkan Stok"
                                >
                                  <PackageCheck className="w-3.5 h-3.5" />
                                  <span>Terima</span>
                                </Button>
                              )}

                              <button
                                onClick={() => openEditModal(p)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDelete(p.id, p.itemName)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Hapus"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-bold text-xs text-slate-700">Belum ada transaksi pembelian</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Klik tombol Tambah Pembelian untuk mencatat pengadaan bahan baru.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredPurchases.length > 0 && (
              <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                <div>
                  Menampilkan <strong>{startRecord}</strong> - <strong>{endRecord}</strong> dari <strong>{filteredPurchases.length}</strong> transaksi
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={validCurrentPage <= 1} className="h-7 w-7 p-0 rounded-lg">
                    <ChevronsLeft className="w-3 h-3" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={validCurrentPage <= 1} className="h-7 w-7 p-0 rounded-lg">
                    <ChevronLeft className="w-3 h-3" />
                  </Button>
                  <span className="px-2 font-bold text-slate-700">{validCurrentPage} / {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={validCurrentPage >= totalPages} className="h-7 w-7 p-0 rounded-lg">
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={validCurrentPage >= totalPages} className="h-7 w-7 p-0 rounded-lg">
                    <ChevronsRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: VENDOR CONTACTS & SUPPLIERS */}
        {/* ========================================================================= */}
        {activeMainTab === "vendors" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vendors.map((v) => (
                <div key={v.id} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3.5 hover:border-indigo-200 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">{v.name}</h3>
                      <span className="text-[11px] text-slate-400 font-medium block mt-0.5">{v.category || "Supplier Umum"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingVendor(v);
                          setVendorForm({
                            id: v.id,
                            name: v.name,
                            phone: v.phone || "",
                            category: v.category || "Supplier Umum",
                            messageTemplate: v.messageTemplate || "",
                          });
                          setIsVendorModalOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteVendor(v.id, v.name)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Total Transaksi PO:</span>
                      <strong className="text-slate-900">{v.totalPurchasesCount || 0} Kali</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Akumulasi Belanja:</span>
                      <strong className="text-slate-900">Rp {Number(v.totalPurchasesAmount || 0).toLocaleString("id-ID")}</strong>
                    </div>
                    {Number(v.unpaidAmount) > 0 && (
                      <div className="flex items-center justify-between text-amber-700 font-bold border-t pt-1">
                        <span>Tagihan Tempo / Hutang:</span>
                        <span>Rp {Number(v.unpaidAmount).toLocaleString("id-ID")}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{v.phone || "Tidak ada telepon"}</span>
                    </div>

                    {v.phone && (
                      <Button
                        size="sm"
                        onClick={() => handleChatVendor(v)}
                        className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl gap-1.5 px-3 cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>Chat WA</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Tambah / Edit Pembelian */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="w-[95vw] sm:max-w-lg p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl sm:rounded-3xl max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900">
                {editingPurchase ? "Edit Catatan Pembelian" : "Tambah Transaksi Pembelian Baru"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Sinkronisasi stok bahan baku presisi berdasarkan ID bahan resmi database.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              
              {/* Dropdown Bahan Baku Resmi */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Pilih Bahan Baku Resmi (Database):
                </label>
                <select
                  value={form.ingredientId}
                  onChange={(e) => handleSelectIngredient(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 focus:bg-white"
                >
                  <option value="">-- [Item Non-Inventory / Input Bebas] --</option>
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name} (Stok: {(Number(ing.floorQuantity) || 0) + (Number(ing.warehouseQuantity) || 0)} {ing.buyUnit || ing.unit} | Rp {Number(ing.hargaBeli || 0).toLocaleString("id-ID")}/{ing.buyUnit || "Pcs"})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  {form.ingredientId ? "✓ Stok bahan terpilih akan otomatis bertambah saat status diterima." : "• Membeli barang umum di luar daftar bahan baku."}
                </p>
              </div>

              {/* Item Name Input (if non-inventory or custom) */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Barang / Pembelian *</label>
                <Input
                  value={form.itemName}
                  onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                  placeholder="misal: Biji Kopi Espresso Blend 1kg"
                  className="min-h-[38px] font-bold text-xs"
                  required
                />
              </div>

              {/* Supplier / Vendor Dropdown */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Supplier / Vendor:</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={form.vendorId}
                    onChange={(e) => handleSelectVendor(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-900 focus:bg-white"
                  >
                    <option value="">-- Pilih dari Daftar Supplier --</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>{v.name} ({v.category || "Supplier"})</option>
                    ))}
                  </select>
                  <Input
                    value={form.supplierName}
                    onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
                    placeholder="Nama Supplier"
                    className="w-full sm:w-1/3 min-h-[38px] text-xs font-medium"
                  />
                </div>
              </div>

              {/* Qty & Unit Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jumlah (Qty) *</label>
                  <Input
                    type="number"
                    min={1}
                    step="any"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                    className="min-h-[38px] font-bold text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Harga Satuan (Rp) *</label>
                  <Input
                    type="text"
                    value={formatRupiahDisplay(form.unitPrice)}
                    onChange={(e) => setForm({ ...form, unitPrice: parseRupiahInput(e.target.value) })}
                    className="min-h-[38px] font-bold text-xs"
                    required
                  />
                </div>
              </div>

              {/* Total Calculation Preview */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold">Total Tagihan Pembelian:</span>
                <strong className="text-sm font-extrabold text-indigo-700 font-mono">
                  Rp {(form.quantity * form.unitPrice).toLocaleString("id-ID")}
                </strong>
              </div>

              {/* Status Pembelian & Status Pembayaran */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status Pembelian:</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-900 focus:bg-white"
                  >
                    <option value="RECEIVED">Diterima (Stok Masuk)</option>
                    <option value="ORDERED">Dipesan (Menunggu)</option>
                    <option value="DRAFT">Draft</option>
                    <option value="CANCELLED">Dibatalkan</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status Pembayaran:</label>
                  <select
                    value={form.paymentStatus}
                    onChange={(e) => setForm({ ...form, paymentStatus: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-900 focus:bg-white"
                  >
                    <option value="PAID">Lunas (Paid)</option>
                    <option value="UNPAID">Hutang / Belum Bayar</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Catatan Tambahan:</label>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="nomor faktur, tempo bayar, dll."
                  className="min-h-[38px] text-xs font-medium"
                />
              </div>

              <DialogFooter className="pt-2 border-t flex gap-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl text-xs">
                  Batal
                </Button>
                <Button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs">
                  {submitting ? "Menyimpan..." : "Simpan Pembelian"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal Tambah / Edit Supplier (Vendor) */}
        <Dialog open={isVendorModalOpen} onOpenChange={setIsVendorModalOpen}>
          <DialogContent className="w-[95vw] sm:max-w-md p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl sm:rounded-3xl max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900">
                {editingVendor ? "Edit Data Supplier" : "Tambah Data Supplier Baru"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Data kontak dan template pesan WhatsApp untuk pemesanan pengadaan bahan.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveVendor} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Supplier / Vendor *</label>
                <Input
                  value={vendorForm.name}
                  onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                  placeholder="misal: Kopi Nusantara Supplier"
                  className="min-h-[38px] font-bold text-xs"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Kategori Supplier</label>
                <Input
                  value={vendorForm.category}
                  onChange={(e) => setVendorForm({ ...vendorForm, category: e.target.value })}
                  placeholder="misal: Biji Kopi / Dairy / Kemasan"
                  className="min-h-[38px] text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nomor Telepon / WhatsApp</label>
                <Input
                  value={vendorForm.phone}
                  onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                  placeholder="081234567890"
                  className="min-h-[38px] text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Template Pesan WhatsApp Otomatis</label>
                <Input
                  value={vendorForm.messageTemplate}
                  onChange={(e) => setVendorForm({ ...vendorForm, messageTemplate: e.target.value })}
                  placeholder="Halo, saya mau order bahan baku untuk Perkara POS..."
                  className="min-h-[38px] text-xs"
                />
              </div>

              <DialogFooter className="gap-2 pt-3 border-t">
                <Button type="button" variant="outline" onClick={() => setIsVendorModalOpen(false)} className="text-xs rounded-xl">
                  Batal
                </Button>
                <Button type="submit" disabled={submitting || !vendorForm.name.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl px-5 cursor-pointer">
                  {submitting ? "Menyimpan..." : "Simpan Supplier"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

      </div>
    </AppShell>
  );
}
