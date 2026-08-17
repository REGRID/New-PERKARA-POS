"use client";

import React, { useState, useEffect } from "react";
import { Receipt, RefreshCw, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/app-shell";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/data?type=orders_history");
      if (res.ok) setOrders(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <AppShell>
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Riwayat Transaksi & Struk</h1>
            <p className="text-xs text-slate-500">Daftar transaksi kasir POS, status pembayaran, & cetak ulang nota</p>
          </div>
          <Button size="sm" variant="outline" onClick={fetchOrders} className="text-xs gap-1 min-h-[36px]">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>

        <div className="bg-white rounded-xl border shadow-2xs overflow-hidden text-xs">
          <div className="grid grid-cols-12 px-4 py-2.5 font-bold text-slate-700 bg-slate-50 border-b">
            <div className="col-span-3">No. Transaksi</div>
            <div className="col-span-3">Pelanggan / Tgl</div>
            <div className="col-span-2 text-center">Metode</div>
            <div className="col-span-2 text-right">Total Nominal</div>
            <div className="col-span-2 text-center">Cetak</div>
          </div>
          <div className="divide-y">
            {orders.length > 0 ? (
              orders.map((o) => (
                <div key={o.id} className="grid grid-cols-12 px-4 py-3 items-center hover:bg-slate-50">
                  <div className="col-span-3 font-bold text-slate-900">
                    {o.orderNumber || `POS-${o.id.slice(0, 6)}`}
                    <span className="block text-[11px] text-emerald-600 font-medium">{o.paymentStatus || "PAID"}</span>
                  </div>
                  <div className="col-span-3 text-slate-700">
                    {o.customerName || "Pelanggan Toko"}
                    <span className="block text-[11px] text-slate-400">{new Date(o.createdAt).toLocaleString("id-ID")}</span>
                  </div>
                  <div className="col-span-2 text-center font-semibold text-slate-700">{o.paymentMethod || "CASH"}</div>
                  <div className="col-span-2 text-right font-bold text-slate-900">Rp {Number(o.totalAmount || 0).toLocaleString("id-ID")}</div>
                  <div className="col-span-2 text-center">
                    <button 
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-300 text-[11px] font-medium hover:bg-slate-100 cursor-pointer"
                    >
                      <Printer className="w-3 h-3 text-slate-600" />
                      <span>Nota</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-400">Belum ada riwayat transaksi.</div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
