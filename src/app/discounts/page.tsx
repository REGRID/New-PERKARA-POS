"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Percent, 
  RefreshCw, 
  Trash2, 
  Pencil, 
  Search, 
  Tag,
  Check,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth-context";

export default function DiscountsPage() {
  const { isAdmin } = useAuth();
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<any>(null);
  const [form, setForm] = useState({
    name: "",
    type: "PERCENT",
    amount: 10,
    isActive: true,
  });

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/data?type=discounts");
      if (res.ok) {
        const json = await res.json();
        setDiscounts(Array.isArray(json) ? json : []);
      } else {
        setDiscounts([]);
      }
    } catch (e) {
      console.error(e);
      setDiscounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const openAddModal = () => {
    setEditingDiscount(null);
    setForm({ name: "", type: "PERCENT", amount: 10, isActive: true });
    setIsModalOpen(true);
  };

  const openEditModal = (d: any) => {
    setEditingDiscount(d);
    setForm({
      name: d.name,
      type: d.type || "PERCENT",
      amount: Number(d.amount) || 0,
      isActive: d.isActive !== false,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/data?type=save_discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingDiscount?.id || undefined,
          ...form,
          amount: Number(form.amount),
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        await fetchDiscounts();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus diskon promo "${name}"?`)) return;
    try {
      const res = await fetch("/api/data?type=delete_discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) await fetchDiscounts();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredDiscounts = discounts.filter((d) =>
    (d.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto text-slate-900 space-y-6">
        
        {/* Prominent Outer Card Container */}
        <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xs space-y-6">
          
          {/* Card Header & Main Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Diskon & Promo</h2>
                {isAdmin && (
                  <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold">
                    Admin
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Pengaturan potongan persentase (%) dan nominal (Rp) untuk kasir POS.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={fetchDiscounts} className="text-xs gap-1.5 min-h-[38px] rounded-xl active:scale-[0.98]">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Segarkan</span>
              </Button>
              {isAdmin && (
                <Button
                  onClick={openAddModal}
                  className="bg-stone-800 hover:bg-stone-900 text-white font-semibold text-xs px-4 py-2 rounded-xl min-h-[38px] gap-2 shadow-xs shrink-0 cursor-pointer active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Diskon</span>
                </Button>
              )}
            </div>
          </div>

          {/* Search Filter Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Cari promo atau diskon..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200 text-xs font-medium min-h-[38px] rounded-xl w-full"
            />
          </div>

          {/* Inner Data Table Box Container with Smooth Horizontal Scroll */}
          <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
            <div className="overflow-x-auto custom-scrollbar">
              <div className="min-w-[580px]">
                {/* Header Row */}
                <div className="grid grid-cols-12 px-5 py-3.5 bg-slate-50/70 border-b text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
                  <div className="col-span-5">NAMA DISKON</div>
                  <div className="col-span-2 text-center">JENIS DISKON</div>
                  <div className="col-span-2 text-right">POTONGAN</div>
                  <div className="col-span-1 text-center">STATUS</div>
                  <div className="col-span-2 text-right">AKSI</div>
                </div>

                {/* Content Rows or Empty State */}
                <div className="divide-y divide-slate-100">
                  {filteredDiscounts.length > 0 ? (
                    filteredDiscounts.map((d) => {
                      const isActive = d.isActive !== false;
                      return (
                        <div key={d.id} className="grid grid-cols-12 px-5 py-3.5 items-center text-xs hover:bg-slate-50/60 transition-colors">
                          <div className="col-span-5 font-bold text-slate-900 flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                              <Percent className="w-4 h-4" />
                            </div>
                            <span>{d.name}</span>
                          </div>
                          <div className="col-span-2 text-center font-medium text-slate-600">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                              {d.type === "PERCENT" ? "Persentase (%)" : "Nominal Tetap (Rp)"}
                            </span>
                          </div>
                          <div className="col-span-2 text-right font-extrabold text-slate-900 font-mono">
                            {d.type === "PERCENT" ? `${d.amount}%` : `Rp ${Number(d.amount).toLocaleString("id-ID")}`}
                          </div>
                          <div className="col-span-1 text-center">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                            }`}>
                              {isActive ? "AKTIF" : "NONAKTIF"}
                            </span>
                          </div>
                          <div className="col-span-2 text-right flex items-center justify-end gap-1">
                            {isAdmin ? (
                              <>
                                <button
                                  onClick={() => openEditModal(d)}
                                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                  title="Ubah Diskon"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleDelete(d.id, d.name)} 
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Hapus Diskon"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <span className="text-slate-400 text-[10px]">Lihat Saja</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-12 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100/70 text-slate-400 flex items-center justify-center mx-auto">
                        <Percent className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-800">Diskon tidak ditemukan</h4>
                        <p className="text-xs text-slate-400 mt-1 font-medium">
                          Tambahkan promo diskon baru untuk potongan harga kasir POS.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Modal Add / Edit Discount */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md max-h-[90dvh] overflow-y-auto rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingDiscount ? "Ubah Diskon" : "Tambah Diskon"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Diskon dapat dipilih langsung kasir saat proses checkout pesanan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-3.5 py-2 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Nama Promo / Diskon *</label>
              <Input
                autoFocus
                placeholder="Contoh: Diskon Mahasiswa 15%"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="text-xs font-medium min-h-[38px] rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Jenis Potongan *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full min-h-[38px] px-3 rounded-xl border border-slate-200 text-xs bg-white font-medium"
                  required
                >
                  <option value="PERCENT">Persentase (%)</option>
                  <option value="FIXED">Nominal Tetap (Rp)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  {form.type === "PERCENT" ? "Persentase (%) *" : "Nominal Potongan (Rp) *"}
                </label>
                <Input
                  type="number"
                  placeholder={form.type === "PERCENT" ? "10" : "5000"}
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                  className="text-xs font-bold text-slate-900 min-h-[38px] rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <div className="font-bold text-slate-900">Status Promo Aktif</div>
                <div className="text-[10px] text-slate-500">Dapat digunakan pada transaksi kasir POS</div>
              </div>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 cursor-pointer"
              />
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
                {submitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
