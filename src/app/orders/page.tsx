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
  FilterX
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

  // Reset pagination when search query, status, or date range changes
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
    if (!confirm(`PERINGATAN ADMIN: Hapus transaksi ${orderNumber} secara permanen?`)) return;

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

      // Date filtering
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

  // Paginated Orders
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
      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto text-slate-900 space-y-6">
        
        {/* Prominent Outer Card Container */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-2xs space-y-6">
          
          {/* Card Header & Main Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Riwayat Transaksi & Struk Kasir</h2>
                {isAdmin && (
                  <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold">
                    Admin Full Access
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Pantau seluruh transaksi kasir, rincian struk belanja, status pembayaran, dan cetak ulang nota.
              </p>
            </div>

            <Button size="sm" variant="outline" onClick={fetchOrders} className="text-xs gap-1.5 min-h-[40px] rounded-xl cursor-pointer">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase">
                {filterMode === "TODAY" ? "Total Omset Hari Ini" : filterMode === "ALL" ? "Total Omset Semua Riwayat" : "Total Omset Periode"}
              </div>
              <div className="text-lg font-extrabold text-slate-900 mt-0.5">Rp {totalRevenue.toLocaleString("id-ID")}</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase">
                {filterMode === "TODAY" ? "Transaksi Hari Ini" : "Total Transaksi"}
              </div>
              <div className="text-lg font-extrabold text-slate-900 mt-0.5">{filteredOrders.length} Transaksi</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Transaksi Berhasil</div>
              <div className="text-lg font-extrabold text-emerald-600 mt-0.5">
                {filteredOrders.filter(o => o.paymentStatus === "PAID" || !o.paymentStatus).length} Selesai
              </div>
            </div>
          </div>

          {/* Mode Selector & Filter Bar (Hari Ini vs Semua Riwayat + Search + DatePicker Range + Status) */}
          <div className="space-y-3">
            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
              {/* Search Input */}
              <div className="relative flex-1 w-full min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="Cari no. struk / order, nama pelanggan, atau metode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-slate-50 border-slate-200 text-xs font-medium min-h-[38px] rounded-xl w-full"
                />
              </div>

              {/* View Mode Toggle: Hari Ini (Default) vs Semua Riwayat */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setFilterMode("TODAY");
                    setDateRange({
                      from: startOfDay(new Date()),
                      to: endOfDay(new Date()),
                    });
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterMode === "TODAY"
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  📅 Hari Ini (Default)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilterMode("ALL");
                    setDateRange(undefined);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterMode === "ALL"
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  🌐 Semua Riwayat Transaksi
                </button>
              </div>

              {/* DatePicker Range Component */}
              <DatePickerWithRange
                date={dateRange}
                setDate={(range) => {
                  setFilterMode(range ? "CUSTOM" : "ALL");
                  setDateRange(range);
                }}
                placeholder="Pilih Rentang Tanggal"
                className="w-full lg:w-auto"
              />

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto shrink-0">
                {["ALL", "PAID", "CANCELLED"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 min-h-[38px] ${
                      selectedStatus === status 
                        ? "bg-stone-800 text-white shadow-xs" 
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {status === "ALL" ? "Semua Status" : status === "PAID" ? "Lunas (PAID)" : "Dibatalkan (CANCEL)"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Filter Indicators if any */}
          <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200/60 text-xs">
            <span className="text-slate-600 font-medium">
              {filterMode === "TODAY" ? (
                <>📅 Menampilkan <strong className="text-slate-900">Transaksi Hari Ini</strong> ({filteredOrders.length} transaksi)</>
              ) : filterMode === "ALL" ? (
                <>🌐 Menampilkan <strong className="text-slate-900">Semua Histori Transaksi</strong> ({filteredOrders.length} transaksi)</>
              ) : (
                <>📆 Menampilkan Transaksi Rentang Tanggal Terpilih ({filteredOrders.length} transaksi)</>
              )}
            </span>
            
            {filterMode !== "ALL" && (
              <button
                type="button"
                onClick={() => {
                  setFilterMode("ALL");
                  setDateRange(undefined);
                }}
                className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Lihat Semua Riwayat &rarr;</span>
              </button>
            )}
          </div>

          {/* Inner Data Table Box Container */}
          <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
            {/* Header Row */}
            <div className="grid grid-cols-12 px-6 py-3.5 bg-slate-50/70 border-b text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
              <div className="col-span-3">ORDER / STRUK</div>
              <div className="col-span-3">PELANGGAN & WAKTU</div>
              <div className="col-span-2 text-center">METODE BAYAR</div>
              <div className="col-span-2 text-right">TOTAL NOMINAL</div>
              <div className="col-span-2 text-right">AKSI</div>
            </div>

            {/* Content Rows or Empty State */}
            <div className="divide-y divide-slate-100">
              {paginatedOrders.length > 0 ? (
                paginatedOrders.map((o) => {
                  const isPaid = (o.paymentStatus || "PAID") === "PAID";
                  const dateStr = o.createdAt ? new Date(o.createdAt).toLocaleString("id-ID", {
                    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                  }) : "-";

                  return (
                    <div key={o.id} className="grid grid-cols-12 px-6 py-3.5 items-center text-xs hover:bg-slate-50/60 transition-colors">
                      <div className="col-span-3 font-bold text-slate-900 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                          <Receipt className="w-4 h-4" />
                        </div>
                        <div>
                          <span>{o.orderNumber || `POS-${o.id.slice(0, 6)}`}</span>
                          <span className={`block text-[10px] font-bold ${isPaid ? "text-emerald-600" : "text-rose-600"}`}>
                            {isPaid ? "LUNAS (PAID)" : "DIBATALKAN"}
                          </span>
                        </div>
                      </div>

                      <div className="col-span-3 text-slate-600 font-medium">
                        <div className="font-semibold text-slate-900">{o.customerName || "Pelanggan Toko"}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" /> {dateStr}
                        </div>
                      </div>

                      <div className="col-span-2 text-center">
                        <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded text-[11px]">
                          {o.paymentMethod || "TUNAI"}
                        </span>
                      </div>

                      <div className="col-span-2 text-right font-extrabold text-slate-900">
                        Rp {Number(o.totalAmount || 0).toLocaleString("id-ID")}
                      </div>

                      <div className="col-span-2 text-right flex items-center justify-end gap-1">
                        <button
                          onClick={() => openDetailModal(o)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Lihat Detail & Cetak Nota"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteOrder(o.id, o.orderNumber || `POS-${o.id.slice(0, 6)}`)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Transaksi (Admin)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100/70 text-slate-400 flex items-center justify-center mx-auto">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">Belum ada riwayat transaksi</h4>
                    <p className="text-xs text-slate-400 mt-1 font-medium">
                      {searchQuery || dateRange?.from || selectedStatus !== "ALL"
                        ? "Tidak ada transaksi yang cocok dengan filter yang dipilih."
                        : "Transaksi yang dibuat dari kasir POS akan otomatis tercatat di sini."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Pagination Controls Footer */}
            {filteredOrders.length > 0 && (
              <div className="px-6 py-4 bg-slate-50/70 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                {/* Info Text & Page Size Selector */}
                <div className="flex items-center gap-3 text-slate-500 font-medium">
                  <span>
                    Menampilkan <strong className="text-slate-800">{startRecord}</strong> - <strong className="text-slate-800">{endRecord}</strong> dari <strong className="text-slate-800">{filteredOrders.length}</strong> transaksi
                  </span>
                  <div className="hidden sm:flex items-center gap-1.5 ml-2 pl-3 border-l border-slate-200">
                    <span className="text-[11px] text-slate-400">Tampilkan:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg px-2 py-1 outline-none cursor-pointer"
                    >
                      <option value={10}>10 / hal</option>
                      <option value={20}>20 / hal</option>
                      <option value={50}>50 / hal</option>
                      <option value={100}>100 / hal</option>
                    </select>
                  </div>
                </div>

                {/* Pagination Page Navigation */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={validCurrentPage <= 1}
                    className="h-8 w-8 p-0 rounded-lg cursor-pointer bg-white"
                    title="Halaman Pertama"
                  >
                    <ChevronsLeft className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={validCurrentPage <= 1}
                    className="h-8 w-8 p-0 rounded-lg cursor-pointer bg-white"
                    title="Halaman Sebelumnya"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>

                  {/* Page numbers */}
                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        return (
                          page === 1 ||
                          page === totalPages ||
                          Math.abs(page - validCurrentPage) <= 1
                        );
                      })
                      .map((page, index, array) => {
                        const showEllipsis = index > 0 && page - array[index - 1] > 1;
                        return (
                          <React.Fragment key={page}>
                            {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                            <button
                              onClick={() => setCurrentPage(page)}
                              className={`h-8 min-w-[32px] px-2 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                                validCurrentPage === page
                                  ? "bg-stone-800 text-white shadow-xs"
                                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        );
                      })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={validCurrentPage >= totalPages}
                    className="h-8 w-8 p-0 rounded-lg cursor-pointer bg-white"
                    title="Halaman Berikutnya"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={validCurrentPage >= totalPages}
                    className="h-8 w-8 p-0 rounded-lg cursor-pointer bg-white"
                    title="Halaman Terakhir"
                  >
                    <ChevronsRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Modal Detail Order & Reprint */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
              <span>Detail Transaksi #{selectedOrder?.orderNumber || "STRUK"}</span>
              <Badge className={selectedOrder?.paymentStatus === "CANCELLED" ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"}>
                {selectedOrder?.paymentStatus || "PAID"}
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Rincian item belanjaan dan log pembayaran kasir POS.
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Pelanggan:</span>
                  <span className="font-bold text-slate-900">{selectedOrder.customerName || "Pelanggan Toko"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Metode Pembayaran:</span>
                  <span className="font-bold text-slate-900">{selectedOrder.paymentMethod || "TUNAI"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Waktu Transaksi:</span>
                  <span className="font-semibold text-slate-700">{new Date(selectedOrder.createdAt).toLocaleString("id-ID")}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Channel Penjualan:</span>
                  <span className="font-semibold text-slate-700">{selectedOrder.channel || "DINE_IN"}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="border rounded-xl divide-y overflow-hidden">
                <div className="bg-slate-100/70 px-3 py-2 font-bold text-slate-700 grid grid-cols-12">
                  <div className="col-span-6">Item Menu</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-4 text-right">Subtotal</div>
                </div>
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((it: any, idx: number) => (
                    <div key={it.id || idx} className="px-3 py-2 grid grid-cols-12 items-center text-[11px]">
                      <div className="col-span-6 font-semibold text-slate-900">{it.menuName || "Item POS"}</div>
                      <div className="col-span-2 text-center font-bold text-slate-700">{it.quantity}</div>
                      <div className="col-span-4 text-right font-bold text-slate-900">
                        Rp {Number(it.subtotal || it.price * it.quantity || 0).toLocaleString("id-ID")}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-slate-400">Rincian item ringkas</div>
                )}
              </div>

              {/* Pricing Breakdown */}
              <div className="space-y-1 text-right pt-2 border-t text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>Rp {Number(selectedOrder.subtotal || selectedOrder.totalAmount || 0).toLocaleString("id-ID")}</span>
                </div>
                {Number(selectedOrder.discount) > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>Diskon Promo:</span>
                    <span>- Rp {Number(selectedOrder.discount).toLocaleString("id-ID")}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t">
                  <span>Total Transaksi:</span>
                  <span>Rp {Number(selectedOrder.totalAmount || 0).toLocaleString("id-ID")}</span>
                </div>
              </div>

              {/* Admin Actions */}
              {isAdmin && (
                <div className="pt-3 border-t flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500">Ubah Status:</span>
                    <button
                      disabled={statusUpdating}
                      onClick={() => handleUpdateStatus(selectedOrder.id, "PAID")}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                        selectedOrder.paymentStatus === "PAID" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      Lunas (PAID)
                    </button>
                    <button
                      disabled={statusUpdating}
                      onClick={() => handleUpdateStatus(selectedOrder.id, "CANCELLED")}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                        selectedOrder.paymentStatus === "CANCELLED" ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      Batalkan
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

              <DialogFooter className="pt-2 flex items-center justify-between sm:justify-between w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDetailOpen(false)}
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
