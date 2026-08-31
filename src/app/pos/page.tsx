"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ShoppingCart, 
  CheckCircle2, 
  Plus, 
  Minus, 
  Search, 
  CreditCard, 
  ShieldAlert,
  Coffee,
  CupSoda,
  Utensils,
  LayoutDashboard,
  RefreshCw,
  Maximize,
  Minimize,
  Clock,
  FileText,
  Wallet,
  Camera
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

import { bluetoothPrinter } from "@/lib/bluetooth-printer";
import { useAuth } from "@/lib/auth-context";
import { MandatoryShiftGate } from "@/components/mandatory-shift-gate";
import { CashInOutModal, CashTransactionPayload } from "@/components/cash-flow/CashInOutModal";

export default function POSTerminalPage() {
  const { user, isAdmin } = useAuth();
  const [isPettyCashOpen, setIsPettyCashOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeShift, setActiveShift] = useState<any>(null);
  const [checkingShift, setCheckingShift] = useState(true);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  const fetchActiveShift = async () => {
    try {
      setCheckingShift(true);
      const res = await fetch(`/api/absen-kas?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}&employee=ALL`);
      if (res.ok) {
        const data = await res.json();
        if (data.activeShifts && data.activeShifts.length > 0) {
          setActiveShift(data.activeShifts[0]);
        } else {
          setActiveShift(null);
        }
      }
    } catch (err) {
      console.error("Error checking active shift:", err);
    } finally {
      setCheckingShift(false);
    }
  };
  
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
    fetchActiveShift();
  }, []);

  const getProductIcon = (cat: string) => {
    const lower = (cat || "").toLowerCase();
    if (lower.includes("kopi") || lower.includes("coffee")) return <Coffee className="w-5 h-5 text-amber-700 dark:text-amber-300" />;
    if (lower.includes("makan") || lower.includes("food") || lower.includes("snack")) return <Utensils className="w-5 h-5 text-orange-700 dark:text-orange-300" />;
    return <CupSoda className="w-5 h-5 text-sky-700 dark:text-sky-300" />;
  };

  // Product Customization Modal State
  const [selectedCustomProduct, setSelectedCustomProduct] = useState<any>(null);
  const [customSugar, setCustomSugar] = useState("Normal Sugar (100%)");
  const [customIce, setCustomIce] = useState("Normal Ice");
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);
  const [customNotes, setCustomNotes] = useState("");
  const [voidError, setVoidError] = useState("");

  const availableAddonsList = [
    { name: "Extra Espresso Shot", price: 5000 },
    { name: "Boba Pearl", price: 4000 },
    { name: "Cream Cheese Top", price: 6000 },
    { name: "Whipped Cream", price: 5000 },
  ];

  const handleOpenCustomization = (product: any) => {
    setSelectedCustomProduct(product);
    setCustomSugar("Normal Sugar (100%)");
    setCustomIce("Normal Ice");
    setSelectedAddons([]);
    setCustomNotes("");
  };

  const handleConfirmAddToCart = () => {
    if (!selectedCustomProduct) return;
    const variantName = `${customSugar}, ${customIce}`;

    setCart([...cart, {
      productId: selectedCustomProduct.id,
      name: selectedCustomProduct.name,
      price: selectedCustomProduct.price,
      qty: 1,
      variantName,
      addons: selectedAddons,
      notes: customNotes,
    }]);

    setSelectedCustomProduct(null);
  };

  const toggleAddonSelection = (addon: any) => {
    if (selectedAddons.some((a) => a.name === addon.name)) {
      setSelectedAddons(selectedAddons.filter((a) => a.name !== addon.name));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const handleConfirmVoidCart = () => {
    if (supervisorPin === "9999" || supervisorPin === (user?.pin || "9999")) {
      setCart([]);
      setIsVoidModalOpen(false);
      setSupervisorPin("");
      setVoidError("");
    } else {
      setVoidError("PIN Supervisor salah! (Default PIN: 9999)");
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
      const randomSuffix = typeof window !== "undefined" && window.crypto?.randomUUID 
        ? window.crypto.randomUUID().slice(0, 4).toUpperCase() 
        : String(Date.now()).slice(-4);
      const orderNumber = `POS-${randomSuffix}`;

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

  // Closing Shift Modal State
  const [isCloseShiftOpen, setIsCloseShiftOpen] = useState(false);
  const [closingCash, setClosingCash] = useState<number>(0);
  const [closingCashDisplay, setClosingCashDisplay] = useState<string>("");
  const [closingNote, setClosingNote] = useState<string>("");
  const [isClosingShift, setIsClosingShift] = useState<boolean>(false);

  const handleClosingCashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, "");
    if (!rawVal) {
      setClosingCashDisplay("");
      setClosingCash(0);
      return;
    }
    const num = parseInt(rawVal, 10);
    setClosingCash(num);
    setClosingCashDisplay(num.toLocaleString("id-ID"));
  };

  const handleConfirmCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;

    try {
      setIsClosingShift(true);
      const res = await fetch("/api/absen-kas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "shift-out",
          employeeName: activeShift.employeeName || user?.name || "Kasir Outlet",
          startingCash: activeShift.startingCash || activeShift.startCash || 0,
          cashVerified: closingCash,
          note: closingNote || "Closing shift kasir",
          timestamp: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        setIsCloseShiftOpen(false);
        setActiveShift(null);
        setClosingCash(0);
        setClosingCashDisplay("");
        setClosingNote("");
        setCart([]);
        setAmountPaid(0);
        setPaymentMethod("CASH");
        setSelectedCategory("Semua");
        setSearchQuery("");
        await fetchActiveShift();
      }
    } catch (err) {
      console.error("Error closing shift:", err);
    } finally {
      setIsClosingShift(false);
    }
  };

  // Mandatory Shift Gate: Blocks terminal and resets to default shift opening gate if no shift is active
  if (!activeShift && !checkingShift) {
    return (
      <MandatoryShiftGate
        onShiftOpened={(newShift) => {
          setActiveShift(newShift);
          fetchActiveShift();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      
      {/* POS Dedicated Full Screen Header Bar */}
      <header className="bg-slate-900 text-white p-3 flex items-center justify-between gap-2 shadow-md shrink-0">
        <div className="flex items-center gap-3">
          {isAdmin ? (
            <Link href="/">
              <Button size="icon" variant="outline" className="min-h-[40px] min-w-[40px] border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700">
                <LayoutDashboard className="w-4 h-4 text-indigo-400" />
              </Button>
            </Link>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white text-base">
              POS
            </div>
          )}

          <div>
            <h1 className="text-sm md:text-base font-extrabold flex items-center gap-2 text-white">
              <span>Kasir POS</span>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] font-bold">
                Aktif
              </Badge>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              Kasir: <strong className="text-slate-200">{activeShift?.employeeName || user?.name || "Kasir Outlet"}</strong> ({isAdmin ? "Admin" : "Kasir Shift"})
            </p>
          </div>
        </div>

        {/* Quick Actions & Fullscreen Toggle Button */}
        <div className="flex items-center gap-2">

          {activeShift && !isAdmin && (
            <Button
              size="sm"
              onClick={() => setIsCloseShiftOpen(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white min-h-[38px] text-xs font-bold gap-1 px-3 rounded-xl cursor-pointer"
              title="Tutup Shift Kasir"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Tutup Shift</span>
            </Button>
          )}

          <Link href="/orders">
            <Button size="sm" variant="outline" className="min-h-[38px] text-xs gap-1.5 border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Transaksi</span>
            </Button>
          </Link>

          <Button
            size="sm"
            onClick={() => setIsPettyCashOpen(true)}
            className="min-h-[38px] text-xs font-bold gap-1.5 px-3 rounded-xl cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
            title="Catat Kas Masuk atau Keluar"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kas Masuk/Keluar</span>
          </Button>

          <Link href="/reports/cash-flow">
            <Button size="sm" variant="outline" className="min-h-[38px] text-xs gap-1.5 border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Kas Laci</span>
            </Button>
          </Link>

          <Link href="/attendance">
            <Button size="sm" variant="outline" className="min-h-[38px] text-xs gap-1.5 border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Absensi</span>
            </Button>
          </Link>

          <Button 
            size="sm" 
            variant="outline" 
            onClick={fetchMenus} 
            className="min-h-[38px] text-xs gap-1.5 border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden md:inline">Segarkan</span>
          </Button>

          {/* Fullscreen Mode Button */}
          <Button
            size="sm"
            onClick={toggleFullscreen}
            className="bg-indigo-600 hover:bg-indigo-700 text-white min-h-[38px] text-xs font-bold gap-1.5 px-3 rounded-xl cursor-pointer"
            title="Layar Penuh (Full Screen)"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            <span className="hidden md:inline">{isFullscreen ? "Keluar Fullscreen" : "Full Screen"}</span>
          </Button>
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
                  onClick={() => handleOpenCustomization(product)}
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
                <span>Keranjang</span>
              </h2>
              {cart.length > 0 && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setIsVoidModalOpen(true)}
                  className="min-h-[36px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950 text-xs gap-1 font-semibold"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Batalkan Semua</span>
                </Button>
              )}
            </div>

            {/* Cart Items List */}
            {cart.length === 0 ? (
              <div className="text-center py-14 text-muted-foreground text-xs space-y-2">
                <ShoppingCart className="w-8 h-8 mx-auto stroke-1" />
                <p>Keranjang kosong. Pilih menu untuk menambahkan.</p>
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
              <span className="text-muted-foreground font-medium">Subtotal:</span>
              <strong className="text-xl font-bold text-foreground">Rp {subtotal.toLocaleString("id-ID")}</strong>
            </div>

            <Button 
              size="lg" 
              disabled={cart.length === 0}
              onClick={() => setIsCheckoutOpen(true)}
              className="w-full min-h-[50px] font-bold text-base gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              <CreditCard className="w-5 h-5" />
              <span>Bayar Rp {subtotal.toLocaleString("id-ID")}</span>
            </Button>
          </div>

        </div>

      </div>

      {/* Checkout Modal */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pembayaran</DialogTitle>
            <DialogDescription>Total: Rp {subtotal.toLocaleString("id-ID")}</DialogDescription>
          </DialogHeader>

          {isPaymentSuccess ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
              <h3 className="text-base font-bold text-emerald-700 dark:text-emerald-400">Pembayaran Berhasil</h3>
              <p className="text-xs text-muted-foreground">Struk otomatis dicetak.</p>
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
                  <label className="text-xs font-semibold text-muted-foreground block">Pilihan Nominal:</label>
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
                    placeholder="Nominal Diterima..."
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
                {isProcessing ? "Memproses Transaksi..." : "Selesaikan Transaksi"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Product Customization & Add-Ons Dialog */}
      <Dialog open={!!selectedCustomProduct} onOpenChange={() => setSelectedCustomProduct(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedCustomProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Opsi Menu: {selectedCustomProduct.name}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Tentukan level gula, es, menu tambahan, dan catatan khusus.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 text-xs">
                {/* Sugar Level */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Level Gula:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Normal Sugar (100%)", "Less Sugar (70%)", "No Sugar (0%)"].map((s) => (
                      <Button
                        key={s}
                        type="button"
                        variant={customSugar === s ? "default" : "outline"}
                        onClick={() => setCustomSugar(s)}
                        className={`min-h-[38px] text-[11px] font-semibold ${
                          customSugar === s ? "bg-indigo-600 hover:bg-indigo-700 text-white" : ""
                        }`}
                      >
                        {s.split(" ")[0]}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Ice Level */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Level Es:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Normal Ice", "Less Ice", "No Ice"].map((i) => (
                      <Button
                        key={i}
                        type="button"
                        variant={customIce === i ? "default" : "outline"}
                        onClick={() => setCustomIce(i)}
                        className={`min-h-[38px] text-[11px] font-semibold ${
                          customIce === i ? "bg-indigo-600 hover:bg-indigo-700 text-white" : ""
                        }`}
                      >
                        {i}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Add-On Toppings */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Menu Tambahan:</label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableAddonsList.map((addon) => {
                      const isSelected = selectedAddons.some((a) => a.name === addon.name);
                      return (
                        <button
                          key={addon.name}
                          type="button"
                          onClick={() => toggleAddonSelection(addon)}
                          className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected ? "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold" : "bg-white hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <span>{addon.name}</span>
                          <span className="text-[11px] text-emerald-600 font-semibold">+Rp {addon.price.toLocaleString("id-ID")}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Catatan Barista */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Catatan Khusus:</label>
                  <Input
                    placeholder="Contoh: Pisahkan es / Sedotan kertas"
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    className="min-h-[38px] text-xs"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" className="min-h-[40px] text-xs" onClick={() => setSelectedCustomProduct(null)}>
                  Batal
                </Button>
                <Button className="min-h-[40px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold" onClick={handleConfirmAddToCart}>
                  Tambah ke Keranjang
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Void Order PIN Supervisor Modal */}
      <Dialog open={isVoidModalOpen} onOpenChange={setIsVoidModalOpen}>
        <DialogContent className="sm:max-w-xs text-center">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-destructive">PIN Supervisor</DialogTitle>
            <DialogDescription className="text-xs">Pembatalan transaksi memerlukan verifikasi PIN supervisor.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Input 
              type="password"
              placeholder="Masukkan PIN Supervisor"
              value={supervisorPin}
              onChange={(e) => setSupervisorPin(e.target.value)}
              className="min-h-[44px] text-center text-lg tracking-widest"
            />
            {voidError && (
              <p className="text-xs font-semibold text-rose-600">{voidError}</p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" className="min-h-[44px] w-full text-xs" onClick={() => { setIsVoidModalOpen(false); setVoidError(""); }}>
              Batal
            </Button>
            <Button 
              variant="destructive"
              className="min-h-[44px] w-full text-xs font-semibold" 
              onClick={handleConfirmVoidCart}
            >
              Batalkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Closing Shift Modal */}
      <Dialog open={isCloseShiftOpen} onOpenChange={setIsCloseShiftOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Tutup Shift Kasir
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Hitung uang fisik di laci kasir untuk serah terima shift.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmCloseShift} className="space-y-4 py-2 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Petugas Shift:</span>
                <span className="font-bold text-slate-900">{activeShift?.employeeName || user?.name || "Kasir"}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Modal Awal Kas:</span>
                <span className="font-semibold text-slate-900">
                  Rp {Number(activeShift?.startingCash || activeShift?.startCash || 0).toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Uang Fisik di Laci (Rp) *
              </label>
              <Input
                type="text"
                placeholder="Contoh: 1.250.000"
                value={closingCashDisplay}
                onChange={handleClosingCashChange}
                className="text-xs font-bold text-slate-900 min-h-[40px] rounded-xl"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Catatan (Opsional)
              </label>
              <Input
                placeholder="Contoh: Kas sesuai, pengeluaran darurat Rp 20.000"
                value={closingNote}
                onChange={(e) => setClosingNote(e.target.value)}
                className="text-xs font-medium min-h-[40px] rounded-xl"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCloseShiftOpen(false)}
                className="text-xs rounded-xl min-h-[38px]"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isClosingShift}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl min-h-[38px]"
              >
                {isClosingShift ? "Menutup Shift..." : "Tutup Shift"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quick Petty Cash In / Out Modal with Photo Receipt & Digital E-Nota */}
      <CashInOutModal
        isOpen={isPettyCashOpen}
        onClose={() => setIsPettyCashOpen(false)}
        onSuccess={async (data) => {
          try {
            await fetch("/api/data?type=save_expense", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                amount: data.amount,
                note: data.catatan,
                employeeName: data.petugas,
                type: data.type,
                receiptImage: data.receiptImage,
              }),
            });
            alert(`Transaksi Kas ${data.type === "CASH_IN" ? "Masuk" : "Keluar"} Rp ${data.amount.toLocaleString("id-ID")} berhasil dicatat!`);
          } catch (e) {
            console.error(e);
          }
        }}
        currentEmployeeName={activeShift?.employeeName || user?.name || "Kasir Outlet"}
      />

    </div>
  );
}
