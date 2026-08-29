"use client";

import React, { useState, useEffect } from "react";
import { Settings, X, UserCheck, ShieldCheck, Tag, Layers } from "lucide-react";
import { CategoryHierarchyItem } from "@/lib/categories";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAdminUser: string;
}

export function SettingsModal({ isOpen, onClose, currentAdminUser }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"categories" | "info">("categories");

  // Category State
  const [categories, setCategories] = useState<CategoryHierarchyItem[]>([]);
  const [newParentName, setNewParentName] = useState("");
  const [newSubName, setNewSubName] = useState("");
  const [selectedParentId, setSelectedParentId] = useState("");

  // Supabase Health State
  const [dbStatus, setDbStatus] = useState<string>("Checking...");

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.hierarchy || []);
        if (data.hierarchy && data.hierarchy.length > 0) {
          setSelectedParentId(data.hierarchy[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const checkDbHealth = async () => {
    try {
      const res = await fetch("/api/ping");
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data.status === "healthy" ? "Terhubung (Online)" : "Degraded");
      } else {
        setDbStatus("Offline");
      }
    } catch {
      setDbStatus("Koneksi Gagal");
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      checkDbHealth();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddCategory = async (type: "parent" | "sub") => {
    const targetName = type === "parent" ? newParentName.trim() : newSubName.trim();
    if (!targetName) return;

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: targetName,
          parentId: type === "sub" ? selectedParentId : null,
        }),
      });

      if (res.ok) {
        if (type === "parent") setNewParentName("");
        if (type === "sub") setNewSubName("");
        fetchCategories();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">Pengaturan Nota AI &amp; Kategori</h3>
              <p className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                User: <strong className="text-slate-900 dark:text-slate-200 font-mono">{currentAdminUser}</strong> &bull; Supabase: <strong className="text-emerald-600">{dbStatus}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("categories")}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "categories" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-emerald-600" /> Kategori 2-Level
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("info")}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "info" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Status Database
          </button>
        </div>

        {/* Tab 1: Kategori 2-Level */}
        {activeTab === "categories" && (
          <div className="space-y-4 text-xs animate-in fade-in duration-150">
            <div className="space-y-2">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">Daftar Hierarki Kategori Resmi</label>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 max-h-60 overflow-y-auto space-y-3">
                {categories.map((cat) => (
                  <div key={cat.id} className="space-y-1">
                    <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <span>{cat.name}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pl-6">
                      {cat.subCategories.map((sub) => (
                        <span key={sub.id} className="px-2.5 py-0.5 rounded-lg bg-white dark:bg-slate-800 border text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                          {sub.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add New Parent & Sub */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t dark:border-slate-800">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">+ Tambah Kategori Induk</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="Nama Kategori..."
                    value={newParentName}
                    onChange={(e) => setNewParentName(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl border text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCategory("parent")}
                    className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 cursor-pointer"
                  >
                    Tambah
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">+ Tambah Sub-Kategori</label>
                <select
                  value={selectedParentId}
                  onChange={(e) => setSelectedParentId(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-xl border text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 mb-1.5"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>Induk: {c.name}</option>
                  ))}
                </select>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="Nama Sub-Kategori..."
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl border text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCategory("sub")}
                    className="px-3 py-1.5 bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-700 cursor-pointer"
                  >
                    Tambah
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Status Database */}
        {activeTab === "info" && (
          <div className="space-y-4 text-xs animate-in fade-in duration-150">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">Status Supabase Cloud:</span>
                <span className="font-bold font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-300">
                  {dbStatus}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t dark:border-slate-700">
                <span className="font-semibold text-slate-500">AI Vision Engine:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">Google Gemini 2.5/2.0 Flash</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t dark:border-slate-700">
                <span className="font-semibold text-slate-500">Fallback Local OCR:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">Tesseract.js ind+eng</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t dark:border-slate-700">
                <span className="font-semibold text-slate-500">Dual-Database Sync:</span>
                <span className="font-bold text-emerald-600">Supabase (Nota) &bull; MySQL (POS &amp; Stok)</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t dark:border-slate-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
