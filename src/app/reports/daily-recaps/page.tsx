"use client";

import React, { useState, useEffect } from "react";
import { 
  ClipboardCheck, 
  RefreshCw, 
  FileText, 
  DollarSign, 
  CreditCard, 
  QrCode, 
  Coins, 
  Receipt,
  ArrowRightLeft
} from "lucide-react";
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

  const pb = data?.paymentBreakdown || {
    CASH: 0,
    QRIS: 0,
    EDC_CARD: 0,
    TRANSFER: 0,
    OTHER: 0,
  };

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 text-slate-900">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Rekap Harian Kasir &amp; Pendapatan</h1>
              <p className="text-xs text-slate-500 font-medium">Ringkasan transaksi shift, rincian per metode pembayaran (termasuk split payment), dan saldo kas laci.</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={fetchRecaps} className="text-xs gap-1.5 min-h-[38px] rounded-xl border-slate-200 hover:bg-slate-50 cursor-pointer">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Segarkan Data</span>
          </Button>
        </div>

        {/* Shift Aktif Status Card */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Kasir yang Bertugas</span>
              <h2 className="text-base font-extrabold text-slate-900 mt-0.5">{shift.employeeName}</h2>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              shift.status === "OPEN" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"
            }`}>
              {shift.status === "OPEN" ? "● Shift Sedang Berjalan" : "Shift Ditutup"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t pt-3.5 text-xs">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <span className="text-slate-400 block text-[11px] font-medium">Modal Kas Awal</span>
              <strong className="text-sm font-extrabold text-slate-900 block mt-0.5">
                Rp {Number(shift.startCash || 0).toLocaleString("id-ID")}
              </strong>
            </div>

            <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100">
              <span className="text-emerald-700 block text-[11px] font-semibold">Estimasi Kas Laci (Uang Fisik)</span>
              <strong className="text-sm font-extrabold text-emerald-900 block mt-0.5">
                Rp {Number(shift.expectedCash || 0).toLocaleString("id-ID")}
              </strong>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <span className="text-slate-400 block text-[11px] font-medium">Total Omzet Penjualan</span>
              <strong className="text-sm font-extrabold text-indigo-700 block mt-0.5">
                Rp {Number(data?.totalRevenue || 0).toLocaleString("id-ID")}
              </strong>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <span className="text-slate-400 block text-[11px] font-medium">Total Transaksi</span>
              <strong className="text-sm font-extrabold text-slate-900 block mt-0.5">
                {data?.totalOrdersCount || 0} Pesanan
              </strong>
            </div>
          </div>
        </div>

        {/* Breakdown Per Metode Pembayaran (Termasuk Split Payment) */}
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900">Rincian Pendapatan per Metode Pembayaran</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block">Tunai (Cash Laci)</span>
                <strong className="text-base font-extrabold text-slate-900 block mt-0.5">
                  Rp {Number(pb.CASH || 0).toLocaleString("id-ID")}
                </strong>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Coins className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block">QRIS (GoPay / ShopeePay / BCA)</span>
                <strong className="text-base font-extrabold text-indigo-600 block mt-0.5">
                  Rp {Number(pb.QRIS || 0).toLocaleString("id-ID")}
                </strong>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block">Kartu Debit / EDC</span>
                <strong className="text-base font-extrabold text-sky-600 block mt-0.5">
                  Rp {Number(pb.EDC_CARD || 0).toLocaleString("id-ID")}
                </strong>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block">Transfer / Lainnya</span>
                <strong className="text-base font-extrabold text-purple-600 block mt-0.5">
                  Rp {Number((pb.TRANSFER || 0) + (pb.OTHER || 0)).toLocaleString("id-ID")}
                </strong>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
            </div>

          </div>
        </div>

      </div>
    </AppShell>
  );
}
