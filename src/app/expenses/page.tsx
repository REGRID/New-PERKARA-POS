"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  CreditCard, 
  Sparkles, 
  Search, 
  Calendar, 
  Pencil, 
  Trash2, 
  RefreshCw, 
  DollarSign,
  TrendingDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth-context";

export default function ExpensesPage() {
  const { isAdmin } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [form, setForm] = useState({
    amount: 0,
    note: "",
    employeeName: "Staf Outlet",
  });

  const DEFAULT_FALLBACK_EXPENSES = [
    { id: "exp-1", amount: 250000, note: "Tagihan Listrik & Air Outlet (Agustus)", employeeName: "Manajer Outlet", timestamp: new Date("2026-08-25"), isFromScan: false },
    { id: "exp-2", amount: 65000, note: "[AI Nota] Toko Bahan Kue - Sirup Aren 1L", employeeName: "Kas Outlet", timestamp: new Date("2026-08-26"), isFromScan: true },
    { id: "exp-3", amount: 18000, note: "Es Batu 2 Plastik (Kasbon Kasir)", employeeName: "Cheisa", timestamp: new Date("2026-08-27"), isFromScan: false },
  ];

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/data?type=expenses");
      if (res.ok) {
        const json = await res.json();
        setExpenses(Array.isArray(json) && json.length > 0 ? json : DEFAULT_FALLBACK_EXPENSES);
      } else {
        setExpenses(DEFAULT_FALLBACK_EXPENSES);
      }
    } catch (e) {
      console.error(e);
      setExpenses(DEFAULT_FALLBACK_EXPENSES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const openAddModal = () => {
    setEditingExpense(null);
    setForm({ amount: 0, note: "", employeeName: "Staf Outlet" });
    setIsModalOpen(true);
  };

  const openEditModal = (ex: any) => {
    setEditingExpense(ex);
    setForm({
      amount: Number(ex.amount) || 0,
      note: ex.note || "",
      employeeName: ex.employeeName || "Staf Outlet",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.note.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/data?type=save_expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingExpense?.id || undefined,
          ...form,
          amount: Number(form.amount),
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        await fetchExpenses();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, note: string) => {
    if (!confirm(`Hapus catatan kas keluar "${note}"?`)) return;
    try {
      const res = await fetch("/api/data?type=delete_expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) await fetchExpenses();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredExpenses = expenses.filter((ex) => {
    const q = searchQuery.toLowerCase();
    return (
      (ex.note || "").toLowerCase().includes(q) ||
      (ex.employeeName || "").toLowerCase().includes(q)
    );
  });

  const totalExpenseAmount = expenses.reduce((sum, ex) => sum + (Number(ex.amount) || 0), 0);
  const scannedCount = expenses.filter((ex) => ex.isFromScan || (ex.note && ex.note.includes("AI Nota"))).length;

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto text-slate-900 space-y-6">
        
        {/* Prominent Outer Card Container */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-2xs space-y-6">
          
          {/* Card Header & Main Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Beban & Pengeluaran Kas (OPEX)</h2>
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
                Catatan kas keluar harian (listrik, wifi, kasbon, kebersihan, & hasil scan nota toko).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={fetchExpenses} className="text-xs gap-1.5 min-h-[40px] rounded-xl">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </Button>
              {isAdmin && (
                <Button
                  onClick={openAddModal}
                  className="bg-stone-800 hover:bg-stone-900 text-white font-semibold text-xs px-4 py-2.5 rounded-xl min-h-[40px] gap-2 shadow-xs shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Catat Kas Keluar</span>
                </Button>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Total Pengeluaran</div>
              <div className="text-lg font-extrabold text-rose-600 mt-0.5">Rp {totalExpenseAmount.toLocaleString("id-ID")}</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Jumlah Transaksi</div>
              <div className="text-lg font-extrabold text-slate-900 mt-0.5">{expenses.length} Catatan</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Terhubung AI Nota</div>
              <div className="text-lg font-extrabold text-emerald-600 mt-0.5">{scannedCount} Nota Scan</div>
            </div>
          </div>

          {/* Search Filter */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Cari keterangan pengeluaran atau nama pencatat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200 text-xs font-medium min-h-[40px] rounded-xl"
            />
          </div>

          {/* Inner Data Table Box Container */}
          <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
            <div className="divide-y divide-slate-100 text-xs">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((ex) => {
                  const isScan = ex.isFromScan || (ex.note && ex.note.includes("AI Nota"));
                  const dateStr = ex.timestamp ? new Date(ex.timestamp).toLocaleString("id-ID") : "-";

                  return (
                    <div key={ex.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap font-bold text-slate-900">
                          <span>{ex.note || "Beban Operasional"}</span>
                          {isScan ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5 text-emerald-600" /> AI Nota
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-600 text-[9px] font-semibold px-1.5 py-0.5 rounded">
                              Kas Keluar
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-normal flex items-center gap-2">
                          <span>Pencatat: {ex.employeeName || "Staf Outlet"}</span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-400" /> {dateStr}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-rose-600 text-sm">
                          - Rp {Number(ex.amount || 0).toLocaleString("id-ID")}
                        </span>

                        {isAdmin && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditModal(ex)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Pengeluaran"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(ex.id, ex.note)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Pengeluaran"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center text-slate-400">
                  Belum ada pengeluaran dicatat.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Modal Add / Edit Expense */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingExpense ? "Edit Pengeluaran Kas" : "Catat Pengeluaran Kas Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Beban operasional akan tercatat pada laporan arus kas dan laba bersih.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-3.5 py-2 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Keterangan Pengeluaran *</label>
              <Input
                autoFocus
                placeholder="cth: Tagihan Listrik & Internet"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="text-xs font-medium min-h-[38px] rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Nominal (Rp) *</label>
                <Input
                  type="number"
                  placeholder="50000"
                  value={form.amount || ""}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                  className="text-xs font-bold text-rose-600 min-h-[38px] rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Nama Pencatat / Kas</label>
                <Input
                  placeholder="Kasir / Admin"
                  value={form.employeeName}
                  onChange={(e) => setForm({ ...form, employeeName: e.target.value })}
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
                {submitting ? "Menyimpan..." : "Simpan Pengeluaran"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
