"use client";

import React, { useState, useEffect } from "react";
import { Coffee, ShoppingBag, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function QrMenuPublicPage() {
  const [menus, setMenus] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [tableNumber, setTableNumber] = useState("01");
  const [ordered, setOrdered] = useState(false);

  useEffect(() => {
    async function fetchMenus() {
      try {
        const res = await fetch("/api/data?type=menus");
        if (res.ok) setMenus(await res.json());
      } catch (e) {
        console.error(e);
      }
    }
    fetchMenus();
  }, []);

  const addToCart = (menu: any) => {
    const existing = cart.find((c) => c.id === menu.id);
    if (existing) {
      setCart(cart.map((c) => c.id === menu.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { ...menu, qty: 1 }]);
    }
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setOrdered(true);
    setCart([]);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <header className="bg-white border-b p-4 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
            P
          </div>
          <div>
            <h1 className="font-bold text-sm leading-none text-slate-900">PERKARA COFFEE</h1>
            <p className="text-[11px] text-slate-500 mt-0.5">Digital Menu QR Code &bull; Meja {tableNumber}</p>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="p-4 max-w-lg mx-auto space-y-4 pb-24">
        
        {ordered && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Pesanan Berhasil Dikirim!
            </div>
            <p>Pesanan Anda langsung diteruskan ke kasir & dapur. Terima kasih!</p>
          </div>
        )}

        {/* Menu Cards List */}
        <div className="space-y-2">
          <h2 className="font-bold text-xs uppercase tracking-wider text-slate-500">Daftar Menu Favorit</h2>
          
          <div className="grid grid-cols-1 gap-2">
            {menus.length > 0 ? (
              menus.map((m) => (
                <div key={m.id} className="bg-white p-3 rounded-xl border flex items-center justify-between shadow-2xs">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{m.name}</h3>
                    <span className="text-xs text-slate-500 font-medium">Rp {Number(m.price || 0).toLocaleString("id-ID")}</span>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => { setOrdered(false); addToCart(m); }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 min-h-[36px] rounded-lg"
                  >
                    + Pesan
                  </Button>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-xl border">Memuat menu...</div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t shadow-lg z-20">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">{cart.reduce((s, i) => s + i.qty, 0)} item dipilih</span>
              <div className="font-extrabold text-slate-900 text-base">Rp {totalAmount.toLocaleString("id-ID")}</div>
            </div>
            <Button 
              onClick={handleCheckout}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 min-h-[44px] rounded-xl gap-2 shadow-md"
            >
              <span>Kirim Pesanan</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
