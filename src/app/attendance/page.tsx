"use client";

import React, { useState, useEffect } from "react";
import { 
  Clock, 
  UserCheck, 
  UserX, 
  RefreshCw 
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/layout/app-shell";

export default function AttendancePage() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/data?type=employees");
      if (res.ok) {
        const json = await res.json();
        setStaffList(json.map((emp: any) => ({
          ...emp,
          status: "NOT_CLOCKED_IN",
          clockInTime: "-",
        })));
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleToggleAttendance = async (staffId: string) => {
    setStaffList(prev => prev.map(s => {
      if (s.id === staffId) {
        const isClockedIn = s.status === "CLOCKED_IN";
        return {
          ...s,
          status: isClockedIn ? "NOT_CLOCKED_IN" : "CLOCKED_IN",
          clockInTime: isClockedIn ? "-" : new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
        };
      }
      return s;
    }));

    // Post to backend
    try {
      await fetch("/api/data?type=save_attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: staffId, status: "HADIR", notes: "1-Click Attendance" }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Terminal Absensi Karyawan</h1>
              <p className="text-xs text-slate-500 font-medium">1-Click Absensi masuk & keluar untuk {staffList.length} karyawan aktif</p>
            </div>
          </div>

          <Button size="lg" variant="outline" onClick={fetchEmployees} className="min-h-[42px] text-xs font-semibold gap-1.5 rounded-xl">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Data</span>
          </Button>
        </div>

        {/* Staff Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {staffList.map((staff) => (
            <Card 
              key={staff.id} 
              className={`transition-all shadow-2xs flex flex-col justify-between rounded-2xl border ${
                staff.status === "CLOCKED_IN" ? "bg-teal-50/20 border-teal-200" : "bg-white border-slate-200/80"
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge 
                    className={`text-[11px] font-bold px-2 py-0.5 border-none ${
                      staff.status === "CLOCKED_IN" 
                        ? "bg-emerald-100 text-emerald-800" 
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {staff.status === "CLOCKED_IN" ? "Hadir (Clocked In)" : "Belum Absen"}
                  </Badge>
                  {staff.status === "CLOCKED_IN" ? (
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <UserX className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <CardTitle className="text-base font-bold mt-2 text-slate-900">{staff.name}</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Karyawan Outlet ({staff.employmentType || "Full Time"})
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-2">
                <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Jam Absen: <strong className="text-slate-900">{staff.clockInTime}</strong></span>
                </div>
              </CardContent>

              <CardFooter className="pt-2">
                <Button 
                  size="lg"
                  onClick={() => handleToggleAttendance(staff.id)}
                  className={`w-full min-h-[42px] font-semibold text-xs rounded-xl cursor-pointer ${
                    staff.status === "CLOCKED_IN" 
                      ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300" 
                      : "bg-teal-600 hover:bg-teal-700 text-white"
                  }`}
                >
                  {staff.status === "CLOCKED_IN" ? "Absen Keluar (Clock Out)" : "Absen Masuk (Clock In)"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

      </div>
    </AppShell>
  );
}
