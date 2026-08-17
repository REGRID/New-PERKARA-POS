"use client";

import React, { useState, useEffect } from "react";
import { Plus, Users, RefreshCw, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppShell } from "@/components/layout/app-shell";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/data?type=customers");
      if (res.ok) setCustomers(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      const res = await fetch("/api/data?type=save_customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ name: "", phone: "", email: "" });
        await fetchCustomers();
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
            <h1 className="text-lg font-bold text-slate-900">Database Pelanggan (CRM)</h1>
            <p className="text-xs text-slate-500">Kelola riwayat kontak, whatsapp, & poin loyalitas pelanggan</p>
          </div>
          <Button size="sm" variant="outline" onClick={fetchCustomers} className="text-xs gap-1 min-h-[36px]">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>

        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2 text-xs">
          <Input 
            placeholder="Nama Pelanggan *" 
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="min-h-[40px] text-xs flex-1"
            required
          />
          <Input 
            placeholder="No. Telepon / WhatsApp" 
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="min-h-[40px] text-xs flex-1"
          />
          <Button type="submit" size="sm" className="bg-slate-900 hover:bg-slate-800 text-white min-h-[40px] text-xs font-semibold px-4">
            <Plus className="w-4 h-4 mr-1" /> Simpan Pelanggan
          </Button>
        </form>

        <div className="bg-white rounded-xl border divide-y shadow-2xs text-xs">
          {loading ? (
            <div className="p-6 space-y-3">
              <div className="h-4 bg-slate-100 rounded animate-pulse w-full" />
              <div className="h-4 bg-slate-100 rounded animate-pulse w-full" />
            </div>
          ) : customers.length > 0 ? (
            customers.map((c) => (
              <div key={c.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                <div>
                  <h4 className="font-bold text-slate-900">{c.name}</h4>
                  <div className="flex items-center gap-3 text-slate-500 text-[11px] mt-0.5">
                    {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" />{c.phone}</span>}
                    {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" />{c.email}</span>}
                  </div>
                </div>
                <span className="font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-[10px]">
                  {c.points || 0} Poin
                </span>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-slate-400">Belum ada pelanggan terdaftar.</div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
