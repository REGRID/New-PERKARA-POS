"use client";

import React, { useState, useEffect } from "react";
import { Plus, Percent, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppShell } from "@/components/layout/app-shell";

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", type: "PERCENT", amount: 10 });

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/data?type=discounts");
      if (res.ok) setDiscounts(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      const res = await fetch("/api/data?type=save_discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ name: "", type: "PERCENT", amount: 10 });
        await fetchDiscounts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AppShell>
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Diskon & Promo</h1>
            <p className="text-xs text-slate-500">Kelola persentase & nominal potongan harga promo</p>
          </div>
          <Button size="sm" variant="outline" onClick={fetchDiscounts} className="text-xs gap-1 min-h-[36px]">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>

        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2">
          <Input 
            placeholder="Nama Promo / Diskon..." 
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="min-h-[40px] text-xs flex-1"
            required
          />
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="min-h-[40px] rounded-lg border px-3 text-xs bg-white text-slate-800"
          >
            <option value="PERCENT">Persentase (%)</option>
            <option value="FIXED">Nominal (Rp)</option>
          </select>
          <Input 
            type="number"
            placeholder="Jumlah" 
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            className="min-h-[40px] text-xs w-28"
            required
          />
          <Button type="submit" size="sm" className="bg-slate-900 hover:bg-slate-800 text-white min-h-[40px] text-xs font-semibold px-4">
            <Plus className="w-4 h-4 mr-1" /> Simpan Promo
          </Button>
        </form>

        <div className="bg-white rounded-xl border divide-y shadow-2xs text-xs">
          {discounts.length > 0 ? (
            discounts.map((d) => (
              <div key={d.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center gap-2 font-medium text-slate-800">
                  <Percent className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{d.name}</span>
                </div>
                <span className="font-bold text-slate-900">
                  {d.type === "PERCENT" ? `${d.amount}%` : `Rp ${Number(d.amount).toLocaleString("id-ID")}`}
                </span>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-slate-400">Belum ada promo diskon.</div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
