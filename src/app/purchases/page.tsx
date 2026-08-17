"use client";

import React, { useState, useEffect } from "react";
import { Plus, ShoppingBag, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppShell } from "@/components/layout/app-shell";

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    itemName: "",
    quantity: 1,
    unitPrice: 0,
    supplierName: "",
    notes: "",
  });

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/data?type=purchases");
      if (res.ok) setPurchases(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.itemName.trim()) return;
    try {
      const res = await fetch("/api/data?type=save_purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ itemName: "", quantity: 1, unitPrice: 0, supplierName: "", notes: "" });
        setShowAddForm(false);
        await fetchPurchases();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto text-slate-900">
        
        {/* Prominent Outer Card Container */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-2xs space-y-6">
          
          {/* Card Header & Main Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Stock Purchase Log</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Record incoming raw materials and supplier inventory purchases.
              </p>
            </div>

            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-stone-800 hover:bg-stone-900 text-white font-semibold text-xs px-4 py-2.5 rounded-xl min-h-[42px] gap-2 shadow-xs shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record Purchase</span>
            </Button>
          </div>

          {/* Inline Purchase Input Form */}
          {showAddForm && (
            <form onSubmit={handleAdd} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="font-bold text-xs text-slate-800">Tambah Transaksi Pembelian</div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <Input 
                  placeholder="Nama Barang *" 
                  value={form.itemName}
                  onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                  className="bg-white min-h-[38px] text-xs"
                  required
                />
                <Input 
                  type="number"
                  placeholder="Jumlah (Qty)" 
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                  className="bg-white min-h-[38px] text-xs"
                  required
                />
                <Input 
                  type="number"
                  placeholder="Harga Satuan (Rp)" 
                  value={form.unitPrice}
                  onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })}
                  className="bg-white min-h-[38px] text-xs"
                  required
                />
                <Input 
                  placeholder="Supplier (Opsional)" 
                  value={form.supplierName}
                  onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
                  className="bg-white min-h-[38px] text-xs"
                />
              </div>
              <Button type="submit" className="bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold px-4 min-h-[38px] rounded-xl">
                Simpan Pembelian
              </Button>
            </form>
          )}

          {/* Inner Data Table Box Container */}
          <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
            {/* Header Row */}
            <div className="grid grid-cols-12 px-6 py-3.5 bg-slate-50/70 border-b text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
              <div className="col-span-4">ITEM DETAILS</div>
              <div className="col-span-2 text-center">QUANTITY</div>
              <div className="col-span-3 text-right">UNIT PRICE</div>
              <div className="col-span-3 text-right">TOTAL COST</div>
            </div>

            {/* Content Rows or Empty State */}
            <div className="divide-y divide-slate-100">
              {purchases.length > 0 ? (
                purchases.map((p) => (
                  <div key={p.id} className="grid grid-cols-12 px-6 py-3.5 items-center text-xs hover:bg-slate-50/60 transition-colors">
                    <div className="col-span-4 font-bold text-slate-900">
                      {p.itemName}
                      {p.supplierName && <span className="block text-[11px] text-slate-400 font-normal">Supplier: {p.supplierName}</span>}
                    </div>
                    <div className="col-span-2 text-center text-slate-700 font-semibold">{p.quantity}</div>
                    <div className="col-span-3 text-right text-slate-700 font-medium">Rp {Number(p.unitPrice || 0).toLocaleString("id-ID")}</div>
                    <div className="col-span-3 text-right font-extrabold text-slate-900">Rp {Number(p.totalPrice || 0).toLocaleString("id-ID")}</div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100/70 text-slate-400 flex items-center justify-center mx-auto">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">No purchases found</h4>
                    <p className="text-xs text-slate-400 mt-1 font-medium">
                      Record stock purchases to track your inventory spend.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </AppShell>
  );
}
