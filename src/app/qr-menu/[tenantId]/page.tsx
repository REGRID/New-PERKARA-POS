"use client";

import React, { useState, useEffect } from "react";
import { 
  Coffee, 
  ShoppingBag, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Info, 
  ChevronRight, 
  Flame, 
  Droplet, 
  X,
  Plus,
  Minus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

export default function QrMenuPublicPage() {
  const [menus, setMenus] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [tableNumber, setTableNumber] = useState("01");
  const [ordered, setOrdered] = useState(false);
  const [selectedStoryMenu, setSelectedStoryMenu] = useState<any>(null);

  // Customization Modal
  const [customizingMenu, setCustomizingMenu] = useState<any>(null);
  const [customBase, setCustomBase] = useState("Pure");
  const [customSugar, setCustomSugar] = useState("Normal (100%)");
  const [customIce, setCustomIce] = useState("Iced");
  const [customNotes, setCustomNotes] = useState("");

  useEffect(() => {
    async function fetchMenus() {
      try {
        const res = await fetch("/api/data?type=menus");
        if (res.ok) {
          const data = await res.json();
          setMenus(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchMenus();
  }, []);

  const categories = ["Semua", "Menu Kopi", "Menu Non Kopi", "Mocktail"];

  const filteredMenus = menus.filter((m) => {
    if (activeCategory === "Semua") return true;
    return m.category?.toLowerCase() === activeCategory.toLowerCase();
  });

  const handleOpenCustomize = (menu: any) => {
    setCustomizingMenu(menu);
    const isNonCoffee = menu.category?.toLowerCase().includes("non") || 
      ["coger", "mapeta", "tezam", "revamato", "taro", "carkol", "korum", "pismat"].some((k: string) => menu.name?.toLowerCase().includes(k));
    setCustomBase(isNonCoffee ? "Pure" : "");
    setCustomSugar("Normal (100%)");
    setCustomIce("Iced");
    setCustomNotes("");
  };

  const handleConfirmAddToCart = () => {
    if (!customizingMenu) return;
    const parts = [];
    if (customBase) parts.push(`Base ${customBase}`);
    if (customSugar) parts.push(`Gula ${customSugar}`);
    if (customIce) parts.push(customIce);
    const variantDesc = parts.join(" • ");

    const cartKey = `${customizingMenu.id}-${variantDesc}-${customNotes}`;
    const existingIndex = cart.findIndex((c) => c.cartKey === cartKey);

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].qty += 1;
      setCart(updated);
    } else {
      setCart([...cart, {
        cartKey,
        id: customizingMenu.id,
        name: customizingMenu.name,
        price: customizingMenu.price,
        qty: 1,
        variantDesc,
        notes: customNotes,
      }]);
    }

    setCustomizingMenu(null);
    setOrdered(false);
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setOrdered(true);
    setCart([]);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-amber-500 selection:text-slate-900 font-sans pb-28">
      {/* Brand Hero Header */}
      <header className="bg-slate-950 border-b border-slate-800 p-4 sticky top-0 z-20 shadow-md">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-lg shadow-lg shadow-amber-500/20">
              P.
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                PERKARA COFFEE <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[9px] font-bold">100% HALAL</Badge>
              </h1>
              <p className="text-[11px] text-slate-400">Daftar Menu Digital &bull; Meja {tableNumber}</p>
            </div>
          </div>

          <Badge variant="outline" className="text-[11px] border-slate-700 bg-slate-900 text-slate-300 py-1 px-2.5">
            Aman di Lambung
          </Badge>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-5">
        
        {/* Satire Tagline Card */}
        <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-slate-800 to-slate-900 border border-amber-500/30 rounded-2xl text-xs text-amber-200/90 leading-relaxed shadow-sm">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="italic">
              &ldquo;Semua menu ini 100% halal dan aman di lambung. Kalau ada yang merasa tersindir, itu murni perkara kebetulan semata.&rdquo;
            </p>
          </div>
        </div>

        {/* Order Placed Success Alert */}
        {ordered && (
          <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs space-y-1.5 shadow-lg animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Pesanan Berhasil Dikirim!
            </div>
            <p className="text-emerald-300/80">Pesanan Anda telah diteruskan ke kasir & barista. Harap tunggu sebentar, pesanan akan segera diantarkan ke Meja {tableNumber}.</p>
          </div>
        )}

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === cat
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Cards List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            <span>{activeCategory} ({filteredMenus.length} Menu)</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {filteredMenus.length > 0 ? (
              filteredMenus.map((m) => {
                let info: any = null;
                try {
                  if (m.ops) info = JSON.parse(m.ops);
                } catch (e) {}

                return (
                  <div 
                    key={m.id} 
                    className="bg-slate-800/80 border border-slate-700/70 p-3.5 rounded-2xl flex flex-col justify-between gap-2.5 shadow-sm hover:border-slate-600 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-extrabold text-sm text-white">{m.name}</h3>
                        {info?.standar && (
                          <div className="text-[11px] text-amber-400 font-medium mt-0.5">
                            {info.standar}
                          </div>
                        )}
                        {info?.makna && (
                          <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                            {info.makna}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-bold text-sm text-white">
                          Rp {Number(m.price || 0).toLocaleString("id-ID")}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-700/50">
                      {info?.filosofi ? (
                        <button
                          type="button"
                          onClick={() => setSelectedStoryMenu(m)}
                          className="text-[11px] text-amber-400/90 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Kisah &amp; Filosofi &rarr;
                        </button>
                      ) : (
                        <div />
                      )}

                      <Button
                        size="sm"
                        onClick={() => handleOpenCustomize(m)}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3.5 h-8 rounded-xl cursor-pointer"
                      >
                        + Pesan
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-800/40 rounded-2xl border border-slate-800">
                Memuat menu Perkara Coffee...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Philosophy & Story Modal */}
      <Dialog open={!!selectedStoryMenu} onOpenChange={() => setSelectedStoryMenu(null)}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700 text-slate-100">
          {selectedStoryMenu && (() => {
            let info: any = null;
            try {
              if (selectedStoryMenu.ops) info = JSON.parse(selectedStoryMenu.ops);
            } catch (e) {}
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-amber-500 text-slate-950 font-extrabold text-[10px]">
                      {selectedStoryMenu.category}
                    </Badge>
                    {info?.standar && (
                      <span className="text-xs text-amber-400 font-medium">({info.standar})</span>
                    )}
                  </div>
                  <DialogTitle className="text-lg font-extrabold text-white">
                    {selectedStoryMenu.name}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-3 py-2 text-xs text-slate-300 leading-relaxed">
                  {info?.makna && (
                    <div className="p-3 bg-slate-800/90 rounded-xl border border-slate-700 space-y-1">
                      <div className="font-bold text-amber-400">Makna Penamaan:</div>
                      <p className="text-slate-300">{info.makna}</p>
                    </div>
                  )}

                  {info?.filosofi && (
                    <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30 text-amber-200/90 space-y-1">
                      <div className="font-bold text-amber-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Cerita &amp; Filosofi Rasa:
                      </div>
                      <p className="italic">{info.filosofi}</p>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    onClick={() => {
                      const m = selectedStoryMenu;
                      setSelectedStoryMenu(null);
                      handleOpenCustomize(m);
                    }}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs h-10 rounded-xl"
                  >
                    Pesan {selectedStoryMenu.name} (Rp {Number(selectedStoryMenu.price || 0).toLocaleString("id-ID")})
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Product Customization Dialog */}
      <Dialog open={!!customizingMenu} onOpenChange={() => setCustomizingMenu(null)}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700 text-slate-100">
          {customizingMenu && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-extrabold text-white">
                  Kustomisasi: {customizingMenu.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  Sesuaikan varian racikan dan tingkat kemanisan sesuai selera Anda.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 text-xs">
                {/* Base Option (for Non-Coffee) */}
                {customBase !== "" && (
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-300 block">Pilihan Base Racikan:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "Pure", title: "Pure (Air + Creamer)", desc: "Pekat & segar" },
                        { id: "Latte", title: "Latte (Fresh Milk)", desc: "Creamy & gurih" },
                      ].map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setCustomBase(b.id)}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                            customBase === b.id
                              ? "border-amber-500 bg-amber-500/20 text-white font-bold"
                              : "border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700"
                          }`}
                        >
                          <div className="text-xs">{b.title}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{b.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sugar Level */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300 block">Tingkat Gula:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Normal (100%)", "Less (50%)", "No Sugar (0%)"].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setCustomSugar(s)}
                        className={`py-2 rounded-xl text-xs font-semibold text-center border cursor-pointer transition-all ${
                          customSugar === s
                            ? "border-amber-500 bg-amber-500 text-slate-950 font-bold"
                            : "border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700"
                        }`}
                      >
                        {s.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Temperature / Ice */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300 block">Suhu:</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Iced (Es Kristal)", "Hot (Hangat)"].map((i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCustomIce(i.split(" ")[0])}
                        className={`py-2 rounded-xl text-xs font-semibold text-center border cursor-pointer transition-all ${
                          customIce === i.split(" ")[0]
                            ? "border-amber-500 bg-amber-500 text-slate-950 font-bold"
                            : "border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700"
                        }`}
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Catatan Khusus Barista:</label>
                  <input
                    type="text"
                    placeholder="Contoh: Kurangi es batu..."
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => setCustomizingMenu(null)}
                  className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs h-10 rounded-xl"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleConfirmAddToCart}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs h-10 rounded-xl"
                >
                  Tambahkan ke Pesanan
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 shadow-2xl z-30">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
            <div>
              <span className="text-[11px] text-slate-400 font-medium">
                {cart.reduce((s, i) => s + i.qty, 0)} Item dipilih (Meja {tableNumber})
              </span>
              <div className="font-black text-amber-400 text-base">
                Rp {totalAmount.toLocaleString("id-ID")}
              </div>
            </div>
            <Button 
              onClick={handleCheckout}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-5 h-11 rounded-xl gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <span>Kirim ke Kasir &amp; Barista</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
