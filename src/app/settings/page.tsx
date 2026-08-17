"use client";

import React, { useState } from "react";
import { Store, Printer, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppShell } from "@/components/layout/app-shell";

export default function SettingsPage() {
  const [outletName, setOutletName] = useState("PERKARA COFFEE");
  const [address, setAddress] = useState("Jl. Boulevard Utama No. 8, Jakarta Selatan");
  const [phone, setPhone] = useState("0812-3456-7890");
  const [receiptFooter, setReceiptFooter] = useState("Terima Kasih Atas Kunjungan Anda!");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AppShell>
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Pengaturan Outlet & Struk Nota</h1>
            <p className="text-xs text-slate-500">Konfigurasi nama toko, alamat, telepon, & footer nota cetak</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="bg-white p-4 rounded-xl border space-y-4 shadow-2xs text-xs">
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Store className="w-4 h-4 text-indigo-600" /> Profil Toko & Outlet
            </h3>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Nama Outlet / Cafe</label>
              <Input 
                value={outletName}
                onChange={(e) => setOutletName(e.target.value)}
                className="min-h-[40px] text-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">No. Telepon / WhatsApp</label>
                <Input 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="min-h-[40px] text-xs font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Alamat Lengkap</label>
                <Input 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="min-h-[40px] text-xs font-medium"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t pt-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Printer className="w-4 h-4 text-indigo-600" /> Tampilan Cetak Struk / Nota
            </h3>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Pesan Footer Struk</label>
              <Input 
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                className="min-h-[40px] text-xs font-medium"
              />
            </div>
          </div>

          <Button type="submit" size="sm" className="bg-slate-900 hover:bg-slate-800 text-white min-h-[40px] text-xs font-semibold px-6 gap-1.5">
            <Save className="w-4 h-4" />
            <span>{saved ? "Tersimpan!" : "Simpan Pengaturan"}</span>
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
