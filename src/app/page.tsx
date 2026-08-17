"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  TrendingUp, 
  Receipt, 
  Users, 
  Clock, 
  Camera, 
  ShoppingCart, 
  AlertTriangle, 
  PlusCircle, 
  ArrowUpRight, 
  DollarSign,
  Boxes,
  ClipboardList,
  Activity,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Tag,
  Package
} from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth-context";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // If user role is Karyawan, redirect to POS Terminal as primary view
  useEffect(() => {
    if (user && !isAdmin) {
      router.replace("/pos");
    }
  }, [user, isAdmin, router]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/data");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Error fetching live dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const totalRevenue = data?.totalRevenue ?? 4850000;
  const totalOrdersCount = data?.totalOrdersCount ?? 142;
  const totalOpex = data?.totalOpex ?? 1450000;
  const estimatedProfit = data?.estimatedProfit ?? 3400000;
  const criticalList = data?.criticalIngredients?.length > 0 
    ? data.criticalIngredients.slice(0, 4) 
    : (data?.allIngredients?.slice(0, 3) || []);
  const activeShift = data?.activeShift || {
    employeeName: "Budi Santoso",
    status: "OPEN",
    startCash: 500000,
    expectedCash: 2150000,
  };
  const employeesCount = data?.employees?.length ?? 7;

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto text-slate-900">
        
        {/* 1. Top Greeting Card */}
        <div className="bg-white p-5 rounded-2xl border shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              Selamat datang, {user?.name || "refo"}
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Berikut adalah ringkasan performa hari ini untuk <strong className="text-slate-800 font-semibold">{user?.name || "refo"}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                LABA BERSIH HARI INI
              </span>
              <span className="text-lg font-bold text-emerald-600">
                Rp {Number(estimatedProfit || 0).toLocaleString("id-ID")}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/receipts/upload">
                <Button size="lg" variant="outline" className="min-h-[44px] bg-white border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold px-4 rounded-xl gap-2 shadow-2xs cursor-pointer">
                  <Camera className="w-4 h-4 text-rose-500" />
                  <span>Scan Nota</span>
                </Button>
              </Link>

              <Link href="/pos">
                <Button size="lg" className="min-h-[44px] bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold px-4 rounded-xl gap-2 shadow-xs cursor-pointer">
                  <ShoppingCart className="w-4 h-4" />
                  <span>Buka Terminal POS &rarr;</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 2. Top 4 Stat Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          
          {/* Card 1: PENDAPATAN HARI INI */}
          <div className="bg-white p-4 rounded-2xl border shadow-2xs space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/80 shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  PENDAPATAN HARI INI
                </span>
                <span className="text-lg font-extrabold text-slate-900">
                  Rp {Number(totalRevenue || 0).toLocaleString("id-ID")}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 font-medium pt-1 border-t border-slate-100">
              Total penjualan masuk
            </p>
          </div>

          {/* Card 2: LABA KOTOR (GROSS) */}
          <div className="bg-white p-4 rounded-2xl border shadow-2xs space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/80 shrink-0">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  LABA KOTOR (GROSS)
                </span>
                <span className="text-lg font-extrabold text-slate-900">
                  Rp {Number(estimatedProfit || 0).toLocaleString("id-ID")}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 font-medium pt-1 border-t border-slate-100">
              Setelah potong HPP (COGS)
            </p>
          </div>

          {/* Card 3: TOTAL BELANJA (STOK) */}
          <div className="bg-white p-4 rounded-2xl border shadow-2xs space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100/80 shrink-0">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  TOTAL BELANJA (STOK)
                </span>
                <span className="text-lg font-extrabold text-slate-900">
                  Rp 0
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 font-medium pt-1 border-t border-slate-100">
              Pembelian barang/bahan
            </p>
          </div>

          {/* Card 4: BIAYA OPERASIONAL */}
          <div className="bg-white p-4 rounded-2xl border shadow-2xs space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100/80 shrink-0">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  BIAYA OPERASIONAL
                </span>
                <span className="text-lg font-extrabold text-slate-900">
                  Rp {Number(totalOpex || 0).toLocaleString("id-ID")}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 font-medium pt-1 border-t border-slate-100">
              Opex di luar belanja
            </p>
          </div>

        </div>

        {/* 3. Middle Section: Graphs & Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Left Chart Card: Arus Kas & Laba Rugi */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border shadow-2xs space-y-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Arus Kas & Laba Rugi</h3>
              <p className="text-[11px] text-slate-400 font-medium">7 hari terakhir</p>
            </div>

            {/* Minimalist SVG Graph */}
            <div className="h-44 w-full relative flex flex-col justify-between pt-2">
              <div className="border-b border-dashed border-slate-100 text-[10px] text-slate-400 pb-1">Rp 0.004k</div>
              <div className="border-b border-dashed border-slate-100 text-[10px] text-slate-400 pb-1">Rp 0.003k</div>
              <div className="border-b border-dashed border-slate-100 text-[10px] text-slate-400 pb-1">Rp 0.002k</div>
              <div className="border-b border-dashed border-slate-100 text-[10px] text-slate-400 pb-1">Rp 0.001k</div>
              <div className="border-b border-slate-200 text-[10px] text-slate-400 pb-1">Rp 0k</div>

              {/* Baseline Trend Line */}
              <div className="absolute inset-x-8 bottom-6 h-0.5 bg-amber-600/70 flex items-center justify-between">
                {["11 Aug", "12 Aug", "13 Aug", "14 Aug", "15 Aug", "16 Aug", "17 Aug"].map((d, i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-amber-600 border border-white" />
                ))}
              </div>

              {/* X Axis Date Labels */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 px-4">
                <span>11 Aug</span>
                <span>12 Aug</span>
                <span>13 Aug</span>
                <span>14 Aug</span>
                <span>15 Aug</span>
                <span>16 Aug</span>
                <span>17 Aug</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 text-[11px] font-medium text-slate-500 pt-2 border-t">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Belanja Stok</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Opex</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Pendapatan</span>
            </div>
          </div>

          {/* Right Chart Card: Volume Pesanan */}
          <div className="bg-white p-5 rounded-2xl border shadow-2xs space-y-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Volume Pesanan</h3>
              <p className="text-[11px] text-slate-400 font-medium">7 hari terakhir</p>
            </div>

            {/* Minimalist Bar Graph */}
            <div className="h-44 w-full flex flex-col justify-between pt-2">
              <div className="border-b border-dashed border-slate-100 text-[10px] text-slate-400">4</div>
              <div className="border-b border-dashed border-slate-100 text-[10px] text-slate-400">3</div>
              <div className="border-b border-dashed border-slate-100 text-[10px] text-slate-400">2</div>
              <div className="border-b border-dashed border-slate-100 text-[10px] text-slate-400">1</div>
              <div className="border-b border-slate-200 text-[10px] text-slate-400">0</div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 px-2">
                <span>11 Aug</span>
                <span>13 Aug</span>
                <span>15 Aug</span>
                <span>17 Aug</span>
              </div>
            </div>
          </div>

        </div>

        {/* 4. Bottom Section: Transaksi Terakhir & Peringatan Stok Tipis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Left Card: Transaksi Terakhir */}
          <div className="bg-white p-5 rounded-2xl border shadow-2xs space-y-4 min-h-[220px] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Transaksi Terakhir</h3>
              <Link href="/orders" className="text-xs text-slate-500 hover:text-slate-900 font-medium">
                Lihat Semua
              </Link>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <p className="text-xs text-slate-400 font-medium">Belum ada transaksi tercatat.</p>
            </div>
          </div>

          {/* Right Card: Peringatan Stok Tipis */}
          <div className="bg-white p-5 rounded-2xl border shadow-2xs space-y-4 min-h-[220px] flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <h3 className="font-bold text-sm text-slate-900">Peringatan Stok Tipis</h3>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <Package className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Stok Aman</h4>
              <p className="text-xs text-slate-400 font-medium">Semua produk dan bahan baku berada di atas batas minimum.</p>
            </div>
          </div>

        </div>

      </div>
    </AppShell>
  );
}
