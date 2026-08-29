"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Utensils, 
  RefreshCw, 
  Pencil, 
  Trash2, 
  Search, 
  Grid,
  CheckCircle2,
  Clock,
  Ban
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth-context";

export default function TablesPage() {
  const { isAdmin } = useAuth();
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<any>(null);
  const [form, setForm] = useState({
    number: "",
    capacity: 4,
    status: "AVAILABLE",
  });

  const DEFAULT_FALLBACK_TABLES = [
    { id: "tbl-1", number: "Meja 01 (Indoor)", capacity: 2, status: "AVAILABLE" },
    { id: "tbl-2", number: "Meja 02 (Indoor)", capacity: 4, status: "OCCUPIED" },
    { id: "tbl-3", number: "Meja 03 (Outdoor)", capacity: 4, status: "AVAILABLE" },
    { id: "tbl-4", number: "Meja 04 (Outdoor)", capacity: 6, status: "AVAILABLE" },
    { id: "tbl-5", number: "VIP Room 1", capacity: 8, status: "RESERVED" },
  ];

  const fetchTables = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/data?type=tables");
      if (res.ok) {
        const json = await res.json();
        setTables(Array.isArray(json) && json.length > 0 ? json : DEFAULT_FALLBACK_TABLES);
      } else {
        setTables(DEFAULT_FALLBACK_TABLES);
      }
    } catch (e) {
      console.error(e);
      setTables(DEFAULT_FALLBACK_TABLES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const openAddModal = () => {
    setEditingTable(null);
    setForm({ number: "", capacity: 4, status: "AVAILABLE" });
    setIsModalOpen(true);
  };

  const openEditModal = (t: any) => {
    setEditingTable(t);
    setForm({
      number: t.number,
      capacity: Number(t.capacity) || 4,
      status: t.status || "AVAILABLE",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.number.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/data?type=save_table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTable?.id || undefined,
          ...form,
          capacity: Number(form.capacity),
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        await fetchTables();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, number: string) => {
    if (!confirm(`Hapus "${number}" dari daftar meja?`)) return;
    try {
      const res = await fetch("/api/data?type=delete_table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) await fetchTables();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredTables = tables.filter((t) =>
    (t.number || "").toLowerCase().includes(searchQuery.toLowerCase())
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
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Manajemen Meja Outlet & Dine-In</h2>
                {isAdmin && (
                  <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold">
                    Admin Full Access
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Kelola nomor meja, kapasitas kursi, dan status okupansi (Kosong, Terisi, Reservasi).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={fetchTables} className="text-xs gap-1.5 min-h-[40px] rounded-xl">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </Button>
              {isAdmin && (
                <Button
                  onClick={openAddModal}
                  className="bg-stone-800 hover:bg-stone-900 text-white font-semibold text-xs px-4 py-2.5 rounded-xl min-h-[40px] gap-2 shadow-xs shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Meja Baru</span>
                </Button>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Total Meja</div>
              <div className="text-lg font-extrabold text-slate-900 mt-0.5">{tables.length} Meja</div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Meja Kosong</div>
              <div className="text-lg font-extrabold text-emerald-600 mt-0.5">
                {tables.filter((t) => t.status === "AVAILABLE").length} Siap
              </div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Sedang Terisi</div>
              <div className="text-lg font-extrabold text-rose-600 mt-0.5">
                {tables.filter((t) => t.status === "OCCUPIED").length} Meja
              </div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Total Kapasitas</div>
              <div className="text-lg font-extrabold text-indigo-600 mt-0.5">
                {tables.reduce((sum, t) => sum + (Number(t.capacity) || 0), 0)} Kursi
              </div>
            </div>
          </div>

          {/* Search Filter Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Cari label meja..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200 text-xs font-medium min-h-[38px] rounded-xl"
            />
          </div>

          {/* Tables Card Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredTables.length > 0 ? (
              filteredTables.map((t) => {
                const isAvail = t.status === "AVAILABLE";
                const isOccupied = t.status === "OCCUPIED";
                const isReserved = t.status === "RESERVED";

                return (
                  <div key={t.id} className="p-4 rounded-2xl border border-slate-200/90 bg-white space-y-3 shadow-2xs hover:border-indigo-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                          isAvail ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          isOccupied ? "bg-rose-50 text-rose-700 border border-rose-200" :
                          "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          <Grid className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">{t.number}</h4>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium mt-0.5">
                            <Utensils className="w-3 h-3 text-slate-400" /> Kapasitas: {t.capacity} Kursi
                          </span>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isAvail ? "bg-emerald-100 text-emerald-800" :
                        isOccupied ? "bg-rose-100 text-rose-800" :
                        "bg-amber-100 text-amber-800"
                      }`}>
                        {isAvail ? "KOSONG" : isOccupied ? "TERISI" : "RESERVASI"}
                      </span>
                    </div>

                    {isAdmin && (
                      <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
                        <span className="text-[10px] text-slate-400 font-mono">ID: {t.id.slice(0, 8)}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(t)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Meja"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id, t.number)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Meja"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="col-span-full p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100/70 text-slate-400 flex items-center justify-center mx-auto">
                  <Grid className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">Tidak ada meja ditemukan</h4>
                  <p className="text-xs text-slate-400 mt-1 font-medium">
                    Tambahkan meja outlet untuk mendukung pesanan dine-in kasir POS.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Modal Add / Edit Table */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingTable ? "Edit Informasi Meja" : "Tambah Meja Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Nomor atau label meja akan muncul saat pemilihan meja dine-in di POS.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-3.5 py-2 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Nomor / Nama Meja *</label>
              <Input
                autoFocus
                placeholder="cth: Meja 05 (Outdoor Area)"
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
                className="text-xs font-medium min-h-[38px] rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Kapasitas Kursi *</label>
                <Input
                  type="number"
                  placeholder="4"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                  className="text-xs font-bold text-slate-900 min-h-[38px] rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Status Meja *</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full min-h-[38px] px-3 rounded-xl border border-slate-200 text-xs bg-white font-medium"
                  required
                >
                  <option value="AVAILABLE">KOSONG (Tersedia)</option>
                  <option value="OCCUPIED">TERISI (Ada Pelanggan)</option>
                  <option value="RESERVED">RESERVASI</option>
                </select>
              </div>
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
                {submitting ? "Menyimpan..." : "Simpan Meja"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
