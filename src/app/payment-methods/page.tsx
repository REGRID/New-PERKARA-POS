"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  CreditCard, 
  RefreshCw, 
  Pencil, 
  Trash2, 
  Search, 
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

  const fetchMethods = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/data?type=payment_methods");
      if (res.ok) {
        const json = await res.json();
        setMethods(Array.isArray(json) ? json : []);
      } else {
        setMethods([]);
      }
    } catch (e) {
      console.error(e);
      setMethods([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const openAddModal = () => {
    setEditingMethod(null);
    const initialCode = `PM_${Math.floor(100 + Math.random() * 900)}`;
    setForm({ name: "", code: initialCode, type: "CASH", isActive: true });
    setIsModalOpen(true);
  };

  const openEditModal = (m: any) => {
    setEditingMethod(m);
    setForm({
      name: m.name,
      code: m.code || `PM_${Math.floor(100 + Math.random() * 900)}`,
      type: m.type || "CASH",
      isActive: m.isActive !== false,
    });
    setIsModalOpen(true);
  };

  const handleNameChange = (name: string) => {
    const autoCode = name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 16);

    setForm((prev) => ({
      ...prev,
      name,
      code: autoCode || prev.code || `PM_${Math.floor(100 + Math.random() * 900)}`,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const finalCode = form.code.trim() || form.name.trim().toUpperCase().replace(/[^A-Z0-9]/g, "_").slice(0, 16) || `PM_${Math.floor(100 + Math.random() * 900)}`;

    try {
      setSubmitting(true);
      const res = await fetch("/api/data?type=save_payment_method", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingMethod?.id || undefined,
          ...form,
          code: finalCode,
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
    if (!confirm(`Hapus metode "${name}"?`)) return;
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
      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto text-slate-900 space-y-6 select-none">
        
        {/* Main Card Container */}
        <div className="bg-white p-5 md:p-7 rounded-3xl border border-slate-200/90 shadow-2xs space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Metode Pembayaran</h1>
                {isAdmin && (
                  <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold">
                    Admin
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                Pengaturan metode pembayaran kasir POS.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={fetchMethods} 
                className="text-xs font-semibold gap-1.5 h-9 rounded-xl border-slate-200 hover:bg-slate-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Segarkan</span>
              </Button>
              {isAdmin && (
                <Button
                  size="sm"
                  onClick={openAddModal}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 px-4 rounded-xl gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Metode</span>
                </Button>
              )}
            </div>
          </div>

          {/* Search Filter Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Cari nama atau kode metode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200 text-xs font-medium h-9 rounded-xl focus:bg-white"
            />
          </div>

          {/* Table Container */}
          <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
            <table className="w-full text-left border-collapse min-w-[550px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">METODE PEMBAYARAN</th>
                  <th className="py-3 px-4">TIPE</th>
                  <th className="py-3 px-4 text-center">STATUS</th>
                  <th className="py-3 px-4 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredMethods.length > 0 ? (
                  filteredMethods.map((m) => {
                    const isActive = m.isActive !== false;
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                              {getMethodIcon(m.type)}
                            </div>
                            <div>
                              <span>{m.name}</span>
                              <span className="block text-[10px] text-slate-400 font-mono font-normal">
                                {m.code}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-slate-600">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-700">
                            {m.type === "CASH" ? "Tunai" :
                             m.type === "E_WALLET" ? "QRIS / E-Wallet" :
                             m.type === "CARD" ? "Kartu Debit/Kredit" :
                             "Transfer Bank"}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <Badge
                            className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                              isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {isActive ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {isAdmin ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openEditModal(m)}
                                  className="h-7 w-7 p-0 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                                  title="Ubah Data"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button 
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDelete(m.id, m.name)} 
                                  className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                  title="Hapus"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </>
                            ) : (
                              <span className="text-slate-400 text-[10px]">Lihat Saja</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400">
                      <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-bold text-xs text-slate-700">Tidak ada metode pembayaran</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Tambahkan metode pembayaran untuk kasir POS.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>

      {/* Modal Add / Edit Payment Method */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md p-6 bg-white border border-slate-200 rounded-3xl select-none">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingMethod ? "Edit Metode Pembayaran" : "Tambah Metode Pembayaran"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Opsi metode pembayaran di kasir POS.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-3.5 my-2 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Nama Metode *</label>
              <Input
                autoFocus
                placeholder="Contoh: QRIS BCA / ShopeePay"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="text-xs font-medium h-9 rounded-xl bg-slate-50 border-slate-200"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700">Kode</label>
                  <span className="text-[9px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded">Otomatis</span>
                </div>
                <Input
                  placeholder="PM_001"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') })}
                  className="text-xs font-mono h-9 rounded-xl uppercase bg-slate-100/70 border-slate-200"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Tipe *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium focus:outline-none"
                  required
                >
                  <option value="CASH">Tunai</option>
                  <option value="E_WALLET">QRIS / E-Wallet</option>
                  <option value="CARD">Debit / Kartu Kredit</option>
                  <option value="BANK_TRANSFER">Transfer Bank</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <div className="font-bold text-slate-900">Status Aktif</div>
                <div className="text-[10px] text-slate-500">Tampilkan pilihan ini di layar kasir</div>
              </div>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </div>

            <DialogFooter className="pt-2 border-t flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl"
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

