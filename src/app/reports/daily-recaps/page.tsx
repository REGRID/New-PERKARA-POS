"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  ClipboardCheck, 
  RefreshCw, 
  FileText, 
  DollarSign, 
  CreditCard, 
  QrCode, 
  Coins, 
  Receipt,
  ArrowRightLeft,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/layout/app-shell";

export default function DailyRecapsPage() {
  const [data, setData] = useState<any>(null);
  const [shiftLogs, setShiftLogs] = useState<any[]>([]);
  const [selectedShiftId, setSelectedShiftId] = useState<string>("ACTIVE");
  const [loading, setLoading] = useState(true);

  const fetchRecaps = async () => {
    try {
      setLoading(true);
      const [dataRes, absenRes] = await Promise.all([
        fetch("/api/data"),
        fetch("/api/absen-kas")
      ]);

      if (dataRes.ok) setData(await dataRes.json());
      if (absenRes.ok) {
        const absenJson = await absenRes.json();
        setShiftLogs(absenJson.recentLogs || []);
      }
    } catch (e) {
      console.error("Error fetching daily recaps:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecaps();
  }, []);

  const activeShift = data?.activeShift || null;

  const selectedShift = useMemo(() => {
    if (selectedShiftId === "ACTIVE") return activeShift;
    return shiftLogs.find((s) => s.id === selectedShiftId) || null;
  }, [selectedShiftId, activeShift, shiftLogs]);

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Rekap Harian Kasir &amp; Pendapatan</h1>
              <p className="text-xs text-slate-500 font-medium">Ringkasan transaksi shift, rincian per metode pembayaran (termasuk split payment), dan saldo kas laci.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {shiftLogs.length > 0 && (
              <select
                value={selectedShiftId}
                onChange={(e) => setSelectedShiftId(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs"
              >
                <option value="ACTIVE">{activeShift ? "● Shift Aktif Sekarang" : "Shift Aktif (Belum Ada)"}</option>
                {shiftLogs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {new Date(s.timestamp).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} - {s.employeeName} ({s.status === "CLOSED" ? "Tutup" : "Buka"})
                  </option>
                ))}
              </select>
            )}

            <Button size="sm" variant="outline" onClick={fetchRecaps} className="text-xs gap-1.5 min-h-[38px] rounded-xl border-slate-200 hover:bg-slate-50 cursor-pointer">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Segarkan</span>
            </Button>
          </div>
        </div>

        {/* Shift Status Card */}
        {selectedShift ? (
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Kasir yang Bertugas</span>
                <h2 className="text-base font-extrabold text-slate-900 mt-0.5">{selectedShift.employeeName}</h2>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                selectedShift.status === "OPEN" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"
              }`}>
                {selectedShift.status === "OPEN" ? "● Shift Sedang Berjalan" : "Shift Telah Ditutup"}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t pt-3.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <span className="text-slate-400 block text-[11px] font-medium">Modal Kas Awal</span>
                <strong className="text-sm font-extrabold text-slate-900 block mt-0.5">
                  Rp {Number(selectedShift.startingCash || selectedShift.startCash || 0).toLocaleString("id-ID")}
                </strong>
              </div>

              <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100">
                <span className="text-emerald-700 block text-[11px] font-semibold">
                  {selectedShift.status === "CLOSED" ? "Kas Akhir Terverifikasi" : "Estimasi Kas Laci"}
                </span>
                <strong className="text-sm font-extrabold text-emerald-900 block mt-0.5">
                  Rp {Number(selectedShift.cashVerified || selectedShift.endCash || selectedShift.cashExpected || selectedShift.expectedCash || 0).toLocaleString("id-ID")}
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

            {selectedShift.cashNote && (
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60 text-xs text-slate-600 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Catatan Shift: <strong>{selectedShift.cashNote}</strong></span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">Belum Ada Shift Kasir yang Aktif</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Silakan buka shift kasir di halaman kasir POS atau menu Absensi &amp; Kas untuk memulai pencatatan kas harian.
            </p>
          </div>
        )}

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

        {/* Riwayat Shift Terkini */}
        {shiftLogs.length > 0 && (
          <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900">Riwayat Shift Kasir Terkini</h3>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Tanggal / Waktu</th>
                    <th className="py-2.5 px-3">Petugas Kasir</th>
                    <th className="py-2.5 px-3 text-right">Modal Awal</th>
                    <th className="py-2.5 px-3 text-right">Kas Akhir</th>
                    <th className="py-2.5 px-3 text-right">Selisih Kas</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {shiftLogs.slice(0, 10).map((log: any) => {
                    const diff = Number(log.cashDiscrepancy || log.difference || 0);
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-3">
                          {new Date(log.timestamp).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          <span className="text-[10px] text-slate-400 block">
                            {new Date(log.timestamp).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {log.employeeName}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          Rp {Number(log.startingCash || log.startCash || 0).toLocaleString("id-ID")}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                          Rp {Number(log.cashVerified || log.endCash || 0).toLocaleString("id-ID")}
                        </td>
                        <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                          diff === 0 ? "text-slate-500" : diff > 0 ? "text-emerald-600" : "text-rose-600"
                        }`}>
                          {diff > 0 ? `+Rp ${diff.toLocaleString("id-ID")}` : diff < 0 ? `-Rp ${Math.abs(diff).toLocaleString("id-ID")}` : "Rp 0 (Cocok)"}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <Badge className={`text-[10px] font-bold ${
                            log.status === "OPEN" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"
                          }`}>
                            {log.status === "OPEN" ? "BUKA" : "DITUTUP"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
