"use client";

import React, { useState, useEffect } from "react";
import { Plus, Tag, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppShell } from "@/components/layout/app-shell";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCatName, setNewCatName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/data?type=categories");
      if (res.ok) setCategories(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const res = await fetch("/api/data?type=save_category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName }),
      });
      if (res.ok) {
        setNewCatName("");
        setShowAddForm(false);
        await fetchCategories();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus kategori ini?")) return;
    try {
      await fetch("/api/data?type=delete_category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await fetchCategories();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto text-slate-900">
        
        {/* Prominent Outer Card Container (Matching Screenshot Dimension) */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-2xs space-y-6">
          
          {/* Card Header & Main Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Category List</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Manage product categories to keep your inventory organized.
              </p>
            </div>

            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-stone-800 hover:bg-stone-900 text-white font-semibold text-xs px-4 py-2.5 rounded-xl min-h-[42px] gap-2 shadow-xs shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Category</span>
            </Button>
          </div>

          {/* Inline Add Category Form */}
          {showAddForm && (
            <form onSubmit={handleAdd} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex gap-2">
              <Input
                autoFocus
                placeholder="Nama Kategori Baru..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="bg-white min-h-[40px] text-xs font-medium"
                required
              />
              <Button type="submit" className="bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold px-4 min-h-[40px] rounded-xl">
                Simpan
              </Button>
            </form>
          )}

          {/* Inner Data Table Box Container */}
          <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
            {/* Header Row */}
            <div className="grid grid-cols-12 px-6 py-3.5 bg-slate-50/70 border-b text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
              <div className="col-span-5">CATEGORY DETAILS</div>
              <div className="col-span-3 text-center">PRODUCTS COUNT</div>
              <div className="col-span-2 text-center">SORT ORDER</div>
              <div className="col-span-2 text-right">ACTIONS</div>
            </div>

            {/* Content Rows or Empty State */}
            <div className="divide-y divide-slate-100">
              {categories.length > 0 ? (
                categories.map((c, idx) => (
                  <div key={c.id} className="grid grid-cols-12 px-6 py-3.5 items-center text-xs hover:bg-slate-50/60 transition-colors">
                    <div className="col-span-5 font-bold text-slate-900 flex items-center gap-2.5">
                      <Tag className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{c.name}</span>
                    </div>
                    <div className="col-span-3 text-center font-medium text-slate-600">0 Item</div>
                    <div className="col-span-2 text-center text-slate-400 font-mono text-[11px]">#{idx + 1}</div>
                    <div className="col-span-2 text-right">
                      <button onClick={() => handleDelete(c.id)} className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100/70 text-slate-400 flex items-center justify-center mx-auto">
                    <Tag className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">No categories found</h4>
                    <p className="text-xs text-slate-400 mt-1 font-medium">
                      Create one to get started organizing your products.
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
