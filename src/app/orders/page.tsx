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
  AlertCircle,
  DollarSign,
  User,
  Package,
  Calendar,
  Filter
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
  const [voidReason, setVoidReason] = useState("Salah input kasir / salah menu");
  const [voidCustomReason, setVoidCustomReason] = useState("");
  const [voidPin, setVoidPin] = useState("");
  const [voidError, setVoidError] = useState("");
  const [isVoiding, setIsVoiding] = useState(false);

  // Refund Modal State (Item-by-item selection)
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundSelectedItems, setRefundSelectedItems] = useState<{ [itemId: string]: { selected: boolean; qty: number } }>({});
  const [refundReason, setRefundReason] = useState("Permintaan pelanggan");
  const [refundCustomReason, setRefundCustomReason] = useState("");
  const [refundMethod, setRefundMethod] = useState<"CASH" | "NON_CASH">("CASH");
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
    setVoidReason("Salah input kasir / salah menu");
    setVoidCustomReason("");
    setVoidPin("");
    setVoidError("");
    setIsVoidModalOpen(true);
  };

  const openRefundModal = (order: any) => {
    setSelectedOrder(order);
    setRefundReason("Permintaan pelanggan");
    setRefundCustomReason("");
    setRefundMethod("CASH");
    setRefundPin("");
    setRefundRestoreStock(true);
    setRefundError("");

    // Initialize all items as selected with full quantity
    const initialItems: { [itemId: string]: { selected: boolean; qty: number } } = {};
    (order.items || []).forEach((item: any) => {
      initialItems[item.id] = {
        selected: true,
        qty: Number(item.quantity) || 1,
      };
    });
    setRefundSelectedItems(initialItems);
    setIsRefundModalOpen(true);
  };

  // Calculate calculated refund amount based on selected items
  const calculatedRefundAmount = useMemo(() => {
    if (!selectedOrder || !selectedOrder.items) return 0;
    return selectedOrder.items.reduce((sum: number, item: any) => {
      const sel = refundSelectedItems[item.id];
      if (sel && sel.selected) {
        const itemPrice = Number(item.price) || 0;
        return sum + itemPrice * (Number(sel.qty) || 1);
      }
      return sum;
    }, 0);
  }, [selectedOrder, refundSelectedItems]);

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
          customReason: voidCustomReason,
          restoreStock: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setVoidError(data.error || "PIN Supervisor salah. Silakan periksa kembali PIN Anda.");
        return;
      }

      setIsVoidModalOpen(false);
      setIsDetailOpen(false);
      await fetchOrders();
    } catch (err: any) {
      setVoidError(err.message || "Terjadi kesalahan sistem.");
    } finally {
      setIsVoiding(false);
    }
  };

  const handleConfirmRefund = async () => {
    if (!selectedOrder) return;
    try {
      setIsRefunding(true);
      setRefundError("");

      // Prepare items payload
      const refundItemsPayload = (selectedOrder.items || [])
        .filter((it: any) => refundSelectedItems[it.id]?.selected)
        .map((it: any) => {
          const qty = refundSelectedItems[it.id]?.qty || it.quantity;
          return {
            orderItemId: it.id,
            menuId: it.menuId,
            menuName: it.menuName,
            variantName: it.variantName,
            quantity: qty,
            unitPrice: it.price,
            subtotal: it.price * qty,
          };
        });

      if (refundItemsPayload.length === 0) {
        setRefundError("Pilih minimal 1 item yang ingin direfund.");
        return;
      }

      const res = await fetch("/api/data?type=refund_order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          supervisorPin: refundPin,
          approvedBy: user?.name || "Supervisor",
          reason: refundReason,
          customReason: refundCustomReason,
          refundMethod,
          refundItems: refundItemsPayload,
          amount: calculatedRefundAmount,
          restoreStock: refundRestoreStock,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setRefundError(data.error || "PIN Supervisor salah. Silakan periksa kembali PIN Anda.");
        return;
      }

      // Auto print refund receipt
      try {
        await bluetoothPrinter.printRefundReceipt({
          storeName: "Perkara Kopi Outlet",
          storeAddress: "Jl. Pemuda No. 88, Jakarta",
          orderNumber: selectedOrder.orderNumber,
          refundDate: new Date().toLocaleString("id-ID"),
          cashierName: user?.name || "Kasir Outlet",
          approverName: data.approverName || "Supervisor",
          reason: `${refundReason}${refundCustomReason ? ` (${refundCustomReason})` : ""}`,
          refundMethod: refundMethod === "CASH" ? "Kas Tunai Laci" : "Non-Tunai / Transfer",
          refundAmount: calculatedRefundAmount,
          items: refundItemsPayload.map((it: any) => ({
            name: it.menuName,
            qty: it.quantity,
            price: it.unitPrice,
            subtotal: it.subtotal,
          })),
        });
      } catch (printErr) {
        console.warn("Bluetooth printer not connected:", printErr);
      }

      setIsRefundModalOpen(false);
      setIsDetailOpen(false);
      await fetchOrders();
    } catch (err: any) {
      setRefundError(err.message || "Terjadi kesalahan saat memproses refund.");
    } finally {
      setIsRefunding(false);
    }
  };

  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`Hapus permanen data pesanan #${orderNumber}? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      const res = await fetch("/api/data?type=delete_order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId }),
      });
      if (res.ok) {
        setIsDetailOpen(false);
        await fetchOrders();
      }
    } catch (e) {
      console.error("Error deleting order:", e);
    }
  };

  const handleDeleteAllOrders = async () => {
    if (!confirm("Apakah Anda yakin ingin MENGHAPUS SEMUA riwayat transaksi? Tindakan ini tidak dapat dibatalkan.")) return;

    try {
      setLoading(true);
      const res = await fetch("/api/data?type=delete_all_orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        setIsDetailOpen(false);
        await fetchOrders();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintNormalReceipt = async (order: any) => {
    try {
      await bluetoothPrinter.printReceipt({
        storeName: "Perkara Kopi Outlet",
        storeAddress: "Jl. Pemuda No. 88, Jakarta",
        orderNumber: order.orderNumber || "POS",
        cashierName: order.employeeName || "Kasir",
        customerName: order.customerName || "Pelanggan",
        items: (order.items || []).map((it: any) => ({
          name: it.menuName,
          qty: it.quantity,
          price: it.price,
          subtotal: it.subtotal || it.price * it.quantity,
        })),
        subtotal: Number(order.subtotal) || Number(order.totalAmount),
        discount: Number(order.discount) || 0,
        total: Number(order.totalAmount),
        paymentMethod: order.paymentMethod || "CASH",
        cashPaid: Number(order.cashPaid) || Number(order.totalAmount),
        cashChange: Number(order.cashChange) || 0,
      });
    } catch (e) {
      alert("Printer Bluetooth belum terhubung. Silakan hubungkan printer di menu kasir POS.");
    }
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q ||
        (o.orderNumber || "").toLowerCase().includes(q) ||
        (o.customerName || "").toLowerCase().includes(q) ||
        (o.employeeName || "").toLowerCase().includes(q) ||
        (o.paymentMethod || "").toLowerCase().includes(q);

      let matchStatus = true;
      if (selectedStatus === "PAID") matchStatus = (o.paymentStatus || "PAID") === "PAID";
      else if (selectedStatus === "REFUNDED") matchStatus = o.paymentStatus === "REFUNDED";
      else if (selectedStatus === "CANCELLED") matchStatus = o.paymentStatus === "CANCELLED";

      let matchDate = true;
      if (filterMode === "TODAY") {
        const orderDate = new Date(o.createdAt);
        matchDate = isSameDay(orderDate, new Date());
      } else if (filterMode === "CUSTOM" && dateRange?.from) {
        const orderDate = new Date(o.createdAt);
        if (dateRange.to) {
          matchDate = isWithinInterval(orderDate, {
            start: startOfDay(dateRange.from),
            end: endOfDay(dateRange.to),
          });
        } else {
          matchDate = isSameDay(orderDate, dateRange.from);
        }
      }

      return matchQuery && matchStatus && matchDate;
    });
  }, [orders, searchQuery, selectedStatus, filterMode, dateRange]);

  // Filtered Cancellation Audit Logs
  const filteredCancellationLogs = useMemo(() => {
    return cancellationLogs.filter((log) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q ||
        (log.order?.orderNumber || log.orderId || "").toLowerCase().includes(q) ||
        (log.cashierName || "").toLowerCase().includes(q) ||
        (log.approvedBy || "").toLowerCase().includes(q) ||
        (log.reason || "").toLowerCase().includes(q);

      let matchDate = true;
      if (filterMode === "TODAY") {
        const logDate = new Date(log.createdAt);
        matchDate = isSameDay(logDate, new Date());
      } else if (filterMode === "CUSTOM" && dateRange?.from) {
        const logDate = new Date(log.createdAt);
        if (dateRange.to) {
          matchDate = isWithinInterval(logDate, {
            start: startOfDay(dateRange.from),
            end: endOfDay(dateRange.to),
          });
        } else {
          matchDate = isSameDay(logDate, dateRange.from);
        }
      }

      return matchQuery && matchDate;
    });
  }, [cancellationLogs, searchQuery, filterMode, dateRange]);

  // Total Void/Refund Loss Calculation
  const totalVoidLoss = cancellationLogs.reduce((sum, log) => sum + (Number(log.amount) || 0), 0);
  const totalVoidCount = cancellationLogs.length;

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  
  const paginatedOrders = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * pageSize;
    return filteredOrders.slice(startIndex, startIndex + pageSize);
  }, [filteredOrders, validCurrentPage, pageSize]);

  const startRecord = filteredOrders.length > 0 ? (validCurrentPage - 1) * pageSize + 1 : 0;
  const endRecord = Math.min(validCurrentPage * pageSize, filteredOrders.length);

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto text-slate-900 space-y-6">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Riwayat Transaksi &amp; Void</h1>
              <p className="text-xs text-slate-500 font-medium">
                Pantau pesanan kasir, split payment, dan log audit pembatalan transaksi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && orders.length > 0 && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={async () => {
                  if (!confirm("Hapus semua data riwayat pesanan?")) return;
                  const res = await fetch("/api/data?type=delete_all_orders", { method: "POST" });
                  if (res.ok) await fetchOrders();
                }} 
                disabled={loading}
                className="text-xs font-semibold gap-1.5 min-h-[40px] rounded-xl cursor-pointer text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Semua</span>
              </Button>
            )}

            <Button
              variant="outline"
              onClick={fetchOrders}
              className="p-2.5 min-h-[40px] rounded-xl border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
              title="Segarkan Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Tab Switcher: Orders vs Audit Logs */}
        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
          <button
            onClick={() => setActiveTab("ORDERS")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "ORDERS"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Semua Pesanan &amp; Penjualan</span>
            <Badge className={`text-[10px] px-2 py-0 border-none font-bold ${
              activeTab === "ORDERS" ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-600"
            }`}>
              {orders.length}
            </Badge>
          </button>

          <button
            onClick={() => setActiveTab("AUDIT_LOGS")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "AUDIT_LOGS"
                ? "bg-rose-700 text-white shadow-xs"
                : "bg-white text-rose-700 border border-rose-200 hover:bg-rose-50"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Riwayat Pembatalan (Void &amp; Refund)</span>
            <Badge className={`text-[10px] px-2 py-0 border-none font-bold ${
              activeTab === "AUDIT_LOGS" ? "bg-rose-900 text-rose-100" : "bg-rose-100 text-rose-800"
            }`}>
              {cancellationLogs.length}
            </Badge>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: ORDERS HISTORY */}
        {/* ========================================================================= */}
        {activeTab === "ORDERS" && (
          <div className="space-y-6">
            
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { label: "Hari Ini", mode: "TODAY" },
                    { label: "Semua Waktu", mode: "ALL" },
                    { label: "Kustom Tanggal", mode: "CUSTOM" },
                  ].map((f) => (
                    <button
                      key={f.mode}
                      onClick={() => setFilterMode(f.mode as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        filterMode === f.mode
                          ? "bg-slate-900 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}

                  {filterMode === "CUSTOM" && (
                    <DatePickerWithRange date={dateRange} setDate={setDateRange} />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-700"
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="PAID">Lunas (Paid)</option>
                    <option value="REFUNDED">Refund</option>
                    <option value="CANCELLED">Void / Dibatalkan</option>
                  </select>

                  <div className="relative min-w-[200px]">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <Input
                      placeholder="Cari nota / pelanggan..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-slate-50 pl-9 min-h-[36px] text-xs rounded-xl border-slate-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Orders Table */}
            <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">No. Nota</th>
                    <th className="py-3 px-4">Pelanggan &amp; Waktu</th>
                    <th className="py-3 px-4 text-center">Metode Bayar</th>
                    <th className="py-3 px-4 text-right">Total Transaksi</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginatedOrders.length > 0 ? (
                    paginatedOrders.map((o) => {
                      const isPaid = (o.paymentStatus || "PAID") === "PAID";
                      const isRefunded = o.paymentStatus === "REFUNDED";
                      const isCancelled = o.paymentStatus === "CANCELLED";

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
                                <Badge className={`ml-2 text-[9px] font-bold px-1.5 py-0 ${
                                  isPaid ? "bg-emerald-100 text-emerald-800" :
                                  isRefunded ? "bg-amber-100 text-amber-800" :
                                  "bg-rose-100 text-rose-800"
                                }`}>
                                  {isPaid ? "Lunas" : isRefunded ? "Refund" : "Void"}
                                </Badge>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-slate-600">
                            <div className="font-semibold text-slate-900">{o.customerName || "Pelanggan"}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" /> {new Date(o.createdAt).toLocaleString("id-ID", {
                                day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                              })} WIB
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
                        <p className="text-[11px] text-slate-400 mt-0.5">Transaksi kasir POS akan muncul otomatis di sini.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredOrders.length > 0 && (
              <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                <div>
                  Menampilkan <strong>{startRecord}</strong> - <strong>{endRecord}</strong> dari <strong>{filteredOrders.length}</strong> transaksi
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={validCurrentPage <= 1} className="h-7 w-7 p-0 rounded-lg">
                    <ChevronsLeft className="w-3 h-3" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={validCurrentPage <= 1} className="h-7 w-7 p-0 rounded-lg">
                    <ChevronLeft className="w-3 h-3" />
                  </Button>
                  <span className="px-2 font-bold text-slate-700">{validCurrentPage} / {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={validCurrentPage >= totalPages} className="h-7 w-7 p-0 rounded-lg">
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={validCurrentPage >= totalPages} className="h-7 w-7 p-0 rounded-lg">
                    <ChevronsRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CANCELLATION AUDIT LOGS (RIWAYAT PEMBATALAN VOID & REFUND) */}
        {/* ========================================================================= */}
        {activeTab === "AUDIT_LOGS" && (
          <div className="space-y-6">
            
            {/* Top Statistics Cards for Void & Refund */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Total Nilai Kerugian Pembatalan</span>
                  <div className="text-2xl font-extrabold text-rose-600">
                    Rp {totalVoidLoss.toLocaleString("id-ID")}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Total Kasus Pembatalan</span>
                  <div className="text-2xl font-extrabold text-slate-900">
                    {totalVoidCount} Insiden
                  </div>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Status Otorisasi Supervisor</span>
                  <div className="text-sm font-bold text-emerald-700 flex items-center gap-1.5 mt-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>100% Diaudit PIN</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Filter Bar for Audit Logs */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { label: "Hari Ini", mode: "TODAY" },
                  { label: "Semua Waktu", mode: "ALL" },
                  { label: "Kustom Tanggal", mode: "CUSTOM" },
                ].map((f) => (
                  <button
                    key={f.mode}
                    onClick={() => setFilterMode(f.mode as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      filterMode === f.mode
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}

                {filterMode === "CUSTOM" && (
                  <DatePickerWithRange date={dateRange} setDate={setDateRange} />
                )}
              </div>

              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <Input
                  placeholder="Cari kasir / supervisor / no order..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-50 pl-9 min-h-[36px] text-xs rounded-xl border-slate-200"
                />
              </div>
            </div>

            {/* Audit Logs Table */}
            <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
              <table className="w-full text-left border-collapse min-w-[750px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">No. Order &amp; Kasir</th>
                    <th className="py-3 px-4">Supervisor Penyetuju</th>
                    <th className="py-3 px-4">Alasan &amp; Item Batal</th>
                    <th className="py-3 px-4 text-right">Nilai Pembatalan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredCancellationLogs.length > 0 ? (
                    filteredCancellationLogs.map((log: any) => {
                      let itemsList: any[] = [];
                      if (log.itemsSnapshot) {
                        try {
                          itemsList = JSON.parse(log.itemsSnapshot);
                        } catch {}
                      }
                      if (itemsList.length === 0 && log.order?.items) {
                        itemsList = log.order.items;
                      }

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString("id-ID", {
                              day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                            })} WIB
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">
                              {log.order?.orderNumber || log.orderId || "-"}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <User className="w-3 h-3 text-slate-400" />
                              <span>Kasir: {log.cashierName || log.order?.employeeName || "Kasir Outlet"}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-[11px]">
                              {log.approvedBy || "Supervisor"}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-slate-700 max-w-xs">
                            <div className="font-semibold text-slate-900">{log.reason}</div>
                            {itemsList.length > 0 && (
                              <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap gap-1">
                                {itemsList.map((it: any, idx: number) => (
                                  <span key={idx} className="bg-slate-100 px-1.5 py-0.2 rounded text-[10px]">
                                    {it.menuName || it.name} (x{it.quantity || it.qty})
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right font-extrabold text-rose-700">
                            Rp {Number(log.amount || 0).toLocaleString("id-ID")}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                        <p className="font-bold text-xs text-slate-700">Belum ada riwayat pembatalan transaksi</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Semua void kasir dan refund akan tercatat otomatis di sini.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* Modal Detail Order */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="sm:max-w-md p-6 bg-white border border-slate-200 rounded-3xl max-h-[90vh] overflow-y-auto">
            {selectedOrder && (
              <div className="space-y-4 text-xs">
                <DialogHeader>
                  <DialogTitle className="text-base font-extrabold text-slate-900 flex items-center justify-between">
                    <span>Detail Nota #{selectedOrder.orderNumber}</span>
                    <Badge className={`text-[10px] font-bold ${
                      selectedOrder.paymentStatus === "PAID" ? "bg-emerald-100 text-emerald-800" :
                      selectedOrder.paymentStatus === "REFUNDED" ? "bg-amber-100 text-amber-800" :
                      "bg-rose-100 text-rose-800"
                    }`}>
                      {selectedOrder.paymentStatus}
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Waktu: {new Date(selectedOrder.createdAt).toLocaleString("id-ID")} | Kasir: {selectedOrder.employeeName || "-"}
                  </DialogDescription>
                </DialogHeader>

                {/* Items List */}
                <div className="divide-y divide-slate-100 border rounded-2xl p-3 bg-slate-50/50 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Daftar Item Belanja:</span>
                  {(selectedOrder.items || []).map((it: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center pt-2">
                      <div>
                        <div className="font-bold text-slate-800">{it.menuName}</div>
                        <span className="text-[11px] text-slate-400">{it.quantity} x Rp {Number(it.price).toLocaleString("id-ID")}</span>
                      </div>
                      <strong className="text-slate-900">Rp {Number(it.subtotal || it.price * it.quantity).toLocaleString("id-ID")}</strong>
                    </div>
                  ))}
                </div>

                {/* Payment Breakdown (Split Support) */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Metode Pembayaran:</span>
                    <strong className="text-slate-900">{selectedOrder.paymentMethod}</strong>
                  </div>
                  {selectedOrder.payments && selectedOrder.payments.length > 0 && (
                    <div className="border-t pt-1 space-y-1">
                      {selectedOrder.payments.map((p: any, pIdx: number) => (
                        <div key={pIdx} className="flex justify-between text-[11px] text-slate-500">
                          <span>• {p.methodName}:</span>
                          <span>Rp {Number(p.amount).toLocaleString("id-ID")}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between text-slate-900 font-extrabold text-sm border-t pt-1.5">
                    <span>Total Pembayaran:</span>
                    <span className="text-emerald-700">Rp {Number(selectedOrder.totalAmount).toLocaleString("id-ID")}</span>
                  </div>
                </div>

                <DialogFooter className="gap-2 pt-2 border-t flex-col sm:flex-row">
                  <div className="flex gap-1.5 w-full sm:w-auto">
                    {selectedOrder.paymentStatus === "PAID" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setIsDetailOpen(false);
                            openRefundModal(selectedOrder);
                          }}
                          className="text-amber-700 border-amber-300 hover:bg-amber-50 text-xs font-bold rounded-xl gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Refund
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setIsDetailOpen(false);
                            openVoidModal(selectedOrder);
                          }}
                          className="text-rose-700 border-rose-300 hover:bg-rose-50 text-xs font-bold rounded-xl gap-1"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" /> Void
                        </Button>
                      </>
                    )}
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handlePrintNormalReceipt(selectedOrder)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl gap-1.5 cursor-pointer ml-auto"
                  >
                    <Printer className="w-3.5 h-3.5" /> Cetak Struk
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal Void Order */}
        <Dialog open={isVoidModalOpen} onOpenChange={setIsVoidModalOpen}>
          <DialogContent className="sm:max-w-md p-6 bg-white border border-slate-200 rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-rose-700 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" />
                <span>Otorisasi Void Pesanan #{selectedOrder?.orderNumber}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Pesanan akan dibatalkan, dicatat ke log audit, dan stok bahan baku dikembalikan.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-2 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Alasan Pembatalan (Wajib):</label>
                <select
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 focus:bg-white"
                >
                  <option value="Salah input kasir / salah menu">Salah input kasir / salah menu</option>
                  <option value="Permintaan pelanggan">Permintaan pelanggan</option>
                  <option value="Item habis / tidak tersedia">Item habis / tidak tersedia</option>
                  <option value="Kendala metode pembayaran">Kendala metode pembayaran</option>
                  <option value="Lainnya">Lainnya (Tulis catatan bebas)</option>
                </select>
              </div>

              {voidReason === "Lainnya" && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Catatan Tambahan *</label>
                  <Input
                    placeholder="Tulis alasan spesifik pembatalan..."
                    value={voidCustomReason}
                    onChange={(e) => setVoidCustomReason(e.target.value)}
                    className="min-h-[38px] text-xs font-medium"
                    required
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">PIN Otorisasi Supervisor:</label>
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

        {/* Modal Refund Interaktif (Item-by-item selection) */}
        <Dialog open={isRefundModalOpen} onOpenChange={setIsRefundModalOpen}>
          <DialogContent className="sm:max-w-lg p-6 bg-white border border-slate-200 rounded-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-amber-700 flex items-center gap-2">
                <RotateCcw className="w-5 h-5" />
                <span>Pengembalian Dana (Refund) #{selectedOrder?.orderNumber}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Pilih item yang dikembalikan (parsial atau seluruhnya) beserta alasan refund.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              
              {/* Item Selection Checklist */}
              <div className="border rounded-2xl p-3 bg-slate-50/50 space-y-2.5">
                <span className="text-[11px] font-bold text-slate-700 block">Pilih Item yang Direfund / Retur:</span>
                {(selectedOrder?.items || []).map((it: any) => {
                  const state = refundSelectedItems[it.id] || { selected: true, qty: it.quantity };
                  return (
                    <div key={it.id} className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={state.selected}
                          onChange={(e) => {
                            setRefundSelectedItems({
                              ...refundSelectedItems,
                              [it.id]: { ...state, selected: e.target.checked }
                            });
                          }}
                          className="rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{it.menuName}</div>
                          <span className="text-[10px] text-slate-400">Rp {Number(it.price).toLocaleString("id-ID")} / item</span>
                        </div>
                      </div>

                      {state.selected && (
                        <div className="flex items-center gap-1.5">
                          <label className="text-[10px] text-slate-400 font-semibold">Qty Retur:</label>
                          <select
                            value={state.qty}
                            onChange={(e) => {
                              setRefundSelectedItems({
                                ...refundSelectedItems,
                                [it.id]: { ...state, qty: Number(e.target.value) }
                              });
                            }}
                            className="bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs font-bold"
                          >
                            {Array.from({ length: it.quantity }, (_, i) => i + 1).map((q) => (
                              <option key={q} value={q}>{q}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Total Refund Summary */}
              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 flex justify-between items-center">
                <span className="text-amber-900 font-bold">Total Nominal yang Dikembalikan:</span>
                <strong className="text-base font-extrabold text-amber-950">
                  Rp {calculatedRefundAmount.toLocaleString("id-ID")}
                </strong>
              </div>

              {/* Refund Method */}
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
                    ? "✓ Uang tunai diambil dari laci kasir, tercatat sebagai Kas Keluar (CASH_OUT) pada shift aktif."
                    : "✓ Pengembalian ditransfer langsung ke rekening atau e-wallet pelanggan."}
                </p>
              </div>

              {/* Refund Reason */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Alasan Refund (Wajib):</label>
                <select
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 focus:bg-white"
                >
                  <option value="Permintaan pelanggan">Permintaan pelanggan / ganti menu</option>
                  <option value="Pelanggan komplain rasa / kualitas kurang baik">Pelanggan komplain rasa / kualitas kurang baik</option>
                  <option value="Salah buat pesanan / salah racik">Salah buat pesanan / salah racik</option>
                  <option value="Item habis / tidak tersedia">Item habis / tidak tersedia</option>
                  <option value="Lainnya">Lainnya (Tulis catatan)</option>
                </select>
              </div>

              {refundReason === "Lainnya" && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Catatan Tambahan *</label>
                  <Input
                    placeholder="Tulis alasan detail refund..."
                    value={refundCustomReason}
                    onChange={(e) => setRefundCustomReason(e.target.value)}
                    className="min-h-[38px] text-xs font-medium"
                    required
                  />
                </div>
              )}

              {/* Restore Stock Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="refundRestoreStockCheckbox"
                  checked={refundRestoreStock}
                  onChange={(e) => setRefundRestoreStock(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <label htmlFor="refundRestoreStockCheckbox" className="text-xs text-slate-700 font-semibold cursor-pointer">
                  Kembalikan stok bahan baku resep item terpilih ke gudang / bar
                </label>
              </div>

              {/* Supervisor PIN */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">PIN Otorisasi Supervisor:</label>
                <Input
                  type="password"
                  placeholder="Masukkan PIN Otorisasi"
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
                disabled={isRefunding || !refundPin || calculatedRefundAmount <= 0}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                onClick={handleConfirmRefund}
              >
                {isRefunding ? "Memproses Refund..." : `Setujui Refund (Rp ${calculatedRefundAmount.toLocaleString("id-ID")})`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </AppShell>
  );
}
