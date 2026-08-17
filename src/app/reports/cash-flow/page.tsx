"use client";

import React, { useState, useEffect } from "react";
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
  FileSpreadsheet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/layout/app-shell";

export default function CashFlowReportPage() {
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState<"today" | "month" | "all">("all");
  const [showInputModal, setShowInputModal] = useState(false);

  // Cash Drawer State
  const [modalAwal, setModalAwal] = useState(144500);
  
  // Petty Cash Transactions Log State
  const [pettyLogs, setPettyLogs] = useState<any[]>([
    {
      id: "log-1",
      waktu: "4/8/2026 15.51.23",
      petugas: "Cheisa",
      tipe: "OUT",
      jumlah: 18000,
      catatan: "Es Batu 2 Plastik",
    },
    {
      id: "log-2",
      waktu: "31/7/2026 17.51.27",
      petugas: "Ummu",
      tipe: "IN",
      jumlah: 200000,
      catatan: "Selisih Cash Absen Masuk (Ummu) [+200.000]",
    },
    {
      id: "log-3",
      waktu: "31/7/2026 15.03.46",
      petugas: "Reza",
      tipe: "OUT",
      jumlah: 7000,
      catatan: "Es batu",
    },
    {
      id: "log-4",
      waktu: "31/7/2026 10.45.40",
      petugas: "Reza",
      tipe: "OUT",
      jumlah: 9000,
      catatan: "Es batu 1",
    },
    {
      id: "log-5",
      waktu: "30/7/2026 18.33.14",
      petugas: "Ummu",
      tipe: "OUT",
      jumlah: 5000,
      catatan: "Tuker uang",
    },
  ]);

  // Form State for New Kas Entry
  const [entryForm, setEntryForm] = useState({
    tipe: "OUT",
    jumlah: 0,
    petugas: "Admin",
    catatan: "",
  });

  // Calculate totals
  const totalKasMasuk = pettyLogs.filter(l => l.tipe === "IN").reduce((s, l) => s + l.jumlah, 0);
  const totalKasKeluar = pettyLogs.filter(l => l.tipe === "OUT").reduce((s, l) => s + l.jumlah, 0);
  const totalPenjualanTunai = 0; // Live offline sales
  const liveReadyCash = modalAwal + totalPenjualanTunai + totalKasMasuk - totalKasKeluar;

  const handleAddPettyLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (entryForm.jumlah <= 0 || !entryForm.catatan.trim()) return;

    const newLog = {
      id: "log-" + Date.now(),
      waktu: new Date().toLocaleString("id-ID"),
      petugas: entryForm.petugas || "Admin",
      tipe: entryForm.tipe,
      jumlah: Number(entryForm.jumlah),
      catatan: entryForm.catatan,
    };

    setPettyLogs([newLog, ...pettyLogs]);
    setEntryForm({ tipe: "OUT", jumlah: 0, petugas: "Admin", catatan: "" });
    setShowInputModal(false);
  };

  const handleDeleteLog = (id: string) => {
    if (!confirm("Hapus catatan transaksi kas ini?")) return;
    setPettyLogs(pettyLogs.filter(l => l.id !== id));
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Waktu,Petugas,Tipe,Jumlah,Catatan", ...pettyLogs.map(l => `"${l.waktu}","${l.petugas}","${l.tipe}",${l.jumlah},"${l.catatan}"`)].join("\n");
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
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Kas Shift & Operasional Laci</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleExportCSV}
              variant="outline"
              className="min-h-[42px] bg-white border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 rounded-xl gap-2 shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export CSV Kas</span>
            </Button>

            <Button
              onClick={() => setShowInputModal(true)}
              className="min-h-[42px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 rounded-xl gap-2 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Input Kas Masuk / Out</span>
            </Button>
          </div>
        </div>

        {/* 2. Dark Theme Top Live Cash Drawer Status Banner (Matching Screenshot) */}
        <div className="bg-[#0f172a] text-white p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                UANG CASH READY DI LACI KASIR (LIVE)
              </span>
              <div className="text-3xl font-extrabold tracking-tight mt-1 text-white">
                Rp {liveReadyCash.toLocaleString("id-ID")}
              </div>
            </div>
          </div>

          {/* 4 Stat Badges at Top Right */}
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
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Kas Masuk (IN)</span>
              <span className="text-xs font-bold text-emerald-400 mt-0.5 block">+Rp {totalKasMasuk.toLocaleString("id-ID")}</span>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60 min-w-[120px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Kas Keluar (OUT)</span>
              <span className="text-xs font-bold text-rose-400 mt-0.5 block">-Rp {totalKasKeluar.toLocaleString("id-ID")}</span>
            </div>
          </div>
        </div>

        {/* 3. Middle Section: Log Rincian Penjualan Offline Shift Karyawan */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
            <div className="flex items-center gap-2.5">
              <span className="text-emerald-600 font-bold text-base">$</span>
              <h3 className="font-bold text-sm text-slate-900">Log Rincian Penjualan Offline Shift Karyawan</h3>
              <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5">
                0 Transaksi Offline
              </Badge>
            </div>

            <div className="text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              Total Omset Filtered: <strong className="text-slate-900">Rp 0</strong>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-1.5 bg-slate-100/70 p-1 rounded-2xl text-xs font-semibold">
              <button 
                onClick={() => setFilterPeriod("today")}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${filterPeriod === "today" ? "bg-stone-800 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
              >
                Hari Ini
              </button>
              <button 
                onClick={() => setFilterPeriod("month")}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${filterPeriod === "month" ? "bg-stone-800 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
              >
                Bulan Ini
              </button>
              <button 
                onClick={() => setFilterPeriod("all")}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${filterPeriod === "all" ? "bg-stone-800 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
              >
                Semua
              </button>
              <button className="px-3 py-1.5 rounded-xl text-slate-600 hover:text-slate-900 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Tanggal
              </button>
            </div>
          </div>

          {/* Empty State Container */}
          <div className="border border-slate-200/80 rounded-2xl p-10 text-center text-xs text-slate-400 font-medium italic">
            Belum ada log transaksi penjualan offline pada periode ini.
          </div>
        </div>

        {/* 4. Bottom Section: Log Uang Kas Masuk & Kas Keluar (Petty Cash) */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Log Uang Kas Masuk & Kas Keluar (Petty Cash)</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Pengeluaran kas kecil selama shift (pembelian galon, es batu, parkir, kebersihan).
              </p>
            </div>

            <Button 
              onClick={() => setShowInputModal(true)}
              size="sm" 
              variant="outline" 
              className="text-xs font-semibold min-h-[38px] rounded-xl border-slate-300"
            >
              + Tambah Kas
            </Button>
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

          {/* Table Container */}
          <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
            <div className="grid grid-cols-12 px-6 py-3.5 bg-slate-50/70 border-b text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
              <div className="col-span-3">WAKTU</div>
              <div className="col-span-2">PETUGAS</div>
              <div className="col-span-2">TIPE</div>
              <div className="col-span-2">JUMLAH (RP)</div>
              <div className="col-span-2">CATATAN KEPERLUAN</div>
              <div className="col-span-1 text-right">AKSI</div>
            </div>

            <div className="divide-y divide-slate-100">
              {pettyLogs.length > 0 ? (
                pettyLogs.map((log) => (
                  <div key={log.id} className="grid grid-cols-12 px-6 py-3.5 items-center text-xs hover:bg-slate-50/60 transition-colors">
                    <div className="col-span-3 text-slate-500 font-mono text-[11px]">{log.waktu}</div>
                    <div className="col-span-2 font-bold text-slate-800">{log.petugas}</div>
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
                    <div className="col-span-2 font-extrabold text-slate-900">
                      Rp {Number(log.jumlah).toLocaleString("id-ID")}
                    </div>
                    <div className="col-span-2 text-slate-600 font-medium truncate">{log.catatan}</div>
                    <div className="col-span-1 text-right">
                      <button 
                        onClick={() => handleDeleteLog(log.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 font-medium">
                  Belum ada transaksi kas kecil tercatat.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Modal Dialog Input Kas Masuk / Out */}
        {showInputModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl border shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-sm text-slate-900">Input Kas Masuk / Out (Petty Cash)</h3>
                <button onClick={() => setShowInputModal(false)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddPettyLog} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Jenis Transaksi Kas</label>
                  <select
                    value={entryForm.tipe}
                    onChange={(e) => setEntryForm({ ...entryForm, tipe: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 min-h-[40px] text-xs font-semibold"
                  >
                    <option value="OUT">Kas Keluar (OUT - Operasional/Belanja)</option>
                    <option value="IN">Kas Masuk (IN - Tambahan Modal/Selisih)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Jumlah Nominal (Rp) *</label>
                  <Input
                    type="number"
                    placeholder="Contoh: 15000"
                    value={entryForm.jumlah || ""}
                    onChange={(e) => setEntryForm({ ...entryForm, jumlah: Number(e.target.value) })}
                    className="min-h-[40px] text-xs font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Petugas / Kasir</label>
                  <Input
                    placeholder="Nama Petugas..."
                    value={entryForm.petugas}
                    onChange={(e) => setEntryForm({ ...entryForm, petugas: e.target.value })}
                    className="min-h-[40px] text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Catatan Keperluan *</label>
                  <Input
                    placeholder="Contoh: Pembelian Es Batu 2 Plastik"
                    value={entryForm.catatan}
                    onChange={(e) => setEntryForm({ ...entryForm, catatan: e.target.value })}
                    className="min-h-[40px] text-xs font-medium"
                    required
                  />
                </div>

                <div className="pt-2 flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowInputModal(false)} className="text-xs min-h-[38px] rounded-xl">
                    Batal
                  </Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold min-h-[38px] rounded-xl px-5">
                    Simpan Transaksi Kas
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
