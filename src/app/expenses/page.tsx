"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Plus, 
  CreditCard, 
  Sparkles, 
  Search, 
  Calendar as CalendarIcon, 
  Pencil, 
  Trash2, 
  RefreshCw, 
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FilterX,
  Camera,
  Receipt,
  Eye
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
import { CashInOutModal, CashTransactionPayload } from "@/components/cash-flow/CashInOutModal";
import { ReceiptProofModal } from "@/components/cash-flow/ReceiptProofModal";

export default function ExpensesPage() {
  const { isAdmin } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Date Filter State
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [isCashInOutModalOpen, setIsCashInOutModalOpen] = useState(false);
  const [selectedProofExpense, setSelectedProofExpense] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [form, setForm] = useState({
    amount: 0,
    note: "",
    employeeName: "Staf Outlet",
  });

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/data?type=expenses");
      if (res.ok) {
        const json = await res.json();
        setExpenses(Array.isArray(json) ? json : []);
      } else {
        setExpenses([]);
      }
    } catch (e) {
      console.error(e);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateRange, pageSize]);

  const handleCashInOutSuccess = async (data: CashTransactionPayload) => {
    try {
      setSubmitting(true);
      const res = await fetch("/api/data?type=save_expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(data.amount),
          note: data.catatan,
          employeeName: data.petugas,
          receiptImage: data.receiptImage,
        }),
      });

      if (res.ok) {
        await fetchExpenses();
      } else {
        // Optimistic local add
        const newExp = {
          id: "exp-" + Date.now(),
          amount: data.amount,
          note: data.catatan,
          employeeName: data.petugas,
          timestamp: new Date(),
          receiptImage: data.receiptImage,
          voucherNumber: data.voucherNumber,
          isFromScan: Boolean(data.receiptImage),
        };
        setExpenses([newExp, ...expenses]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (ex: any) => {
    setEditingExpense(ex);
    setForm({
      amount: Number(ex.amount) || 0,
      note: ex.note || "",
      employeeName: ex.employeeName || "Staf Outlet",
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.note.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/data?type=save_expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingExpense?.id || undefined,
          ...form,
          amount: Number(form.amount),
        }),
      });

      if (res.ok) {
        setIsEditModalOpen(false);
        await fetchExpenses();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, note: string) => {
    if (!confirm(`Hapus catatan kas keluar "${note}"?`)) return;
    try {
      const res = await fetch("/api/data?type=delete_expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) await fetchExpenses();
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered Expenses with Date Range
  const filteredExpenses = useMemo(() => {
    return expenses.filter((ex) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q ||
        (ex.note || "").toLowerCase().includes(q) ||
        (ex.employeeName || "").toLowerCase().includes(q);

      let matchDate = true;
      if (dateRange?.from) {
        const itemDate = new Date(ex.timestamp || ex.createdAt || ex.expenseDate);
        if (dateRange.to) {
          matchDate = isWithinInterval(itemDate, {
            start: startOfDay(dateRange.from),
            end: endOfDay(dateRange.to),
          });
        } else {
          matchDate = isSameDay(itemDate, dateRange.from);
        }
      }

      return matchQuery && matchDate;
    });
  }, [expenses, searchQuery, dateRange]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  
  const paginatedExpenses = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * pageSize;
    return filteredExpenses.slice(startIndex, startIndex + pageSize);
  }, [filteredExpenses, validCurrentPage, pageSize]);

  const totalExpenseAmount = filteredExpenses.reduce((sum, ex) => sum + (Number(ex.amount) || 0), 0);
  const scannedCount = filteredExpenses.filter((ex) => ex.isFromScan || (ex.note && ex.note.includes("AI Nota")) || ex.receiptImage).length;

  const startRecord = filteredExpenses.length > 0 ? (validCurrentPage - 1) * pageSize + 1 : 0;
  const endRecord = Math.min(validCurrentPage * pageSize, filteredExpenses.length);

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto text-slate-900 space-y-6">
        
        {/* Prominent Outer Card Container */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-2xs space-y-6">
          
          {/* Card Header & Main Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Biaya Operasional</h2>
                {isAdmin && (
                  <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold">
                    Admin
                  </Badge>
                )}
                {scannedCount > 0 && (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    {scannedCount} Pindai Nota AI
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Pencatatan kas keluar operasional dengan verifikasi foto nota dan slip kas.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={fetchExpenses} className="text-xs gap-1.5 min-h-[40px] rounded-xl cursor-pointer">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Segarkan</span>
              </Button>
              {isAdmin && (
                <Button
                  onClick={() => setIsCashInOutModalOpen(true)}
                  className="bg-stone-800 hover:bg-stone-900 text-white font-semibold text-xs px-4 py-2.5 rounded-xl min-h-[40px] gap-2 shadow-xs shrink-0 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Catat Pengeluaran</span>
                </Button>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Total Pengeluaran</div>
              <div className="text-lg font-extrabold text-rose-600 mt-0.5">Rp {totalExpenseAmount.toLocaleString("id-ID")}</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Jumlah Transaksi</div>
              <div className="text-lg font-extrabold text-slate-900 mt-0.5">{filteredExpenses.length} Catatan</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Bukti Nota Terlampir</div>
              <div className="text-lg font-extrabold text-emerald-600 mt-0.5">{scannedCount} Nota Terverifikasi</div>
            </div>
          </div>

          {/* Filter Bar (Search + DatePicker Range) */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Cari keterangan pengeluaran atau nama pencatat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200 text-xs font-medium min-h-[38px] rounded-xl w-full"
              />
            </div>

            <DatePickerWithRange
              date={dateRange}
              setDate={setDateRange}
              placeholder="Pilih Rentang Tanggal"
            />
          </div>

          {/* Active Filter Indicators */}
          {(searchQuery || dateRange?.from) && (
            <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200/60 text-xs">
              <span className="text-slate-600 font-medium">
                Ditemukan <strong className="text-slate-900">{filteredExpenses.length}</strong> pengeluaran sesuai filter.
              </span>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setDateRange(undefined);
                }}
                className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <FilterX className="w-3.5 h-3.5" />
                <span>Atur Ulang</span>
              </button>
            </div>
          )}

          {/* Inner Data Table Box Container */}
          <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
            <div className="divide-y divide-slate-100 text-xs">
              {paginatedExpenses.length > 0 ? (
                paginatedExpenses.map((ex) => {
                  const isScan = ex.isFromScan || (ex.note && ex.note.includes("AI Nota")) || ex.receiptImage;
                  const dateStr = ex.timestamp ? new Date(ex.timestamp).toLocaleString("id-ID") : "-";

                  return (
                    <div key={ex.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap font-bold text-slate-900">
                          <span>{ex.note || "Beban Operasional"}</span>
                          {ex.receiptImage ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Camera className="w-2.5 h-2.5 text-emerald-600" /> Foto Nota
                            </span>
                          ) : isScan ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5 text-emerald-600" /> AI Nota
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-600 text-[9px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Receipt className="w-2.5 h-2.5 text-slate-500" /> E-Nota Slip
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-normal flex items-center gap-2">
                          <span>Pencatat: {ex.employeeName || "Staf Outlet"}</span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3 text-slate-400" /> {dateStr}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-rose-600 text-sm">
                          - Rp {Number(ex.amount || 0).toLocaleString("id-ID")}
                        </span>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedProofExpense(ex)}
                          className="text-[11px] h-7 px-2 rounded-lg border-slate-300 text-slate-700 hover:bg-slate-100 gap-1 cursor-pointer"
                          title="Buka Popup Bukti Nota"
                        >
                          <Eye className="w-3 h-3 text-indigo-600" />
                          <span>Lihat Nota</span>
                        </Button>

                        {isAdmin && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditModal(ex)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Pengeluaran"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(ex.id, ex.note)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Pengeluaran"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center text-slate-400">
                  {searchQuery || dateRange?.from ? "Tidak ada pengeluaran sesuai filter." : "Belum ada pengeluaran dicatat."}
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {filteredExpenses.length > 0 && (
              <div className="px-6 py-4 bg-slate-50/70 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3 text-slate-500 font-medium">
                  <span>
                    Menampilkan <strong className="text-slate-800">{startRecord}</strong> - <strong className="text-slate-800">{endRecord}</strong> dari <strong className="text-slate-800">{filteredExpenses.length}</strong> catatan
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
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={validCurrentPage <= 1}
                    className="h-8 w-8 p-0 rounded-lg cursor-pointer bg-white"
                  >
                    <ChevronsLeft className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={validCurrentPage <= 1}
                    className="h-8 w-8 p-0 rounded-lg cursor-pointer bg-white"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>

                  <span className="px-2 font-bold text-slate-700">
                    Hal {validCurrentPage} / {totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={validCurrentPage >= totalPages}
                    className="h-8 w-8 p-0 rounded-lg cursor-pointer bg-white"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={validCurrentPage >= totalPages}
                    className="h-8 w-8 p-0 rounded-lg cursor-pointer bg-white"
                  >
                    <ChevronsRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Modal Input Kas Masuk / Keluar With Receipt Photo */}
      <CashInOutModal
        isOpen={isCashInOutModalOpen}
        onClose={() => setIsCashInOutModalOpen(false)}
        onSuccess={handleCashInOutSuccess}
        defaultType="OUT"
      />

      {/* Modal Popup Bukti Nota / E-Nota Preview */}
      <ReceiptProofModal
        isOpen={Boolean(selectedProofExpense)}
        onClose={() => setSelectedProofExpense(null)}
        transaction={selectedProofExpense}
      />

      {/* Modal Edit Simple Expense */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Edit Catatan Pengeluaran Kas
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Perbarui rincian beban operasional outlet.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-3.5 py-2 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Keterangan Pengeluaran *</label>
              <Input
                autoFocus
                placeholder="cth: Tagihan Listrik & Internet"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="text-xs font-medium min-h-[38px] rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Nominal (Rp) *</label>
                <Input
                  type="number"
                  placeholder="50000"
                  value={form.amount || ""}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                  className="text-xs font-bold text-rose-600 min-h-[38px] rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Nama Pencatat / Kas</label>
                <Input
                  placeholder="Kasir / Admin"
                  value={form.employeeName}
                  onChange={(e) => setForm({ ...form, employeeName: e.target.value })}
                  className="text-xs font-medium min-h-[38px] rounded-xl"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                className="text-xs rounded-xl min-h-[38px]"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold rounded-xl min-h-[38px]"
              >
                {submitting ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
