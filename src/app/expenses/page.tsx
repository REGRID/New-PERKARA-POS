"use client";

import React, { useState, useEffect } from "react";
import { Plus, CreditCard, Sparkles, Search, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppShell } from "@/components/layout/app-shell";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState({ amount: 0, note: "", employeeName: "Staf Outlet" });

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
        if (Array.isArray(json) && json.length > 0) {
          setExpenses(json);
        } else {
          setExpenses(DEFAULT_FALLBACK_EXPENSES);
        }
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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.note.trim()) return;
    try {
      const res = await fetch("/api/data?type=save_expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ amount: 0, note: "", employeeName: "Staf Outlet" });
        await fetchExpenses();
      }
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
          
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Beban & Pengeluaran Operasional</h2>
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

          {/* Input Form */}
          <form onSubmit={handleAdd} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="font-bold text-xs text-slate-800">Input Pengeluaran Kas Baru</div>
            <div className="flex flex-col sm:flex-row gap-2 text-xs">
              <Input 
                placeholder="Keterangan Beban (Listrik, Wifi, Air, Sewa, Kebersihan) *" 
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="bg-white min-h-[40px] text-xs flex-1"
                required
              />
              <Input 
                type="number"
                placeholder="Jumlah (Rp) *" 
                value={form.amount || ""}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                className="bg-white min-h-[40px] text-xs sm:w-48"
                required
              />
              <Button type="submit" size="sm" className="bg-stone-800 hover:bg-stone-900 text-white min-h-[40px] text-xs font-semibold px-4 cursor-pointer">
                <Plus className="w-4 h-4 mr-1" /> Catat Kas Keluar
              </Button>
            </div>
          </form>

          {/* Search Filter */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Cari pengeluaran..."
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
                    <div key={ex.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/60 transition-colors">
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
                      <span className="font-extrabold text-rose-600 text-sm shrink-0">
                        - Rp {Number(ex.amount || 0).toLocaleString("id-ID")}
                      </span>
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
    </AppShell>
  );
}
