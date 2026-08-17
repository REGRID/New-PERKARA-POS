"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  User, 
  Lock, 
  ArrowRight, 
  Store, 
  AlertCircle
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth, UserSession } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const inputId = username.trim();
    const inputPass = password.trim();

    if (!inputId) {
      setErrorMsg("Silakan masukkan ID Pengguna.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/data?type=login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: inputId, password: inputPass }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          login(data.user);
          router.push(data.user.role === "admin" ? "/" : "/pos");
          return;
        }
      }
      setErrorMsg("ID Pengguna atau Password salah.");
    } catch (err) {
      console.error("Login error:", err);
      setErrorMsg("Gagal menghubungi server autentikasi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100 text-slate-900 flex items-center justify-center p-4 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Light Background Decor Accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-300/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6">
        
        {/* Branding Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white font-bold text-2xl shadow-lg border border-indigo-200">
            P
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
            PERKARA POS
          </h1>
          <p className="text-xs text-slate-600 font-medium">Superapp Kasir, Stok, & Manajemen Outlet</p>
        </div>

        {/* Main Login Card (Clean Light Theme) */}
        <Card className="border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-xl text-slate-900 rounded-2xl">
          <CardHeader className="space-y-1 pb-3 text-center">
            <CardTitle className="text-xl font-bold text-slate-900">Masuk ke Sistem</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Masukkan ID Pengguna & Password akun Anda
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-1">
            
            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Login Form: ONLY ID and Password */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  ID Pengguna (Username)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <Input 
                    type="text"
                    placeholder="Masukkan ID Pengguna"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="min-h-[44px] pl-10 bg-slate-50/70 border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Password / PIN
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <Input 
                    type="password"
                    placeholder="Masukkan Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="min-h-[44px] pl-10 bg-slate-50/70 border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full min-h-[46px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 gap-2 text-xs uppercase tracking-wider transition-all rounded-xl cursor-pointer"
              >
                <span>Masuk Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

          </CardContent>

          <CardFooter className="justify-center border-t border-slate-100 py-3 bg-slate-50/50 rounded-b-2xl">
            <p className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
              <Store className="w-3.5 h-3.5 text-slate-400" />
              <span>PERKARA POS v2.0 &bull; Database Local MySQL (3306)</span>
            </p>
          </CardFooter>
        </Card>

      </div>
    </div>
  );
}
