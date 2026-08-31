"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Plus, 
  Clock, 
  Calendar, 
  DollarSign, 
  Trash2, 
  UserCheck, 
  Printer,
  Pencil,
  Sparkles,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/layout/app-shell";
import { AttendanceCalendarView } from "@/components/attendance-calendar-view";

export default function EmployeesPage() {
  const [activeTab, setActiveTab] = useState<"employees" | "attendance" | "schedule" | "payroll">("employees");
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    role: "cashier",
    pin: "1234",
    shiftRate: 75000,
  });

  const [shiftLogs, setShiftLogs] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [empRes, attRes, absenRes] = await Promise.all([
        fetch("/api/data?type=employees"),
        fetch("/api/data?type=attendances"),
        fetch(`/api/absen-kas?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}&employee=ALL`),
      ]);
      if (empRes.ok) {
        const empJson = await empRes.json();
        setEmployees(Array.isArray(empJson) ? empJson : []);
      } else {
        setEmployees([]);
      }

      if (attRes.ok) {
        const attJson = await attRes.json();
        setAttendances(Array.isArray(attJson) ? attJson : []);
      }

      if (absenRes.ok) {
        const absenJson = await absenRes.json();
        if (absenJson.calendarLogs && Array.isArray(absenJson.calendarLogs)) {
          setShiftLogs(absenJson.calendarLogs);
        }
      }
    } catch (e) {
      console.error(e);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenEdit = (emp: any) => {
    setEditingId(emp.id);
    setForm({
      name: emp.name || "",
      role: emp.role || "cashier",
      pin: emp.pin || "1234",
      shiftRate: Number(emp.dailyRate || emp.shiftRate || 75000),
    });
    setShowAddForm(true);
  };

  const handleResetForm = () => {
    setEditingId(null);
    setForm({
      name: "",
      role: "cashier",
      pin: "1234",
      shiftRate: 75000,
    });
    setShowAddForm(false);
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      const payload = editingId ? { id: editingId, ...form, dailyRate: form.shiftRate } : { ...form, dailyRate: form.shiftRate };
      const res = await fetch("/api/data?type=save_employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        handleResetForm();
        await fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm("Hapus data karyawan ini dari database?")) return;
    try {
      await fetch("/api/data?type=delete_employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto text-slate-900 space-y-6">
        
        {/* Prominent Outer Card Container */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-2xs space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Data Karyawan</h2>
                <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Sistem Per-Shift
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Kelola data staf, upah per shift, PIN kasir, absensi, dan payroll.
              </p>
            </div>

            <Button
              onClick={() => {
                if (showAddForm) {
                  handleResetForm();
                } else {
                  handleResetForm();
                  setShowAddForm(true);
                }
              }}
              className="bg-stone-800 hover:bg-stone-900 text-white font-semibold text-xs px-4 py-2.5 rounded-xl min-h-[42px] gap-2 shadow-xs shrink-0 cursor-pointer"
            >
              {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{showAddForm ? "Tutup Formulir" : "Tambah Karyawan"}</span>
            </Button>
          </div>

          {/* Sub Navigation Tabs (Horizontally scrollable on small mobile screens) */}
          <div className="flex items-center gap-2 border-b pb-3 overflow-x-auto custom-scrollbar flex-nowrap sm:flex-wrap">
            <button
              onClick={() => setActiveTab("employees")}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all gap-1.5 sm:gap-2 flex items-center cursor-pointer shrink-0 ${
                activeTab === "employees"
                  ? "bg-stone-800 text-white shadow-2xs"
                  : "bg-slate-100/70 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Data Karyawan ({employees.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("attendance")}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all gap-1.5 sm:gap-2 flex items-center cursor-pointer shrink-0 ${
                activeTab === "attendance"
                  ? "bg-stone-800 text-white shadow-2xs"
                  : "bg-slate-100/70 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Absensi & Kehadiran</span>
            </button>

            <button
              onClick={() => setActiveTab("schedule")}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all gap-1.5 sm:gap-2 flex items-center cursor-pointer shrink-0 ${
                activeTab === "schedule"
                  ? "bg-stone-800 text-white shadow-2xs"
                  : "bg-slate-100/70 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Jadwal Shift</span>
            </button>

            <button
              onClick={() => setActiveTab("payroll")}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all gap-1.5 sm:gap-2 flex items-center cursor-pointer shrink-0 ${
                activeTab === "payroll"
                  ? "bg-stone-800 text-white shadow-2xs"
                  : "bg-slate-100/70 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Kalkulasi Payroll</span>
            </button>
          </div>

          {/* Inline Add / Edit Employee Form */}
          {showAddForm && (
            <form onSubmit={handleSaveEmployee} className="bg-slate-50 p-4 md:p-5 rounded-2xl border border-slate-200 space-y-4 shadow-2xs animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="font-bold text-xs text-slate-900">
                  {editingId ? "Ubah Data Karyawan" : "Tambah Karyawan Baru"}
                </h4>
                <Button type="button" variant="ghost" size="sm" onClick={handleResetForm} className="h-7 text-xs text-slate-500">
                  Batal
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Nama Lengkap *</label>
                  <Input
                    placeholder="Contoh: Budi Santoso"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="bg-white min-h-[38px] text-xs font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Jabatan</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="bg-white min-h-[38px] w-full text-xs font-semibold rounded-xl border border-slate-200 px-3 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="cashier">Kasir</option>
                    <option value="barista">Barista</option>
                    <option value="kitchen">Dapur</option>
                    <option value="admin">Supervisor</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">PIN Kasir (4 Digit)</label>
                  <Input
                    placeholder="Contoh: 1234"
                    value={form.pin}
                    onChange={(e) => setForm({ ...form, pin: e.target.value })}
                    className="bg-white min-h-[38px] text-xs font-semibold tracking-wider font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-emerald-700 block mb-1">Upah Per Shift (Rp) *</label>
                  <Input
                    type="number"
                    value={form.shiftRate || ""}
                    onChange={(e) => setForm({ ...form, shiftRate: Number(e.target.value) })}
                    placeholder="Contoh: 75000"
                    className="bg-emerald-50/40 border-emerald-300 text-emerald-900 min-h-[38px] text-xs font-extrabold"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <Button type="button" variant="outline" onClick={handleResetForm} className="text-xs rounded-xl min-h-[38px]">
                  Batal
                </Button>
                <Button type="submit" className="bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold px-5 min-h-[38px] rounded-xl">
                  {editingId ? "Simpan Perubahan" : "Simpan"}
                </Button>
              </div>
            </form>
          )}

          {/* TAB 1: DATA KARYAWAN ROSTER (Responsive Horizontal Scroll) */}
          {activeTab === "employees" && (
            <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
              <div className="overflow-x-auto custom-scrollbar">
                <div className="min-w-[620px]">
                  <div className="grid grid-cols-12 px-6 py-3.5 bg-slate-50/70 border-b text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
                    <div className="col-span-4">NAMA & STAF</div>
                    <div className="col-span-3 text-center">ROLE & PIN</div>
                    <div className="col-span-2 text-center">SISTEM GAJI</div>
                    <div className="col-span-2 text-right">UPAH PER SHIFT</div>
                    <div className="col-span-1 text-right">AKSI</div>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {employees.length > 0 ? (
                      employees.map((emp) => {
                        const rate = Number(emp.dailyRate || emp.shiftRate || 75000);
                        return (
                          <div key={emp.id} className="grid grid-cols-12 px-6 py-3.5 items-center text-xs hover:bg-slate-50/60 transition-colors">
                            <div className="col-span-4 font-bold text-slate-900 flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-stone-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                                {emp.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="text-slate-900 font-bold text-sm block">{emp.name}</span>
                                <span className="text-[10px] text-slate-500 font-medium">Staf Outlet Shift</span>
                              </div>
                            </div>

                            <div className="col-span-3 text-center space-y-1">
                              <Badge className="text-[10px] px-2 py-0.5 font-bold bg-indigo-50 text-indigo-700 border-indigo-200">
                                {emp.role ? emp.role.toUpperCase() : "KASIR"}
                              </Badge>
                              <span className="block text-[10px] font-mono text-slate-500">
                                PIN: {emp.pin || "1234"}
                              </span>
                            </div>

                            <div className="col-span-2 text-center">
                              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                PER SHIFT
                              </span>
                            </div>

                            <div className="col-span-2 text-right font-extrabold text-emerald-700">
                              Rp {rate.toLocaleString("id-ID")} <span className="text-[10px] font-normal text-slate-400">/ shift</span>
                            </div>

                            <div className="col-span-1 flex items-center justify-end gap-1">
                              <button 
                                onClick={() => handleOpenEdit(emp)} 
                                className="text-slate-500 hover:text-indigo-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                                title="Edit Data Karyawan"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteEmployee(emp.id)} 
                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Karyawan"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-12 text-center space-y-2">
                        <Users className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-xs text-slate-400 font-medium">Belum ada karyawan terdaftar.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ABSENSI & KALENDER KEHADIRAN SHIFT */}
          {activeTab === "attendance" && (
            <div className="pt-2">
              <AttendanceCalendarView />
            </div>
          )}

          {/* TAB 3: JADWAL SHIFT */}
          {activeTab === "schedule" && (
            <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs p-6 space-y-4">
              <h3 className="font-bold text-sm text-slate-900">Jadwal Shift Kerja Karyawan Minggu Ini</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"].map((day) => (
                  <div key={day} className="p-3 rounded-xl border bg-slate-50 space-y-2">
                    <span className="font-extrabold text-slate-900 block border-b pb-1">{day}</span>
                    <div className="space-y-1 text-[11px]">
                      <p className="text-slate-600 font-medium"> Shift Pagi (08:00 - 16:00): <strong className="text-slate-900 block">Budi Santoso</strong></p>
                      <p className="text-slate-600 font-medium"> Shift Sore (16:00 - 23:00): <strong className="text-slate-900 block">Siti Rahma</strong></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PAYROLL / PENGGAJIAN SHIFT */}
          {activeTab === "payroll" && (
            <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs p-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Ringkasan Payroll Per Shift</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Kalkulasi murni dari (Jumlah Shift Dikerjakan &times; Upah Per Shift)</p>
                </div>
                <Button size="sm" variant="outline" className="text-xs gap-1.5 min-h-[36px] cursor-pointer">
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Slip Payroll Shift</span>
                </Button>
              </div>

              <div className="divide-y divide-slate-100 border rounded-xl overflow-hidden">
                {employees.map((emp) => {
                  const ratePerShift = Number(emp.dailyRate || emp.shiftRate || 75000);
                  
                  // Hitung kehadiran real dari log shift kasir & tabel absensi
                  const empShiftLogs = shiftLogs.filter((log: any) => {
                    const logName = (log.employeeName || "").toLowerCase().trim();
                    const empName = (emp.name || "").toLowerCase().trim();
                    return logName === empName || (log.employeeId && log.employeeId === emp.id);
                  });

                  const empAtts = attendances.filter((att: any) => {
                    const attEmpId = att.employeeId || att.employee?.id;
                    const attName = (att.employee?.name || "").toLowerCase().trim();
                    const empName = (emp.name || "").toLowerCase().trim();
                    return (attEmpId && attEmpId === emp.id) || (attName && attName === empName);
                  });

                  const shiftCompletedCount = Math.max(empShiftLogs.length, empAtts.length);
                  const totalWage = shiftCompletedCount * ratePerShift;

                  return (
                    <div key={emp.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/60 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-sm">{emp.name}</span>
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded">
                            {emp.role ? emp.role.toUpperCase() : "STAF"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Tarif: <strong className="text-slate-800">Rp {ratePerShift.toLocaleString("id-ID")} / shift</strong> &bull; Total Hadir: <strong className={shiftCompletedCount > 0 ? "text-emerald-700 font-bold" : "text-slate-500"}>{shiftCompletedCount} Shift</strong>
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          Formula: ({shiftCompletedCount} shift &times; Rp {ratePerShift.toLocaleString("id-ID")})
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">TOTAL UPAH SHIFT</span>
                        <span className={`text-base font-extrabold ${shiftCompletedCount > 0 ? "text-emerald-600" : "text-slate-400"}`}>
                          Rp {totalWage.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

      </div>
    </AppShell>
  );
}
