"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/lib/auth-context";
import { Search, Bell, X, CheckCircle2, Info, AlertTriangle, FileText, Package, ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AppShellProps {
  children: React.ReactNode;
}

const AppShellContext = React.createContext(false);

export function AppShell({ children }: AppShellProps) {
  const isAlreadyInShell = React.useContext(AppShellContext);
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // If already wrapped in persistent RootLayout AppShell, render children directly
  if (isAlreadyInShell) {
    return <>{children}</>;
  }

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifPopover, setShowNotifPopover] = useState(false);

  // Demo Notification Activity Logs
  const [notifications, setNotifications] = useState([
    {
      id: "n1",
      title: "Perubahan Detail Bahan Baku",
      desc: "Admin mengubah detail nama/satuan item Creamer",
      time: "10m lalu",
      type: "info",
    },
    {
      id: "n2",
      title: "Transaksi POS Berhasil",
      desc: "Transaksi POS-8821 senilai Rp 45.000 selesai dicatat",
      time: "25m lalu",
      type: "success",
    },
    {
      id: "n3",
      title: "Pengadaan Stok Baru",
      desc: "Stok Biji Kopi Arabica (2 Kg) masuk ke inventaris",
      time: "1j lalu",
      type: "info",
    },
    {
      id: "n4",
      title: "Peringatan Stok Tipis",
      desc: "Stok Susu UHT mendekati batas minimum alert",
      time: "2j lalu",
      type: "warning",
    },
  ]);

  const pageTitles: Record<string, string> = {
    "/": "Dashboard",
    "/pos": "POS Terminal",
    "/products": "Products",
    "/categories": "Categories",
    "/inventory/raw-materials": "Raw Materials",
    "/inventory/recipes": "Recipes & HPP",
    "/inventory/addons": "Add-Ons",
    "/discounts": "Discounts",
    "/purchases": "Purchases",
    "/orders": "Transactions",
    "/tables": "Tables",
    "/customers": "Customers",
    "/expenses": "Expenses",
    "/attendance": "Attendance",
    "/receipts/upload": "Scan Receipt AI",
    "/reports/cash-flow": "Cash Flow",
    "/reports/daily-recaps": "Daily Recaps",
    "/payment-methods": "Payment Methods",
    "/settings": "Settings",
  };

  const currentTitle = pageTitles[pathname] || "PERKARA POS";

  useEffect(() => {
    if (!loading && !user && pathname !== "/login" && !pathname.startsWith("/qr-menu")) {
      router.push("/login");
    }
  }, [user, loading, pathname, router]);

  if (pathname === "/login" || pathname.startsWith("/qr-menu")) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          <p className="text-xs text-slate-600 font-medium">Memuat Sesi POS...</p>
        </div>
      </div>
    );
  }

  return (
    <AppShellContext.Provider value={true}>
      <div className="min-h-screen bg-[#f3f6f9] text-foreground flex flex-col lg:flex-row">
        <Sidebar />

        <main className="flex-1 min-w-0 overflow-y-auto flex flex-col">
          {/* Top Header Bar with Title, Search & Notification icons */}
          <header className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
            <h1 className="text-base md:text-lg font-bold text-slate-900 tracking-tight">
              {currentTitle}
            </h1>

            <div className="flex items-center gap-2 relative">
              {/* Search Button */}
              <button
                type="button"
                onClick={() => setShowSearchModal(true)}
                className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                title="Cari Item / Produk"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Notification Bell Button */}
              <button
                type="button"
                onClick={() => setShowNotifPopover(!showNotifPopover)}
                className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer relative"
                title="Notifikasi & Log Perubahan"
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {showNotifPopover && (
                <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl border shadow-xl z-50 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Log Perubahan & Notifikasi</h3>
                    <button 
                      onClick={() => setShowNotifPopover(false)} 
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {notifications.map((n) => (
                      <div key={n.id} className="p-2.5 rounded-xl border bg-slate-50/70 hover:bg-slate-100/60 transition-colors space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5">
                            {n.type === "info" && <Info className="w-3.5 h-3.5 text-blue-500" />}
                            {n.type === "success" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                            {n.type === "warning" && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                            {n.title}
                          </span>
                          <span className="text-[10px] text-slate-400">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium pl-5">{n.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </header>

          {/* Global Search Modal Overlay */}
          {showSearchModal && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-start justify-center pt-20 p-4">
              <div className="bg-white w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden space-y-3 p-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2 flex-1">
                    <Search className="w-4 h-4 text-slate-400 shrink-0" />
                    <Input
                      autoFocus
                      placeholder="Ketik pencarian item, produk, bahan baku, atau transaksi..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="border-none shadow-none focus-visible:ring-0 text-xs min-h-[38px]"
                    />
                  </div>
                  <button onClick={() => setShowSearchModal(false)} className="text-slate-400 hover:text-slate-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1 text-xs max-h-60 overflow-y-auto">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-2">Pintasan Halaman</span>
                  <button 
                    onClick={() => { router.push("/products"); setShowSearchModal(false); }}
                    className="w-full p-2 rounded-lg text-left hover:bg-slate-100 flex items-center gap-2 text-slate-800 font-medium"
                  >
                    <Package className="w-4 h-4 text-indigo-600" /> Master Produk
                  </button>
                  <button 
                    onClick={() => { router.push("/inventory/raw-materials"); setShowSearchModal(false); }}
                    className="w-full p-2 rounded-lg text-left hover:bg-slate-100 flex items-center gap-2 text-slate-800 font-medium"
                  >
                    <Package className="w-4 h-4 text-blue-600" /> Stok Bahan Baku
                  </button>
                  <button 
                    onClick={() => { router.push("/orders"); setShowSearchModal(false); }}
                    className="w-full p-2 rounded-lg text-left hover:bg-slate-100 flex items-center gap-2 text-slate-800 font-medium"
                  >
                    <FileText className="w-4 h-4 text-emerald-600" /> Riwayat Transaksi
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Page Content */}
          <div className="flex-1">
            {children}
          </div>
        </main>
      </div>
    </AppShellContext.Provider>
  );
}

