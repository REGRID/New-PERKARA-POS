"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Boxes,
  Layers,
  Plus
} from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/layout/app-shell";

export default function AddonStockPage() {
  const [addonCategories] = useState([
    {
      id: "ac1",
      name: "Topping & Ekstra Shot",
      isRequired: false,
      allowMultiple: true,
      items: [
        {
          id: "ai1",
          name: "Extra Espresso Shot",
          price: 5000,
          stockRecipe: { rawMaterialName: "Biji Kopi Espresso Arabica", qty: 9, unit: "gram" }
        },
        {
          id: "ai2",
          name: "Boba Topping",
          price: 4000,
          stockRecipe: { rawMaterialName: "Boba Tapioca Pearl", qty: 30, unit: "gram" }
        },
        {
          id: "ai3",
          name: "Oat Milk Swap",
          price: 10000,
          stockRecipe: { rawMaterialName: "Susu Oat Barista", qty: 150, unit: "ml" }
        }
      ]
    }
  ]);

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-2xl border shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Add-on Terintegrasi Stok Bahan Baku</h1>
              <p className="text-xs text-muted-foreground">Setiap opsi ekstra memotong stok bahan baku secara otomatis saat diaktifkan di kasir</p>
            </div>
          </div>
        </div>

        {/* Addon Categories Grid */}
        <div className="space-y-4">
          {addonCategories.map((category) => (
            <Card key={category.id} className="shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <CardHeader className="bg-muted/20 pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-foreground">{category.name}</CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Pilihan Ekstra Transaksi Kasir & Menu
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="font-semibold text-xs bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                    Auto Deduct Stock
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {category.items.map((item) => (
                    <div key={item.id} className="p-3.5 rounded-xl border bg-card space-y-2.5 shadow-2xs hover:border-amber-300 transition-colors">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-foreground">{item.name}</h4>
                        <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400">+Rp {item.price.toLocaleString("id-ID")}</span>
                      </div>

                      <div className="p-2.5 rounded-lg border bg-amber-50/30 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/40 text-xs text-muted-foreground space-y-1">
                        <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 block">Potongan Bahan Baku:</span>
                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                          <Boxes className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>{item.stockRecipe.rawMaterialName}</span>
                        </div>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold block">
                          - {item.stockRecipe.qty} {item.stockRecipe.unit} / porsi
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </AppShell>
  );
}
