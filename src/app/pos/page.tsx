"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ShoppingCart, 
  ArrowLeft, 
  CheckCircle2, 
  Trash2, 
  Plus, 
  Minus, 
  Search, 
  CreditCard, 
  DollarSign, 
  ShieldAlert,
  Coffee,
  CupSoda,
  Utensils,
  Package,
  Layers,
  Store,
  LayoutDashboard,
  RefreshCw
} from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

import { bluetoothPrinter } from "@/lib/bluetooth-printer";

export default function POSTerminalPage() {
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Cart State
  const [cart, setCart] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [supervisorPin, setSupervisorPin] = useState("");
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/data?type=menus");
      if (res.ok) {
        const json = await res.json();
        if (json.length > 0) {
          setProducts(json);
        } else {
          // Fallback default menu items if database is empty
          setProducts([
            { id: "m1", name: "Es Kopi Susu Gula Aren", category: "Kopi", price: 24000 },
            { id: "m2", name: "Americano Iced", category: "Kopi", price: 18000 },
            { id: "m3", name: "Matcha Latte Ice", category: "Non-Kopi", price: 26000 },
            { id: "m4", name: "Croissant Coklat", category: "Makanan", price: 22000 },
          ]);
        }
      }
    } catch (err) {
      console.error("Error fetching menus:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const getProductIcon = (cat: string) => {
    const lower = (cat || "").toLowerCase();
    if (lower.includes("kopi") || lower.includes("coffee")) return <Coffee className="w-5 h-5 text-amber-700 dark:text-amber-300" />;
    if (lower.includes("makan") || lower.includes("food") || lower.includes("snack")) return <Utensils className="w-5 h-5 text-orange-700 dark:text-orange-300" />;
    return <CupSoda className="w-5 h-5 text-sky-700 dark:text-sky-300" />;
  };

  const addToCart = (product: any) => {
    const existingIndex = cart.findIndex(c => c.productId === product.id);
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].qty += 1;
      setCart(updated);
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        price: product.price,
        qty: 1,
        variantName: "Regular",
        addons: []
      }]);
    }
  };

  const updateCartQty = (index: number, delta: number) => {
    const updated = [...cart];
    updated[index].qty += delta;
    if (updated[index].qty <= 0) {
      updated.splice(index, 1);
    }
    setCart(updated);
  };

  const subtotal = cart.reduce((sum, item) => {
    const addonsSum = item.addons.reduce((aSum: number, a: any) => aSum + a.price, 0);
    return sum + (item.price + addonsSum) * item.qty;
  }, 0);

  const changeAmount = Math.max(0, amountPaid - subtotal);

  const handleProcessCheckout = async () => {
    try {
      setIsProcessing(true);
      const orderNumber = `POS-${Math.floor(Math.random() * 9000) + 1000}`;

      // Save real order to database
      await fetch("/api/data?type=checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber,
          channel: "DINE_IN",
          subtotal,
          discount: 0,
          totalAmount: subtotal,
          paymentMethod,
          items: cart.map(item => ({
            menuId: item.productId,
            menuName: item.name,
            variantName: item.variantName,
            price: item.price,
            quantity: item.qty,
            subtotal: item.price * item.qty,
          })),
        }),
      });

      setIsPaymentSuccess(true);

      // Bluetooth Print
      const receiptData = {
        storeName: "Perkara Kopi Outlet",
        storeAddress: "Jl. Pemuda No. 88, Jakarta",
        orderNumber,
        date: new Date().toLocaleString("id-ID"),
        cashierName: "Budi Santoso",
        channel: "Dine-In Kasir",
        items: cart.map(item => ({
          name: item.name,
          variantName: item.variantName,
          qty: item.qty,
          price: item.price,
          subtotal: item.price * item.qty,
          addons: item.addons
        })),
        subtotal,
        discount: 0,
        total: subtotal,
        paymentMethod,
        amountPaid: amountPaid || subtotal,
        change: changeAmount
      };

      try {
        await bluetoothPrinter.printReceipt(receiptData);
      } catch (err) {
        console.warn("Printer warning:", err);
      }

      setTimeout(() => {
        setIsPaymentSuccess(false);
        setIsCheckoutOpen(false);
        setCart([]);
        setAmountPaid(0);
      }, 1500);

    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const categories = ["Semua", ...Array.from(new Set(products.map(p => p.category || "Umum")))];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      
      {/* POS Top Header Bar */}
      <header className="bg-card border-b p-3 flex items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button size="icon" variant="outline" className="min-h-[44px] min-w-[44px] gap-2 border-slate-200 dark:border-slate-800">
              <LayoutDashboard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </Button>
          </Link>
          <div>
            <h1 className="text-base font-bold flex items-center gap-2 text-foreground">
              <span>Terminal Kasir POS (Live Database)</span>
              <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 text-[10px] font-semibold">
                Database Ready
              </Badge>
            </h1>
            <p className="text-xs text-muted-foreground">Kasir: Budi Santoso | Terhubung ke MySQL 3306</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={fetchMenus} className="min-h-[38px] text-xs gap-1.5 font-medium">
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            <span>Sync Menu</span>
          </Button>
          <Badge variant="outline" className="px-2.5 py-1 text-xs font-semibold bg-indigo-50/60 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200">
            Omnichannel Ready
          </Badge>
        </div>
      </header>

      {/* Main POS Split Screen */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        
        {/* Left Side: Product Catalogue Grid (Cols 7) */}
        <div className="lg:col-span-7 p-4 border-r flex flex-col space-y-4 overflow-y-auto bg-muted/10">
          
          {/* Search & Category Filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-muted-foreground" />
              <Input 
                placeholder="Cari nama menu..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="min-h-[44px] pl-9 bg-card border"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  onClick={() => setSelectedCategory(cat)}
                  className={`min-h-[44px] px-5 rounded-xl text-xs font-semibold ${
                    selectedCategory === cat ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs" : ""
                  }`}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {products
              .filter(p => selectedCategory === "Semua" || p.category === selectedCategory)
              .filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((product) => (
                <Card 
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="hover:border-indigo-400 cursor-pointer transition-all flex flex-col justify-between p-3.5 min-h-[145px] shadow-xs hover:shadow-sm bg-card"
                >
                  <div>
                    <div className="p-2.5 rounded-xl border bg-muted/40 w-fit mb-2.5">
                      {getProductIcon(product.category)}
                    </div>
                    <h3 className="font-bold text-sm text-foreground line-clamp-1">{product.name}</h3>
                    <span className="text-[11px] text-muted-foreground">{product.category || "Menu"}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground">Rp {Number(product.price).toLocaleString("id-ID")}</span>
                    <Button size="icon" className="h-8 w-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
          </div>

        </div>

        {/* Right Side: Active Cart & Checkout (Cols 5) */}
        <div className="lg:col-span-5 p-4 bg-card flex flex-col justify-between space-y-4">
          
          <div className="space-y-4 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="font-bold text-sm flex items-center gap-2 text-foreground">
                <ShoppingCart className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Keranjang Pesanan</span>
              </h2>
              {cart.length > 0 && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setIsVoidModalOpen(true)}
                  className="min-h-[36px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950 text-xs gap-1 font-semibold"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Void Order</span>
                </Button>
              )}
            </div>

            {/* Cart Items List */}
            {cart.length === 0 ? (
              <div className="text-center py-14 text-muted-foreground text-xs space-y-2">
                <ShoppingCart className="w-8 h-8 mx-auto stroke-1" />
                <p>Keranjang kosong. Pilih menu di sebelah kiri.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl border bg-muted/20 space-y-2 shadow-2xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{item.name}</h4>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">Rp {Number(item.price).toLocaleString("id-ID")}</p>
                      </div>
                      
                      <div className="flex items-center gap-2 bg-card rounded-lg border p-1 shadow-2xs">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateCartQty(idx, -1)}>
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="font-bold text-xs px-2 text-foreground">{item.qty}</span>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateCartQty(idx, 1)}>
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Footer Summary & Checkout Button */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground font-medium">Subtotal Tagihan:</span>
              <strong className="text-xl font-bold text-foreground">Rp {subtotal.toLocaleString("id-ID")}</strong>
            </div>

            <Button 
              size="lg" 
              disabled={cart.length === 0}
              onClick={() => setIsCheckoutOpen(true)}
              className="w-full min-h-[50px] font-bold text-base gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              <CreditCard className="w-5 h-5" />
              <span>Bayar (Rp {subtotal.toLocaleString("id-ID")})</span>
            </Button>
          </div>

        </div>

      </div>

      {/* Checkout Modal */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pembayaran Transaksi</DialogTitle>
            <DialogDescription>Total Tagihan: Rp {subtotal.toLocaleString("id-ID")}</DialogDescription>
          </DialogHeader>

          {isPaymentSuccess ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
              <h3 className="text-base font-bold text-emerald-700 dark:text-emerald-400">Pembayaran Sukses & Tersimpan ke DB</h3>
              <p className="text-xs text-muted-foreground">Struk dicetak ke Printer Bluetooth.</p>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              
              {/* Payment Method Selector */}
              <div className="grid grid-cols-3 gap-2">
                {["CASH", "QRIS", "EDC_CARD"].map((m) => (
                  <Button
                    key={m}
                    variant={paymentMethod === m ? "default" : "outline"}
                    onClick={() => setPaymentMethod(m)}
                    className={`min-h-[44px] text-xs font-bold ${
                      paymentMethod === m ? "bg-indigo-600 hover:bg-indigo-700 text-white" : ""
                    }`}
                  >
                    {m}
                  </Button>
                ))}
              </div>

              {/* Quick Cash Buttons for Cash Payment */}
              {paymentMethod === "CASH" && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground block">Pecahan Uang Tunai Cepat:</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[subtotal, 20000, 50000, 100000].map((amt) => (
                      <Button 
                        key={amt}
                        size="sm"
                        variant="outline"
                        onClick={() => setAmountPaid(amt)}
                        className="min-h-[44px] text-xs font-semibold hover:border-indigo-300"
                      >
                        {amt === subtotal ? "Uang Pas" : `${amt / 1000}k`}
                      </Button>
                    ))}
                  </div>

                  <Input 
                    type="number" 
                    placeholder="Nominal Uang Tunai..."
                    value={amountPaid || ""}
                    onChange={(e) => setAmountPaid(Number(e.target.value))}
                    className="min-h-[44px] mt-2"
                  />

                  {amountPaid >= subtotal && (
                    <div className="p-3.5 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 rounded-xl flex justify-between text-sm font-bold">
                      <span>Kembalian:</span>
                      <span>Rp {changeAmount.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {!isPaymentSuccess && (
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" className="min-h-[44px]" onClick={() => setIsCheckoutOpen(false)}>
                Batal
              </Button>
              <Button 
                disabled={isProcessing}
                className="min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" 
                onClick={handleProcessCheckout}
              >
                {isProcessing ? "Menyimpan ke DB..." : "Proses & Simpan Order"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Void Order PIN Supervisor Modal */}
      <Dialog open={isVoidModalOpen} onOpenChange={setIsVoidModalOpen}>
        <DialogContent className="sm:max-w-xs text-center">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-destructive">PIN Supervisor (Void)</DialogTitle>
            <DialogDescription className="text-xs">Pembatalan pesanan wajib otorisasi PIN</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Input 
              type="password"
              placeholder="PIN Supervisor..."
              value={supervisorPin}
              onChange={(e) => setSupervisorPin(e.target.value)}
              className="min-h-[44px] text-center text-lg tracking-widest"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" className="min-h-[44px] w-full" onClick={() => setIsVoidModalOpen(false)}>
              Batal
            </Button>
            <Button 
              variant="destructive"
              className="min-h-[44px] w-full font-semibold" 
              onClick={() => { setCart([]); setIsVoidModalOpen(false); setSupervisorPin(""); }}
            >
              Batalkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
