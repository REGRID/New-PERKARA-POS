"use client";

import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, DollarSign, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/app-shell";

export default function CashFlowReportPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
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
    fetchReport();
  }, []);

  const totalRevenue = data?.totalRevenue ?? 4850000;
  const totalOpex = data?.totalOpex ?? 1450000;
  const estimatedProfit = data?.estimatedProfit ?? 3400000;

  return (
    <AppShell>
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Laporan Arus Kas (Cash Flow)</h1>
            <p className="text-xs text-slate-500">Ringkasan kas masuk dari transaksi & kas keluar untuk operasional</p>
          </div>
          <Button size="sm" variant="outline" onClick={fetchReport} className="text-xs gap-1 min-h-[36px]">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-white p-4 rounded-xl border space-y-1 shadow-2xs">
            <span className="text-slate-500 font-semibold uppercase text-[10px]">Total Kas Masuk (Omset)</span>
            <div className="text-xl font-bold text-emerald-600 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              <span>Rp {Number(totalRevenue).toLocaleString("id-ID")}</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border space-y-1 shadow-2xs">
            <span className="text-slate-500 font-semibold uppercase text-[10px]">Total Kas Keluar (Beban)</span>
            <div className="text-xl font-bold text-rose-600 flex items-center gap-1">
              <TrendingDown className="w-4 h-4" />
              <span>Rp {Number(totalOpex).toLocaleString("id-ID")}</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border space-y-1 shadow-2xs">
            <span className="text-slate-500 font-semibold uppercase text-[10px]">Arus Kas Bersih (Net Profit)</span>
            <div className="text-xl font-bold text-indigo-600 flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              <span>Rp {Number(estimatedProfit).toLocaleString("id-ID")}</span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
