"use client";

import React, { useState, useEffect } from "react";
import { Plus, Package, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/app-shell";

export default function ProductsPage() {
  const [menus, setMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/data?type=menus");
      if (res.ok) setMenus(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto text-slate-900">
        
        {/* Prominent Outer Card Container (Matching Screenshot Dimension) */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-2xs space-y-6">
          
          {/* Card Header & Main Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Inventory Items</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Manage physical products available for sale in your POS.
              </p>
            </div>

            <Button
              className="bg-stone-800 hover:bg-stone-900 text-white font-semibold text-xs px-4 py-2.5 rounded-xl min-h-[42px] gap-2 shadow-xs shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Product</span>
            </Button>
          </div>

          {/* Inner Data Table Box Container */}
          <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
            {/* Header Row */}
            <div className="grid grid-cols-12 px-6 py-3.5 bg-slate-50/70 border-b text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
              <div className="col-span-4">PRODUCT INFO</div>
              <div className="col-span-3">CATEGORY</div>
              <div className="col-span-2 text-right">PRICE (IDR)</div>
              <div className="col-span-2 text-center">STATUS</div>
              <div className="col-span-1 text-right">ACTIONS</div>
            </div>

            {/* Content Rows or Empty State */}
            <div className="divide-y divide-slate-100">
              {menus.length > 0 ? (
                menus.map((m) => (
                  <div key={m.id} className="grid grid-cols-12 px-6 py-3.5 items-center text-xs hover:bg-slate-50/60 transition-colors">
                    <div className="col-span-4 font-bold text-slate-900 flex items-center gap-2.5">
                      <Package className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>{m.name}</span>
                    </div>
                    <div className="col-span-3 text-slate-600 font-medium">{m.category || "Menu Utama"}</div>
                    <div className="col-span-2 text-right font-bold text-slate-900">Rp {Number(m.price || 0).toLocaleString("id-ID")}</div>
                    <div className="col-span-2 text-center">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        AKTIF
                      </span>
                    </div>
                    <div className="col-span-1 text-right text-slate-400">...</div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100/70 text-slate-400 flex items-center justify-center mx-auto">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">No products found</h4>
                    <p className="text-xs text-slate-400 mt-1 font-medium">
                      Add some products to stock your inventory.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </AppShell>
  );
}
