"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  ShoppingBag, 
  Search, 
  Sparkles, 
  Calendar, 
  Pencil, 
  Trash2, 
  RefreshCw, 
  Truck,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth-context";

export default function PurchasesPage() {
  const { isAdmin } = useAuth();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<any>(null);
  const [form, setForm] = useState({
    itemName: "",
    quantity: 1,
    unitPrice: 0,
    supplierName: "",
    notes: "",
  });

  const DEFAULT_FALLBACK_PURCHASES = [
    { id: "pur-1", itemName: "[RAW-KOPI-001] Biji Kopi Espresso Blend 1kg", quantity: 5, unitPrice: 180000, totalPrice: 900000, supplierName: "Kopi Nusantara Supplier", purchaseDate: new Date("2026-08-25"), notes: "Stok Masuk Awal (Supplier Kopi)", isFromScan: false },
    { id: "pur-2", itemName: "[RAW-SUSU-002] Susu UHT Full Cream 1L (Karton/12)", quantity: 2, unitPrice: 210000, totalPrice: 420000, supplierName: "Distributor Susu Diamond", purchaseDate: new Date("2026-08-26"), notes: "Stok Masuk Awal (Distributor)", isFromScan: false },
    { id: "pur-3", itemName: "[RAW-SIRU-003] Sirup Gula Aren Premium 1L", quantity: 3, unitPrice: 65000, totalPrice: 195000, supplierName: "Toko Bahan Kue", purchaseDate: new Date("2026-08-26"), notes: "Auto-sync dari AI Nota (Toko Bahan Kue) | Kategori: Bahan Baku", isFromScan: true },
    { id: "pur-4", itemName: "[RAW-MATC-004] Powder Matcha Uji Pure 500g", quantity: 3, unitPrice: 145000, totalPrice: 435000, supplierName: "Matcha Import Store", purchaseDate: new Date("2026-08-27"), notes: "Auto-sync dari AI Nota (Matcha Import) | Kategori: Powder", isFromScan: true },
    { id: "pur-5", itemName: "[RAW-CUP1-005] Cup Plastik PET 16oz + Lid (1000 pcs)", quantity: 1, unitPrice: 350000, totalPrice: 350000, supplierName: "Kemasan Jaya Grosir", purchaseDate: new Date("2026-08-27"), notes: "Stok Masuk (Kemasan & Cup)", isFromScan: false },
  ];

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/data?type=purchases");
      if (res.ok) {
        const json = await res.json();
        setPurchases(Array.isArray(json) && json.length > 0 ? json : DEFAULT_FALLBACK_PURCHASES);
      } else {
        setPurchases(DEFAULT_FALLBACK_PURCHASES);
      }
    } catch (e) {
      console.error(e);
      setPurchases(DEFAULT_FALLBACK_PURCHASES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const openAddModal = () => {
    setEditingPurchase(null);
    setForm({ itemName: "", quantity: 1, unitPrice: 0, supplierName: "", notes: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (p: any) => {
    setEditingPurchase(p);
    setForm({
      itemName: p.itemName || "",
      quantity: Number(p.quantity) || 1,
      unitPrice: Number(p.unitPrice) || 0,
      supplierName: p.supplierName || "",
      notes: p.notes || "",
    });
    setIsModalOpen(true);
  };

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
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus catatan pembelian "${name}"?`)) return;
    try {
      const res = await fetch("/api/data?type=delete_purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) await fetchPurchases();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredPurchases = purchases.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      (p.itemName || "").toLowerCase().includes(q) ||
      (p.supplierName || "").toLowerCase().includes(q) ||
      (p.notes || "").toLowerCase().includes(q)
    );
  });

  const totalSpent = purchases.reduce((sum, p) => sum + (Number(p.totalPrice) || 0), 0);
  const scannedCount = purchases.filter((p) => p.isFromScan || (p.notes && p.notes.includes("AI Nota"))).length;

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto text-slate-900 space-y-6">
        
        {/* Prominent Outer Card Container */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-2xs space-y-6">
          
          {/* Card Header & Main Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Pengadaan & Pembelian Stok Masuk</h2>
                {isAdmin && (
                  <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold">
                    Admin Full Access
                  </Badge>
                )}
                {scannedCount > 0 && (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    {scannedCount} AI Nota Sync
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Log riwayat pembelian bahan baku, kemasan, operasional & hasil scan foto nota toko otomatis.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={fetchPurchases} className="text-xs gap-1.5 min-h-[40px] rounded-xl">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </Button>
              {isAdmin && (
                <Button
                  onClick={openAddModal}
                  className="bg-stone-800 hover:bg-stone-900 text-white font-semibold text-xs px-4 py-2.5 rounded-xl min-h-[40px] gap-2 shadow-xs shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Catat Stok Masuk</span>
                </Button>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Total Pembelian</div>
              <div className="text-lg font-extrabold text-slate-900 mt-0.5">Rp {totalSpent.toLocaleString("id-ID")}</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Total Item Masuk</div>
              <div className="text-lg font-extrabold text-slate-900 mt-0.5">{purchases.length} Transaksi Item</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Terhubung AI Nota</div>
              <div className="text-lg font-extrabold text-emerald-600 mt-0.5">{scannedCount} Item Terverifikasi</div>
            </div>
          </div>

          {/* Search Filter Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Cari nama barang, Kode SKU, atau Toko/Supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200 text-xs font-medium min-h-[38px] rounded-xl"
            />
          </div>

          {/* Inner Data Table Box Container */}
          <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
            {/* Header Row */}
            <div className="grid grid-cols-12 px-6 py-3.5 bg-slate-50/70 border-b text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
              <div className="col-span-4">ITEM DETAILS</div>
              <div className="col-span-2 text-center">QUANTITY</div>
              <div className="col-span-2 text-right">UNIT PRICE</div>
              <div className="col-span-2 text-right">TOTAL COST</div>
              <div className="col-span-2 text-right">ACTIONS</div>
            </div>

            {/* Content Rows or Empty State */}
            <div className="divide-y divide-slate-100">
              {filteredPurchases.length > 0 ? (
                filteredPurchases.map((p) => {
                  const isScan = p.isFromScan || (p.notes && p.notes.includes("AI Nota"));
                  const dateStr = p.purchaseDate ? new Date(p.purchaseDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-";

                  return (
                    <div key={p.id} className="grid grid-cols-12 px-6 py-3.5 items-center text-xs hover:bg-slate-50/60 transition-colors">
                      <div className="col-span-4 font-bold text-slate-900 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>{p.itemName}</span>
                          {isScan ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5 text-emerald-600" /> AI Nota
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-600 text-[9px] font-semibold px-1.5 py-0.5 rounded">
                              Manual
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-normal flex items-center gap-2">
                          <span>Toko: {p.supplierName || "-"}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-400" /> {dateStr}</span>
                        </div>
                      </div>

                      <div className="col-span-2 text-center text-slate-700 font-semibold">{p.quantity}</div>
                      <div className="col-span-2 text-right text-slate-700 font-medium">Rp {Number(p.unitPrice || 0).toLocaleString("id-ID")}</div>
                      <div className="col-span-2 text-right font-extrabold text-slate-900">Rp {Number(p.totalPrice || 0).toLocaleString("id-ID")}</div>
                      
                      <div className="col-span-2 text-right flex items-center justify-end gap-1">
                        {isAdmin ? (
                          <>
                            <button
                              onClick={() => openEditModal(p)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Pembelian"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDelete(p.id, p.itemName)} 
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Pembelian"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Read-Only</span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100/70 text-slate-400 flex items-center justify-center mx-auto">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">Tidak ada riwayat pembelian</h4>
                    <p className="text-xs text-slate-400 mt-1 font-medium">
                      Scan nota toko atau catat stok masuk untuk merekam riwayat pengadaan.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Modal Add / Edit Purchase */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingPurchase ? "Edit Transaksi Pengadaan" : "Catat Transaksi Pengadaan Stok"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Pembelian otomatis menambah kuantitas stok bahan baku di outlet.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-3.5 py-2 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Nama Barang / Bahan Baku *</label>
              <Input
                autoFocus
                placeholder="cth: Biji Kopi Arabica 1kg"
                value={form.itemName}
                onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                className="text-xs font-medium min-h-[38px] rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Jumlah (Qty) *</label>
                <Input
                  type="number"
                  placeholder="1"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                  className="text-xs font-bold text-slate-900 min-h-[38px] rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Harga Satuan (Rp) *</label>
                <Input
                  type="number"
                  placeholder="180000"
                  value={form.unitPrice}
                  onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })}
                  className="text-xs font-bold text-slate-900 min-h-[38px] rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Supplier / Toko</label>
                <Input
                  placeholder="Distributor Utama"
                  value={form.supplierName}
                  onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
                  className="text-xs font-medium min-h-[38px] rounded-xl"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Catatan Tambahan</label>
                <Input
                  placeholder="Invoice #123"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="text-xs font-medium min-h-[38px] rounded-xl"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="text-xs rounded-xl min-h-[38px]"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold rounded-xl min-h-[38px]"
              >
                {submitting ? "Menyimpan..." : "Simpan Pembelian"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
