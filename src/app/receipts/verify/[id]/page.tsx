"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  CheckCircle2, 
  Boxes, 
  ClipboardList, 
  FileText
} from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/layout/app-shell";

export default function VerifyReceiptPage() {
  const router = useRouter();
  const [isApproved, setIsApproved] = useState(false);

  // Demo receipt items parsed
  const [items, setItems] = useState([
    {
      id: "i1",
      name: "Biji Kopi Espresso Arabica 1kg",
      qty: 2,
      price: 125000,
      subtotal: 250000,
      category: "Bahan Baku",
      isStockItem: true,
    },
    {
      id: "i2",
      name: "Susu UHT Full Cream 1L",
      qty: 5,
      price: 18000,
      subtotal: 90000,
      category: "Bahan Baku",
      isStockItem: true,
    },
    {
      id: "i3",
      name: "Sabun Cuci Piring & Pembersih Lantai",
      qty: 1,
      price: 45000,
      subtotal: 45000,
      category: "Operasional & Kebersihan",
      isStockItem: false,
    },
  ]);

  const toggleStockItem = (id: string) => {
    setItems(items.map(item => item.id === id ? { ...item, isStockItem: !item.isStockItem } : item));
  };

  const handleApprove = async () => {
    try {
      setIsApproved(true);

      for (const item of items) {
        if (item.isStockItem) {
          // Stock item: Sync to Purchases + Raw Materials + Cash Flow
          await fetch("/api/data?type=save_purchase", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              itemName: item.name,
              quantity: item.qty,
              unitPrice: item.price,
              supplierName: "Toko Bahan Kopi Bersama",
              notes: "Hasil Verifikasi Scan Nota AI",
            }),
          });
        } else {
          // Non-stock item: Sync to Expenses (OPEX) + Cash Flow
          await fetch("/api/data?type=save_expense", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: item.subtotal,
              note: `${item.name} (${item.category})`,
              employeeName: "Scan Nota AI",
            }),
          });
        }
      }

      setTimeout(() => {
        router.push("/purchases");
      }, 1200);
    } catch (err) {
      console.error("Error approving receipt items:", err);
    }
  };

  const grandTotal = items.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-2xl border shadow-xs">
          <div className="flex items-center gap-3">
            <Link href="/receipts/upload">
              <Button size="icon" variant="outline" className="min-h-[44px] min-w-[44px]">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Verifikasi Nota Pembelian</h1>
              <p className="text-xs text-muted-foreground">Bahan Baku menambah stok inventaris, Operasional dicatat ke OPEX</p>
            </div>
          </div>

          <Button 
            size="lg" 
            onClick={handleApprove}
            disabled={isApproved}
            className="min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2 shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isApproved ? "Nota Telah Disetujui!" : "Setujui & Perbarui Stok / OPEX"}</span>
          </Button>
        </div>

        {/* Split Screen Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Column: Photo Receipt Preview */}
          <Card className="shadow-xs flex flex-col justify-between">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-sm font-bold text-foreground">Tinjauan Nota Fisik</CardTitle>
              <CardDescription className="text-xs">Supplier: Toko Bahan Kopi Bersama | Tanggal: 15/08/2026</CardDescription>
            </CardHeader>
            <CardContent className="p-4 flex items-center justify-center min-h-[350px]">
              <div className="border border-dashed p-6 rounded-xl text-center space-y-3 w-full bg-muted/10">
                <FileText className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-xs font-mono text-muted-foreground">Pratinjau Foto Nota Belanja</p>
                <div className="text-xs text-muted-foreground text-left bg-card p-4 rounded-lg font-mono border shadow-2xs">
                  TOKO BAHAN KOPI BERSAMA<br />
                  --------------------------------<br />
                  2x Biji Kopi Arabica @125.000 = 250.000<br />
                  5x Susu UHT 1L        @18.000  =  90.000<br />
                  1x Sabun Cuci & Lantai          =  45.000<br />
                  --------------------------------<br />
                  TOTAL                          = 385.000
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Column: Parsed Items Verification */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-foreground">Daftar Item Hasil Ekstraksi</CardTitle>
                  <CardDescription className="text-xs">Sesuaikan klasifikasi item stok atau beban operasional</CardDescription>
                </div>
                <Badge variant="outline" className="font-semibold text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200">
                  3 Item Terbaca
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              <div className="space-y-3">
                {items.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-3.5 rounded-xl border bg-card space-y-2 shadow-2xs hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{item.name}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.qty} x Rp {item.price.toLocaleString("id-ID")} = <strong className="text-foreground font-bold">Rp {item.subtotal.toLocaleString("id-ID")}</strong>
                        </p>
                      </div>

                      <Button 
                        size="sm" 
                        variant={item.isStockItem ? "default" : "secondary"}
                        onClick={() => toggleStockItem(item.id)}
                        className={`min-h-[36px] text-xs font-semibold gap-1.5 ${
                          item.isStockItem ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {item.isStockItem ? (
                          <>
                            <Boxes className="w-3.5 h-3.5" />
                            <span>+ Tambah Stok</span>
                          </>
                        ) : (
                          <>
                            <ClipboardList className="w-3.5 h-3.5" />
                            <span>Beban OPEX</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3.5 bg-muted/30 rounded-xl flex items-center justify-between border">
                <span className="font-semibold text-xs text-muted-foreground">Total Belanja:</span>
                <span className="font-bold text-base text-foreground">Rp {grandTotal.toLocaleString("id-ID")}</span>
              </div>

            </CardContent>
          </Card>

        </div>

      </div>
    </AppShell>
  );
}
