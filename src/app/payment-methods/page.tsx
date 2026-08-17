"use client";

import React, { useState, useEffect } from "react";
import { Plus, CreditCard, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppShell } from "@/components/layout/app-shell";

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", code: "", type: "CASH" });

  const fetchMethods = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/data?type=payment_methods");
      if (res.ok) setMethods(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      const res = await fetch("/api/data?type=save_payment_method", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ name: "", code: "", type: "CASH" });
        await fetchMethods();
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
            <h1 className="text-lg font-bold text-slate-900">Metode Pembayaran</h1>
            <p className="text-xs text-slate-500">Konfigurasi opsi pembayaran kasir (Tunai, QRIS, EDC, E-Wallet)</p>
          </div>
          <Button size="sm" variant="outline" onClick={fetchMethods} className="text-xs gap-1 min-h-[36px]">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>

        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2 text-xs">
          <Input 
            placeholder="Nama Metode Pembayaran *" 
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="min-h-[40px] text-xs flex-1"
            required
          />
          <Input 
            placeholder="Kode Singkat (cth: QRIS_BCA)" 
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            className="min-h-[40px] text-xs flex-1"
            required
          />
          <Button type="submit" size="sm" className="bg-slate-900 hover:bg-slate-800 text-white min-h-[40px] text-xs font-semibold px-4">
            <Plus className="w-4 h-4 mr-1" /> Tambah
          </Button>
        </form>

        <div className="bg-white rounded-xl border divide-y shadow-2xs text-xs">
          {methods.length > 0 ? (
            methods.map((m) => (
              <div key={m.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{m.name} ({m.code})</span>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                  AKTIF
                </span>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-slate-400">Belum ada metode pembayaran kustom.</div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
