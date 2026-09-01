"use client";

import React, { useState, useEffect } from "react";
import { Coffee, ShieldAlert, ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";

interface MandatoryShiftGateProps {
  onShiftOpened: (shiftData: any) => void;
}

export function MandatoryShiftGate({ onShiftOpened }: MandatoryShiftGateProps) {
  const { isAdmin } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [inputPin, setInputPin] = useState<string>("");
  const [shiftCategory, setShiftCategory] = useState<"FULL_TIME" | "PART_TIME">("FULL_TIME");
  const [startCashDisplay, setStartCashDisplay] = useState<string>("");
  const [startCashNumber, setStartCashNumber] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const res = await fetch("/api/data?type=employees");
        if (res.ok) {
          const json = await res.json();
          setEmployees(Array.isArray(json) ? json : []);
        } else {
          setEmployees([]);
        }
      } catch (e) {
        console.error(e);
        setEmployees([]);
      }
    };
    loadEmployees();
  }, []);

  const handleStartCashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, "");
    if (!rawVal) {
      setStartCashDisplay("");
      setStartCashNumber(0);
      return;
    }
    const num = parseInt(rawVal, 10);
    setStartCashNumber(num);
    setStartCashDisplay(num.toLocaleString("id-ID"));
  };

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) {
      setErrorMsg("Silakan pilih nama karyawan yang bertugas shift.");
      return;
    }

    // Verify Employee PIN
    const currentEmp = employees.find((emp) => emp.name === selectedStaff);
    const validPin = currentEmp?.pin;

    if (!validPin || inputPin !== validPin) {
      setErrorMsg(`PIN verifikasi salah untuk ${selectedStaff}! Silakan masukkan PIN yang terdaftar.`);
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg("");

      const res = await fetch("/api/absen-kas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "shift-in",
          employeeName: selectedStaff,
          shiftCategory,
          startingCash: startCashNumber,
          note: `Buka shift kasir (${shiftCategory})`,
          timestamp: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        const json = await res.json();
        onShiftOpened(json.log || { employeeName: selectedStaff, shiftCategory, startCash: startCashNumber });
      } else {
        const errJson = await res.json();
        setErrorMsg(errJson.error || "Gagal membuka shift. Silakan coba lagi.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Terjadi kesalahan jaringan.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0b1329] flex items-center justify-center p-4 select-none fixed inset-0 z-50">
      
      {/* Centered Modal Card */}
      <div className="max-w-[440px] w-full bg-white rounded-[28px] p-7 md:p-8 shadow-2xl space-y-6 text-slate-900 border border-slate-100/40 relative animate-in fade-in zoom-in-95 duration-200">
        {/* Coffee Cup Icon */}
        <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto shadow-md">
          <Coffee className="w-7 h-7 text-amber-400" />
        </div>

        {/* Header Text & Badge */}
        <div className="text-center space-y-2.5">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
            PERKARA KOPI POS
          </h2>

          <div className="flex justify-center">
            <span className="bg-amber-50 text-amber-800 border border-amber-200/80 text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              Buka Shift Kasir
            </span>
          </div>

          <p className="text-xs text-slate-500 font-medium leading-relaxed px-1">
            Pilih staf kasir yang bertugas dan masukkan modal awal kasir untuk memulai transaksi.
          </p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleOpenShift} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl text-center">
              {errorMsg}
            </div>
          )}

          {/* Field 1: Staff Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-800">
                Kasir yang Bertugas <span className="text-rose-500">*</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">(Penanggung Jawab)</span>
            </div>

            <div className="relative">
              <select
                value={selectedStaff}
                onChange={(e) => {
                  setSelectedStaff(e.target.value);
                  setErrorMsg("");
                }}
                className="w-full min-h-[46px] px-4 pr-10 rounded-2xl border-2 border-slate-800 text-xs bg-white font-bold text-slate-900 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-900/20 transition-all"
                required
              >
                <option value="">-- Pilih Kasir --</option>
                {employees.map((emp) => (
                  <option key={emp.id || emp.name} value={emp.name}>
                    {emp.name} ({emp.role ? emp.role.toUpperCase() : "BARISTA"})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-700 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Field 1.5: PIN Verifikasi Karyawan */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-800">
                PIN Kasir <span className="text-rose-500">*</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">(4 Digit PIN)</span>
            </div>
            <Input
              type="password"
              maxLength={6}
              value={inputPin}
              onChange={(e) => {
                setInputPin(e.target.value);
                setErrorMsg("");
              }}
              placeholder="Masukkan PIN..."
              className="min-h-[46px] px-4 rounded-2xl border-2 border-slate-800 text-sm font-black tracking-widest bg-slate-50 focus:bg-white"
              required
            />
          </div>

          {/* Field 2: Shift Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 block">Jenis Shift</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShiftCategory("FULL_TIME")}
                className={`py-3 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                  shiftCategory === "FULL_TIME"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                Full Time
              </button>
              <button
                type="button"
                onClick={() => setShiftCategory("PART_TIME")}
                className={`py-3 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                  shiftCategory === "PART_TIME"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                Part Time
              </button>
            </div>
          </div>

          {/* Field 3: Nominal Uang Cash di Kasir */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-800">
                Modal Awal Kasir (Rp) <span className="text-rose-500">*</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">(Wajib)</span>
            </div>
            
            <Input
              type="text"
              placeholder="Contoh: 200.000"
              value={startCashDisplay}
              onChange={handleStartCashChange}
              className="min-h-[46px] rounded-2xl border-slate-200 text-xs font-semibold text-slate-900 placeholder:text-slate-400 bg-slate-50/50 focus-visible:ring-slate-900"
              required
            />
            
            <p className="text-[10px] text-slate-400 italic pt-0.5">
              * Masukkan jumlah uang fisik di laci kasir saat ini.
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={submitting || !selectedStaff}
            className="w-full bg-[#86efac] hover:bg-[#6ee7b7] text-slate-900 font-extrabold py-3.5 rounded-2xl shadow-sm text-sm flex items-center justify-center gap-2 cursor-pointer transition-all min-h-[48px] border border-emerald-300/40 mt-3"
          >
            {submitting ? (
              <span>Membuka Shift...</span>
            ) : (
              <>
                <span>Buka Shift Kasir</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>

      </div>

    </div>
  );
}
