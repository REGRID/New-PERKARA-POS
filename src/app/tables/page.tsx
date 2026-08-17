"use client";

import React, { useState, useEffect } from "react";
import { Plus, Utensils, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppShell } from "@/components/layout/app-shell";

export default function TablesPage() {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ number: "", capacity: 4, status: "AVAILABLE" });

  const fetchTables = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/data?type=tables");
      if (res.ok) setTables(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.number.trim()) return;
    try {
      const res = await fetch("/api/data?type=save_table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ number: "", capacity: 4, status: "AVAILABLE" });
        await fetchTables();
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
            <h1 className="text-lg font-bold text-slate-900">Manajemen Meja Outlet</h1>
            <p className="text-xs text-slate-500">Kelola nomor meja, kapasitas kursi, & status reservasi</p>
          </div>
          <Button size="sm" variant="outline" onClick={fetchTables} className="text-xs gap-1 min-h-[36px]">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>

        <form onSubmit={handleAdd} className="flex gap-2 text-xs">
          <Input 
            placeholder="Nomor / Label Meja (cth: Meja 01)" 
            value={form.number}
            onChange={(e) => setForm({ ...form, number: e.target.value })}
            className="min-h-[40px] text-xs flex-1"
            required
          />
          <Input 
            type="number"
            placeholder="Kapasitas Kursi" 
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
            className="min-h-[40px] text-xs w-32"
            required
          />
          <Button type="submit" size="sm" className="bg-slate-900 hover:bg-slate-800 text-white min-h-[40px] text-xs font-semibold px-4">
            <Plus className="w-4 h-4 mr-1" /> Tambah Meja
          </Button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {loading ? (
            <div className="col-span-full p-6 space-y-3">
              <div className="h-4 bg-slate-100 rounded animate-pulse w-full" />
              <div className="h-4 bg-slate-100 rounded animate-pulse w-full" />
            </div>
          ) : tables.length > 0 ? (
            tables.map((t) => (
              <div key={t.id} className="bg-white p-3 rounded-xl border space-y-1 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">{t.number}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    t.status === "AVAILABLE" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                  }`}>
                    {t.status === "AVAILABLE" ? "KOSONG" : "TERISI"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Utensils className="w-3 h-3 text-slate-400" />
                  <span>Kapasitas: {t.capacity} Kursi</span>
                </p>
              </div>
            ))
          ) : (
            <div className="col-span-full p-6 text-center text-xs text-slate-400">Belum ada meja terdaftar.</div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
