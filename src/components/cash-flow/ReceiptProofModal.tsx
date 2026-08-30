"use client";

import React from "react";
import { Receipt, Printer, X, Image as ImageIcon, CheckCircle2, User, Clock, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

interface ReceiptProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: {
    id?: string;
    waktu?: string;
    timestamp?: string;
    petugas?: string;
    employeeName?: string;
    tipe?: string;
    type?: string;
    jumlah?: number;
    amount?: number;
    catatan?: string;
    note?: string;
    kategori?: string;
    receiptImage?: string | null;
    voucherNumber?: string;
    isFromScan?: boolean;
  } | null;
}

export function ReceiptProofModal({
  isOpen,
  onClose,
  transaction,
}: ReceiptProofModalProps) {
  if (!transaction) return null;

  const isOut = transaction.tipe === "OUT" || transaction.type === "CASH_OUT" || transaction.type === "OUT";
  const nominal = Number(transaction.jumlah || transaction.amount || 0);
  const timeStr = transaction.waktu || (transaction.timestamp ? new Date(transaction.timestamp).toLocaleString("id-ID") : "-");
  const kasir = transaction.petugas || transaction.employeeName || "Staf Outlet";
  const noteStr = transaction.catatan || transaction.note || "Transaksi Kas";
  const voucherNo = transaction.voucherNumber || `VKAS-${transaction.id ? transaction.id.slice(-6) : "REC"}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-white border border-slate-200 shadow-2xl">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              Bukti Nota Kas #{voucherNo}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isOut ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
            }`}>
              {isOut ? "KAS KELUAR" : "KAS MASUK"}
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Dokumentasi sah pengeluaran / pemasukan kas kecil outlet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Photo Preview if available */}
          {transaction.receiptImage ? (
            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 p-2 flex flex-col items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={transaction.receiptImage}
                alt="Foto Struk Nota"
                className="max-h-64 object-contain rounded-xl"
              />
              <span className="text-[10px] text-slate-400 font-semibold mt-1">
                Foto Nota Asli Terlampir
              </span>
            </div>
          ) : (
            /* Digital Struk Nota Duplicate Template */
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 font-mono text-[11px] space-y-2 text-slate-800">
              <div className="text-center border-b border-dashed border-slate-300 pb-2">
                <div className="font-black text-sm uppercase text-slate-900">PERKARA POS</div>
                <div className="text-[10px] text-slate-500 font-bold">SLIP BUKTI KAS INTERNAL</div>
                <div className="text-[10px] text-slate-600 mt-0.5">NO: #{voucherNo}</div>
              </div>

              <div className="space-y-1.5 py-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Waktu:</span>
                  <span>{timeStr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Petugas Kasir:</span>
                  <span className="font-bold">{kasir}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Keterangan:</span>
                  <span className="font-semibold text-right max-w-[200px]">{noteStr}</span>
                </div>
              </div>

              <div className="border-t border-b border-dashed border-slate-300 py-2 flex justify-between items-center text-xs">
                <span className="font-bold">TOTAL NOMINAL:</span>
                <span className="font-black text-sm text-slate-900">
                  Rp {nominal.toLocaleString("id-ID")}
                </span>
              </div>

              <div className="text-[10px] text-center text-slate-400 pt-1">
                Dicatat & diverifikasi sistem PERKARA POS
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-2 flex items-center justify-between sm:justify-between w-full border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs rounded-xl min-h-[38px] cursor-pointer"
          >
            Tutup
          </Button>
          <Button
            type="button"
            onClick={() => window.print()}
            className="bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold rounded-xl min-h-[38px] gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Slip Nota</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
