"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  CreditCard, 
  RefreshCw, 
  Pencil, 
  Trash2, 
  Search, 
  Check, 
  X,
  Wallet,
  Building2,
  QrCode
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth-context";

export default function PaymentMethodsPage() {
  const { isAdmin } = useAuth();
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<any>(null);
  const [form, setForm] = useState({
    name: "",
    code: "",
    type: "CASH",
    isActive: true,
  });

  const DEFAULT_FALLBACK_PAYMENT_METHODS = [
    { id: "pm-1", name: "Tunai / Cash", code: "CASH", type: "CASH", isActive: true },
    { id: "pm-2", name: "QRIS BCA / Mandiri", code: "QRIS", type: "E_WALLET", isActive: true },
    { id: "pm-3", name: "Mesin EDC Debit / Kredit", code: "EDC", type: "CARD", isActive: true },
    { id: "pm-4", name: "Transfer Bank BCA", code: "TRANSFER", type: "BANK_TRANSFER", isActive: true },
  ];

  const fetchMethods = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/data?type=payment_methods");
      if (res.ok) {
        const json = await res.json();
        setMethods(Array.isArray(json) && json.length > 0 ? json : DEFAULT_FALLBACK_PAYMENT_METHODS);
      } else {
        setMethods(DEFAULT_FALLBACK_PAYMENT_METHODS);
      }
    } catch (e) {
      console.error(e);
      setMethods(DEFAULT_FALLBACK_PAYMENT_METHODS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const openAddModal = () => {
    setEditingMethod(null);
    setForm({ name: "", code: "", type: "CASH", isActive: true });
    setIsModalOpen(true);
  };

  const openEditModal = (m: any) => {
    setEditingMethod(m);
    setForm({
      name: m.name,
      code: m.code,
      type: m.type || "CASH",
      isActive: m.isActive !== false,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/data?type=save_payment_method", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingMethod?.id || undefined,
          ...form,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        await fetchMethods();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus opsi metode pembayaran "${name}"?`)) return;
    try {
      const res = await fetch("/api/data?type=delete_payment_method", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) await fetchMethods();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredMethods = methods.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      (m.name || "").toLowerCase().includes(q) ||
      (m.code || "").toLowerCase().includes(q) ||
      (m.type || "").toLowerCase().includes(q)
    );
  });

  const getMethodIcon = (type: string) => {
    switch (type) {
      case "CASH": return <Wallet className="w-4 h-4 text-emerald-600" />;
      case "E_WALLET": return <QrCode className="w-4 h-4 text-indigo-600" />;
      case "CARD": return <CreditCard className="w-4 h-4 text-blue-600" />;
      case "BANK_TRANSFER": return <Building2 className="w-4 h-4 text-purple-600" />;
      default: return <CreditCard className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto text-slate-900 space-y-6">
        
        {/* Prominent Outer Card Container */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-2xs space-y-6">
          
          {/* Card Header & Main Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Metode Pembayaran Kasir POS</h2>
                {isAdmin && (
                  <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold">
                    Admin Full Access
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Konfigurasi pilihan pembayaran (Tunai, QRIS Dinamis/Statis, Mesin EDC, Transfer Bank) di terminal POS.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={fetchMethods} className="text-xs gap-1.5 min-h-[40px] rounded-xl">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </Button>
              {isAdmin && (
                <Button
                  onClick={openAddModal}
                  className="bg-stone-800 hover:bg-stone-900 text-white font-semibold text-xs px-4 py-2.5 rounded-xl min-h-[40px] gap-2 shadow-xs shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Metode Bayar</span>
                </Button>
              )}
            </div>
          </div>

          {/* Search Filter Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Cari nama atau kode metode pembayaran..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200 text-xs font-medium min-h-[38px] rounded-xl"
            />
          </div>

          {/* Inner Data Table Box Container */}
          <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
            {/* Header Row */}
            <div className="grid grid-cols-12 px-6 py-3.5 bg-slate-50/70 border-b text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
              <div className="col-span-5">PAYMENT METHOD</div>
              <div className="col-span-3">KODE / TIPE</div>
              <div className="col-span-2 text-center">STATUS</div>
              <div className="col-span-2 text-right">ACTIONS</div>
            </div>

            {/* Content Rows or Empty State */}
            <div className="divide-y divide-slate-100">
              {filteredMethods.length > 0 ? (
                filteredMethods.map((m) => {
                  const isActive = m.isActive !== false;
                  return (
                    <div key={m.id} className="grid grid-cols-12 px-6 py-3.5 items-center text-xs hover:bg-slate-50/60 transition-colors">
                      <div className="col-span-5 font-bold text-slate-900 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                          {getMethodIcon(m.type)}
                        </div>
                        <div>
                          <span>{m.name}</span>
                          <span className="block text-[10px] text-slate-400 font-mono font-normal">
                            Code: {m.code}
                          </span>
                        </div>
                      </div>

                      <div className="col-span-3 text-slate-600 font-medium">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-700">
                          {m.type === "CASH" ? "Tunai / Cash" :
                           m.type === "E_WALLET" ? "QRIS / E-Wallet" :
                           m.type === "CARD" ? "Debit / Kartu Kredit" :
                           "Transfer Bank"}
                        </span>
                      </div>

                      <div className="col-span-2 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                        }`}>
                          {isActive ? "AKTIF" : "NON-AKTIF"}
                        </span>
                      </div>

                      <div className="col-span-2 text-right flex items-center justify-end gap-1">
                        {isAdmin ? (
                          <>
                            <button
                              onClick={() => openEditModal(m)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Metode Bayar"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDelete(m.id, m.name)} 
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Metode Bayar"
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
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">Tidak ada metode pembayaran</h4>
                    <p className="text-xs text-slate-400 mt-1 font-medium">
                      Tambahkan opsi pembayaran untuk mempermudah transaksi kasir.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Modal Add / Edit Payment Method */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingMethod ? "Edit Metode Pembayaran" : "Tambah Metode Pembayaran"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Metode pembayaran akan muncul di opsi pembayaran layar POS kasir.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-3.5 py-2 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Nama Metode Pembayaran *</label>
              <Input
                autoFocus
                placeholder="cth: QRIS BCA / ShopeePay"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="text-xs font-medium min-h-[38px] rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Kode Singkat *</label>
                <Input
                  placeholder="cth: QRIS_BCA"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="text-xs font-mono min-h-[38px] rounded-xl uppercase"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Tipe Integrasi *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full min-h-[38px] px-3 rounded-xl border border-slate-200 text-xs bg-white font-medium"
                  required
                >
                  <option value="CASH">Tunai (Cash)</option>
                  <option value="E_WALLET">QRIS / E-Wallet</option>
                  <option value="CARD">EDC / Kartu Debit/Kredit</option>
                  <option value="BANK_TRANSFER">Transfer Bank</option>
                </select>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <div className="font-bold text-slate-900">Status Aktif</div>
                <div className="text-[10px] text-slate-500">Tampilkan pilihan ini di layar kasir POS</div>
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
                {submitting ? "Menyimpan..." : "Simpan Metode"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
