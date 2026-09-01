"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Users, 
  RefreshCw, 
  Phone, 
  Mail, 
  Pencil, 
  Trash2, 
  Search, 
  Award,
  MessageCircle,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth-context";

export default function CustomersPage() {
  const { isAdmin } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    points: 0,
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/data?type=customers");
      if (res.ok) {
        const json = await res.json();
        setCustomers(Array.isArray(json) ? json : []);
      } else {
        setCustomers([]);
      }
    } catch (e) {
      console.error(e);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const openAddModal = () => {
    setEditingCustomer(null);
    setForm({ name: "", phone: "", email: "", points: 0 });
    setIsModalOpen(true);
  };

  const openEditModal = (c: any) => {
    setEditingCustomer(c);
    setForm({
      name: c.name,
      phone: c.phone || "",
      email: c.email || "",
      points: Number(c.points) || 0,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/data?type=save_customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCustomer?.id || undefined,
          ...form,
          points: Number(form.points),
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        await fetchCustomers();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus data pelanggan "${name}"?`)) return;
    try {
      const res = await fetch("/api/data?type=delete_customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) await fetchCustomers();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      (c.name || "").toLowerCase().includes(q) ||
      (c.phone || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q)
    );
  });

  const totalPoints = customers.reduce((sum, c) => sum + (Number(c.points) || 0), 0);

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto text-slate-900 space-y-6">
        
        {/* Prominent Outer Card Container */}
        <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xs space-y-6">
          
          {/* Card Header & Main Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Pelanggan &amp; Member</h2>
                {isAdmin && (
                  <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold">
                    Admin
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Kelola kontak pelanggan, WhatsApp, dan poin loyalitas.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={fetchCustomers} className="text-xs gap-1.5 min-h-[38px] rounded-xl active:scale-[0.98]">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Segarkan</span>
              </Button>
              {isAdmin && (
                <Button
                  onClick={openAddModal}
                  className="bg-stone-800 hover:bg-stone-900 text-white font-semibold text-xs px-4 py-2 rounded-xl min-h-[38px] gap-2 shadow-xs shrink-0 cursor-pointer active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Pelanggan</span>
                </Button>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Total Pelanggan</div>
              <div className="text-lg font-extrabold text-slate-900 mt-0.5">{customers.length} Orang</div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Total Poin Loyalitas</div>
              <div className="text-lg font-extrabold text-amber-600 mt-0.5 font-mono">{totalPoints} Poin</div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Kontak WhatsApp</div>
              <div className="text-lg font-extrabold text-emerald-600 mt-0.5">
                {customers.filter((c) => c.phone).length} Nomor
              </div>
            </div>
          </div>

          {/* Search Filter Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Cari nama, WhatsApp, atau email pelanggan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200 text-xs font-medium min-h-[38px] rounded-xl w-full"
            />
          </div>

          {/* Inner Data Table Box Container with Smooth Horizontal Scroll */}
          <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
            <div className="overflow-x-auto custom-scrollbar">
              <div className="min-w-[620px]">
                {/* Header Row */}
                <div className="grid grid-cols-12 px-5 py-3.5 bg-slate-50/70 border-b text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
                  <div className="col-span-4">NAMA PELANGGAN</div>
                  <div className="col-span-3">KONTAK / WHATSAPP</div>
                  <div className="col-span-2 text-center">POIN LOYALITAS</div>
                  <div className="col-span-3 text-right">AKSI</div>
                </div>

                {/* Content Rows or Empty State */}
                <div className="divide-y divide-slate-100">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((c) => {
                      const cleanPhone = (c.phone || "").replace(/\D/g, "");
                      const waUrl = cleanPhone ? `https://wa.me/${cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone}` : null;

                      return (
                        <div key={c.id} className="grid grid-cols-12 px-5 py-3.5 items-center text-xs hover:bg-slate-50/60 transition-colors">
                          <div className="col-span-4 font-bold text-slate-900 flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                              <Users className="w-4 h-4" />
                            </div>
                            <div>
                              <span>{c.name}</span>
                              {c.email && (
                                <span className="block text-[10px] text-slate-400 font-normal">
                                  {c.email}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="col-span-3 text-slate-600 font-medium">
                            {waUrl ? (
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 transition-colors font-mono text-[11px]"
                              >
                                <MessageCircle className="w-3 h-3" />
                                <span>{c.phone}</span>
                              </a>
                            ) : (
                              <span className="text-slate-400 text-[11px]">-</span>
                            )}
                          </div>

                          <div className="col-span-2 text-center">
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold text-[11px] border border-amber-100 font-mono">
                              <Award className="w-3 h-3" />
                              <span>{c.points || 0} Poin</span>
                            </span>
                          </div>

                          <div className="col-span-3 text-right flex items-center justify-end gap-1">
                            {isAdmin ? (
                              <>
                                <button
                                  onClick={() => openEditModal(c)}
                                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                  title="Ubah Pelanggan"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleDelete(c.id, c.name)} 
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Hapus Pelanggan"
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
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-800">Pelanggan tidak ditemukan</h4>
                        <p className="text-xs text-slate-400 mt-1 font-medium">
                          Tambahkan kontak member baru untuk mengumpulkan poin belanja.
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

      {/* Modal Add / Edit Customer */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md max-h-[90dvh] overflow-y-auto rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingCustomer ? "Ubah Data Pelanggan" : "Tambah Pelanggan"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Data pelanggan terhubung dengan transaksi kasir POS.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-3.5 py-2 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Nama Pelanggan *</label>
              <Input
                autoFocus
                placeholder="Contoh: Rahmat Hidayat"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="text-xs font-medium min-h-[38px] rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">No. WhatsApp / HP</label>
                <Input
                  placeholder="08123456789"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="text-xs font-medium min-h-[38px] rounded-xl"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Poin Loyalitas</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.points}
                  onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
                  className="text-xs font-bold text-amber-600 min-h-[38px] rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Alamat Email (Opsional)</label>
              <Input
                type="email"
                placeholder="rahmat@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="text-xs font-medium min-h-[38px] rounded-xl"
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
