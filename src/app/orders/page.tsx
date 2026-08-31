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
  ShoppingBag
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

export default function OrdersPage() {
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

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
      const res = await fetch("/api/data?type=orders_history");
      if (res.ok) {
        const json = await res.json();
        setOrders(Array.isArray(json) ? json : []);
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
  }, [searchQuery, selectedStatus, dateRange, pageSize]);

  const openDetailModal = (order: any) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      setStatusUpdating(true);
      const res = await fetch("/api/data?type=update_order_status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          paymentStatus: newStatus,
          orderStatus: newStatus === "PAID" ? "COMPLETED" : "CANCELLED",
        }),
      });

      if (res.ok) {
        await fetchOrders();
        if (selectedOrder && selectedOrder.id === id) {
          setSelectedOrder({ ...selectedOrder, paymentStatus: newStatus });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setStatusUpdating(false);
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
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Riwayat Transaksi</h1>
                {isAdmin && (
                  <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold">
                    Admin
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                Daftar transaksi kasir, rincian pembayaran, dan cetak ulang nota.
              </p>
            </div>

            <Button 
              size="sm" 
              variant="outline" 
              onClick={fetchOrders} 
              className="text-xs font-semibold gap-1.5 h-9 rounded-xl cursor-pointer border-slate-200 hover:bg-slate-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>
          </div>

          {/* Metric Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                Transaksi Berhasil
              </span>
              <div className="text-xl font-extrabold text-emerald-700 mt-1">
                {filteredOrders.filter(o => o.paymentStatus === "PAID" || !o.paymentStatus).length} <span className="text-xs font-normal text-slate-500">Selesai</span>
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
                  placeholder="Cari no. nota, nama pelanggan, metode..."
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
                  Semua Riwayat
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
                  { id: "CANCELLED", label: "Batal" },
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
                      const dateStr = o.createdAt ? new Date(o.createdAt).toLocaleString("id-ID", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                      }) : "-";

                      return (
                        <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shrink-0">
                                <Receipt className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <span>{o.orderNumber || `POS-${o.id.slice(0, 6)}`}</span>
                                <Badge
                                  className={`ml-2 text-[9px] font-bold px-1.5 py-0 rounded ${
                                    isPaid ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                                  }`}
                                >
                                  {isPaid ? "Lunas" : "Batal"}
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
                            <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded text-[11px]">
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
                                  title="Hapus"
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

        </div>

      </div>

      {/* Modal Detail & Cetak Struk */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-md p-6 bg-white border border-slate-200 rounded-3xl select-none">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-bold text-slate-900">
                Detail Transaksi #{selectedOrder?.orderNumber || "STRUK"}
              </DialogTitle>
              <Badge className={selectedOrder?.paymentStatus === "CANCELLED" ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"}>
                {selectedOrder?.paymentStatus === "CANCELLED" ? "Dibatalkan" : "Lunas"}
              </Badge>
            </div>
            <DialogDescription className="text-xs text-slate-500">
              Rincian item belanja dan status pembayaran kasir.
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
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Channel</span>
                  <span className="font-semibold text-slate-700">{selectedOrder.channel || "DINE_IN"}</span>
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
                      <div className="col-span-6 font-semibold text-slate-900">{it.menuName || "Item"}</div>
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

              {/* Admin Status Switch */}
              {isAdmin && (
                <div className="pt-2 border-t flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-500">Status:</span>
                    <button
                      disabled={statusUpdating}
                      onClick={() => handleUpdateStatus(selectedOrder.id, "PAID")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                        selectedOrder.paymentStatus === "PAID" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      Lunas
                    </button>
                    <button
                      disabled={statusUpdating}
                      onClick={() => handleUpdateStatus(selectedOrder.id, "CANCELLED")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                        selectedOrder.paymentStatus === "CANCELLED" ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      Batal
                    </button>
                  </div>

                  <button
                    onClick={() => handleDeleteOrder(selectedOrder.id, selectedOrder.orderNumber || selectedOrder.id)}
                    className="text-rose-600 hover:text-rose-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus
                  </button>
                </div>
              )}

              <DialogFooter className="pt-2 border-t flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDetailOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Tutup
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => window.print()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Struk</span>
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

