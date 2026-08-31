"use client";

import React, { useState, useEffect } from "react";
import { ClipboardCheck, RefreshCw, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/app-shell";

export default function DailyRecapsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchRecaps = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/data");
      if (res.ok) setData(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecaps();
  }, []);

  const shift = data?.activeShift || {
    employeeName: "Budi Santoso",
    status: "OPEN",
    startCash: 500000,
    expectedCash: 2150000,
  };

  return (
    <AppShell>
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Rekap Harian Kasir</h1>
            <p className="text-xs text-slate-500">Ringkasan transaksi shift kasir, total pendapatan, dan saldo laci.</p>
          </div>
          <Button size="sm" variant="outline" onClick={fetchRecaps} className="text-xs gap-1 min-h-[36px]">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Segarkan</span>
          </Button>
        </div>

        <div className="bg-white p-4 rounded-xl border shadow-2xs space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 text-sm">Shift Berjalan: {shift.employeeName}</span>
            <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
              {shift.status === "OPEN" ? "Shift Aktif" : "Selesai"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-t pt-3">
            <div>
              <span className="text-slate-400 block text-[10px]">Modal Kas Awal</span>
              <span className="font-bold text-slate-900">Rp {Number(shift.startCash || 500000).toLocaleString("id-ID")}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Estimasi Kas Laci</span>
              <span className="font-bold text-emerald-600">Rp {Number(shift.expectedCash || 2150000).toLocaleString("id-ID")}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Total Pendapatan</span>
              <span className="font-bold text-slate-900">Rp {Number(data?.totalRevenue || 4850000).toLocaleString("id-ID")}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Total Transaksi</span>
              <span className="font-bold text-slate-900">{data?.totalOrdersCount || 142} Pesanan</span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
