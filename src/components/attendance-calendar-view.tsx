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
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
}

export function AttendanceCalendarView() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [calendarLogs, setCalendarLogs] = useState<ShiftLog[]>([]);
  const [loading, setLoading] = useState(true);

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

  const [empDetailModalName, setEmpDetailModalName] = useState<string | null>(null);

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

  return (
    <div className="space-y-6 text-slate-900 select-none">
      
      {/* 1. TOP SECTION: REKAP KEHADIRAN KARYAWAN SUMMARY CARDS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-emerald-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Rekap Kehadiran Karyawan ({MONTH_NAMES[selectedMonth - 1]} {selectedYear})
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Klik kartu untuk detail log</span>
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
                  {i + 1} - {m}
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

        <CardContent className="p-4 sm:p-5 space-y-3">
          
          {/* Legend Indicator */}
          <div className="flex items-center gap-4 text-xs font-normal text-slate-600 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 flex-wrap">
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
        </CardContent>
      </Card>

      {/* 3. MODAL: DETAIL LOG HARIAN (SELECTED DAY) */}
      {selectedDayDetail && (
        <Dialog open={!!selectedDayDetail} onOpenChange={() => setSelectedDayDetail(null)}>
          <DialogContent className="sm:max-w-xl p-6 bg-white border border-slate-200 rounded-3xl max-h-[85vh] overflow-y-auto select-none">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-emerald-600" />
                  <span>Detail Log Shift: {selectedDayDetail.dateStr}</span>
                </DialogTitle>
                <Badge variant="outline" className="text-xs font-bold bg-emerald-50 text-emerald-800 border-emerald-200 rounded-full px-2.5">
                  {selectedDayDetail.dayLogs.length} Log Absensi
                </Badge>
              </div>
              <DialogDescription className="text-xs text-slate-500 font-normal mt-1">
                Rincian jam masuk/keluar karyawan, status cash closing laci, dan laporan kasir.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 my-4">
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
                    {/* Header: Name + Time + Type Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {log.employeeName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-slate-900">{log.employeeName}</h4>
                          <p className="text-[10px] text-slate-500">
                            Waktu Log: {new Date(log.timestamp).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
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

                    {/* Breakdown Numbers */}
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

                    {/* Action buttons */}
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

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setSelectedDayDetail(null)} className="rounded-xl">
                Tutup Detail
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

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
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {new Date(log.timestamp).toLocaleDateString("id-ID", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              })}{" "}
                              - {new Date(log.timestamp).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                            </span>
                            <span className="text-[10px] text-slate-500">{log.cashNote || "Shift Kasir"}</span>
                          </div>

                          <div className="text-right">
                            <Badge
                              className={`text-[9px] font-bold rounded-full ${
                                log.type === "SHIFT_OUT" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"
                              }`}
                            >
                              {log.type}
                            </Badge>
                            {log.type === "SHIFT_OUT" && (
                              <span className="block text-[10px] font-semibold text-slate-600 mt-0.5">
                                Fisik: Rp {(log.cashVerified || 0).toLocaleString("id-ID")}
                              </span>
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
