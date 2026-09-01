"use client";

import React, { useState, useEffect } from "react";
import { 
  Store, 
  Printer, 
  Eye, 
  Save, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  ShoppingCart, 
  FileText, 
  Grid, 
  Users, 
  CircleDot, 
  Clock, 
  Tag, 
  Package, 
  Layers, 
  Percent, 
  Boxes, 
  ClipboardList, 
  Camera, 
  TrendingUp, 
  CreditCard, 
  Settings as SettingsIcon,
  Sparkles,
  DollarSign,
  Receipt,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth-context";

interface NavConfigGroup {
  groupName: string;
  items: {
    name: string;
    href: string;
    icon: any;
  }[];
}

export default function SettingsPage() {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";

  const [accounts, setAccounts] = useState<any[]>([]);
  const [newAccount, setNewAccount] = useState({ name: "", username: "", password: "", pin: "", role: "cashier" });
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [accountError, setAccountError] = useState("");
  const [accountSuccess, setAccountSuccess] = useState("");

  const [outletName, setOutletName] = useState("PERKARA COFFEE");
  const [address, setAddress] = useState("Jl. Boulevard Utama No. 8, Jakarta Selatan");
  const [phone, setPhone] = useState("0812-3456-7890");
  const [receiptFooter, setReceiptFooter] = useState("Terima Kasih Atas Kunjungan Anda!");
  const [taxPercentage, setTaxPercentage] = useState<number>(0);
  const [serviceCharge, setServiceCharge] = useState<number>(0);
  
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // State for collapsible Visibilitas Menu box
  const [showVisConfig, setShowVisConfig] = useState(true);

  // Navigation Groups matching Sidebar 1-to-1
  const navGroups: NavConfigGroup[] = [
    {
      groupName: "OPERASIONAL",
      items: [
        { name: "Kasir POS", href: "/pos", icon: ShoppingCart },
        { name: "Transaksi", href: "/orders", icon: FileText },
        { name: "Meja", href: "/tables", icon: Grid },
        { name: "Pelanggan", href: "/customers", icon: Users },
        { name: "Menu QR", href: "/qr-menu/outlet-1", icon: CircleDot },
        { name: "Absensi & Shift", href: "/attendance", icon: Clock },
      ]
    },
    {
      groupName: "KATALOG",
      items: [
        { name: "Kategori", href: "/categories", icon: Tag },
        { name: "Produk", href: "/products", icon: Package },
        { name: "Menu Tambahan", href: "/inventory/addons", icon: Layers },
        { name: "Diskon", href: "/discounts", icon: Percent },
      ]
    },
    {
      groupName: "INVENTARIS & STOK",
      items: [
        { name: "Bahan Baku", href: "/inventory/raw-materials", icon: Boxes },
        { name: "Pembelian Bahan", href: "/purchases", icon: ShoppingCart },
        { name: "Resep & HPP", href: "/inventory/recipes", icon: ClipboardList },
        { name: "Pindai Nota AI", href: "/receipts/upload", icon: Camera },
      ]
    },
    {
      groupName: "LAPORAN",
      items: [
        { name: "Arus Kas", href: "/reports/cash-flow", icon: TrendingUp },
        { name: "Rekap Harian", href: "/reports/daily-recaps", icon: ClipboardList },
      ]
    },
    {
      groupName: "PENGATURAN SISTEM",
      items: [
        { name: "Karyawan", href: "/employees", icon: Users },
        { name: "Metode Pembayaran", href: "/payment-methods", icon: CreditCard },
        { name: "Biaya Operasional", href: "/expenses", icon: DollarSign },
        { name: "Pengaturan", href: "/settings", icon: SettingsIcon },
      ]
    }
  ];

  // Hidden Nav Items state (hrefs array)
  const [hiddenHrefs, setHiddenHrefs] = useState<string[]>([]);

  // 1. Load Settings from LocalStorage & DB API on Mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);

        // A. Load from LocalStorage first for instant render
        const localSettings = localStorage.getItem("perkara_pos_settings");
        if (localSettings) {
          try {
            const parsed = JSON.parse(localSettings);
            if (parsed.outletName) setOutletName(parsed.outletName);
            if (parsed.address) setAddress(parsed.address);
            if (parsed.phone) setPhone(parsed.phone);
            if (parsed.receiptFooter) setReceiptFooter(parsed.receiptFooter);
            if (parsed.taxPercentage !== undefined) setTaxPercentage(Number(parsed.taxPercentage));
            if (parsed.serviceCharge !== undefined) setServiceCharge(Number(parsed.serviceCharge));
          } catch (e) {}
        }

        const savedHidden = localStorage.getItem("perkara_pos_hidden_navs");
        if (savedHidden) {
          try {
            setHiddenHrefs(JSON.parse(savedHidden));
          } catch (e) {}
        }

        // B. Fetch from Database System Settings API
        const res = await fetch("/api/data?type=settings");
        if (res.ok) {
          const dbSettings = await res.json();
          if (Array.isArray(dbSettings) && dbSettings.length > 0) {
            const settingsMap: Record<string, string> = {};
            dbSettings.forEach((item: any) => {
              if (item.key && item.value !== undefined) {
                settingsMap[item.key] = item.value;
              }
            });

            if (settingsMap.outletName) setOutletName(settingsMap.outletName);
            if (settingsMap.address) setAddress(settingsMap.address);
            if (settingsMap.phone) setPhone(settingsMap.phone);
            if (settingsMap.receiptFooter) setReceiptFooter(settingsMap.receiptFooter);
            if (settingsMap.taxPercentage !== undefined) setTaxPercentage(Number(settingsMap.taxPercentage));
            if (settingsMap.serviceCharge !== undefined) setServiceCharge(Number(settingsMap.serviceCharge));
            if (settingsMap.hiddenNavs) {
              try {
                const parsedNavs = JSON.parse(settingsMap.hiddenNavs);
                if (Array.isArray(parsedNavs)) setHiddenHrefs(parsedNavs);
              } catch (e) {}
            }
          }
        }
      } catch (e) {
        console.error("Error loading settings:", e);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const loadAccounts = async () => {
    try {
      const res = await fetch("/api/data?type=accounts");
      if (res.ok) {
        setAccounts(await res.json());
      }
    } catch (e) {
      console.error("Error loading accounts:", e);
    }
  };

  useEffect(() => {
    if (isOwner) loadAccounts();
  }, [isOwner]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountError("");
    setAccountSuccess("");
    setCreatingAccount(true);
    try {
      const res = await fetch("/api/data?type=create_account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAccount),
      });
      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error || "Gagal membuat akun");
      setAccountSuccess(`Akun "${newAccount.name}" berhasil dibuat!`);
      setNewAccount({ name: "", username: "", password: "", pin: "", role: "cashier" });
      await loadAccounts();
    } catch (err: any) {
      setAccountError(err.message || "Gagal membuat akun");
    } finally {
      setCreatingAccount(false);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await fetch("/api/data?type=set_account_active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive }),
      });
      await loadAccounts();
    } catch (e) {
      console.error("Error toggling account status:", e);
    }
  };

  const toggleNavVisibility = (href: string) => {
    let updated: string[];
    if (hiddenHrefs.includes(href)) {
      // Unhide
      updated = hiddenHrefs.filter((h) => h !== href);
    } else {
      // Hide
      updated = [...hiddenHrefs, href];
    }
    setHiddenHrefs(updated);
    localStorage.setItem("perkara_pos_hidden_navs", JSON.stringify(updated));
    window.dispatchEvent(new Event("nav_visibility_changed"));
  };

  // 2. Persist Settings (LocalStorage + Database SystemSetting Upsert)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);

      const settingsPayload = {
        outletName,
        address,
        phone,
        receiptFooter,
        taxPercentage,
        serviceCharge,
        hiddenNavs: JSON.stringify(hiddenHrefs),
      };

      // 1. Save to LocalStorage immediately
      localStorage.setItem("perkara_pos_settings", JSON.stringify(settingsPayload));
      localStorage.setItem("perkara_pos_hidden_navs", JSON.stringify(hiddenHrefs));

      // 2. Sync to Database SystemSetting table
      const keysToSave = Object.entries(settingsPayload);
      await Promise.all(
        keysToSave.map(([key, val]) =>
          fetch("/api/data?type=save_setting", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key, value: String(val) }),
          })
        )
      );

      // 3. Dispatch global events so Header/Sidebar/POS update reactively
      window.dispatchEvent(new Event("settings_updated"));
      window.dispatchEvent(new Event("nav_visibility_changed"));

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto text-slate-900 space-y-6">
        
        {/* Prominent Outer Card Container */}
        <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xs space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Pengaturan Sistem</h2>
                <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold">
                  Admin
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Profil outlet, tampilan cetak struk kasir, pajak, dan visibilitas menu navigasi.
              </p>
            </div>

            {saved && (
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-xl animate-in fade-in slide-in-from-top-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Pengaturan berhasil disimpan!</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            
            {/* 1. Profile Outlet Settings */}
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Store className="w-4 h-4 text-indigo-600" />
                <span>Profil Toko & Outlet</span>
              </h3>

              <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-200/70">
                <div>
                  <label className="font-semibold text-xs text-slate-700 block mb-1">Nama Outlet / Cafe *</label>
                  <Input 
                    value={outletName}
                    onChange={(e) => setOutletName(e.target.value)}
                    className="min-h-[40px] text-xs font-bold text-slate-900 bg-white rounded-xl"
                    placeholder="Contoh: PERKARA COFFEE"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-xs text-slate-700 block mb-1">No. Telepon / WhatsApp</label>
                    <Input 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="min-h-[40px] text-xs font-medium bg-white rounded-xl"
                      placeholder="Contoh: 0812-3456-7890"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-xs text-slate-700 block mb-1">Alamat Lengkap Outlet</label>
                    <Input 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="min-h-[40px] text-xs font-medium bg-white rounded-xl"
                      placeholder="Contoh: Jl. Boulevard Utama No. 8"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Receipt & POS Settings */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Printer className="w-4 h-4 text-indigo-600" />
                <span>Tampilan Cetak Struk & Pajak</span>
              </h3>

              <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-200/70">
                <div>
                  <label className="font-semibold text-xs text-slate-700 block mb-1">Pesan Footer Struk / Nota</label>
                  <Input 
                    value={receiptFooter}
                    onChange={(e) => setReceiptFooter(e.target.value)}
                    className="min-h-[40px] text-xs font-medium bg-white rounded-xl"
                    placeholder="cth: Terima Kasih Atas Kunjungan Anda!"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-xs text-slate-700 block mb-1">Pajak PB1 / PPN (%)</label>
                    <Input 
                      type="number"
                      value={taxPercentage || 0}
                      onChange={(e) => setTaxPercentage(Number(e.target.value))}
                      className="min-h-[40px] text-xs font-medium bg-white rounded-xl"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-xs text-slate-700 block mb-1">Service Charge (%)</label>
                    <Input 
                      type="number"
                      value={serviceCharge || 0}
                      onChange={(e) => setServiceCharge(Number(e.target.value))}
                      className="min-h-[40px] text-xs font-medium bg-white rounded-xl"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Sidebar Navigation Checklist Options */}
            <div className="space-y-3 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 transition-all">
              <div 
                onClick={() => setShowVisConfig(!showVisConfig)}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <div>
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-indigo-600" />
                    <span>Visibilitas Menu Navigasi Sidebar (Checklist Option)</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Centang untuk menampilkan menu di sidebar, atau klik untuk menyembunyikannya (perubahan otomatis tersimpan).
                  </p>
                </div>

                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                  {showVisConfig ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {/* Collapsible Content */}
              {showVisConfig && (
                <div className="space-y-4 pt-3 border-t border-slate-200/60">
                  {navGroups.map((group) => (
                    <div key={group.groupName} className="space-y-2 bg-white p-4 rounded-xl border border-slate-200/70 shadow-2xs">
                      <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest px-1">
                        {group.groupName}
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {group.items.map((item) => {
                          const isVisible = !hiddenHrefs.includes(item.href);
                          const Icon = item.icon;
                          const isMandatory = item.href === "/settings"; // Settings can't be hidden

                          return (
                            <div
                              key={item.href}
                              onClick={() => !isMandatory && toggleNavVisibility(item.href)}
                              className={`
                                flex items-center justify-between p-2.5 rounded-lg border text-xs font-semibold transition-all select-none
                                ${isMandatory 
                                  ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed" 
                                  : isVisible
                                    ? "bg-white border-indigo-200/90 text-slate-900 shadow-2xs hover:border-indigo-300 cursor-pointer"
                                    : "bg-slate-100/70 border-slate-200 text-slate-400 opacity-60 hover:opacity-80 cursor-pointer"
                                }
                              `}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                                  isVisible ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300 bg-white"
                                }`}>
                                  {isVisible && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <Icon className={`w-3.5 h-3.5 ${isVisible ? "text-indigo-600" : "text-slate-400"}`} />
                                <span className="truncate">{item.name}</span>
                              </div>

                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 ml-1">
                                {isVisible ? "TAMPIL" : "SEMBUNYI"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Kelola Akun (Khusus Role Owner) */}
            {isOwner && (
              <div className="space-y-4 pt-6 border-t border-slate-200/80">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-600" />
                      <span>Kelola Akun &amp; Kredensial (Khusus Owner)</span>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Buat akun baru untuk Admin, Supervisor, atau Kasir. Setiap akun memiliki kredensial independen dan tercatat di audit log.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={loadAccounts}
                    className="text-xs gap-1 rounded-xl cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Segarkan Akun</span>
                  </Button>
                </div>

                {/* Form Buat Akun */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800">Tambah Akun Pengguna Baru</h4>

                  {accountError && (
                    <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-2.5">
                      {accountError}
                    </div>
                  )}
                  {accountSuccess && (
                    <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
                      {accountSuccess}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">Nama Lengkap</label>
                      <Input
                        placeholder="Contoh: Siti Rahma"
                        value={newAccount.name}
                        onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                        className="text-xs bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">Username Login</label>
                      <Input
                        placeholder="Contoh: sitikasir"
                        value={newAccount.username}
                        onChange={(e) => setNewAccount({ ...newAccount, username: e.target.value })}
                        className="text-xs bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">Password (Min. 6 Karakter)</label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={newAccount.password}
                        onChange={(e) => setNewAccount({ ...newAccount, password: e.target.value })}
                        className="text-xs bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">PIN Cepat POS (Opsional, 4-6 digit)</label>
                      <Input
                        placeholder="Contoh: 123456"
                        value={newAccount.pin}
                        onChange={(e) => setNewAccount({ ...newAccount, pin: e.target.value })}
                        className="text-xs bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">Role Akun</label>
                      <select
                        value={newAccount.role}
                        onChange={(e) => setNewAccount({ ...newAccount, role: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 shadow-2xs h-9"
                      >
                        <option value="cashier">Kasir (Akses POS &amp; Meja)</option>
                        <option value="supervisor">Supervisor (Void &amp; Laporan)</option>
                        <option value="admin">Admin (ERP Penuh)</option>
                        <option value="owner">Owner (Hak Akses Penuh)</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <Button
                        type="button"
                        onClick={handleCreateAccount}
                        disabled={creatingAccount}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9 rounded-xl cursor-pointer"
                      >
                        {creatingAccount ? "Membuat Akun..." : "Tambah Akun"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Daftar Akun Terdaftar */}
                <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Daftar Akun Pengguna ({accounts.length})</span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {accounts.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">Belum ada akun di database.</div>
                    ) : (
                      accounts.map((acc) => (
                        <div key={acc.id} className="flex items-center justify-between p-3.5 text-xs hover:bg-slate-50/50 transition-colors">
                          <div>
                            <div className="flex items-center gap-2">
                              <strong className="text-slate-900 font-bold">{acc.name}</strong>
                              <span className="text-slate-400 font-normal">@{acc.username || acc.id}</span>
                              <Badge className={`text-[10px] font-bold ${
                                acc.role === "owner" ? "bg-amber-100 text-amber-800" :
                                acc.role === "admin" ? "bg-indigo-100 text-indigo-800" :
                                acc.role === "supervisor" ? "bg-purple-100 text-purple-800" :
                                "bg-emerald-100 text-emerald-800"
                              }`}>
                                {acc.role.toUpperCase()}
                              </Badge>
                              {acc.hasPin && (
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">PIN Aktif</span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 mt-0.5 block">
                              Dibuat: {acc.createdAt ? new Date(acc.createdAt).toLocaleDateString("id-ID") : "Awal"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold ${acc.isActive ? "text-emerald-600" : "text-rose-600"}`}>
                              {acc.isActive ? "● Aktif" : "● Nonaktif"}
                            </span>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleActive(acc.id, !acc.isActive)}
                              className={`text-[11px] h-7 px-2.5 rounded-lg cursor-pointer ${
                                acc.isActive ? "hover:bg-rose-50 text-rose-600 border-rose-200" : "hover:bg-emerald-50 text-emerald-700 border-emerald-200"
                              }`}
                            >
                              {acc.isActive ? "Nonaktifkan" : "Aktifkan"}
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Button 
                type="submit" 
                disabled={saving}
                className="bg-stone-800 hover:bg-stone-900 text-white min-h-[44px] text-xs font-semibold px-6 rounded-xl gap-2 shadow-xs cursor-pointer"
              >
                <Save className={`w-4 h-4 ${saving ? "animate-spin" : ""}`} />
                <span>{saving ? "Menyimpan Pengaturan..." : saved ? "Pengaturan Tersimpan!" : "Simpan Seluruh Pengaturan"}</span>
              </Button>
            </div>
          </form>

        </div>

      </div>
    </AppShell>
  );
}
