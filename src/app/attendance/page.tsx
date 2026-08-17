"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Users, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  Key, 
  AlertCircle,
  Delete,
  UserCheck,
  UserX,
  RefreshCw
} from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AppShell } from "@/components/layout/app-shell";

export default function AttendancePage() {
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [pinInput, setPinInput] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
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

  const handleNumpadPress = (num: string) => {
    if (pinInput.length < 6) {
      setPinInput(prev => prev + num);
    }
  };

  const handleDeletePin = () => {
    setPinInput(prev => prev.slice(0, -1));
  };

  const handleVerifyAttendance = () => {
    if (pinInput.length < 4) return;
    setIsSuccess(true);
    setTimeout(() => {
      setStaffList(staffList.map(s => s.id === selectedStaff.id ? { 
        ...s, 
        status: s.status === "CLOCKED_IN" ? "NOT_CLOCKED_IN" : "CLOCKED_IN",
        clockInTime: s.status === "CLOCKED_IN" ? "-" : new Date().toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' }) + " WIB"
      } : s));
      setIsSuccess(false);
      setSelectedStaff(null);
      setPinInput("");
    }, 1200);
  };

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-2xl border shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400 flex items-center justify-center border border-teal-100 dark:border-teal-900">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Terminal Absensi Karyawan (Data Riil)</h1>
              <p className="text-xs text-muted-foreground">Menampilkan {staffList.length} karyawan aktif dari database lokal MySQL</p>
            </div>
          </div>

          <Button size="lg" variant="outline" onClick={fetchEmployees} className="min-h-[44px] font-medium gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>

        {/* Staff Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {staffList.map((staff) => (
            <Card 
              key={staff.id} 
              onClick={() => { setSelectedStaff(staff); setPinInput(""); }}
              className={`cursor-pointer transition-all shadow-xs flex flex-col justify-between hover:border-teal-400 ${
                staff.status === "CLOCKED_IN" ? "bg-teal-50/20 dark:bg-teal-950/10 border-teal-200 dark:border-teal-900/60" : "bg-card"
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge 
                    className={`text-[11px] font-semibold px-2 py-0.5 ${
                      staff.status === "CLOCKED_IN" 
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" 
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {staff.status === "CLOCKED_IN" ? "Hadir (Clocked In)" : "Belum Absen"}
                  </Badge>
                  {staff.status === "CLOCKED_IN" ? (
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <UserX className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <CardTitle className="text-base font-bold mt-2 text-foreground">{staff.name}</CardTitle>
                <CardDescription className="text-xs">
                  Role: <strong className="capitalize text-foreground">{staff.role || "Staf"}</strong> ({staff.employmentType || "Full Time"})
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Jam Absen: <strong className="text-foreground">{staff.clockInTime}</strong></span>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button 
                  size="lg" 
                  variant={staff.status === "CLOCKED_IN" ? "outline" : "default"} 
                  className={`w-full min-h-[44px] font-semibold text-xs ${
                    staff.status !== "CLOCKED_IN" ? "bg-teal-600 hover:bg-teal-700 text-white" : ""
                  }`}
                >
                  {staff.status === "CLOCKED_IN" ? "Absen Keluar (Clock Out)" : "Absen Masuk (Clock In)"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* PIN Touch Modal */}
        <Dialog open={!!selectedStaff} onOpenChange={() => setSelectedStaff(null)}>
          <DialogContent className="sm:max-w-md text-center">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                Verifikasi PIN: {selectedStaff?.name}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Masukkan 4-6 digit PIN karyawan Anda
              </DialogDescription>
            </DialogHeader>

            {isSuccess ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
                <h3 className="text-base font-bold text-emerald-700 dark:text-emerald-400">Absensi Berhasil Dicatat</h3>
              </div>
            ) : (
              <div className="space-y-4 py-2">
                {/* PIN Dots */}
                <div className="flex justify-center items-center gap-3 my-2">
                  {[0, 1, 2, 3, 4, 5].map((idx) => (
                    <div 
                      key={idx} 
                      className={`w-3.5 h-3.5 rounded-full border transition-all ${
                        idx < pinInput.length ? "bg-teal-600 border-teal-600 scale-110" : "bg-muted border-border"
                      }`}
                    />
                  ))}
                </div>

                {/* Numpad Touch Buttons (min 48px) */}
                <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                    <Button 
                      key={num} 
                      variant="outline" 
                      onClick={() => handleNumpadPress(num)}
                      className="min-h-[56px] text-xl font-bold hover:bg-teal-50 dark:hover:bg-teal-950/30"
                    >
                      {num}
                    </Button>
                  ))}
                  <Button 
                    variant="outline" 
                    onClick={handleDeletePin}
                    className="min-h-[56px] text-xs font-bold text-destructive hover:bg-destructive/10"
                  >
                    <Delete className="w-5 h-5 mx-auto" />
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleNumpadPress("0")}
                    className="min-h-[56px] text-xl font-bold hover:bg-teal-50 dark:hover:bg-teal-950/30"
                  >
                    0
                  </Button>
                  <Button 
                    onClick={handleVerifyAttendance}
                    disabled={pinInput.length < 4}
                    className="min-h-[56px] font-bold bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    OK
                  </Button>
                </div>
              </div>
            )}

          </DialogContent>
        </Dialog>

      </div>
    </AppShell>
  );
}
