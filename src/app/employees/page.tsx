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
  Printer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/layout/app-shell";

export default function EmployeesPage() {
  const [activeTab, setActiveTab] = useState<"employees" | "attendance" | "schedule" | "payroll">("employees");
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    employmentType: "FULL_TIME",
    flatSalaryAmount: 3000000,
    dailyRate: 100000,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [empRes, attRes] = await Promise.all([
        fetch("/api/data?type=employees"),
        fetch("/api/data?type=attendances"),
      ]);
      if (empRes.ok) setEmployees(await empRes.json());
      if (attRes.ok) setAttendances(await attRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      const res = await fetch("/api/data?type=save_employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({
          name: "",
          employmentType: "FULL_TIME",
          flatSalaryAmount: 3000000,
          dailyRate: 100000,
        });
        setShowAddForm(false);
        await fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm("Hapus data karyawan ini?")) return;
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
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Employee & HR Management</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Kelola data staf, jadwal shift kerja, dan perincian penggajian karyawan.
              </p>
            </div>

            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-stone-800 hover:bg-stone-900 text-white font-semibold text-xs px-4 py-2.5 rounded-xl min-h-[42px] gap-2 shadow-xs shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Karyawan Baru</span>
            </Button>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b pb-3">
            <button
              onClick={() => setActiveTab("employees")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all gap-2 flex items-center cursor-pointer ${
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
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all gap-2 flex items-center cursor-pointer ${
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
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all gap-2 flex items-center cursor-pointer ${
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
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all gap-2 flex items-center cursor-pointer ${
                activeTab === "payroll"
                  ? "bg-stone-800 text-white shadow-2xs"
                  : "bg-slate-100/70 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Penggajian (Payroll)</span>
            </button>
          </div>

          {/* Inline Add Employee Form */}
          {showAddForm && (
            <form onSubmit={handleAddEmployee} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-xs text-slate-800">Form Pendaftaran Karyawan Baru</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Nama Lengkap *</label>
                  <Input
                    placeholder="Nama Karyawan..."
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="bg-white min-h-[38px] text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Gaji Pokok Bulanan (Rp)</label>
                  <Input
                    type="number"
                    value={form.flatSalaryAmount}
                    onChange={(e) => setForm({ ...form, flatSalaryAmount: Number(e.target.value) })}
                    className="bg-white min-h-[38px] text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Tarif Harian (Daily Rate Rp)</label>
                  <Input
                    type="number"
                    value={form.dailyRate}
                    onChange={(e) => setForm({ ...form, dailyRate: Number(e.target.value) })}
                    className="bg-white min-h-[38px] text-xs"
                  />
                </div>
              </div>

              <Button type="submit" className="bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold px-4 min-h-[38px] rounded-xl">
                Simpan Karyawan
              </Button>
            </form>
          )}

          {/* TAB 1: DATA KARYAWAN ROSTER */}
          {activeTab === "employees" && (
            <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
              <div className="grid grid-cols-12 px-6 py-3.5 bg-slate-50/70 border-b text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
                <div className="col-span-6">NAMA & STAF</div>
                <div className="col-span-2 text-center">TIPE KERJA</div>
                <div className="col-span-3 text-right">GAJI POKOK</div>
                <div className="col-span-1 text-right">AKSI</div>
              </div>

              <div className="divide-y divide-slate-100">
                {employees.length > 0 ? (
                  employees.map((emp) => (
                    <div key={emp.id} className="grid grid-cols-12 px-6 py-3.5 items-center text-xs hover:bg-slate-50/60 transition-colors">
                      <div className="col-span-6 font-bold text-slate-900 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-slate-900 font-bold">{emp.name}</span>
                          <span className="block text-[10px] text-slate-400 font-normal">Karyawan Outlet</span>
                        </div>
                      </div>

                      <div className="col-span-2 text-center">
                        <Badge className="text-[10px] px-2 py-0.5 font-bold bg-slate-100 text-slate-700 border-none">
                          {emp.employmentType || "FULL_TIME"}
                        </Badge>
                      </div>

                      <div className="col-span-3 text-right font-bold text-slate-900">
                        Rp {Number(emp.flatSalaryAmount || 3000000).toLocaleString("id-ID")}
                      </div>

                      <div className="col-span-1 text-right">
                        <button onClick={() => handleDeleteEmployee(emp.id)} className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center space-y-2">
                    <Users className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-400 font-medium">Belum ada karyawan terdaftar.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ABSENSI & LOG KEHADIRAN */}
          {activeTab === "attendance" && (
            <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs space-y-4 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">Log Kehadiran Staf</h3>
                <span className="text-xs text-slate-400 font-medium">Total: {attendances.length} Log</span>
              </div>

              <div className="divide-y divide-slate-100 border rounded-xl overflow-hidden">
                {attendances.length > 0 ? (
                  attendances.map((att) => (
                    <div key={att.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                        <div>
                          <span className="font-bold text-slate-900">{att.employee?.name || "Karyawan"}</span>
                          <span className="block text-[10px] text-slate-400">{new Date(att.clockIn).toLocaleString("id-ID")}</span>
                        </div>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {att.status || "HADIR"}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400 font-medium">
                    Belum ada riwayat absensi tercatat hari ini.
                  </div>
                )}
              </div>
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

          {/* TAB 4: PAYROLL / PENGGAJIAN */}
          {activeTab === "payroll" && (
            <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs p-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-sm text-slate-900">Ringkasan Slip Gaji & Payroll Karyawan</h3>
                <Button size="sm" variant="outline" className="text-xs gap-1.5 min-h-[36px]">
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Laporan Payroll</span>
                </Button>
              </div>

              <div className="divide-y divide-slate-100 border rounded-xl overflow-hidden">
                {employees.map((emp) => {
                  const base = emp.flatSalaryAmount || 3000000;
                  const bonus = 250000;
                  const total = base + bonus;

                  return (
                    <div key={emp.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/60">
                      <div>
                        <span className="font-extrabold text-slate-900 text-sm">{emp.name}</span>
                        <span className="block text-[11px] text-slate-500 font-medium">Gaji Pokok: Rp {base.toLocaleString("id-ID")}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">TOTAL REKAP GAJI</span>
                        <span className="text-sm font-extrabold text-emerald-600">Rp {total.toLocaleString("id-ID")}</span>
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
