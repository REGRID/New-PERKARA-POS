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
  Settings as SettingsIcon 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppShell } from "@/components/layout/app-shell";

interface NavConfigGroup {
  groupName: string;
  items: {
    name: string;
    href: string;
    icon: any;
  }[];
}

export default function SettingsPage() {
  const [outletName, setOutletName] = useState("PERKARA COFFEE");
  const [address, setAddress] = useState("Jl. Boulevard Utama No. 8, Jakarta Selatan");
  const [phone, setPhone] = useState("0812-3456-7890");
  const [receiptFooter, setReceiptFooter] = useState("Terima Kasih Atas Kunjungan Anda!");
  const [saved, setSaved] = useState(false);

  // State for collapsible Visibilitas Menu box
  const [showVisConfig, setShowVisConfig] = useState(true);

  // Navigation Groups matching Sidebar 1-to-1
  const navGroups: NavConfigGroup[] = [
    {
      groupName: "OPERATIONS",
      items: [
        { name: "POS Terminal", href: "/pos", icon: ShoppingCart },
        { name: "Transactions", href: "/orders", icon: FileText },
        { name: "Tables", href: "/tables", icon: Grid },
        { name: "Customers", href: "/customers", icon: Users },
        { name: "QR Menu", href: "/qr-menu/outlet-1", icon: CircleDot },
        { name: "Attendance", href: "/attendance", icon: Clock },
      ]
    },
    {
      groupName: "CATALOG",
      items: [
        { name: "Categories", href: "/categories", icon: Tag },
        { name: "Products", href: "/products", icon: Package },
        { name: "Add-Ons", href: "/inventory/addons", icon: Layers },
        { name: "Discounts", href: "/discounts", icon: Percent },
      ]
    },
    {
      groupName: "INVENTORY",
      items: [
        { name: "Raw Materials", href: "/inventory/raw-materials", icon: Boxes },
        { name: "Purchases", href: "/purchases", icon: ShoppingCart },
        { name: "Recipes & HPP", href: "/inventory/recipes", icon: ClipboardList },
        { name: "Scan Receipt AI", href: "/receipts/upload", icon: Camera },
      ]
    },
    {
      groupName: "REPORTS",
      items: [
        { name: "Cash Flow", href: "/reports/cash-flow", icon: TrendingUp },
        { name: "Daily Recaps", href: "/reports/daily-recaps", icon: ClipboardList },
      ]
    },
    {
      groupName: "SYSTEM",
      items: [
        { name: "Employees (Staf & HR)", href: "/employees", icon: Users },
        { name: "Payment Methods", href: "/payment-methods", icon: CreditCard },
        { name: "Settings", href: "/settings", icon: SettingsIcon },
      ]
    }
  ];

  // Hidden Nav Items state (hrefs array)
  const [hiddenHrefs, setHiddenHrefs] = useState<string[]>([]);

  useEffect(() => {
    try {
      const savedHidden = localStorage.getItem("perkara_pos_hidden_navs");
      if (savedHidden) {
        setHiddenHrefs(JSON.parse(savedHidden));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto text-slate-900 space-y-6">
        
        {/* Prominent Outer Card Container */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-2xs space-y-6">
          
          {/* Header */}
          <div className="border-b pb-4">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">System & Navigation Settings</h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Kelola profil outlet, tampilan struk, dan aktif/nonaktifkan menu navigasi sidebar sesuai kebutuhan.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            
            {/* 1. Profile Outlet Settings */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Store className="w-4 h-4 text-indigo-600" />
                <span>Profil Toko & Outlet</span>
              </h3>

              <div>
                <label className="font-semibold text-xs text-slate-700 block mb-1">Nama Outlet / Cafe</label>
                <Input 
                  value={outletName}
                  onChange={(e) => setOutletName(e.target.value)}
                  className="min-h-[40px] text-xs font-medium bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-xs text-slate-700 block mb-1">No. Telepon / WhatsApp</label>
                  <Input 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="min-h-[40px] text-xs font-medium bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-xs text-slate-700 block mb-1">Alamat Lengkap</label>
                  <Input 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="min-h-[40px] text-xs font-medium bg-white"
                  />
                </div>
              </div>
            </div>

            {/* 2. Receipt Settings */}
            <div className="space-y-3 border-t pt-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Printer className="w-4 h-4 text-indigo-600" />
                <span>Tampilan Cetak Struk / Nota</span>
              </h3>

              <div>
                <label className="font-semibold text-xs text-slate-700 block mb-1">Pesan Footer Struk</label>
                <Input 
                  value={receiptFooter}
                  onChange={(e) => setReceiptFooter(e.target.value)}
                  className="min-h-[40px] text-xs font-medium bg-white"
                />
              </div>
            </div>

            {/* 3. Sidebar Navigation Checklist Options (Placed at bottom, Collapsible Dropdown) */}
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
                    Centang untuk menampilkan menu di sidebar, atau hapus centang (misal: <strong className="text-slate-700">QR Menu</strong>) untuk menyembunyikannya.
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

            <Button type="submit" className="bg-stone-800 hover:bg-stone-900 text-white min-h-[44px] text-xs font-semibold px-6 rounded-xl gap-2 shadow-xs cursor-pointer">
              <Save className="w-4 h-4" />
              <span>{saved ? "Pengaturan Tersimpan!" : "Simpan Seluruh Pengaturan"}</span>
            </Button>
          </form>

        </div>

      </div>
    </AppShell>
  );
}
