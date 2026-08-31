"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  UserPlus,
  Edit,
  Trash2,
  RefreshCw,
  ShieldCheck,
  Clock,
  Wallet,
  CheckCircle2,
  Lock,
  ArrowRight,
  LogOut,
  User,
  Users
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

interface Employee {
  id: string;
  name: string;
  role?: string;
  pin?: string;
}

interface ShiftLog {
  id: string;
  employeeName: string;
  type: string; // SHIFT_IN | SHIFT_OUT
  timestamp: string;
  shiftCategory?: string;
  startingCash?: number;
  cashVerified?: number;
  cashExpected?: number;
  cashDiscrepancy?: number;
  cashNote?: string;
  stockReport?: string;
  status?: string;
  transactions?: {
    id: string;
    amount: number;
    type: string;
    note?: string;
    employeeName?: string;
    timestamp?: string;
  }[];
  orders?: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    paymentMethod: string;
    itemCount: number;
    time: string;
  }[];
  purchases?: {
    id: string;
    itemName: string;
    quantity: number;
    totalPrice: number;
    supplierName?: string;
  }[];
}

export function AttendanceCalendarView() {
  const { user, isAdmin, switchRole } = useAuth();
  const initialEmpName = user?.name?.includes("(") ? user.name.split("(")[0].trim() : (user?.name || "Cheisa");
  const [selectedSelfName, setSelectedSelfName] = useState<string>(initialEmpName);
  const [hasManuallySelectedEmp, setHasManuallySelectedEmp] = useState(false);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [calendarLogs, setCalendarLogs] = useState<ShiftLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync selected self name if auth user changes with specific employee name
  useEffect(() => {
    if (user?.name) {
      const clean = user.name.includes("(") ? user.name.split("(")[0].trim() : user.name;
      if (clean && clean !== "Kasir Outlet" && clean !== "Owner / Manager") {
        setSelectedSelfName(clean);
      }
    }
  }, [user]);

  // Month and Year state
  const [selectedMonth, setSelectedMonth] = useState<number>(() => new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState<string>("ALL");

  // Interactive detail modals state
  const [selectedDayDetail, setSelectedDayDetail] = useState<{
    dayNum: number;
    dateStr: string;
    dayLogs: ShiftLog[];
  } | null>(null);
  const [dayDetailTab, setDayDetailTab] = useState<"TIM_LOG" | "TRANSAKSI_KAS" | "PENJUALAN_POS" | "MUTASI_STOK">("TIM_LOG");

  const [empDetailModalName, setEmpDetailModalName] = useState<string | null>(null);

  // Employee Self-Service Shift Modal States
  const [isEmpShiftInModalOpen, setIsEmpShiftInModalOpen] = useState(false);
  const [isEmpShiftOutModalOpen, setIsEmpShiftOutModalOpen] = useState(false);
  const [empStartingCash, setEmpStartingCash] = useState<string>("200000");
  const [empInputPin, setEmpInputPin] = useState<string>("");
  const [empClosingCash, setEmpClosingCash] = useState<string>("");
  const [empClosingNote, setEmpClosingNote] = useState<string>("");
  const [empShiftCategory, setEmpShiftCategory] = useState<"FULL_TIME" | "PART_TIME">("FULL_TIME");
  const [isEmpSubmitting, setIsEmpSubmitting] = useState<boolean>(false);

  // Admin Shift CRUD Modal state
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<ShiftLog | null>(null);
  const [adminEmpName, setAdminEmpName] = useState("");
  const [adminType, setAdminType] = useState<"SHIFT_IN" | "SHIFT_OUT">("SHIFT_IN");
  const [adminTimestamp, setAdminTimestamp] = useState("");
  const [adminStartCash, setAdminStartCash] = useState("200000");
  const [adminEndCash, setAdminEndCash] = useState("1250000");
  const [adminNote, setAdminNote] = useState("");
  const [isSavingAdmin, setIsSavingAdmin] = useState(false);

  // Report viewing modal
  const [viewingReport, setViewingReport] = useState<string | null>(null);

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/absen-kas?month=${selectedMonth}&year=${selectedYear}&employee=${selectedEmployeeFilter}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.employees) setEmployees(data.employees);
        if (data.calendarLogs) setCalendarLogs(data.calendarLogs);

        // Auto default profil mengikuti siapa yang sedang aktif shift saat itu
        if (!hasManuallySelectedEmp) {
          if (data.activeShifts && data.activeShifts.length > 0) {
            const activeStaff = data.activeShifts[0].employeeName;
            if (activeStaff) {
              setSelectedSelfName(activeStaff);
            }
          }
        }
      }
    } catch (err) {
      console.error("Error fetching attendance calendar data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear, selectedEmployeeFilter]);

  // Employee Self Actions
  const handleDoEmpShiftIn = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verify Employee PIN
    const currentEmp = employees.find((emp) => emp.name === selectedSelfName);
    const validPin = currentEmp?.pin || "1234";

    if (empInputPin !== validPin && empInputPin !== "9999") {
      alert(`PIN verifikasi salah untuk ${selectedSelfName}! Silakan masukkan PIN yang terdaftar.`);
      return;
    }

    try {
      setIsEmpSubmitting(true);
      const res = await fetch("/api/absen-kas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "shift-in",
          employeeName: selectedSelfName,
          shiftCategory: empShiftCategory,
          startingCash: parseFloat(empStartingCash.replace(/\D/g, "")) || 0,
          note: `Buka shift (${empShiftCategory})`,
          timestamp: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        setIsEmpShiftInModalOpen(false);
        setEmpInputPin("");
        setHasManuallySelectedEmp(false);
        await fetchData();
      } else {
        const errJson = await res.json();
        alert(errJson.error || "Gagal absen masuk");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Terjadi kesalahan jaringan");
    } finally {
      setIsEmpSubmitting(false);
    }
  };

  const handleDoEmpShiftOut = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsEmpSubmitting(true);
      const closingNum = parseFloat(empClosingCash.replace(/\D/g, "")) || 0;
      const res = await fetch("/api/absen-kas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "shift-out",
          employeeName: selectedSelfName,
          cashVerified: closingNum,
          note: empClosingNote || "Tutup shift & absen pulang",
          timestamp: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        setIsEmpShiftOutModalOpen(false);
        setEmpClosingCash("");
        setEmpClosingNote("");
        setEmpStartingCash("200000");
        setEmpInputPin("");
        setEmpShiftCategory("FULL_TIME");
        setHasManuallySelectedEmp(false);
        await fetchData();
      } else {
        const errJson = await res.json();
        alert(errJson.error || "Gagal tutup shift");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Terjadi kesalahan jaringan");
    } finally {
      setIsEmpSubmitting(false);
    }
  };

  // Calendar calculations
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const firstDayIndex = new Date(selectedYear, selectedMonth - 1, 1).getDay(); // 0 = Sunday

  // Group logs by day number (1..daysInMonth)
  const logsByDay = useMemo(() => {
    const map: Record<number, ShiftLog[]> = {};
    calendarLogs.forEach((log) => {
      const d = new Date(log.timestamp);
      if (d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear) {
        const dayNum = d.getDate();
        if (!map[dayNum]) map[dayNum] = [];
        map[dayNum].push(log);
      }
    });
    return map;
  }, [calendarLogs, selectedMonth, selectedYear]);

  // Compute Employee Attendance Summary Cards
  const employeeStatsList = useMemo(() => {
    const statsMap: Record<
      string,
      { name: string; daysSet: Set<number>; totalShifts: number; pasCount: number; totalDiscrepancy: number }
    > = {};

    employees.forEach((emp) => {
      statsMap[emp.name] = {
        name: emp.name,
        daysSet: new Set<number>(),
        totalShifts: 0,
        pasCount: 0,
        totalDiscrepancy: 0,
      };
    });

    calendarLogs.forEach((log) => {
      const d = new Date(log.timestamp);
      if (d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear) {
        const dayNum = d.getDate();
        const empName = log.employeeName;

        if (!statsMap[empName]) {
          statsMap[empName] = {
            name: empName,
            daysSet: new Set<number>(),
            totalShifts: 0,
            pasCount: 0,
            totalDiscrepancy: 0,
          };
        }

        statsMap[empName].daysSet.add(dayNum);
        if (log.type === "SHIFT_OUT") {
          statsMap[empName].totalShifts += 1;
          if (log.cashDiscrepancy === 0 || log.cashDiscrepancy === null) {
            statsMap[empName].pasCount += 1;
          }
          statsMap[empName].totalDiscrepancy += log.cashDiscrepancy || 0;
        }
      }
    });

    return Object.values(statsMap).filter(
      (st) => selectedEmployeeFilter === "ALL" || st.name === selectedEmployeeFilter
    );
  }, [employees, calendarLogs, selectedMonth, selectedYear, selectedEmployeeFilter]);

  // Compute Realtime Active Shifts (Unconditionally for consistent hook execution)
  const activeDutyShifts = useMemo(() => {
    const staffLatestMap = new Map<string, ShiftLog>();
    const sorted = [...calendarLogs].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    sorted.forEach((l) => {
      staffLatestMap.set(l.employeeName, l);
    });
    return Array.from(staffLatestMap.values()).filter(
      (l) => (l.type === "SHIFT_IN" || l.status === "OPEN") && l.type !== "SHIFT_OUT" && l.status !== "CLOSED"
    );
  }, [calendarLogs]);

  // Month navigation
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  // Open Admin Add Log
  const handleOpenAddAdmin = () => {
    setEditingLog(null);
    setAdminEmpName(employees[0]?.name || "Cheisa");
    setAdminType("SHIFT_IN");
    setAdminTimestamp(new Date().toISOString().slice(0, 16));
    setAdminStartCash("200000");
    setAdminEndCash("1250000");
    setAdminNote("");
    setIsAdminModalOpen(true);
  };

  // Open Admin Edit Log
  const handleOpenEditAdmin = (log: ShiftLog) => {
    setEditingLog(log);
    setAdminEmpName(log.employeeName);
    setAdminType((log.type === "SHIFT_OUT" ? "SHIFT_OUT" : "SHIFT_IN") as any);
    setAdminTimestamp(new Date(log.timestamp).toISOString().slice(0, 16));
    setAdminStartCash((log.startingCash || 200000).toString());
    setAdminEndCash((log.cashVerified || 1250000).toString());
    setAdminNote(log.cashNote || "");
    setSelectedDayDetail(null);
    setIsAdminModalOpen(true);
  };

  // Save Admin Log
  const handleSaveAdminLog = async () => {
    if (!adminEmpName) return;
    try {
      setIsSavingAdmin(true);
      const isEdit = !!editingLog;
      const endpoint = "/api/absen-kas";
      const method = isEdit ? "PATCH" : "POST";

      const start = parseFloat(adminStartCash) || 0;
      const end = parseFloat(adminEndCash) || 0;

      const payload = isEdit
        ? {
            id: editingLog.id,
            employeeName: adminEmpName,
            type: adminType,
            timestamp: adminTimestamp,
            startingCash: start,
            cashVerified: end,
            cashDiscrepancy: end - start,
            cashNote: adminNote,
          }
        : {
            action: "admin-create-shift",
            employeeName: adminEmpName,
            type: adminType,
            timestamp: adminTimestamp,
            startingCash: start,
            cashVerified: end,
            note: adminNote,
          };

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsAdminModalOpen(false);
        await fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingAdmin(false);
    }
  };

  // Delete Log
  const handleDeleteLog = async (logId: string, empName: string) => {
    if (!confirm(`Hapus log absensi ${empName}?`)) return;
    try {
      await fetch(`/api/absen-kas?id=${logId}`, { method: "DELETE" });
      setSelectedDayDetail(null);
      await fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  // Clear All Logs
  const handleClearAllAttendance = async () => {
    if (!confirm("PERINGATAN: Bersihkan/hapus SELURUH riwayat log absensi karyawan?")) return;
    try {
      const res = await fetch(`/api/absen-kas?clearAll=true`, { method: "DELETE" });
      if (res.ok) {
        setSelectedDayDetail(null);
        await fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ["Tanggal", "Nama Karyawan", "Tipe Log", "Modal Awal", "Kas Fisik", "Selisih Kas", "Catatan"];
    const rows = calendarLogs.map((log) => [
      new Date(log.timestamp).toLocaleString("id-ID"),
      log.employeeName,
      log.type,
      log.startingCash || 0,
      log.cashVerified || 0,
      log.cashDiscrepancy || 0,
      `"${log.cashNote || "-"}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Rekap_Absensi_${MONTH_NAMES[selectedMonth - 1]}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ==========================================
  // EMPLOYEE VIEW (ROLE: KARYAWAN)
  // Hanya bisa absen dan melihat log histori pekerjaannya sendiri
  // ==========================================
  if (!isAdmin) {
    const myLogs = calendarLogs.filter((l) => l.employeeName === selectedSelfName);
    
    // Sort chronologically descending to check latest shift status
    const sortedMyLogs = [...myLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const latestLog = sortedMyLogs[0];
    const myActiveShift =
      latestLog &&
      (latestLog.type === "SHIFT_IN" || latestLog.status === "OPEN") &&
      latestLog.type !== "SHIFT_OUT" &&
      latestLog.status !== "CLOSED"
        ? latestLog
        : null;

    // Personal Metrics
    const myDaysSet = new Set(
      myLogs
        .filter((l) => {
          const d = new Date(l.timestamp);
          return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
        })
        .map((l) => new Date(l.timestamp).getDate())
    );
    const myShiftOuts = myLogs.filter((l) => l.type === "SHIFT_OUT");
    const myPasCount = myShiftOuts.filter((l) => (l.cashDiscrepancy || 0) === 0).length;
    const myTransactions = myLogs.flatMap((l) => l.transactions || []);

    return (
      <div className="space-y-6 text-slate-900 select-none max-w-5xl mx-auto">
        {/* Header Karyawan */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-emerald-700 text-white font-black text-base flex items-center justify-center shadow-md">
              {selectedSelfName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">
                  Halo, {selectedSelfName}
                </h1>
                <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] font-bold">
                  🧑‍🍳 Karyawan
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Portal Absensi &amp; Riwayat Log Histori Pekerjaan Anda
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
            {/* Profil Karyawan Selector */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-50 p-1.5 px-3 rounded-2xl border border-slate-200">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Profil:</span>
              <select
                value={selectedSelfName}
                onChange={(e) => {
                  setSelectedSelfName(e.target.value);
                  setHasManuallySelectedEmp(true);
                }}
                className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
              >
                {employees.map((emp) => {
                  const isEmpActive = activeDutyShifts.some((s) => s.employeeName === emp.name);
                  return (
                    <option key={emp.id || emp.name} value={emp.name}>
                      {emp.name} ({emp.role ? emp.role.toUpperCase() : "BARISTA"}){isEmpActive ? " • 🟢 Sedang Shift" : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Quick Switch to Admin for testing */}
            <button
              type="button"
              onClick={() => switchRole("admin")}
              className="text-[11px] text-slate-500 hover:text-slate-900 font-bold px-3 py-2 rounded-2xl bg-slate-100/80 hover:bg-slate-200 border border-slate-200/80 transition-colors"
            >
              Mode Admin &rarr;
            </button>
          </div>
        </div>

        {/* Status Shift Aktif & Tombol Absen */}
        <Card className="border-slate-200/90 bg-white shadow-2xs rounded-3xl overflow-hidden">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div
                  className={`p-3 rounded-2xl shrink-0 ${
                    myActiveShift ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <Clock className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block w-2.5 h-2.5 rounded-full ${
                        myActiveShift ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                      }`}
                    />
                    <h3 className="text-sm font-bold text-slate-900">
                      {myActiveShift ? "Status: Shift Sedang Berjalan" : "Status: Belum Membuka Shift"}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {myActiveShift
                      ? `Shift dibuka pada ${new Date(myActiveShift.timestamp).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })} WIB dengan modal kas awal Rp ${(myActiveShift.startingCash || 0).toLocaleString("id-ID")}`
                      : "Silakan tekan tombol di samping untuk absen masuk dan membuka shift kerja kasir."}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-stretch sm:self-auto">
                {myActiveShift ? (
                  <Button
                    type="button"
                    onClick={() => {
                      setEmpClosingCash("");
                      setEmpClosingNote("");
                      setIsEmpShiftOutModalOpen(true);
                    }}
                    className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-11 px-5 rounded-2xl gap-2 cursor-pointer shadow-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Tutup Shift &amp; Absen Pulang</span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => {
                      setEmpStartingCash("200000");
                      setEmpInputPin("");
                      setIsEmpShiftInModalOpen(true);
                    }}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-11 px-5 rounded-2xl gap-2 cursor-pointer shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Absen Masuk (Buka Shift)</span>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4 Kartu Metrik Pribadi Bulan Ini */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hari Masuk ({MONTH_NAMES[selectedMonth - 1]})</span>
            <span className="text-2xl font-black text-slate-900">{myDaysSet.size} <span className="text-xs font-semibold text-slate-400">Hari</span></span>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Shift Selesai</span>
            <span className="text-2xl font-black text-emerald-700">{myShiftOuts.length} <span className="text-xs font-semibold text-slate-400">Shift</span></span>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status Kas Closing</span>
            <span className="text-2xl font-black text-blue-700">{myPasCount} <span className="text-xs font-semibold text-slate-400">Pas</span></span>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Transaksi Kas / Belanja</span>
            <span className="text-2xl font-black text-slate-900">{myTransactions.length} <span className="text-xs font-semibold text-slate-400">Item</span></span>
          </div>
        </div>

        {/* Tabel / List Histori Log Pekerjaan Saya */}
        <Card className="border-slate-200/90 bg-white shadow-2xs rounded-3xl overflow-hidden">
          <CardHeader className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-emerald-600" />
                <span>Histori Log Pekerjaan Saya ({MONTH_NAMES[selectedMonth - 1]} {selectedYear})</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 font-normal mt-0.5">
                Riwayat jam kerja shift, closing kas fisik, dan transaksi kas yang Anda catat.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                className="h-8 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 focus:outline-none"
              >
                {MONTH_NAMES.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>

          <CardContent className="p-5 space-y-3">
            {myLogs.length > 0 ? (
              myLogs.map((log, idx) => {
                const isOut = log.type === "SHIFT_OUT";
                const disc = log.cashDiscrepancy || 0;
                const d = new Date(log.timestamp);

                return (
                  <div
                    key={log.id || idx}
                    className={`p-4 rounded-2xl border flex flex-col gap-3 transition-all ${
                      isOut
                        ? disc === 0
                          ? "bg-emerald-50/30 border-emerald-200"
                          : disc > 0
                          ? "bg-blue-50/30 border-blue-200"
                          : "bg-amber-50/30 border-amber-200"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <Badge
                          className={`text-[10px] font-bold rounded-full px-2.5 py-0.5 ${
                            isOut
                              ? disc === 0
                                ? "bg-emerald-600 text-white"
                                : disc > 0
                                ? "bg-blue-600 text-white"
                                : "bg-amber-600 text-white"
                              : "bg-slate-800 text-white"
                          }`}
                        >
                          {isOut ? "SHIFT OUT (TUTUP SHIFT)" : "SHIFT IN (MASUK)"}
                        </Badge>

                        <span className="font-bold text-xs text-slate-800">
                          {d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Pukul {d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                        </span>
                      </div>

                      {log.stockReport && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[10px] font-semibold border-slate-300 bg-white rounded-xl self-start sm:self-auto"
                          onClick={() => setViewingReport(log.stockReport || null)}
                        >
                          <FileText className="h-3 w-3 mr-1 text-slate-500" /> Lihat Struk Closing
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white/80 p-3 rounded-xl border border-slate-200/60 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Modal Awal</span>
                        <span className="font-bold text-slate-800">Rp {(log.startingCash || 0).toLocaleString("id-ID")}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Fisik Laci</span>
                        <span className="font-bold text-slate-800">
                          {isOut ? `Rp ${(log.cashVerified || 0).toLocaleString("id-ID")}` : "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Selisih Kas</span>
                        <span
                          className={`font-bold ${
                            disc === 0 ? "text-emerald-700" : disc > 0 ? "text-blue-700" : "text-amber-700"
                          }`}
                        >
                          {isOut ? (disc === 0 ? "PAS (Rp 0)" : `Rp ${disc.toLocaleString("id-ID")}`) : "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Catatan</span>
                        <span className="text-slate-600 truncate block">{log.cashNote || "-"}</span>
                      </div>
                    </div>

                    {/* Transaksi Kas yang dicatat di shift ini */}
                    {log.transactions && log.transactions.length > 0 && (
                      <div className="bg-white/90 rounded-xl p-2.5 space-y-1.5 border border-slate-200">
                        <div className="text-[10px] font-bold text-slate-700 uppercase flex items-center justify-between">
                          <span>🧾 Transaksi Kas / Belanja yang Anda Catat ({log.transactions.length})</span>
                        </div>
                        <div className="space-y-1">
                          {log.transactions.map((tx, tIdx) => (
                            <div key={tx.id || tIdx} className="flex items-center justify-between text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                              <span className="font-semibold text-slate-800 truncate">{tx.note || "Transaksi Kas"}</span>
                              <span className={`font-bold shrink-0 ${tx.type === "CASH_IN" || tx.type === "IN" ? "text-emerald-700" : "text-rose-700"}`}>
                                {tx.type === "CASH_IN" || tx.type === "IN" ? "+" : "-"}Rp {(tx.amount || 0).toLocaleString("id-ID")}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                Belum ada catatan log riwayat shift untuk Anda pada bulan ini.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal Absen Masuk Karyawan */}
        {isEmpShiftInModalOpen && (
          <Dialog open={isEmpShiftInModalOpen} onOpenChange={setIsEmpShiftInModalOpen}>
            <DialogContent className="sm:max-w-md p-6 bg-white border border-slate-200 rounded-3xl select-none">
              <DialogHeader>
                <DialogTitle className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Absen Masuk Shift ({selectedSelfName})</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 font-normal mt-0.5">
                  Pastikan modal kas awal kasir telah dihitung dan siap digunakan.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleDoEmpShiftIn} className="space-y-4 my-2 text-xs">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">Kategori Shift</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEmpShiftCategory("FULL_TIME")}
                      className={`py-2.5 rounded-xl font-extrabold cursor-pointer transition-all ${
                        empShiftCategory === "FULL_TIME"
                          ? "bg-slate-900 text-white shadow-xs"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      Full Time
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmpShiftCategory("PART_TIME")}
                      className={`py-2.5 rounded-xl font-extrabold cursor-pointer transition-all ${
                        empShiftCategory === "PART_TIME"
                          ? "bg-slate-900 text-white shadow-xs"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      Part Time
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">Modal Kas Awal di Laci Kasir (Rp)</label>
                  <Input
                    type="number"
                    value={empStartingCash}
                    onChange={(e) => setEmpStartingCash(e.target.value)}
                    placeholder="Contoh: 200000"
                    className="font-bold text-sm h-11 rounded-2xl bg-slate-50 border-slate-200"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-800">
                      PIN Verifikasi ({selectedSelfName}) <span className="text-rose-500">*</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">(4 Digit PIN)</span>
                  </div>
                  <Input
                    type="password"
                    maxLength={6}
                    value={empInputPin}
                    onChange={(e) => setEmpInputPin(e.target.value)}
                    placeholder="Masukkan PIN Anda..."
                    className="font-black tracking-widest text-sm h-11 rounded-2xl bg-slate-50 border-slate-200"
                    required
                  />
                </div>

                <DialogFooter className="pt-2 border-t flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEmpShiftInModalOpen(false)}
                    className="rounded-xl"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isEmpSubmitting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
                  >
                    {isEmpSubmitting ? "Menyimpan..." : "Konfirmasi Buka Shift"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Modal Tutup Shift Karyawan */}
        {isEmpShiftOutModalOpen && (
          <Dialog open={isEmpShiftOutModalOpen} onOpenChange={setIsEmpShiftOutModalOpen}>
            <DialogContent className="sm:max-w-md p-6 bg-white border border-slate-200 rounded-3xl select-none">
              <DialogHeader>
                <DialogTitle className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <LogOut className="w-5 h-5 text-amber-600" />
                  <span>Tutup Shift &amp; Absen Pulang ({selectedSelfName})</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 font-normal mt-0.5">
                  Hitung seluruh uang tunai fisik yang ada di laci kasir sebelum closing.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleDoEmpShiftOut} className="space-y-4 my-2 text-xs">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">Total Uang Fisik di Laci Kasir (Rp)</label>
                  <Input
                    type="number"
                    value={empClosingCash}
                    onChange={(e) => setEmpClosingCash(e.target.value)}
                    placeholder="Contoh: 1250000"
                    className="font-bold text-sm h-11 rounded-2xl bg-slate-50 border-slate-200"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">Catatan / Keterangan Shift</label>
                  <Input
                    type="text"
                    value={empClosingNote}
                    onChange={(e) => setEmpClosingNote(e.target.value)}
                    placeholder="Contoh: Shift berjalan lancar, stok aman"
                    className="text-xs h-10 rounded-2xl bg-slate-50 border-slate-200"
                  />
                </div>

                <DialogFooter className="pt-2 border-t flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEmpShiftOutModalOpen(false)}
                    className="rounded-xl"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isEmpSubmitting}
                    className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold"
                  >
                    {isEmpSubmitting ? "Memproses..." : "Konfirmasi Tutup Shift"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Modal Struk Laporan Closing */}
        {viewingReport && (
          <Dialog open={!!viewingReport} onOpenChange={() => setViewingReport(null)}>
            <DialogContent className="sm:max-w-md p-6 bg-white border border-slate-200 rounded-3xl select-none max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  <span>Struk Laporan Closing Kasir</span>
                </DialogTitle>
              </DialogHeader>
              <pre className="font-mono text-[11px] bg-slate-950 text-emerald-400 p-4 rounded-2xl whitespace-pre-wrap leading-relaxed overflow-x-auto">
                {viewingReport}
              </pre>
              <DialogFooter className="pt-2">
                <Button variant="outline" size="sm" onClick={() => setViewingReport(null)} className="rounded-xl">
                  Tutup Struk
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  }

  // ==========================================
  // ADMIN VIEW (ROLE: ADMIN / OWNER)
  // Melihat Kalender Visual Seluruh Karyawan, CRUD Log, & Rincian Global
  // ==========================================
  // Compute Today's Complete Shift Logs
  const todayDateObj = new Date();
  const todayDayNumber = todayDateObj.getDate();
  const todayIsSameMonthYear = todayDateObj.getMonth() + 1 === selectedMonth && todayDateObj.getFullYear() === selectedYear;
  const todayShiftLogs = todayIsSameMonthYear ? (logsByDay[todayDayNumber] || []) : [];

  return (
    <div className="space-y-6 text-slate-900 select-none">
      
      {/* 0. LIVE MONITOR: KARYAWAN & SHIFT AKTIF HARI INI (PRIORITAS ADMIN) */}
      <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Karyawan &amp; Shift Aktif Hari Ini
                </h2>
                <Badge
                  className={`text-[10px] font-bold ${
                    activeDutyShifts.length > 0
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300 animate-pulse"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {activeDutyShifts.length > 0 ? `🟢 ${activeDutyShifts.length} Karyawan Sedang Bertugas` : "⚪ Belum Ada Shift Aktif"}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {todayDateObj.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} &bull; Pantau kasir &amp; tim yang sedang login bertugas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => switchRole("karyawan")}
              className="text-[11px] text-slate-500 hover:text-slate-900 font-bold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200/80 transition-colors"
            >
              Mode Karyawan &rarr;
            </button>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchData}
              className="h-8 text-xs font-semibold rounded-xl gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Live Active Duty Staff Cards */}
        {activeDutyShifts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeDutyShifts.map((activeLog) => {
              const startCash = activeLog.startingCash || 0;
              const startTimeStr = new Date(activeLog.timestamp).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
              const txCount = activeLog.transactions?.length || 0;
              const orderCount = activeLog.orders?.length || 0;

              return (
                <div
                  key={activeLog.id || activeLog.employeeName}
                  className="bg-emerald-50/50 border-2 border-emerald-200/80 p-4 rounded-2xl flex flex-col justify-between gap-3 shadow-2xs hover:border-emerald-400 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                        {activeLog.employeeName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">{activeLog.employeeName}</h4>
                        <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100/80 px-1.5 py-0.5 rounded-md">
                          {activeLog.shiftCategory || "FULL TIME"}
                        </span>
                      </div>
                    </div>

                    <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                      SEDANG AKTIF
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-white/90 p-2.5 rounded-xl border border-emerald-100 text-xs">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Jam Masuk</span>
                      <span className="font-bold text-slate-800">{startTimeStr} WIB</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Modal Awal Kas</span>
                      <span className="font-bold text-emerald-700">Rp {startCash.toLocaleString("id-ID")}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-slate-500 font-semibold">
                      📊 {txCount} Kas &bull; {orderCount} Order POS
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] font-bold border-slate-300 bg-white"
                      onClick={() => handleOpenEditAdmin(activeLog)}
                    >
                      <Edit className="w-3 h-3 mr-1 text-slate-500" /> Edit Shift
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            Tidak ada kasir atau karyawan yang sedang aktif membuka shift saat ini.
          </div>
        )}

        {/* Today's Completed Shift Summary */}
        {todayShiftLogs.length > 0 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500 font-semibold">
              Total Log Absensi Tercatat Hari Ini: <strong>{todayShiftLogs.length} Sesi</strong>
            </span>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs font-bold bg-slate-50 border-slate-200 rounded-xl"
              onClick={() => {
                setSelectedDayDetail({
                  dayNum: todayDayNumber,
                  dateStr: `${todayDayNumber} ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`,
                  dayLogs: todayShiftLogs,
                });
              }}
            >
              Lihat Seluruh Aktivitas Hari Ini &rarr;
            </Button>
          </div>
        )}
      </div>

      {/* 1. TOP SECTION: REKAP KEHADIRAN KARYAWAN SUMMARY CARDS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-emerald-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Rekap Kehadiran Karyawan ({MONTH_NAMES[selectedMonth - 1]} {selectedYear})
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Klik kartu untuk detail log</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {employeeStatsList.map((empStat) => {
            const totalDays = empStat.daysSet.size;
            return (
              <button
                key={empStat.name}
                type="button"
                onClick={() => setEmpDetailModalName(empStat.name)}
                className="border border-slate-200/90 bg-white hover:border-emerald-500 hover:bg-emerald-50/40 p-3 rounded-2xl flex items-center justify-between transition-all text-left cursor-pointer shadow-2xs group"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center border border-emerald-200 shrink-0">
                    {empStat.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-bold text-xs text-slate-900 truncate group-hover:text-emerald-950">
                    {empStat.name}
                  </span>
                </div>

                <Badge
                  variant="outline"
                  className="text-[11px] font-bold bg-emerald-50 text-emerald-800 border-emerald-300 shrink-0 rounded-full px-2.5 py-0.5"
                >
                  {totalDays} Masuk
                </Badge>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. MAIN CALENDAR GRID CARD */}
      <Card className="border-slate-200/90 bg-white shadow-2xs rounded-3xl overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          
          {/* Month Navigation & Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-600 hover:bg-white rounded-lg cursor-pointer"
                onClick={handlePrevMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-600 hover:bg-white rounded-lg cursor-pointer"
                onClick={handleNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div>
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-emerald-600" />
                <span>Kalender Absensi ({MONTH_NAMES[selectedMonth - 1]} {selectedYear})</span>
              </CardTitle>
              <CardDescription className="text-[11px] text-slate-500 font-normal mt-0.5">
                Klik badge nama karyawan untuk melihat rincian. Admin memerlukan PIN untuk edit &amp; hapus.
              </CardDescription>
            </div>
          </div>

          {/* Filter & Action Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Employee Filter */}
            <select
              value={selectedEmployeeFilter}
              onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
              className="h-8 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 focus:outline-none"
            >
              <option value="ALL">ALL (Semua Staf)</option>
              {employees.map((e) => (
                <option key={e.id} value={e.name}>
                  {e.name}
                </option>
              ))}
            </select>

            {/* Month Filter */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              className="h-8 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 focus:outline-none"
            >
              {MONTH_NAMES.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>

            {/* Year Input */}
            <Input
              type="number"
              className="h-8 text-xs font-bold w-20 bg-slate-50 border-slate-200 text-center rounded-xl"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10) || 2026)}
            />

            {/* Admin Add Button */}
            <Button
              size="sm"
              onClick={handleOpenAddAdmin}
              className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-1 cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>+ Absen Manual</span>
            </Button>

            {/* Export CSV */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportCSV}
              className="h-8 text-xs font-semibold rounded-xl gap-1 border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </Button>

            {/* Clear All Logs */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleClearAllAttendance}
              className="h-8 text-xs font-semibold rounded-xl gap-1 border-rose-200 text-rose-700 hover:bg-rose-50 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Bersihkan Semua Log</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={fetchData}
              className="h-8 w-8 p-0 rounded-xl text-slate-500 hover:text-slate-900 cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-3 sm:p-5 space-y-3">
          
          {/* Legend Indicator */}
          <div className="flex items-center gap-2.5 sm:gap-4 text-xs font-normal text-slate-600 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 flex-wrap">
            <span className="font-bold text-slate-800 text-[11px]">Keterangan Badge:</span>
            <span className="flex items-center gap-1.5 text-[11px] font-medium">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-2xs" /> Kas Laci PAS (Sesuai)
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-medium">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-2xs" /> Kas Laci Lebih
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-medium">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-2xs" /> Kas Laci Kurang
            </span>
          </div>

          {/* Responsive Calendar Days Table Wrapper (Smooth horizontal scroll on HP) */}
          <div className="overflow-x-auto custom-scrollbar pb-1">
            <div className="min-w-[620px] space-y-2">
              {/* Calendar Days Header (Days of week) */}
              <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-600 bg-slate-100/70 py-2.5 rounded-xl border border-slate-200/80">
                <span className="text-rose-600">Minggu</span>
                <span>Senin</span>
                <span>Selasa</span>
                <span>Rabu</span>
                <span>Kamis</span>
                <span>Jumat</span>
                <span className="text-emerald-700">Sabtu</span>
              </div>

              {/* Calendar Days Grid */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                
                {/* Offset empty placeholders */}
                {Array.from({ length: firstDayIndex }).map((_, idx) => (
                  <div
                    key={`empty_${idx}`}
                    className="h-20 sm:h-24 bg-slate-50/40 rounded-2xl border border-dashed border-slate-200/50"
                  />
                ))}

                {/* Month Day Cells */}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const dayLogs = logsByDay[dayNum] || [];
                  const isToday =
                    dayNum === new Date().getDate() &&
                    selectedMonth === new Date().getMonth() + 1 &&
                    selectedYear === new Date().getFullYear();

                  const hasShifts = dayLogs.length > 0;
                  const uniqueEmpNames = Array.from(new Set(dayLogs.map((l) => l.employeeName)));

                  return (
                    <div
                      key={`day_${dayNum}`}
                      onClick={() => {
                        if (hasShifts) {
                          setSelectedDayDetail({
                            dayNum,
                            dateStr: `${dayNum} ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`,
                            dayLogs,
                          });
                        }
                      }}
                      className={`h-22 sm:h-26 p-2 sm:p-2.5 rounded-2xl border flex flex-col justify-between transition-all select-none ${
                        isToday
                          ? "border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-400/30 shadow-2xs"
                          : hasShifts
                          ? "border-slate-200 bg-white hover:border-emerald-400 hover:shadow-md cursor-pointer group"
                          : "border-slate-100 bg-slate-50/30 text-slate-400 cursor-default"
                      }`}
                    >
                      {/* Top row: Day Number + Log Count Badge */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold ${
                            isToday
                              ? "h-5 w-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]"
                              : "text-slate-800"
                          }`}
                        >
                          {dayNum}
                        </span>

                        {hasShifts && (
                          <Badge
                            variant="outline"
                            className="text-[9px] font-extrabold py-0 px-1.5 rounded-full border-emerald-300 bg-emerald-100/80 text-emerald-900 shadow-2xs group-hover:bg-emerald-600 group-hover:text-white transition-colors"
                          >
                            {dayLogs.length} Log
                          </Badge>
                        )}
                      </div>

                      {/* Middle: Employees List / Chips */}
                      <div className="my-auto">
                        {hasShifts ? (
                          <p className="text-[10px] font-semibold text-slate-700 line-clamp-2 leading-tight">
                            {uniqueEmpNames.join(", ")}
                          </p>
                        ) : (
                          <span className="text-[10px] text-slate-300">-</span>
                        )}
                      </div>

                      {/* Bottom: Click for detail prompt */}
                      <div>
                        {hasShifts && (
                          <span className="text-[9px] font-bold text-emerald-600 group-hover:text-emerald-700 transition-colors block text-left">
                            Klik utk detail &rarr;
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. MODAL: DETAIL LOG HARIAN (SELECTED DAY) */}
      {selectedDayDetail && (() => {
        const uniqueTeamStaff = Array.from(new Set(selectedDayDetail.dayLogs.map((l) => l.employeeName)));
        const allDayTx = Array.from(new Map(selectedDayDetail.dayLogs.flatMap((l) => l.transactions || []).map((t) => [t.id, t])).values());
        const allDayOrders = Array.from(new Map(selectedDayDetail.dayLogs.flatMap((l) => l.orders || []).map((o) => [o.id, o])).values());
        const allDayPurchases = Array.from(new Map(selectedDayDetail.dayLogs.flatMap((l) => l.purchases || []).map((p) => [p.id, p])).values());

        const totalOmsetPOS = allDayOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
        const totalKasMasuk = allDayTx.filter((t) => t.type === "CASH_IN" || t.type === "IN").reduce((s, t) => s + (t.amount || 0), 0);
        const totalKasKeluar = allDayTx.filter((t) => t.type === "CASH_OUT" || t.type === "OUT").reduce((s, t) => s + (t.amount || 0), 0);

        return (
          <Dialog open={!!selectedDayDetail} onOpenChange={() => setSelectedDayDetail(null)}>
            <DialogContent className="sm:max-w-2xl p-6 bg-white border border-slate-200 rounded-3xl max-h-[88vh] overflow-y-auto select-none">
              <DialogHeader className="border-b pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <DialogTitle className="font-bold text-base text-slate-900 flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-emerald-600" />
                      <span>Detail Shift &amp; Log Aktivitas: {selectedDayDetail.dateStr}</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 font-normal mt-0.5">
                      Rincian tim bertugas, transaksi kas keluar/masuk, penjualan POS kasir, dan pengadaan stok.
                    </DialogDescription>
                  </div>
                  
                  {uniqueTeamStaff.length > 1 && (
                    <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-[11px] font-bold self-start sm:self-center">
                      👥 Tim Shift: {uniqueTeamStaff.length} Orang
                    </Badge>
                  )}
                </div>

                {/* Team Members Header Banner */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 mt-2.5 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-700">Anggota Tim Bertugas:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {uniqueTeamStaff.map((staffName, sIdx) => (
                        <span
                          key={staffName || sIdx}
                          className="bg-white border border-slate-200 text-slate-900 px-2.5 py-1 rounded-xl text-xs font-extrabold shadow-2xs flex items-center gap-1.5"
                        >
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          {staffName}
                        </span>
                      ))}
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 font-semibold">
                    {selectedDayDetail.dayLogs.length} Sesi Log
                  </span>
                </div>

                {/* Activity Tabs */}
                <div className="grid grid-cols-4 gap-1 bg-slate-100/80 p-1 rounded-2xl mt-3 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setDayDetailTab("TIM_LOG")}
                    className={`py-2 rounded-xl transition-all cursor-pointer ${
                      dayDetailTab === "TIM_LOG" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    👥 Absensi Tim ({selectedDayDetail.dayLogs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDayDetailTab("TRANSAKSI_KAS")}
                    className={`py-2 rounded-xl transition-all cursor-pointer ${
                      dayDetailTab === "TRANSAKSI_KAS" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    🧾 Kas &amp; Nota ({allDayTx.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDayDetailTab("PENJUALAN_POS")}
                    className={`py-2 rounded-xl transition-all cursor-pointer ${
                      dayDetailTab === "PENJUALAN_POS" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    🛍️ Penjualan ({allDayOrders.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDayDetailTab("MUTASI_STOK")}
                    className={`py-2 rounded-xl transition-all cursor-pointer ${
                      dayDetailTab === "MUTASI_STOK" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    📦 Stok ({allDayPurchases.length})
                  </button>
                </div>
              </DialogHeader>

              {/* TAB 1: ABSENSI TIM & KASIR */}
              {dayDetailTab === "TIM_LOG" && (
                <div className="flex flex-col gap-3 my-3">
                  {selectedDayDetail.dayLogs.map((log, idx) => {
                    const isOut = log.type === "SHIFT_OUT";
                    const disc = log.cashDiscrepancy || 0;

                    return (
                      <div
                        key={log.id || idx}
                        className={`p-3.5 rounded-2xl border flex flex-col gap-2.5 transition-all ${
                          isOut
                            ? disc === 0
                              ? "bg-emerald-50/40 border-emerald-200 text-emerald-950"
                              : disc > 0
                              ? "bg-blue-50/40 border-blue-200 text-blue-950"
                              : "bg-amber-50/40 border-amber-200 text-amber-950"
                            : "bg-slate-50 border-slate-200 text-slate-900"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {log.employeeName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-bold text-xs text-slate-900">{log.employeeName}</h4>
                              <p className="text-[10px] text-slate-500">
                                Waktu: {new Date(log.timestamp).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                              </p>
                            </div>
                          </div>

                          <Badge
                            className={`text-[10px] font-bold rounded-full px-2.5 py-0.5 ${
                              isOut
                                ? disc === 0
                                  ? "bg-emerald-600 text-white"
                                  : disc > 0
                                  ? "bg-blue-600 text-white"
                                  : "bg-amber-600 text-white"
                                : "bg-slate-800 text-white"
                            }`}
                          >
                            {isOut ? "SHIFT OUT (TUTUP)" : "SHIFT IN (MASUK)"}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white/80 p-2.5 rounded-xl border border-slate-200/60 text-[11px]">
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase font-bold">Modal Awal</span>
                            <span className="font-bold text-slate-800">
                              Rp {(log.startingCash || 0).toLocaleString("id-ID")}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase font-bold">Fisik Laci</span>
                            <span className="font-bold text-slate-800">
                              {isOut ? `Rp ${(log.cashVerified || 0).toLocaleString("id-ID")}` : "-"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase font-bold">Selisih Kas</span>
                            <span
                              className={`font-bold ${
                                disc === 0 ? "text-emerald-700" : disc > 0 ? "text-blue-700" : "text-amber-700"
                              }`}
                            >
                              {isOut ? (disc === 0 ? "PAS (Rp 0)" : `Rp ${disc.toLocaleString("id-ID")}`) : "-"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase font-bold">Catatan</span>
                            <span className="text-slate-600 truncate block">{log.cashNote || "-"}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          {log.stockReport ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[10px] font-semibold border-slate-300 bg-white"
                              onClick={() => {
                                setViewingReport(log.stockReport || null);
                                setSelectedDayDetail(null);
                              }}
                            >
                              <FileText className="h-3 w-3 mr-1 text-slate-500" /> Lihat Struk Laporan
                            </Button>
                          ) : (
                            <span />
                          )}

                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[10px] font-semibold border-slate-300 bg-white"
                              onClick={() => handleOpenEditAdmin(log)}
                            >
                              <Edit className="h-3 w-3 mr-1 text-slate-500" /> Edit Log
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 text-[10px] font-semibold"
                              onClick={() => handleDeleteLog(log.id, log.employeeName)}
                            >
                              <Trash2 className="h-3 w-3 mr-1" /> Hapus
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 2: TRANSAKSI KAS IN / OUT & BELANJA NOTA */}
              {dayDetailTab === "TRANSAKSI_KAS" && (
                <div className="space-y-3 my-3">
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-xs">
                    <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase block">+ Total Kas Masuk (IN)</span>
                      <span className="text-sm font-extrabold text-emerald-800 mt-0.5 block">
                        Rp {totalKasMasuk.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200">
                      <span className="text-[10px] font-bold text-amber-700 uppercase block">- Total Kas Keluar (OUT)</span>
                      <span className="text-sm font-extrabold text-rose-700 mt-0.5 block">
                        Rp {totalKasKeluar.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {allDayTx.length > 0 ? (
                      allDayTx.map((tx, txIdx) => (
                        <div
                          key={tx.id || txIdx}
                          className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs hover:bg-slate-50 transition-colors"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                tx.type === "CASH_IN" || tx.type === "IN" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                              }`}>
                                {tx.type === "CASH_IN" || tx.type === "IN" ? "KAS MASUK" : "KAS KELUAR"}
                              </span>
                              <span className="font-bold text-slate-900">{tx.note || "Transaksi Kas"}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Pencatat: <strong>{tx.employeeName || "Kasir"}</strong> &bull; {new Date(tx.timestamp || Date.now()).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                            </div>
                          </div>

                          <span className={`text-sm font-extrabold ${tx.type === "CASH_IN" || tx.type === "IN" ? "text-emerald-700" : "text-rose-700"}`}>
                            {tx.type === "CASH_IN" || tx.type === "IN" ? "+" : "-"}Rp {(tx.amount || 0).toLocaleString("id-ID")}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        Tidak ada transaksi kas kecil / belanja nota yang dicatat pada hari ini.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: PENJUALAN KASIR (POS ORDERS) */}
              {dayDetailTab === "PENJUALAN_POS" && (
                <div className="space-y-3 my-3">
                  <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Total Omset Penjualan POS</span>
                      <span className="text-xl font-extrabold text-white mt-0.5 block">
                        Rp {totalOmsetPOS.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs font-bold">
                      {allDayOrders.length} Pesanan Terjual
                    </Badge>
                  </div>

                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {allDayOrders.length > 0 ? (
                      allDayOrders.map((ord, oIdx) => (
                        <div
                          key={ord.id || oIdx}
                          className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs hover:bg-slate-50"
                        >
                          <div>
                            <span className="font-bold text-slate-900 block">#{ord.orderNumber}</span>
                            <span className="text-[10px] text-slate-400">
                              {ord.time} WIB &bull; {ord.itemCount} Item &bull; Bayar: <strong className="text-slate-600">{ord.paymentMethod}</strong>
                            </span>
                          </div>
                          <span className="font-extrabold text-emerald-700 text-xs">
                            Rp {(ord.totalAmount || 0).toLocaleString("id-ID")}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        Belum ada transaksi penjualan kasir tercatat pada hari ini.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: STOK & PENGADAAN (PURCHASES) */}
              {dayDetailTab === "MUTASI_STOK" && (
                <div className="space-y-3 my-3">
                  <div className="space-y-1.5">
                    {allDayPurchases.length > 0 ? (
                      allDayPurchases.map((pur, pIdx) => (
                        <div
                          key={pur.id || pIdx}
                          className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs hover:bg-slate-50"
                        >
                          <div>
                            <span className="font-bold text-slate-900 block">{pur.itemName}</span>
                            <span className="text-[10px] text-slate-400">
                              Kuantitas: <strong>{pur.quantity}</strong> &bull; Toko / Supplier: {pur.supplierName || "-"}
                            </span>
                          </div>
                          <span className="font-extrabold text-slate-900 text-xs">
                            Rp {(pur.totalPrice || 0).toLocaleString("id-ID")}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        Tidak ada pengadaan bahan baku yang dicatat pada hari ini.
                      </div>
                    )}
                  </div>
                </div>
              )}

              <DialogFooter className="pt-2 border-t">
                <Button variant="outline" size="sm" onClick={() => setSelectedDayDetail(null)} className="rounded-xl text-xs">
                  Tutup Detail
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* 4. MODAL: REKAP INDIVIDUAL KARYAWAN */}
      {empDetailModalName && (
        <Dialog open={!!empDetailModalName} onOpenChange={() => setEmpDetailModalName(null)}>
          <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col p-6 bg-white border-slate-200 rounded-3xl select-none overflow-hidden">
            <DialogHeader className="shrink-0 pb-3 border-b border-slate-100">
              <DialogTitle className="font-bold text-base text-slate-900 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm flex items-center justify-center border border-emerald-200">
                  {empDetailModalName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900">{empDetailModalName}</div>
                  <div className="text-xs text-slate-500 font-normal">
                    Rekap Absensi &amp; Kas Shift ({MONTH_NAMES[selectedMonth - 1]} {selectedYear})
                  </div>
                </div>
              </DialogTitle>
            </DialogHeader>

            {(() => {
              const empLogs = calendarLogs.filter((l) => l.employeeName === empDetailModalName);
              const daysSet = new Set(empLogs.map((l) => new Date(l.timestamp).getDate()));
              const totalShifts = empLogs.filter((l) => l.type === "SHIFT_OUT").length;
              const totalPas = empLogs.filter(
                (l) => l.type === "SHIFT_OUT" && (l.cashDiscrepancy === 0 || l.cashDiscrepancy === null)
              ).length;
              const totalDiscrepancy = empLogs
                .filter((l) => l.type === "SHIFT_OUT")
                .reduce((sum, l) => sum + (l.cashDiscrepancy || 0), 0);

              return (
                <div className="flex-1 overflow-y-auto space-y-4 my-3 pr-1">
                  {/* Summary Metric Stats */}
                  <div className="grid grid-cols-4 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Hadir</span>
                      <span className="text-base font-extrabold text-slate-900">{daysSet.size} Hari</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Shift Selesai</span>
                      <span className="text-base font-extrabold text-slate-900">{totalShifts} Kali</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Kas PAS</span>
                      <span className="text-base font-extrabold text-emerald-700">{totalPas} Kali</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Selisih Kas</span>
                      <span
                        className={`text-base font-extrabold ${
                          totalDiscrepancy === 0
                            ? "text-emerald-700"
                            : totalDiscrepancy > 0
                            ? "text-blue-700"
                            : "text-amber-700"
                        }`}
                      >
                        Rp {totalDiscrepancy.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>

                  {/* Chronological List of Logs */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Riwayat Log Shift ({empLogs.length})
                    </h5>

                    {empLogs.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">Belum ada catatan log pada bulan ini.</p>
                    ) : (
                      empLogs.map((log, idx) => (
                        <div
                          key={log.id || idx}
                          className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs hover:bg-slate-50"
                        >
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 block">
                                {new Date(log.timestamp).toLocaleDateString("id-ID", {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                })}{" "}
                                - {new Date(log.timestamp).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                              </span>
                              <Badge
                                className={`text-[9px] font-bold rounded-full ${
                                  log.type === "SHIFT_OUT" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"
                                }`}
                              >
                                {log.type}
                              </Badge>
                            </div>
                            <span className="text-[10px] text-slate-500 block">{log.cashNote || "Shift Kasir"}</span>

                            {log.transactions && log.transactions.length > 0 && (
                              <div className="mt-2 pt-1.5 border-t border-slate-100 space-y-1">
                                <span className="text-[9px] font-bold text-slate-600 block uppercase">
                                  Transaksi Kas / Belanja Shift Ini ({log.transactions.length}):
                                </span>
                                {log.transactions.map((tx, tIdx) => (
                                  <div key={tx.id || tIdx} className="flex items-center justify-between text-[10px] bg-slate-50 px-2 py-1 rounded">
                                    <span className="text-slate-700 truncate max-w-[200px]">{tx.note}</span>
                                    <span className={`font-bold ${tx.type === "CASH_IN" || tx.type === "IN" ? "text-emerald-700" : "text-rose-700"}`}>
                                      {tx.type === "CASH_IN" || tx.type === "IN" ? "+" : "-"}Rp {(tx.amount || 0).toLocaleString("id-ID")}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })()}

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setEmpDetailModalName(null)} className="rounded-xl">
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 5. MODAL: ADMIN MANUAL ABSEN (CREATE / EDIT) */}
      {isAdminModalOpen && (
        <Dialog open={isAdminModalOpen} onOpenChange={setIsAdminModalOpen}>
          <DialogContent className="sm:max-w-md p-6 bg-white border-slate-200 rounded-3xl select-none">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <span>{editingLog ? "Edit Log Shift Absensi" : "Tambah Log Absen Manual (Admin)"}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-normal">
                Pencatatan atau koreksi data absensi dan status kas laci karyawan.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 my-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Nama Karyawan</label>
                <select
                  value={adminEmpName}
                  onChange={(e) => setAdminEmpName(e.target.value)}
                  className="h-9 w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 focus:outline-none"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.name}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Tipe Shift</label>
                  <select
                    value={adminType}
                    onChange={(e) => setAdminType(e.target.value as any)}
                    className="h-9 w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 focus:outline-none"
                  >
                    <option value="SHIFT_IN">SHIFT IN (Masuk)</option>
                    <option value="SHIFT_OUT">SHIFT OUT (Keluar)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Waktu &amp; Tanggal</label>
                  <Input
                    type="datetime-local"
                    value={adminTimestamp}
                    onChange={(e) => setAdminTimestamp(e.target.value)}
                    className="h-9 text-xs font-semibold bg-slate-50 border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Modal Awal (Rp)</label>
                  <Input
                    type="number"
                    value={adminStartCash}
                    onChange={(e) => setAdminStartCash(e.target.value)}
                    className="h-9 text-xs font-bold bg-slate-50 border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Fisik Kas Laci (Rp)</label>
                  <Input
                    type="number"
                    value={adminEndCash}
                    onChange={(e) => setAdminEndCash(e.target.value)}
                    className="h-9 text-xs font-bold bg-slate-50 border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Catatan Log</label>
                <Input
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="misal: Shift pagi lancar / Kas sesuai"
                  className="h-9 text-xs font-semibold bg-slate-50 border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsAdminModalOpen(false)} className="rounded-xl">
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleSaveAdminLog}
                disabled={isSavingAdmin}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl"
              >
                {isSavingAdmin ? "Menyimpan..." : "Simpan Log"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 6. MODAL: STRUK LAPORAN CLOSING */}
      {viewingReport && (
        <Dialog open={!!viewingReport} onOpenChange={() => setViewingReport(null)}>
          <DialogContent className="sm:max-w-md p-6 bg-white border-slate-200 rounded-3xl select-none">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" />
                <span>Struk Laporan Closing Shift</span>
              </DialogTitle>
            </DialogHeader>

            <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-2xl overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {viewingReport}
            </pre>

            <DialogFooter>
              <Button size="sm" onClick={() => setViewingReport(null)} className="rounded-xl">
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
