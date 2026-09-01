"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Receipt, 
  RefreshCw, 
  Printer, 
  Search, 
  Trash2, 
  Eye, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  RotateCcw,
  ShieldAlert,
  FileSpreadsheet,
  AlertCircle
} from "lucide-react";
import { type DateRange } from "react-day-picker";
import { startOfDay, endOfDay, isWithinInterval, isSameDay } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth-context";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { bluetoothPrinter } from "@/lib/bluetooth-printer";

export default function OrdersPage() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<"ORDERS" | "AUDIT_LOGS">("ORDERS");
  const [orders, setOrders] = useState<any[]>([]);
  const [cancellationLogs, setCancellationLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Void Modal State
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [voidReason, setVoidReason] = useState("Salah input / ganti menu");
  const [voidPin, setVoidPin] = useState("");
  const [voidError, setVoidError] = useState("");
  const [isVoiding, setIsVoiding] = useState(false);

  // Refund Modal State
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState("Pelanggan komplain / retur menu");
  const [refundMethod, setRefundMethod] = useState<"CASH" | "NON_CASH">("CASH");
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundPin, setRefundPin] = useState("");
  const [refundRestoreStock, setRefundRestoreStock] = useState(true);
  const [refundError, setRefundError] = useState("");
  const [isRefunding, setIsRefunding] = useState(false);

  // Filter Mode (Default: TODAY)
  const [filterMode, setFilterMode] = useState<"TODAY" | "ALL" | "CUSTOM">("TODAY");

  // Date Range filter state (Default: Today)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => ({
    from: startOfDay(new Date()),
    to: endOfDay(new Date()),
  }));

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const [ordersRes, logsRes] = await Promise.all([
        fetch("/api/data?type=orders_history"),
        fetch("/api/data?type=cancellation_logs"),
      ]);

      if (ordersRes.ok) {
        const json = await ordersRes.json();
        setOrders(Array.isArray(json) ? json : []);
      }

      if (logsRes.ok) {
        const logsJson = await logsRes.json();
        setCancellationLogs(Array.isArray(logsJson) ? logsJson : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatus, dateRange, pageSize, activeTab]);

  const openDetailModal = (order: any) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const openVoidModal = (order: any) => {
    setSelectedOrder(order);
    setVoidReason("Salah input / ganti menu");
    setVoidPin("");
    setVoidError("");
    setIsVoidModalOpen(true);
  };

  const openRefundModal = (order: any) => {
    setSelectedOrder(order);
    setRefundReason("Pelanggan komplain / retur menu");
    setRefundMethod("CASH");
    setRefundAmount(Number(order.totalAmount) || 0);
    setRefundPin("");
    setRefundRestoreStock(true);
    setRefundError("");
    setIsRefundModalOpen(true);
  };

  const handleConfirmVoid = async () => {
    if (!selectedOrder) return;
    try {
      setIsVoiding(true);
      setVoidError("");

      const res = await fetch("/api/data?type=void_order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          supervisorPin: voidPin,
          approvedBy: user?.name || "Supervisor",
          reason: voidReason,
          restoreStock: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setVoidError(data.error || "Gagal membatalkan transaksi.");
        return;
      }

      setIsVoidModalOpen(false);
      setIsDetailOpen(false);
      await fetchOrders();
    } catch (err: any) {
      setVoidError(err.message || "Terjadi kesalahan.");
    } finally {
      setIsVoiding(false);
    }
  };

  const handleConfirmRefund = async () => {
    if (!selectedOrder) return;
    try {
      setIsRefunding(true);
      setRefundError("");

      const res = await fetch("/api/data?type=refund_order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          supervisorPin: refundPin,
          approvedBy: user?.name || "Supervisor",
          reason: refundReason,
          refundMethod,
          amount: refundAmount || Number(selectedOrder.totalAmount) || 0,
          restoreStock: refundRestoreStock,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setRefundError(data.error || "Gagal memproses refund.");
        return;
      }

      // Auto print refund receipt
      try {
        await bluetoothPrinter.printRefundReceipt({
          storeName: "Perkara Kopi Outlet",
          storeAddress: "Jl. Pemuda No. 88, Jakarta",
          orderNumber: selectedOrder.orderNumber,
          refundDate: new Date().toLocaleString("id-ID"),
          approvedBy: data.approverName || user?.name || "Supervisor",
          reason: refundReason,
          refundMethod: refundMethod === "CASH" ? "Kas Tunai Laci" : "Non-Tunai / Transfer",
          refundAmount: refundAmount || Number(selectedOrder.totalAmount) || 0,
          items: (selectedOrder.items || []).map((it: any) => ({
            name: it.menuName,
            variantName: it.variantName,
            qty: it.quantity,
            subtotal: it.subtotal,
          })),
        });
      } catch (printErr) {
        console.warn("Print refund warning:", printErr);
      }

      setIsRefundModalOpen(false);
      setIsDetailOpen(false);
      await fetchOrders();
    } catch (err: any) {
      setRefundError(err.message || "Terjadi kesalahan.");
    } finally {
      setIsRefunding(false);
    }
  };

  const handlePrintNormalReceipt = async (order: any) => {
    try {
      await bluetoothPrinter.printReceipt({
        storeName: "Perkara Kopi Outlet",
        storeAddress: "Jl. Pemuda No. 88, Jakarta",
        orderNumber: order.orderNumber,
        date: new Date(order.createdAt).toLocaleString("id-ID"),
        cashierName: order.employeeName || user?.name || "Kasir Outlet",
        customerName: order.customerName,
        tableNumber: order.tableNumber,
        channel: order.channel || "Dine-In",
        items: (order.items || []).map((it: any) => ({
          name: it.menuName,
          variantName: it.variantName,
          qty: it.quantity,
          price: it.price,
          subtotal: it.subtotal || it.price * it.quantity,
        })),
        subtotal: Number(order.subtotal) || Number(order.totalAmount) || 0,
        discount: Number(order.discount) || 0,
        total: Number(order.totalAmount) || 0,
        paymentMethod: order.paymentMethod || "CASH",
        amountPaid: Number(order.cashPaid) || Number(order.totalAmount) || 0,
        change: Number(order.cashChange) || 0,
      });
    } catch (e) {
      window.print();
    }
  };

  const handleDeleteOrder = async (id: string, orderNumber: string) => {
    if (!confirm(`Hapus transaksi ${orderNumber}?`)) return;

    try {
      const res = await fetch("/api/data?type=delete_order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setIsDetailOpen(false);
        await fetchOrders();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered Orders calculation
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || 
        (o.orderNumber || "").toLowerCase().includes(q) ||
        (o.customerName || "").toLowerCase().includes(q) ||
        (o.paymentMethod || "").toLowerCase().includes(q);

      const matchStatus = selectedStatus === "ALL" || (o.paymentStatus || "PAID") === selectedStatus;

      let matchDate = true;
      if (dateRange?.from) {
        const orderDate = new Date(o.createdAt || o.timestamp);
        if (dateRange.to) {
          const from = startOfDay(dateRange.from);
          const to = endOfDay(dateRange.to);
          matchDate = isWithinInterval(orderDate, { start: from, end: to });
        } else {
          matchDate = isSameDay(orderDate, dateRange.from);
        }
      }

      return matchQuery && matchStatus && matchDate;
    });
  }, [orders, searchQuery, selectedStatus, dateRange]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  
  const paginatedOrders = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * pageSize;
    return filteredOrders.slice(startIndex, startIndex + pageSize);
  }, [filteredOrders, validCurrentPage, pageSize]);

  const totalRevenue = filteredOrders
    .filter(o => o.paymentStatus === "PAID" || !o.paymentStatus)
    .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  const startRecord = filteredOrders.length > 0 ? (validCurrentPage - 1) * pageSize + 1 : 0;
  const endRecord = Math.min(validCurrentPage * pageSize, filteredOrders.length);

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto text-slate-900 space-y-6 select-none">
        
        {/* Main Card Container */}
        <div className="bg-white p-5 md:p-7 rounded-3xl border border-slate-200/90 shadow-2xs space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Riwayat &amp; Audit Transaksi</h1>
                {isAdmin && (
                  <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold">
                    Admin
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                Pencatatan transaksi kasir, split payment, otorisasi void &amp; refund dana.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setActiveTab("ORDERS")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "ORDERS" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Daftar Transaksi ({orders.length})
                </button>
                <button
                  onClick={() => setActiveTab("AUDIT_LOGS")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "AUDIT_LOGS" ? "bg-white text-rose-700 shadow-xs" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Log Audit Void ({cancellationLogs.length})</span>
                </button>
              </div>

              <Button 
                size="sm" 
                variant="outline" 
                onClick={fetchOrders} 
                className="text-xs font-semibold gap-1.5 h-9 rounded-xl cursor-pointer border-slate-200 hover:bg-slate-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Segarkan</span>
              </Button>
            </div>
          </div>

          {activeTab === "ORDERS" ? (
            <>
              {/* Metric Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    {filterMode === "TODAY" ? "Omset Hari Ini" : filterMode === "ALL" ? "Total Omset" : "Omset Periode"}
                  </span>
                  <div className="text-xl font-extrabold text-slate-900 mt-1">
                    Rp {totalRevenue.toLocaleString("id-ID")}
                  </div>
                </div>

                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    {filterMode === "TODAY" ? "Transaksi Hari Ini" : "Total Transaksi"}
                  </span>
                  <div className="text-xl font-extrabold text-slate-900 mt-1">
                    {filteredOrders.length} <span className="text-xs font-normal text-slate-500">Pesanan</span>
                  </div>
                </div>

                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Transaksi Lunas
                  </span>
                  <div className="text-xl font-extrabold text-emerald-700 mt-1">
                    {filteredOrders.filter(o => o.paymentStatus === "PAID" || !o.paymentStatus).length} <span className="text-xs font-normal text-slate-500">Selesai</span>
                  </div>
                </div>

                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Void / Refund
                  </span>
                  <div className="text-xl font-extrabold text-rose-600 mt-1">
                    {filteredOrders.filter(o => o.paymentStatus === "CANCELLED" || o.paymentStatus === "REFUNDED").length} <span className="text-xs font-normal text-slate-500">Batal</span>
                  </div>
                </div>
              </div>

              {/* Filter Bar */}
              <div className="space-y-3">
                <div className="flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-center justify-between">
                  {/* Search Bar */}
                  <div className="relative flex-1 w-full min-w-[240px]">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      type="text"
                      placeholder="Cari no. nota, pelanggan, atau metode..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-slate-50 border-slate-200 text-xs font-medium h-9 rounded-xl w-full focus:bg-white"
                    />
                  </div>

                  {/* View Mode: Hari Ini vs Semua */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setFilterMode("TODAY");
                        setDateRange({
                          from: startOfDay(new Date()),
                          to: endOfDay(new Date()),
                        });
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        filterMode === "TODAY"
                          ? "bg-emerald-600 text-white shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Hari Ini
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFilterMode("ALL");
                        setDateRange(undefined);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        filterMode === "ALL"
                          ? "bg-slate-900 text-white shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Semua
                    </button>
                  </div>

                  {/* Date Range Picker */}
                  <DatePickerWithRange
                    date={dateRange}
                    setDate={(range) => {
                      setFilterMode(range ? "CUSTOM" : "ALL");
                      setDateRange(range);
                    }}
                    placeholder="Pilih Rentang Tanggal"
                    className="w-full lg:w-auto"
                  />

                  {/* Status Filter Chips */}
                  <div className="flex items-center gap-1 shrink-0">
                    {[
                      { id: "ALL", label: "Semua" },
                      { id: "PAID", label: "Lunas" },
                      { id: "REFUNDED", label: "Refund" },
                      { id: "CANCELLED", label: "Void" },
                    ].map((st) => (
                      <button
                        key={st.id}
                        onClick={() => setSelectedStatus(st.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                          selectedStatus === st.id 
                            ? "bg-slate-900 text-white" 
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Active Filter Info Bar */}
              <div className="flex items-center justify-between bg-slate-50/80 px-3.5 py-2 rounded-xl border border-slate-200/60 text-xs">
                <span className="text-slate-600 font-medium">
                  Menampilkan <strong className="text-slate-900">{filteredOrders.length} transaksi</strong> ({filterMode === "TODAY" ? "Hari Ini" : filterMode === "ALL" ? "Semua Riwayat" : "Rentang Terpilih"})
                </span>
                
                {filterMode !== "ALL" && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterMode("ALL");
                      setDateRange(undefined);
                    }}
                    className="text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer"
                  >
                    Lihat Semua &rarr;
                  </button>
                )}
              </div>

              {/* Table Container */}
              <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[650px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4">No. Nota</th>
                        <th className="py-3 px-4">Pelanggan &amp; Waktu</th>
                        <th className="py-3 px-4 text-center">Pembayaran</th>
                        <th className="py-3 px-4 text-right">Total</th>
                        <th className="py-3 px-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {paginatedOrders.length > 0 ? (
                        paginatedOrders.map((o) => {
                          const isPaid = (o.paymentStatus || "PAID") === "PAID";
                          const isRefunded = o.paymentStatus === "REFUNDED";
                          const isCancelled = o.paymentStatus === "CANCELLED";
                          const dateStr = o.createdAt ? new Date(o.createdAt).toLocaleString("id-ID", {
                            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                          }) : "-";

                          return (
                            <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3 px-4 font-bold text-slate-900">
                                <div className="flex items-center gap-2">
                                  <div className={`h-7 w-7 rounded-lg flex items-center justify-center border shrink-0 ${
                                    isPaid ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                    isRefunded ? "bg-amber-50 text-amber-700 border-amber-200" :
                                    "bg-rose-50 text-rose-700 border-rose-200"
                                  }`}>
                                    <Receipt className="w-3.5 h-3.5" />
                                  </div>
                                  <div>
                                    <span>{o.orderNumber || `POS-${o.id.slice(0, 6)}`}</span>
                                    <Badge
                                      className={`ml-2 text-[9px] font-bold px-1.5 py-0 rounded ${
                                        isPaid ? "bg-emerald-100 text-emerald-800" :
                                        isRefunded ? "bg-amber-100 text-amber-800" :
                                        "bg-rose-100 text-rose-800"
                                      }`}
                                    >
                                      {isPaid ? "Lunas" : isRefunded ? "Refund" : "Void / Batal"}
                                    </Badge>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-4 text-slate-600">
                                <div className="font-semibold text-slate-900">{o.customerName || "Pelanggan"}</div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                  <Clock className="w-3 h-3" /> {dateStr} WIB
                                </div>
                              </td>

                              <td className="py-3 px-4 text-center">
                                <span className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                                  (o.paymentMethod || "").startsWith("SPLIT")
                                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                    : "bg-slate-100 text-slate-700"
                                }`}>
                                  {o.paymentMethod || "CASH"}
                                </span>
                              </td>

                              <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                                Rp {Number(o.totalAmount || 0).toLocaleString("id-ID")}
                              </td>

                              <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => openDetailModal(o)}
                                    className="h-7 w-7 p-0 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                                    title="Lihat Detail & Cetak"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </Button>
                                  {isAdmin && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDeleteOrder(o.id, o.orderNumber || o.id)}
                                      className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                      title="Hapus Permanen"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400">
                            <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="font-bold text-xs text-slate-700">Belum ada transaksi</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Transaksi dari kasir POS akan otomatis tercatat di sini.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {filteredOrders.length > 0 && (
                  <div className="px-4 py-3 bg-slate-50/70 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="text-slate-500 text-[11px]">
                      Menampilkan <strong>{startRecord}</strong> - <strong>{endRecord}</strong> dari <strong>{filteredOrders.length}</strong> data
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                        disabled={validCurrentPage <= 1}
                        className="h-7 w-7 p-0 rounded-lg bg-white"
                      >
                        <ChevronsLeft className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={validCurrentPage <= 1}
                        className="h-7 w-7 p-0 rounded-lg bg-white"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </Button>

                      <span className="px-2 text-xs font-bold text-slate-700">
                        {validCurrentPage} / {totalPages}
                      </span>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={validCurrentPage >= totalPages}
                        className="h-7 w-7 p-0 rounded-lg bg-white"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={validCurrentPage >= totalPages}
                        className="h-7 w-7 p-0 rounded-lg bg-white"
                      >
                        <ChevronsRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* AUDIT LOGS TAB */
            <div className="space-y-4">
              <div className="p-4 bg-rose-50/60 border border-rose-200/80 rounded-2xl flex items-start gap-3 text-xs text-rose-900">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-rose-950">Log Audit Void &amp; Refund Transaksi</h4>
                  <p className="text-slate-600 mt-0.5">
                    Semua tindakan pembatalan pesanan dan pengembalian dana wajib diverifikasi PIN supervisor dan tercatat permanen di bawah ini untuk mencegah kecurangan.
                  </p>
                </div>
              </div>

              <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Waktu</th>
                      <th className="py-3 px-4">No. Order</th>
                      <th className="py-3 px-4">Supervisor Penyetuju</th>
                      <th className="py-3 px-4">Alasan &amp; Keterangan</th>
                      <th className="py-3 px-4 text-right">Nominal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {cancellationLogs.length > 0 ? (
                      cancellationLogs.map((log: any) => (
                        <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 text-slate-500">
                            {new Date(log.createdAt).toLocaleString("id-ID", {
                              day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                            })} WIB
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {log.order?.orderNumber || log.orderId || "-"}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                              {log.approvedBy || "Supervisor"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            {log.reason}
                          </td>
                          <td className="py-3 px-4 text-right font-extrabold text-rose-700">
                            Rp {Number(log.amount || 0).toLocaleString("id-ID")}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400">
                          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                          <p className="font-bold text-xs text-slate-700">Belum ada log pembatalan atau refund</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Semua void &amp; refund kasir akan tercatat di sini secara otomatis.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Modal Detail & Cetak Struk */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-md p-6 bg-white border border-slate-200 rounded-3xl select-none max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-bold text-slate-900">
                Detail Transaksi #{selectedOrder?.orderNumber || "STRUK"}
              </DialogTitle>
              <Badge className={
                selectedOrder?.paymentStatus === "REFUNDED" ? "bg-amber-100 text-amber-800" :
                selectedOrder?.paymentStatus === "CANCELLED" ? "bg-rose-100 text-rose-800" :
                "bg-emerald-100 text-emerald-800"
              }>
                {selectedOrder?.paymentStatus === "REFUNDED" ? "Refund" :
                 selectedOrder?.paymentStatus === "CANCELLED" ? "Dibatalkan" : "Lunas"}
              </Badge>
            </div>
            <DialogDescription className="text-xs text-slate-500">
              Rincian item belanja, status pembayaran, dan opsi tindakan.
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 my-2 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Pelanggan</span>
                  <span className="font-bold text-slate-900">{selectedOrder.customerName || "Pelanggan"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Metode Bayar</span>
                  <span className="font-bold text-slate-900">{selectedOrder.paymentMethod || "CASH"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Waktu</span>
                  <span className="font-semibold text-slate-700">{new Date(selectedOrder.createdAt).toLocaleString("id-ID")}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Kasir</span>
                  <span className="font-semibold text-slate-700">{selectedOrder.employeeName || "Kasir Outlet"}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden">
                <div className="bg-slate-50 px-3 py-2 font-bold text-slate-700 grid grid-cols-12 text-[10px] uppercase">
                  <div className="col-span-6">Item</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-4 text-right">Subtotal</div>
                </div>
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((it: any, idx: number) => (
                    <div key={it.id || idx} className="px-3 py-2 grid grid-cols-12 items-center text-xs">
                      <div className="col-span-6 font-semibold text-slate-900">
                        {it.menuName || "Item"}
                        {it.variantName && <span className="text-[10px] text-slate-400 block">({it.variantName})</span>}
                      </div>
                      <div className="col-span-2 text-center font-bold text-slate-700">{it.quantity}</div>
                      <div className="col-span-4 text-right font-bold text-slate-900">
                        Rp {Number(it.subtotal || it.price * it.quantity || 0).toLocaleString("id-ID")}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-slate-400">Tidak ada item</div>
                )}
              </div>

              {/* Total Summary */}
              <div className="space-y-1 text-right pt-2 border-t text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>Rp {Number(selectedOrder.subtotal || selectedOrder.totalAmount || 0).toLocaleString("id-ID")}</span>
                </div>
                {Number(selectedOrder.discount) > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>Diskon:</span>
                    <span>- Rp {Number(selectedOrder.discount).toLocaleString("id-ID")}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t">
                  <span>Total:</span>
                  <span>Rp {Number(selectedOrder.totalAmount || 0).toLocaleString("id-ID")}</span>
                </div>
              </div>

              {/* Void & Refund Action Controls */}
              {selectedOrder.paymentStatus === "PAID" && (
                <div className="p-3 bg-slate-50 border rounded-2xl space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 block">Aksi Transaksi:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openRefundModal(selectedOrder)}
                      className="text-amber-700 border-amber-200 hover:bg-amber-50 text-xs font-bold gap-1 cursor-pointer min-h-[38px]"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Refund Transaksi</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openVoidModal(selectedOrder)}
                      className="text-rose-700 border-rose-200 hover:bg-rose-50 text-xs font-bold gap-1 cursor-pointer min-h-[38px]"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Void Transaksi</span>
                    </Button>
                  </div>
                </div>
              )}

              <DialogFooter className="pt-2 border-t flex flex-wrap gap-2 justify-between">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDetailOpen(false)}
                    className="rounded-xl text-xs"
                  >
                    Tutup
                  </Button>
                  {isAdmin && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteOrder(selectedOrder.id, selectedOrder.orderNumber || selectedOrder.id)}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handlePrintNormalReceipt(selectedOrder)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Ulang Struk</span>
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Void Order with Supervisor PIN */}
      <Dialog open={isVoidModalOpen} onOpenChange={setIsVoidModalOpen}>
        <DialogContent className="sm:max-w-md p-6 bg-white border border-slate-200 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-700 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              <span>Otorisasi Void Transaksi #{selectedOrder?.orderNumber}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Transaksi ini akan dibatalkan, dicatat ke log audit, dan stok bahan baku akan otomatis dikembalikan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Alasan Pembatalan / Void:</label>
              <select
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                className="w-full text-xs font-medium rounded-xl border bg-slate-50 p-2.5 text-slate-900 focus:bg-white"
              >
                <option value="Salah input kasir / salah menu">Salah input kasir / salah menu</option>
                <option value="Pelanggan ganti pesanan">Pelanggan ganti pesanan</option>
                <option value="Pelanggan batal / antrean lama">Pelanggan batal / antrean lama</option>
                <option value="Kendala metode pembayaran (double charge / failed)">Kendala metode pembayaran</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">PIN Supervisor (Default: 9999):</label>
              <Input
                type="password"
                placeholder="Masukkan PIN"
                value={voidPin}
                onChange={(e) => setVoidPin(e.target.value)}
                className="min-h-[42px] text-center text-lg tracking-widest font-bold"
              />
            </div>

            {voidError && (
              <p className="text-xs font-semibold text-rose-600 text-center">{voidError}</p>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2 border-t">
            <Button variant="outline" className="text-xs rounded-xl" onClick={() => setIsVoidModalOpen(false)}>
              Batal
            </Button>
            <Button
              disabled={isVoiding || !voidPin}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              onClick={handleConfirmVoid}
            >
              {isVoiding ? "Memproses Void..." : "Konfirmasi Void Transaksi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Refund Transaksi with Supervisor PIN */}
      <Dialog open={isRefundModalOpen} onOpenChange={setIsRefundModalOpen}>
        <DialogContent className="sm:max-w-md p-6 bg-white border border-slate-200 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-amber-700 flex items-center gap-2">
              <RotateCcw className="w-5 h-5" />
              <span>Pengembalian Dana (Refund) #{selectedOrder?.orderNumber}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Pengembalian dana pelanggan setelah transaksi selesai.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 flex justify-between items-center text-xs">
              <span className="text-amber-900 font-medium">Nominal Refund:</span>
              <strong className="text-sm font-extrabold text-amber-950">
                Rp {Number(selectedOrder?.totalAmount || 0).toLocaleString("id-ID")}
              </strong>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Metode Pengembalian Uang:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRefundMethod("CASH")}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    refundMethod === "CASH"
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Kas Tunai Laci
                </button>
                <button
                  type="button"
                  onClick={() => setRefundMethod("NON_CASH")}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    refundMethod === "NON_CASH"
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Non-Tunai / Transfer
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                {refundMethod === "CASH" 
                  ? "✓ Uang fisik diambil dari laci kasir, tercatat sebagai Kas Keluar (CASH_OUT) shift aktif."
                  : "✓ Pengembalian ditransfer langsung ke rekening/e-wallet pelanggan."}
              </p>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Alasan Refund:</label>
              <select
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full text-xs font-medium rounded-xl border bg-slate-50 p-2.5 text-slate-900 focus:bg-white"
              >
                <option value="Pelanggan komplain rasa / pesanan kurang baik">Pelanggan komplain rasa / pesanan kurang baik</option>
                <option value="Salah buat pesanan / salah menu">Salah buat pesanan / salah menu</option>
                <option value="Barang / makanan tidak tersedia">Barang / makanan tidak tersedia</option>
                <option value="Pelanggan membatalkan pesanan setelah bayar">Pelanggan membatalkan pesanan setelah bayar</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="restoreStockCheck"
                checked={refundRestoreStock}
                onChange={(e) => setRefundRestoreStock(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
              <label htmlFor="restoreStockCheck" className="text-xs text-slate-700 font-semibold cursor-pointer">
                Kembalikan stok bahan baku ke gudang / bar
              </label>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">PIN Supervisor (Default: 9999):</label>
              <Input
                type="password"
                placeholder="Masukkan PIN"
                value={refundPin}
                onChange={(e) => setRefundPin(e.target.value)}
                className="min-h-[42px] text-center text-lg tracking-widest font-bold"
              />
            </div>

            {refundError && (
              <p className="text-xs font-semibold text-rose-600 text-center">{refundError}</p>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2 border-t">
            <Button variant="outline" className="text-xs rounded-xl" onClick={() => setIsRefundModalOpen(false)}>
              Batal
            </Button>
            <Button
              disabled={isRefunding || !refundPin}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              onClick={handleConfirmRefund}
            >
              {isRefunding ? "Memproses Refund..." : "Setujui Refund & Cetak Bukti"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

