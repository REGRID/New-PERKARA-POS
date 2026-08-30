"use client";

import React, { useState, useRef } from "react";
import {
  Camera,
  Upload,
  Receipt,
  Sparkles,
  X,
  Printer,
  FileText,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Image as ImageIcon,
  RotateCw,
  Eye,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

export interface CashTransactionPayload {
  id?: string;
  type: "IN" | "OUT" | "CASH_IN" | "CASH_OUT";
  amount: number;
  petugas: string;
  catatan: string;
  kategori?: string;
  receiptImage?: string | null;
  voucherNumber?: string;
  timestamp?: string;
}

interface CashInOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: CashTransactionPayload) => void;
  defaultType?: "IN" | "OUT";
  currentCashBalance?: number;
  currentEmployeeName?: string;
}

export function CashInOutModal({
  isOpen,
  onClose,
  onSuccess,
  defaultType = "OUT",
  currentCashBalance = 0,
  currentEmployeeName = "Kasir Outlet",
}: CashInOutModalProps) {
  const [activeTab, setActiveTab] = useState<"PHOTO" | "DIGITAL_SLIP">("PHOTO");
  const [transactionType, setTransactionType] = useState<"OUT" | "IN">(defaultType);
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState("Bahan & Operasional");
  const [note, setNote] = useState("");
  const [employeeName, setEmployeeName] = useState(currentEmployeeName);
  const [voucherNumber, setVoucherNumber] = useState(() => `VKAS-${Date.now().toString().slice(-6)}`);
  
  // Photo states
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [imageRotation, setImageRotation] = useState(0);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Quick preset amounts
  const quickAmounts = [10000, 20000, 50000, 100000, 250000];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      setReceiptImage(event.target?.result as string);
      setIsProcessingImage(false);
    };
    reader.onerror = () => setIsProcessingImage(false);
    reader.readAsDataURL(file);
  };

  const handleRotate = () => {
    setImageRotation((prev) => (prev + 90) % 360);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !note.trim()) {
      alert("Mohon masukkan nominal uang dan catatan keperluan transaksi.");
      return;
    }

    const payload: CashTransactionPayload = {
      type: transactionType === "IN" ? "CASH_IN" : "CASH_OUT",
      amount: Number(amount),
      petugas: employeeName || "Kasir Outlet",
      catatan: `[${category}] ${note}${receiptImage ? " 📷 [Foto Nota Terlampir]" : " 🧾 [E-Nota Slip Kasir]"}`,
      kategori: category,
      receiptImage: receiptImage || undefined,
      voucherNumber: voucherNumber,
      timestamp: new Date().toISOString(),
    };

    onSuccess(payload);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setAmount(0);
    setNote("");
    setReceiptImage(null);
    setImageRotation(0);
    setVoucherNumber(`VKAS-${Date.now().toString().slice(-6)}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl rounded-3xl max-h-[90vh] overflow-y-auto p-6 bg-white border border-slate-200">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${transactionType === "OUT" ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                {transactionType === "OUT" ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Input Transaksi Kas {transactionType === "OUT" ? "Keluar (OUT)" : "Masuk (IN)"}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Lengkapi pencatatan kas laci dengan bukti foto nota fisik atau voucher slip kas digital.
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
          {/* Transaction Type Selector */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setTransactionType("OUT")}
              className={`py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                transactionType === "OUT"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Kas Keluar (OUT - Beban/Belanja)</span>
            </button>
            <button
              type="button"
              onClick={() => setTransactionType("IN")}
              className={`py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                transactionType === "IN"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Kas Masuk (IN - Tambahan Modal)</span>
            </button>
          </div>

          {/* Nominal Input & Quick Preset Buttons */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2.5">
            <label className="font-bold text-slate-700 block">Nominal Uang (Rp) *</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm text-slate-400">Rp</span>
              <Input
                type="number"
                placeholder="0"
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
                className={`pl-10 text-base font-extrabold rounded-xl min-h-[44px] bg-white ${
                  transactionType === "OUT" ? "text-rose-600 focus:border-rose-500" : "text-emerald-600 focus:border-emerald-500"
                }`}
                required
                autoFocus
              />
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] text-slate-400 font-semibold mr-1">Cepat:</span>
              {quickAmounts.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setAmount(q)}
                  className="px-2.5 py-1 bg-white hover:bg-slate-200 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer transition-colors"
                >
                  +{q.toLocaleString("id-ID")}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmount(0)}
                className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 rounded-lg text-[11px] font-semibold text-slate-600 cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Form Fields: Kategori, Keterangan, Petugas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Kategori Keperluan</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 min-h-[38px] text-xs font-semibold text-slate-800 cursor-pointer"
              >
                <option value="Bahan & Operasional">Bahan & Operasional Harian</option>
                <option value="Es Batu & Galon">Es Batu & Air Galon</option>
                <option value="Listrik & Internet">Listrik, Air & Wifi</option>
                <option value="Kebersihan & Perlengkapan">Kebersihan & Perlengkapan</option>
                <option value="Kasbon Karyawan">Kasbon Kasir / Karyawan</option>
                <option value="Transport & Parkir">Transportasi & Parkir</option>
                <option value="Tambahan Modal Laci">Tambahan Modal Laci Kasir</option>
                <option value="Lainnya">Pengeluaran / Pemasukan Lainnya</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Nama Petugas / Kasir</label>
              <Input
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                placeholder="Nama kasir..."
                className="text-xs font-semibold rounded-xl min-h-[38px]"
                required
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Catatan / Detail Belanja *</label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Beli Es Batu 2 Plastik di Warung Pak Joko"
              className="text-xs font-medium rounded-xl min-h-[38px]"
              required
            />
          </div>

          {/* SECTION: BUKTI NOTA / E-NOTA DUPLICATE POPUP */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-emerald-600" />
                Bukti Struk Transaksi Kas
              </span>

              {/* Toggle Mode: Foto Nota vs E-Nota Slip Kasir */}
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-slate-200 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab("PHOTO")}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    activeTab === "PHOTO" ? "bg-stone-800 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  📷 Foto Nota
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("DIGITAL_SLIP")}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    activeTab === "DIGITAL_SLIP" ? "bg-stone-800 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  🧾 E-Nota Slip Kas
                </button>
              </div>
            </div>

            {/* TAB 1: Foto Nota Fisik Upload & Camera Capture */}
            {activeTab === "PHOTO" && (
              <div className="space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <input
                  type="file"
                  ref={cameraInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                />

                {receiptImage ? (
                  <div className="relative bg-black/5 rounded-2xl p-3 border border-slate-200 flex flex-col items-center gap-2">
                    <div className="relative max-h-56 overflow-hidden rounded-xl bg-white border shadow-xs flex items-center justify-center w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={receiptImage}
                        alt="Bukti Nota Kas"
                        style={{ transform: `rotate(${imageRotation}deg)` }}
                        className="max-h-52 object-contain transition-transform duration-200"
                      />
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleRotate}
                        className="text-xs gap-1 rounded-xl h-8 bg-white"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Putar 90°</span>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs gap-1 rounded-xl h-8 bg-white"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Ganti Foto</span>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => setReceiptImage(null)}
                        className="text-xs gap-1 rounded-xl h-8"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="p-4 border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer text-emerald-800"
                    >
                      <Camera className="w-6 h-6 text-emerald-600" />
                      <span className="font-bold text-xs">Buka Kamera / Foto Nota</span>
                      <span className="text-[10px] text-emerald-600/80">Ambil langsung struk belanja fisik</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-4 border-2 border-dashed border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer text-slate-700"
                    >
                      <Upload className="w-6 h-6 text-slate-500" />
                      <span className="font-bold text-xs">Unggah Galeri Foto Nota</span>
                      <span className="text-[10px] text-slate-400">JPG, PNG, atau scan foto struk</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Digital E-Nota / Voucher Slip Kasir Pop-up Template */}
            {activeTab === "DIGITAL_SLIP" && (
              <div className="bg-white border border-slate-300/80 rounded-2xl p-4 shadow-xs space-y-3 font-mono text-[11px] text-slate-800">
                <div className="text-center border-b pb-2 border-dashed border-slate-300">
                  <div className="font-black text-sm tracking-wider uppercase text-slate-900">PERKARA POS</div>
                  <div className="text-[10px] text-slate-500">BUKTI KAS {transactionType === "OUT" ? "KELUAR (PETTY CASH)" : "MASUK (CASH IN)"}</div>
                  <div className="text-[10px] font-bold text-slate-700 mt-0.5">NO: #{voucherNumber}</div>
                </div>

                <div className="space-y-1 py-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Waktu:</span>
                    <span>{new Date().toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Petugas/Kasir:</span>
                    <span className="font-bold">{employeeName || "Kasir Outlet"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kategori:</span>
                    <span>{category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Keterangan:</span>
                    <span className="font-semibold">{note || "(Belum ada catatan)"}</span>
                  </div>
                </div>

                <div className="border-t border-b border-dashed border-slate-300 py-2 flex justify-between items-center text-xs">
                  <span className="font-bold">TOTAL NOMINAL:</span>
                  <span className="font-black text-sm text-slate-900">Rp {amount.toLocaleString("id-ID")}</span>
                </div>

                <div className="pt-1 text-[10px] text-center text-slate-400 italic">
                  * E-Nota ini merupakan bukti sah transaksi kas internal outlet
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-3 border-t flex items-center justify-between sm:justify-between w-full">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs rounded-xl min-h-[38px] cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold rounded-xl min-h-[38px] px-5 gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan Transaksi Kas</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
