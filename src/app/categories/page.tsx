"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Tag, 
  RefreshCw, 
  Trash2, 
  Pencil, 
  Search, 
  Check, 
  X,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth-context";

export default function CategoriesPage() {
  const { isAdmin } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [menus, setMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [catNameInput, setCatNameInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const DEFAULT_FALLBACK_CATEGORIES = [
    { id: "cat-1", name: "Kopi" },
    { id: "cat-2", name: "Non-Kopi" },
    { id: "cat-3", name: "Makanan" },
    { id: "cat-4", name: "Bahan Baku" },
    { id: "cat-5", name: "Kemasan" },
    { id: "cat-6", name: "Operasional" },
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resCats, resMenus] = await Promise.all([
        fetch("/api/data?type=categories"),
        fetch("/api/data?type=menus"),
      ]);

      if (resCats.ok) {
        const json = await resCats.json();
        setCategories(Array.isArray(json) && json.length > 0 ? json : DEFAULT_FALLBACK_CATEGORIES);
      } else {
        setCategories(DEFAULT_FALLBACK_CATEGORIES);
      }

      if (resMenus.ok) {
        const menusJson = await resMenus.json();
        setMenus(Array.isArray(menusJson) ? menusJson : []);
      }
    } catch (e) {
      console.error(e);
      setCategories(DEFAULT_FALLBACK_CATEGORIES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setCatNameInput("");
    setIsModalOpen(true);
  };

  const openEditModal = (cat: any) => {
    setEditingCategory(cat);
    setCatNameInput(cat.name);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catNameInput.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/data?type=save_category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCategory?.id || undefined,
          name: catNameInput.trim(),
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setCatNameInput("");
        await fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus kategori "${name}"?`)) return;
    try {
      const res = await fetch("/api/data?type=delete_category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredCategories = categories.filter((c) =>
    (c.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto text-slate-900 space-y-6">
        
        {/* Prominent Outer Card Container */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-2xs space-y-6">
          
          {/* Card Header & Main Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Kategori Produk</h2>
                {isAdmin && (
                  <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold">
                    Admin Full Access
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Kelola kategori produk dan menu untuk pengelompokan rapi di terminal kasir dan laporan.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={fetchData} className="text-xs gap-1.5 min-h-[40px] rounded-xl">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </Button>
              {isAdmin && (
                <Button
                  onClick={openAddModal}
                  className="bg-stone-800 hover:bg-stone-900 text-white font-semibold text-xs px-4 py-2.5 rounded-xl min-h-[40px] gap-2 shadow-xs shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Kategori</span>
                </Button>
              )}
            </div>
          </div>

          {/* Search Filter Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Cari nama kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200 text-xs font-medium min-h-[38px] rounded-xl"
            />
          </div>

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
              {filteredCategories.length > 0 ? (
                filteredCategories.map((c, idx) => {
                  const count = menus.filter((m) => m.category === c.name).length;
                  return (
                    <div key={c.id} className="grid grid-cols-12 px-6 py-3.5 items-center text-xs hover:bg-slate-50/60 transition-colors">
                      <div className="col-span-5 font-bold text-slate-900 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                          <Tag className="w-4 h-4" />
                        </div>
                        <span>{c.name}</span>
                      </div>
                      <div className="col-span-3 text-center font-semibold text-slate-700">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {count} Item Produk
                        </span>
                      </div>
                      <div className="col-span-2 text-center text-slate-400 font-mono text-[11px]">#{idx + 1}</div>
                      <div className="col-span-2 text-right flex items-center justify-end gap-1">
                        {isAdmin ? (
                          <>
                            <button
                              onClick={() => openEditModal(c)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Kategori"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDelete(c.id, c.name)} 
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Kategori"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Read-Only</span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100/70 text-slate-400 flex items-center justify-center mx-auto">
                    <Tag className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">Tidak ada kategori ditemukan</h4>
                    <p className="text-xs text-slate-400 mt-1 font-medium">
                      Buat kategori baru untuk mengorganisir produk Anda.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Modal Add / Edit Category */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingCategory ? "Edit Nama Kategori" : "Tambah Kategori Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Kategori akan digunakan untuk memfilter produk di POS dan inventori.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-2 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Nama Kategori *</label>
              <Input
                autoFocus
                placeholder="cth: Pastry & Bakery"
                value={catNameInput}
                onChange={(e) => setCatNameInput(e.target.value)}
                className="text-xs font-medium min-h-[38px] rounded-xl"
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="text-xs rounded-xl min-h-[38px]"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold rounded-xl min-h-[38px]"
              >
                {submitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
