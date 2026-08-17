"use client";

import React, { useState, useEffect } from "react";
import { Plus, CreditCard, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppShell } from "@/components/layout/app-shell";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ amount: 0, note: "Listrik / Kebersihan", employeeName: "Staf Outlet" });

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/data?type=expenses");
      if (res.ok) setExpenses(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount) return;
    try {
      const res = await fetch("/api/data?type=save_expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ amount: 0, note: "Listrik / Kebersihan", employeeName: "Staf Outlet" });
        await fetchExpenses();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AppShell>
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Beban & Pengeluaran Operasional</h1>
            <p className="text-xs text-slate-500">Catatan kas keluar harian (listrik, wifi, kasbon, kebersihan, dll)</p>
          </div>
          <Button size="sm" variant="outline" onClick={fetchExpenses} className="text-xs gap-1 min-h-[36px]">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>

        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2 text-xs">
          <Input 
            placeholder="Keterangan Beban (Listrik, Wifi, Air, Sewa) *" 
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            className="min-h-[40px] text-xs flex-1"
            required
          />
          <Input 
            type="number"
            placeholder="Jumlah Pengeluaran (Rp) *" 
            value={form.amount || ""}
            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            className="min-h-[40px] text-xs w-44"
            required
          />
          <Button type="submit" size="sm" className="bg-slate-900 hover:bg-slate-800 text-white min-h-[40px] text-xs font-semibold px-4">
            <Plus className="w-4 h-4 mr-1" /> Catat Kas Keluar
          </Button>
        </form>

        <div className="bg-white rounded-xl border divide-y shadow-2xs text-xs">
          {expenses.length > 0 ? (
            expenses.map((ex) => (
              <div key={ex.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                <div>
                  <h4 className="font-bold text-slate-900">{ex.note || "Beban Operasional"}</h4>
                  <p className="text-[11px] text-slate-400">Pencatat: {ex.employeeName || "Staf"} &bull; {new Date(ex.timestamp).toLocaleString("id-ID")}</p>
                </div>
                <span className="font-bold text-rose-600 text-sm">
                  - Rp {Number(ex.amount || 0).toLocaleString("id-ID")}
                </span>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-slate-400">Belum ada pengeluaran dicatat.</div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
