"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Wallet, 
  Download, 
  Plus, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar, 
  Check, 
  X,
  FileSpreadsheet,
  Receipt,
  Eye,
  Camera,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/layout/app-shell";
import { type DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { CashInOutModal, CashTransactionPayload } from "@/components/cash-flow/CashInOutModal";
import { ReceiptProofModal } from "@/components/cash-flow/ReceiptProofModal";
import { startOfDay, endOfDay, isWithinInterval, isSameDay } from "date-fns";

export default function CashFlowReportPage() {
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState<"today" | "month" | "all">("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [showInputModal, setShowInputModal] = useState(false);
  const [selectedProofTransaction, setSelectedProofTransaction] = useState<any>(null);

  // Cash Drawer State
  const [modalAwal, setModalAwal] = useState(144500);
  
  // Petty Cash Transactions Log State
  const [pettyLogs, setPettyLogs] = useState<any[]>([]);

  const fetchCashFlowLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/data?type=expenses");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((item: any, idx: number) => ({
            id: item.id || `exp-${idx}`,
            waktu: item.timestamp ? new Date(item.timestamp).toLocaleString("id-ID") : new Date().toLocaleString("id-ID"),
            timestamp: item.timestamp || item.createdAt,
            petugas: item.employeeName || (item.isFromScan ? "AI Nota" : "Staf Outlet"),
            tipe: item.type === "IN" || item.type === "CASH_IN" ? "IN" : "OUT",
            jumlah: Number(item.amount) || 0,
            catatan: item.note || item.notes || "Pengeluaran Operasional",
            isFromScan: item.isFromScan,
            receiptImage: item.receiptImage || (item.imageUrl ? item.imageUrl : null),
            voucherNumber: item.voucherNumber || `VKAS-${(item.id || idx).toString().slice(-6)}`,
          }));
          setPettyLogs(mapped);
        } else {
          setPettyLogs([
            { id: "log-1", waktu: new Date().toLocaleString("id-ID"), petugas: "AI Nota", tipe: "OUT", jumlah: 65000, catatan: "[AI Nota] Toko Bahan Kue - Sirup Aren 1L", isFromScan: true, voucherNumber: "VKAS-001" },
            { id: "log-2", waktu: new Date().toLocaleString("id-ID"), petugas: "Cheisa", tipe: "OUT", jumlah: 18000, catatan: "Es Batu 2 Plastik", isFromScan: false, voucherNumber: "VKAS-002" },
          ]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashFlowLogs();
  }, []);

  // Filtered petty logs
  const filteredPettyLogs = useMemo(() => {
    return pettyLogs.filter((log) => {
      if (!log) return false;
      const logDate = new Date(log.timestamp || log.waktu || Date.now());

      if (dateRange?.from) {
        if (dateRange.to) {
          return isWithinInterval(logDate, {
            start: startOfDay(dateRange.from),
            end: endOfDay(dateRange.to),
          });
        }
        return isSameDay(logDate, dateRange.from);
      }

      if (filterPeriod === "today") {
        return isSameDay(logDate, new Date());
      }

      if (filterPeriod === "month") {
        const now = new Date();
        return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
      }

      return true;
    });
  }, [pettyLogs, dateRange, filterPeriod]);

  // Calculate totals based on all / filtered
  const totalKasMasuk = filteredPettyLogs.filter(l => l.tipe === "IN").reduce((s, l) => s + l.jumlah, 0);
  const totalKasKeluar = filteredPettyLogs.filter(l => l.tipe === "OUT").reduce((s, l) => s + l.jumlah, 0);
  const totalPenjualanTunai = 0; // Live offline sales
  const liveReadyCash = modalAwal + totalPenjualanTunai + totalKasMasuk - totalKasKeluar;

  const handleCashInOutSuccess = async (data: CashTransactionPayload) => {
    const newLog = {
      id: "log-" + Date.now(),
      waktu: new Date().toLocaleString("id-ID"),
      timestamp: new Date().toISOString(),
      petugas: data.petugas,
      tipe: data.type === "CASH_IN" || data.type === "IN" ? "IN" : "OUT",
      jumlah: Number(data.amount),
      catatan: data.catatan,
      receiptImage: data.receiptImage,
      voucherNumber: data.voucherNumber,
      isFromScan: Boolean(data.receiptImage),
    };

    setPettyLogs([newLog, ...pettyLogs]);

    // Also persist via API
    try {
      await fetch("/api/data?type=save_expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: data.amount,
          note: data.catatan,
          employeeName: data.petugas,
          type: data.type,
          receiptImage: data.receiptImage,
        }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteLog = (id: string) => {
    if (!confirm("Hapus catatan transaksi kas ini?")) return;
    setPettyLogs(pettyLogs.filter(l => l.id !== id));
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Waktu,Petugas,Tipe,Jumlah,Catatan,NoVoucher", ...filteredPettyLogs.map(l => `"${l.waktu}","${l.petugas}","${l.tipe}",${l.jumlah},"${l.catatan}","${l.voucherNumber || ""}"`)].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Kas_Shift_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto text-slate-900 space-y-6">
        
        {/* 1. Page Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Laporan Arus Kas</h1>
              <p className="text-xs text-slate-500 font-medium">
                Pencatatan kas masuk dan keluar laci kasir dengan verifikasi foto nota dan slip kas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleExportCSV}
              variant="outline"
              className="min-h-[42px] bg-white border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 rounded-xl gap-2 shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Ekspor CSV</span>
            </Button>

            <Button
              onClick={() => setShowInputModal(true)}
              className="min-h-[42px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 rounded-xl gap-2 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Kas</span>
            </Button>
          </div>
        </div>

        {/* 2. Top Live Cash Drawer Status Banner */}
        <div className="bg-[#0f172a] text-white p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                UANG TUNAI DI LACI KASIR
              </span>
              <div className="text-3xl font-extrabold tracking-tight mt-1 text-white">
                Rp {liveReadyCash.toLocaleString("id-ID")}
              </div>
            </div>
          </div>

          {/* Stat Badges at Top Right */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
            <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60 min-w-[120px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Modal Awal Laci</span>
              <span className="text-xs font-bold text-white mt-0.5 block">Rp {modalAwal.toLocaleString("id-ID")}</span>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60 min-w-[120px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Penjualan Tunai</span>
              <span className="text-xs font-bold text-emerald-400 mt-0.5 block">+Rp {totalPenjualanTunai.toLocaleString("id-ID")}</span>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60 min-w-[120px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Kas Masuk</span>
              <span className="text-xs font-bold text-emerald-400 mt-0.5 block">+Rp {totalKasMasuk.toLocaleString("id-ID")}</span>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60 min-w-[120px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Kas Keluar</span>
              <span className="text-xs font-bold text-rose-400 mt-0.5 block">-Rp {totalKasKeluar.toLocaleString("id-ID")}</span>
            </div>
          </div>
        </div>

        {/* 3. Log Uang Kas Masuk & Kas Keluar (Petty Cash Table) */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Log Kas Masuk & Kas Keluar</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Pengeluaran kas operasional selama shift lengkap dengan bukti foto nota.
              </p>
            </div>

            <Button 
              onClick={() => setShowInputModal(true)}
              size="sm" 
              className="bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold min-h-[38px] rounded-xl cursor-pointer gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>+ Catat Kas</span>
            </Button>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-1.5 bg-slate-100/70 p-1 rounded-2xl text-xs font-semibold">
              <button 
                onClick={() => { setFilterPeriod("today"); setDateRange(undefined); }}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${filterPeriod === "today" && !dateRange ? "bg-stone-800 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
              >
                Hari Ini
              </button>
              <button 
                onClick={() => { setFilterPeriod("month"); setDateRange(undefined); }}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${filterPeriod === "month" && !dateRange ? "bg-stone-800 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
              >
                Bulan Ini
              </button>
              <button 
                onClick={() => { setFilterPeriod("all"); setDateRange(undefined); }}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${filterPeriod === "all" && !dateRange ? "bg-stone-800 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
              >
                Semua
              </button>
            </div>

            <DatePickerWithRange
              date={dateRange}
              setDate={(range) => {
                setDateRange(range);
                if (range?.from) setFilterPeriod("all");
              }}
              placeholder="Filter Rentang Tanggal"
            />
          </div>

          {/* Summary Badges */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-3 py-1 rounded-xl">
              + Kas Masuk: Rp {totalKasMasuk.toLocaleString("id-ID")}
            </span>
            <span className="bg-amber-50 text-amber-800 border border-amber-200 font-bold px-3 py-1 rounded-xl">
              - Kas Keluar: Rp {totalKasKeluar.toLocaleString("id-ID")}
            </span>
            <span className="bg-slate-100 text-slate-800 border border-slate-200 font-bold px-3 py-1 rounded-xl">
              Netto: Rp {(totalKasMasuk - totalKasKeluar).toLocaleString("id-ID")}
            </span>
          </div>

          {/* Table Container with Smooth Horizontal Scroll */}
          <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
            <div className="overflow-x-auto custom-scrollbar">
              <div className="min-w-[680px]">
                <div className="grid grid-cols-12 px-5 py-3.5 bg-slate-50/70 border-b text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
                  <div className="col-span-3">WAKTU & PETUGAS</div>
                  <div className="col-span-2">TIPE</div>
                  <div className="col-span-2">JUMLAH (RP)</div>
                  <div className="col-span-3">CATATAN & BUKTI</div>
                  <div className="col-span-2 text-right">AKSI / NOTA</div>
                </div>

                <div className="divide-y divide-slate-100">
                  {filteredPettyLogs.length > 0 ? (
                    filteredPettyLogs.map((log) => (
                      <div key={log.id} className="grid grid-cols-12 px-5 py-3.5 items-center text-xs hover:bg-slate-50/60 transition-colors">
                        <div className="col-span-3">
                          <div className="font-bold text-slate-800">{log.petugas}</div>
                          <div className="text-slate-400 font-mono text-[11px]">{log.waktu}</div>
                        </div>

                        <div className="col-span-2">
                          {log.tipe === "OUT" ? (
                            <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-lg inline-flex items-center gap-1">
                              <ArrowUpRight className="w-3 h-3 text-amber-600" /> Kas Keluar
                            </span>
                          ) : (
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-lg inline-flex items-center gap-1">
                              <ArrowDownLeft className="w-3 h-3 text-emerald-600" /> Kas Masuk
                            </span>
                          )}
                        </div>

                        <div className="col-span-2 font-extrabold text-slate-900 font-mono">
                          Rp {Number(log.jumlah).toLocaleString("id-ID")}
                        </div>

                        <div className="col-span-3 text-slate-600 font-medium space-y-1">
                          <div className="truncate">{log.catatan}</div>
                          <div className="flex items-center gap-1">
                            {log.receiptImage ? (
                              <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <Camera className="w-2.5 h-2.5 text-emerald-600" /> Foto Terlampir
                              </span>
                            ) : (
                              <span className="bg-slate-100 text-slate-600 text-[9px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <Receipt className="w-2.5 h-2.5 text-slate-500" /> E-Nota Slip
                              </span>
                            )}
                            {log.voucherNumber && (
                              <span className="text-[10px] text-slate-400 font-mono">#{log.voucherNumber}</span>
                            )}
                          </div>
                        </div>

                        <div className="col-span-2 text-right flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedProofTransaction(log)}
                            className="text-[11px] h-7 px-2.5 rounded-lg border-slate-300 text-slate-700 hover:bg-slate-100 gap-1 cursor-pointer"
                            title="Buka Popup Bukti Nota"
                          >
                            <Eye className="w-3 h-3 text-indigo-600" />
                            <span>Lihat Nota</span>
                          </Button>

                          <button 
                            onClick={() => handleDeleteLog(log.id)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Catatan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-400 font-medium">
                      Belum ada transaksi kas kecil tercatat pada periode ini.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Dialog Input Kas Masuk / Out (With Receipt Photo & Digital E-Nota) */}
        <CashInOutModal
          isOpen={showInputModal}
          onClose={() => setShowInputModal(false)}
          onSuccess={handleCashInOutSuccess}
          currentCashBalance={liveReadyCash}
        />

        {/* Modal Dialog Bukti Nota / E-Nota Pop-up Preview */}
        <ReceiptProofModal
          isOpen={Boolean(selectedProofTransaction)}
          onClose={() => setSelectedProofTransaction(null)}
          transaction={selectedProofTransaction}
        />

      </div>
    </AppShell>
  );
}
