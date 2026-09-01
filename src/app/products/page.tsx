"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Package, 
  RefreshCw, 
  Search, 
  Pencil, 
  Trash2, 
  Tag, 
  Check, 
  X, 
  DollarSign,
  TrendingUp,
  Boxes
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth-context";

export default function ProductsPage() {
  const { isAdmin } = useAuth();
  const [menus, setMenus] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [submitting, setSubmitting] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Form State
  const [form, setForm] = useState({
    id: "",
    name: "",
    category: "Kopi",
    price: 20000,
    baseHpp: 8000,
    sku: "",
    isActive: true,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resMenus, resCats] = await Promise.all([
        fetch("/api/data?type=menus"),
        fetch("/api/data?type=categories"),
      ]);

      if (resMenus.ok) {
        const json = await resMenus.json();
        setMenus(Array.isArray(json) ? json : []);
      } else {
        setMenus([]);
      }

      if (resCats.ok) {
        const catsJson = await resCats.json();
        setCategories(Array.isArray(catsJson) ? catsJson : []);
      }
    } catch (e) {
      console.error(e);
      setMenus([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setForm({
      id: "",
      name: "",
      category: categories[0]?.name || "Kopi",
      price: 20000,
      baseHpp: 7500,
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setForm({
      id: product.id,
      name: product.name,
      category: product.category || "Kopi",
      price: product.price || 0,
      baseHpp: product.baseHpp || 0,
      sku: product.sku || "",
      isActive: product.isActive !== false,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/data?type=save_menu_settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id || undefined,
          name: form.name,
          category: form.category,
          price: Number(form.price),
          baseHpp: Number(form.baseHpp) || 0,
          sku: form.sku || undefined,
          isActive: form.isActive,
          recipeIngredients: editingProduct?.recipeItems?.map((r: any) => ({
            ingredientId: r.ingredientId,
            quantityUsed: r.quantityUsed || 1,
          })) || [],
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        await fetchData();
      }
    } catch (e) {
      console.error("Error saving product:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus produk "${name}" dari sistem?`)) return;

    try {
      const res = await fetch("/api/data?type=delete_menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        await fetchData();
      }
    } catch (e) {
      console.error("Error deleting product:", e);
    }
  };

  const filteredMenus = menus.filter((m) => {
    const matchQuery = (m.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                       (m.sku || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                       (m.category || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === "ALL" || m.category === selectedCategory;
    return matchQuery && matchCat;
  });

  const categoryOptions = Array.from(new Set(["Kopi", "Non-Kopi", "Makanan", ...categories.map((c) => c.name)]));

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto text-slate-900 space-y-6">
        
        {/* Prominent Outer Card Container */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-2xs space-y-6">
          
          {/* Card Header & Main Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Katalog Produk</h2>
                {isAdmin && (
                  <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold">
                    Admin
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Kelola menu produk, kategori, harga jual, estimasi HPP, dan ketersediaan kasir.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={fetchData} className="text-xs gap-1.5 min-h-[40px] rounded-xl">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Segarkan</span>
              </Button>
              {isAdmin && (
                <Button
                  onClick={openAddModal}
                  className="bg-stone-800 hover:bg-stone-900 text-white font-semibold text-xs px-4 py-2 rounded-xl min-h-[40px] gap-2 shadow-xs shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Produk</span>
                </Button>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Total Produk</div>
              <div className="text-lg font-extrabold text-slate-900 mt-0.5">{menus.length} Produk</div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Produk Aktif</div>
              <div className="text-lg font-extrabold text-emerald-600 mt-0.5">
                {menus.filter((m) => m.isActive !== false).length} Aktif
              </div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Rata-rata Harga</div>
              <div className="text-lg font-extrabold text-slate-900 mt-0.5">
                Rp {menus.length ? Math.round(menus.reduce((sum, m) => sum + Number(m.price || 0), 0) / menus.length).toLocaleString("id-ID") : "0"}
              </div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Total Kategori</div>
              <div className="text-lg font-extrabold text-indigo-600 mt-0.5">{categoryOptions.length} Kategori</div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Cari nama menu, SKU, atau kategori..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200 text-xs font-medium min-h-[38px] rounded-xl"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <button
                onClick={() => setSelectedCategory("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                  selectedCategory === "ALL" 
                    ? "bg-stone-800 text-white" 
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Semua
              </button>
              {categoryOptions.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                    selectedCategory === cat 
                      ? "bg-stone-800 text-white" 
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Inner Data Table Box Container */}
          <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
            {/* Header Row */}
            <div className="grid grid-cols-12 px-6 py-3.5 bg-slate-50/70 border-b text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
              <div className="col-span-4">INFORMASI PRODUK</div>
              <div className="col-span-2">KATEGORI</div>
              <div className="col-span-2 text-right">HARGA JUAL (RP)</div>
              <div className="col-span-2 text-center">STATUS</div>
              <div className="col-span-2 text-right">AKSI</div>
            </div>

            {/* Content Rows or Empty State */}
            <div className="divide-y divide-slate-100">
              {filteredMenus.length > 0 ? (
                filteredMenus.map((m) => {
                  const isActive = m.isActive !== false;
                  return (
                    <div key={m.id} className="grid grid-cols-12 px-6 py-3.5 items-center text-xs hover:bg-slate-50/60 transition-colors">
                      <div className="col-span-4 font-bold text-slate-900 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                          <Package className="w-4 h-4" />
                        </div>
                        <div>
                          <span>{m.name}</span>
                          <span className="block text-[10px] text-slate-400 font-mono font-normal">
                            {m.sku || `SKU-${m.id.slice(0, 6)}`}
                          </span>
                        </div>
                      </div>
                      <div className="col-span-2 text-slate-600 font-medium">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700">
                          {m.category || "Kopi"}
                        </span>
                      </div>
                      <div className="col-span-2 text-right font-extrabold text-slate-900">
                        Rp {Number(m.price || 0).toLocaleString("id-ID")}
                      </div>
                      <div className="col-span-2 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                        }`}>
                          {isActive ? "AKTIF" : "NONAKTIF"}
                        </span>
                      </div>
                      <div className="col-span-2 text-right flex items-center justify-end gap-1">
                        {isAdmin ? (
                          <>
                            <button
                              onClick={() => openEditModal(m)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="Ubah Data"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDelete(m.id, m.name)} 
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Produk"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Lihat Saja</span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100/70 text-slate-400 flex items-center justify-center mx-auto">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">Produk tidak ditemukan</h4>
                    <p className="text-xs text-slate-400 mt-1 font-medium">
                      Sesuaikan kata kunci pencarian atau tambahkan produk baru.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Modal Add / Edit Product */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingProduct ? "Ubah Data Produk" : "Tambah Produk"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Data produk ditampilkan di layar kasir POS dan pencatatan transaksi.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-3.5 py-2 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Nama Produk / Menu *</label>
              <Input
                placeholder="Contoh: Caramel Macchiato Ice"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="text-xs font-medium min-h-[38px] rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Kategori Menu *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full min-h-[38px] px-3 rounded-xl border border-slate-200 text-xs bg-white font-medium"
                  required
                >
                  {categoryOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Kode SKU</label>
                <Input
                  placeholder="SKU-001"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  className="text-xs font-medium min-h-[38px] rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Harga Jual (Rp) *</label>
                <Input
                  type="number"
                  placeholder="Contoh: 24000"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  className="text-xs font-bold text-slate-900 min-h-[38px] rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Estimasi HPP (Rp)</label>
                <Input
                  type="number"
                  placeholder="Contoh: 8500"
                  value={form.baseHpp}
                  onChange={(e) => setForm({ ...form, baseHpp: Number(e.target.value) })}
                  className="text-xs font-medium text-slate-700 min-h-[38px] rounded-xl"
                />
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <div className="font-bold text-slate-900">Status Menu Aktif</div>
                <div className="text-[10px] text-slate-500">Tampilkan produk ini di kasir POS</div>
              </div>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 cursor-pointer"
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
