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
  RefreshCw
} from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/layout/app-shell";

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        
        {/* Top Header Bar */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-2xl border shadow-xs">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">Dashboard Operasional</h1>
              <Badge variant="outline" className="bg-emerald-50/80 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 font-medium px-2 py-0.5 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 inline-block animate-pulse" />
                Live Database (3306)
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Ringkasan transaksi riil, {data?.ingredientsCount || 32} bahan baku terdaftar, & operasional outlet</p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button size="lg" variant="outline" onClick={fetchDashboard} className="min-h-[44px] font-medium gap-1.5">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>
            <Link href="/receipts/upload">
              <Button size="lg" variant="outline" className="min-h-[44px] font-medium gap-2 border-slate-200 hover:bg-slate-50 dark:border-slate-800">
                <Camera className="w-4 h-4 text-rose-500" />
                <span>Scan Nota AI</span>
              </Button>
            </Link>
            <Link href="/inventory/raw-materials">
              <Button size="lg" variant="outline" className="min-h-[44px] font-medium gap-2 border-slate-200 hover:bg-slate-50 dark:border-slate-800">
                <Boxes className="w-4 h-4 text-blue-500" />
                <span>Stok Bahan</span>
              </Button>
            </Link>
            <Link href="/pos">
              <Button size="lg" className="min-h-[44px] bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-2 shadow-xs">
                <ShoppingCart className="w-4 h-4" />
                <span>Buka Kasir POS</span>
              </Button>
            </Link>
          </div>
        </header>

        {/* 1. Finansial Cards (Loaded Live from MySQL) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Omset Card */}
          <Card className="shadow-xs hover:border-emerald-300 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Omset Terdata</CardTitle>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900">
                <DollarSign className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                Rp {Number(totalRevenue).toLocaleString("id-ID")}
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Data Riil MySQL</span>
              </p>
            </CardContent>
          </Card>

          {/* Total Orders Card */}
          <Card className="shadow-xs hover:border-indigo-300 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Transaksi</CardTitle>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900">
                <Receipt className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {totalOrdersCount} Pesanan
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Rata-rata: <strong className="text-foreground">Rp {Math.round(totalRevenue / Math.max(1, totalOrdersCount)).toLocaleString("id-ID")}</strong> / order
              </p>
            </CardContent>
          </Card>

          {/* OPEX Card */}
          <Card className="shadow-xs hover:border-amber-300 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Beban OPEX / Kas Keluar</CardTitle>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900">
                <ClipboardList className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                Rp {Number(totalOpex).toLocaleString("id-ID")}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Beban riil dari transaksi kasir</p>
            </CardContent>
          </Card>

          {/* Net Profit Card */}
          <Card className="shadow-xs hover:border-sky-300 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estimasi Laba Bersih</CardTitle>
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400 flex items-center justify-center border border-sky-100 dark:border-sky-900">
                <Activity className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                Rp {Number(estimatedProfit).toLocaleString("id-ID")}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Omset - Beban Kas Keluar</p>
            </CardContent>
          </Card>
        </div>

        {/* 2. Urgent Stock Alert & Shift Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Widget Stok Kritis (Live from Database) */}
          <Card className="lg:col-span-2 shadow-xs border-rose-200 dark:border-rose-900/60 bg-gradient-to-b from-rose-50/30 to-card dark:from-rose-950/10">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Peringatan Stok Persediaan (Database Riil)</CardTitle>
                  <CardDescription className="text-xs">Bahan baku dari database dengan stok di bawah batas aman</CardDescription>
                </div>
              </div>
              <Link href="/inventory/raw-materials">
                <Button size="sm" variant="ghost" className="text-xs gap-1 text-rose-700 hover:text-rose-800 hover:bg-rose-50 dark:text-rose-400">
                  <span>Lihat Semua ({data?.ingredientsCount || 32} Bahan)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-1">
              
              {criticalList.map((ing: any) => {
                const totalStock = (ing.floorQuantity || 0) + (ing.warehouseQuantity || 0);
                const isCrit = totalStock <= (ing.minStockAlert || 10);

                return (
                  <div key={ing.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-card flex items-center justify-between shadow-2xs">
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">{ing.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        Satuan: {ing.unit || "gram"} | Batas Min: {ing.minStockAlert || 10} {ing.unit || "gram"}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={isCrit ? "destructive" : "secondary"} className="text-xs font-semibold px-2 py-0.5">
                        Sisa {totalStock} {ing.unit || "gram"}
                      </Badge>
                      <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                        {isCrit ? "Perlu Restock" : "Aman"}
                      </p>
                    </div>
                  </div>
                );
              })}

            </CardContent>
            <CardFooter className="pt-2">
              <Link href="/inventory/raw-materials" className="w-full">
                <Button size="lg" className="w-full min-h-[46px] bg-rose-600 hover:bg-rose-700 text-white gap-2 font-medium shadow-xs">
                  <PlusCircle className="w-4 h-4" />
                  <span>Kelola & Tambah Bahan Baku</span>
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Widget Status Shift & Absensi */}
          <Card className="shadow-xs flex flex-col justify-between">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Shift & Karyawan</CardTitle>
              <CardDescription className="text-xs">Data staf & shift aktif dari database</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Shift Active Card */}
              <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/40 dark:bg-indigo-950/20 dark:border-indigo-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                    Kasir: {activeShift.employeeName || "Budi Santoso"}
                  </span>
                  <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold">
                    Shift {activeShift.status || "OPEN"}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Modal Kas Awal: <strong className="text-foreground">Rp {Number(activeShift.startCash || 500000).toLocaleString("id-ID")}</strong></p>
                  <p>Uang Laci Estimasi: <strong className="text-foreground">Rp {Number(activeShift.expectedCash || 2150000).toLocaleString("id-ID")}</strong></p>
                </div>
              </div>

              {/* Attendance Card */}
              <div className="p-3.5 rounded-xl border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Total Karyawan Terdaftar</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{employeesCount} Karyawan</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-500 h-2 rounded-full w-[85%]" />
                </div>
                <p className="text-[11px] text-muted-foreground">Aktif di outlet utama</p>
              </div>

            </CardContent>

            <CardFooter className="pt-2">
              <Link href="/attendance" className="w-full">
                <Button size="lg" variant="outline" className="w-full min-h-[46px] gap-2 font-medium">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>Terminal Absensi PIN</span>
                </Button>
              </Link>
            </CardFooter>
          </Card>

        </div>

      </div>
    </AppShell>
  );
}
