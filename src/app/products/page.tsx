"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  Boxes,
  Layers,
  Percent,
  ClipboardList,
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  Utensils,
  Coffee,
  PieChart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth-context";

type CatalogTab = "PRODUCTS" | "CATEGORIES" | "ADDONS" | "DISCOUNTS" | "RECIPES";

function ProductsContent() {
  const { isAdmin } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Active Tab from URL search params or fallback to PRODUCTS
  const initialTab = (searchParams.get("tab")?.toUpperCase() as CatalogTab) || "PRODUCTS";
  const [activeTab, setActiveTab] = useState<CatalogTab>(
    ["PRODUCTS", "CATEGORIES", "ADDONS", "DISCOUNTS", "RECIPES"].includes(initialTab) ? initialTab : "PRODUCTS"
  );

  const handleTabChange = (tab: CatalogTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", tab.toLowerCase());
    router.replace(`/products?${params.toString()}`);
  };

  // =========================================================================
  // 1. DATA STATES
  // =========================================================================
  const [menus, setMenus] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [addonCategories, setAddonCategories] = useState<any[]>([]);
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Products Filtering & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | "AVAILABLE" | "UNAVAILABLE">("ALL");

  // Multi-Selection State for Bulk Actions
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [bulkActionCategory, setBulkActionCategory] = useState("");
  const [bulkPriceChange, setBulkPriceChange] = useState<number>(0);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<"CATEGORY" | "PRICE" | "STATUS" | "DELETE">("CATEGORY");

  // Inline Price Editing State
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPriceValue, setTempPriceValue] = useState<string>("");

  // Product Add / Edit Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productFormTab, setProductFormTab] = useState<"INFO" | "RECIPE">("INFO");
  const [productForm, setProductForm] = useState({
    id: "",
    name: "",
    category: "Kopi",
    price: 20000,
    baseHpp: 7500,
    sku: "",
    isActive: true,
    recipeIngredients: [] as Array<{ ingredientId: string; quantityUsed: number }>,
  });

  // Category Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);
  const [catNameInput, setCatNameInput] = useState("");

  // Addon Modal State
  const [isAddonCatModalOpen, setIsAddonCatModalOpen] = useState(false);
  const [isAddonItemModalOpen, setIsAddonItemModalOpen] = useState(false);
  const [addonCatForm, setAddonCatForm] = useState({ id: "", name: "", isRequired: false, allowMultiple: true });
  const [addonItemForm, setAddonItemForm] = useState({ id: "", name: "", price: 5000, addonCategoryId: "", ingredientId: "", quantityUsed: 1 });

  // Discount Modal State
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<any>(null);
  const [discountForm, setDiscountForm] = useState({
    id: "",
    name: "",
    type: "PERCENTAGE" as "PERCENTAGE" | "FIXED_AMOUNT",
    value: 10,
    minOrderAmount: 0,
    isActive: true,
  });

  // CSV Import/Export Modal State
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [csvPreviewRows, setCsvPreviewRows] = useState<any[]>([]);

  const [submitting, setSubmitting] = useState(false);

  // =========================================================================
  // 2. DATA FETCHING
  // =========================================================================
  const fetchData = async () => {
    try {
      setLoading(true);
      const [resMenus, resCats, resIngs, resAddons, resDiscounts] = await Promise.all([
        fetch("/api/data?type=menus_with_recipes"),
        fetch("/api/data?type=categories"),
        fetch("/api/data?type=ingredients"),
        fetch("/api/data?type=addon_categories"),
        fetch("/api/data?type=discounts"),
      ]);

      if (resMenus.ok) {
        const json = await resMenus.json();
        setMenus(Array.isArray(json) ? json : []);
      }
      if (resCats.ok) {
        const json = await resCats.json();
        setCategories(Array.isArray(json) ? json : []);
      }
      if (resIngs.ok) {
        const json = await resIngs.json();
        setIngredients(Array.isArray(json) ? json : []);
      }
      if (resAddons.ok) {
        const json = await resAddons.json();
        setAddonCategories(Array.isArray(json) ? json : []);
      }
      if (resDiscounts.ok) {
        const json = await resDiscounts.json();
        setDiscounts(Array.isArray(json) ? json : []);
      }
    } catch (e) {
      console.error("Error fetching catalog data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sync category default when categories loaded
  useEffect(() => {
    if (categories.length > 0 && !productForm.category) {
      setProductForm((prev) => ({ ...prev, category: categories[0].name }));
    }
  }, [categories]);

  // =========================================================================
  // 3. COMPUTED METRICS & FILTERED PRODUCTS
  // =========================================================================
  const filteredMenus = useMemo(() => {
    return menus.filter((m) => {
      const matchesSearch = 
        !searchQuery || 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.sku && m.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.category && m.category.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = selectedCategory === "ALL" || m.category === selectedCategory;

      const matchesStatus = 
        selectedStatus === "ALL" ||
        (selectedStatus === "AVAILABLE" && m.isActive !== false) ||
        (selectedStatus === "UNAVAILABLE" && m.isActive === false);

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [menus, searchQuery, selectedCategory, selectedStatus]);

  const metrics = useMemo(() => {
    const total = menus.length;
    const activeCount = menus.filter((m) => m.isActive !== false).length;
    const inactiveCount = total - activeCount;

    let totalMarginPct = 0;
    let validMarginCount = 0;

    menus.forEach((m) => {
      const price = Number(m.price) || 0;
      const hpp = Number(m.baseHpp) || 0;
      if (price > 0) {
        const margin = ((price - hpp) / price) * 100;
        totalMarginPct += margin;
        validMarginCount++;
      }
    });

    const avgMargin = validMarginCount > 0 ? (totalMarginPct / validMarginCount).toFixed(1) : "0";

    return { total, activeCount, inactiveCount, avgMargin };
  }, [menus]);

  // =========================================================================
  // 4. QUICK INLINE ACTIONS
  // =========================================================================
  const handleQuickToggleStatus = async (product: any) => {
    const newStatus = !(product.isActive !== false);
    // Optimistic UI update
    setMenus((prev) =>
      prev.map((m) => (m.id === product.id ? { ...m, isActive: newStatus } : m))
    );

    try {
      await fetch("/api/data?type=quick_update_menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id, isActive: newStatus }),
      });
    } catch (e) {
      console.error("Failed to toggle menu status:", e);
      await fetchData(); // rollback
    }
  };

  const handleStartEditPrice = (product: any) => {
    setEditingPriceId(product.id);
    setTempPriceValue(String(product.price || 0));
  };

  const handleSaveInlinePrice = async (productId: string) => {
    const numPrice = Number(tempPriceValue);
    if (isNaN(numPrice) || numPrice < 0) {
      setEditingPriceId(null);
      return;
    }

    // Optimistic UI update
    setMenus((prev) =>
      prev.map((m) => (m.id === productId ? { ...m, price: numPrice } : m))
    );
    setEditingPriceId(null);

    try {
      await fetch("/api/data?type=quick_update_menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productId, price: numPrice }),
      });
    } catch (e) {
      console.error("Failed to update price inline:", e);
      await fetchData();
    }
  };

  // =========================================================================
  // 5. BULK ACTIONS
  // =========================================================================
  const handleSelectAll = () => {
    if (selectedProductIds.length === filteredMenus.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredMenus.map((m) => m.id));
    }
  };

  const handleToggleSelectProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleExecuteBulkAction = async () => {
    if (selectedProductIds.length === 0) return;

    try {
      setSubmitting(true);
      if (bulkActionType === "DELETE") {
        if (!confirm(`Hapus ${selectedProductIds.length} produk yang dipilih secara permanen?`)) {
          setSubmitting(false);
          return;
        }
        await fetch("/api/data?type=bulk_delete_menus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: selectedProductIds }),
        });
      } else if (bulkActionType === "CATEGORY") {
        if (!bulkActionCategory) return;
        await fetch("/api/data?type=bulk_update_menus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ids: selectedProductIds,
            updates: { category: bulkActionCategory },
          }),
        });
      } else if (bulkActionType === "STATUS") {
        await fetch("/api/data?type=bulk_update_menus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ids: selectedProductIds,
            updates: { isActive: bulkActionCategory === "ACTIVE" },
          }),
        });
      } else if (bulkActionType === "PRICE") {
        await fetch("/api/data?type=bulk_update_menus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ids: selectedProductIds,
            updates: { priceChangePercent: Number(bulkPriceChange) },
          }),
        });
      }

      setIsBulkModalOpen(false);
      setSelectedProductIds([]);
      await fetchData();
    } catch (e) {
      console.error("Bulk action failed:", e);
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================================
  // 6. PRODUCT MODAL (WITH INTEGRATED RECIPE & LIVE HPP CALCULATOR)
  // =========================================================================
  const openAddProductModal = () => {
    setEditingProduct(null);
    setProductFormTab("INFO");
    setProductForm({
      id: "",
      name: "",
      category: categories[0]?.name || "Kopi",
      price: 20000,
      baseHpp: 0,
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      isActive: true,
      recipeIngredients: [],
    });
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: any) => {
    setEditingProduct(product);
    setProductFormTab("INFO");
    const existingRecipes = (product.recipeItems || []).map((r: any) => ({
      ingredientId: r.ingredientId,
      quantityUsed: r.quantityUsed || 1,
    }));

    setProductForm({
      id: product.id,
      name: product.name,
      category: product.category || categories[0]?.name || "Kopi",
      price: product.price || 0,
      baseHpp: product.baseHpp || 0,
      sku: product.sku || "",
      isActive: product.isActive !== false,
      recipeIngredients: existingRecipes,
    });
    setIsProductModalOpen(true);
  };

  // Live Recipe Calculations for Form
  const calculatedFormHpp = useMemo(() => {
    let totalHpp = 0;
    productForm.recipeIngredients.forEach((item) => {
      const ing = ingredients.find((i) => i.id === item.ingredientId);
      if (ing) {
        const costPerUnit = Number(ing.costPerUseUnit || 0);
        totalHpp += costPerUnit * Number(item.quantityUsed || 0);
      }
    });
    return Math.round(totalHpp);
  }, [productForm.recipeIngredients, ingredients]);

  const liveMarginInfo = useMemo(() => {
    const price = Number(productForm.price) || 0;
    const hpp = calculatedFormHpp > 0 ? calculatedFormHpp : Number(productForm.baseHpp) || 0;
    const nominal = price - hpp;
    const percentage = price > 0 ? ((nominal / price) * 100).toFixed(1) : "0";
    return { hpp, nominal, percentage };
  }, [productForm.price, productForm.baseHpp, calculatedFormHpp]);

  const handleAddRecipeRow = () => {
    if (ingredients.length === 0) return;
    setProductForm((prev) => ({
      ...prev,
      recipeIngredients: [
        ...prev.recipeIngredients,
        { ingredientId: ingredients[0].id, quantityUsed: 10 },
      ],
    }));
  };

  const handleRemoveRecipeRow = (index: number) => {
    setProductForm((prev) => ({
      ...prev,
      recipeIngredients: prev.recipeIngredients.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateRecipeRow = (index: number, field: string, value: any) => {
    setProductForm((prev) => {
      const updated = [...prev.recipeIngredients];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, recipeIngredients: updated };
    });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) return;

    try {
      setSubmitting(true);
      const finalHpp = calculatedFormHpp > 0 ? calculatedFormHpp : Number(productForm.baseHpp) || 0;
      const res = await fetch("/api/data?type=save_menu_settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: productForm.id || undefined,
          name: productForm.name,
          category: productForm.category,
          price: Number(productForm.price),
          baseHpp: finalHpp,
          sku: productForm.sku || undefined,
          isActive: productForm.isActive,
          recipeIngredients: productForm.recipeIngredients,
        }),
      });

      if (res.ok) {
        setIsProductModalOpen(false);
        await fetchData();
      }
    } catch (e) {
      console.error("Error saving product:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Hapus menu "${name}" dari katalog?`)) return;

    try {
      await fetch("/api/data?type=delete_menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await fetchData();
    } catch (e) {
      console.error("Failed to delete product:", e);
    }
  };

  // =========================================================================
  // 7. CATEGORY CRUD HANDLERS
  // =========================================================================
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catNameInput.trim()) return;

    try {
      setSubmitting(true);
      await fetch("/api/data?type=save_category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCat?.id || undefined,
          name: catNameInput.trim(),
        }),
      });
      setIsCatModalOpen(false);
      setCatNameInput("");
      await fetchData();
    } catch (e) {
      console.error("Failed to save category:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Hapus kategori "${name}"?`)) return;
    try {
      await fetch("/api/data?type=delete_category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await fetchData();
    } catch (e) {
      console.error("Failed to delete category:", e);
    }
  };

  // =========================================================================
  // 8. ADDON CRUD HANDLERS
  // =========================================================================
  const openAddAddonCategory = () => {
    setAddonCatForm({ id: "", name: "", isRequired: false, allowMultiple: true });
    setIsAddonCatModalOpen(true);
  };

  const openEditAddonCategory = (cat: any) => {
    setAddonCatForm({
      id: cat.id,
      name: cat.name,
      isRequired: Boolean(cat.isRequired),
      allowMultiple: cat.allowMultiple !== false,
    });
    setIsAddonCatModalOpen(true);
  };

  const handleDeleteAddonCategory = async (id: string, name: string) => {
    if (!confirm(`Hapus grup topping "${name}" beserta seluruh item di dalamnya?`)) return;
    try {
      setSubmitting(true);
      await fetch("/api/data?type=delete_addon_category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await fetchData();
    } catch (e) {
      console.error("Failed to delete addon category:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const openAddAddonItem = (catId?: string) => {
    const defaultCatId = catId || (addonCategories.length > 0 ? addonCategories[0].id : "");
    setAddonItemForm({
      id: "",
      name: "",
      price: 5000,
      addonCategoryId: defaultCatId,
      ingredientId: "",
      quantityUsed: 1,
    });
    setIsAddonItemModalOpen(true);
  };

  const openEditAddonItem = (item: any, catId: string) => {
    const recipe = item.recipes && item.recipes[0];
    setAddonItemForm({
      id: item.id,
      name: item.name,
      price: item.price || 0,
      addonCategoryId: catId || item.addonCategoryId,
      ingredientId: recipe?.ingredientId || "",
      quantityUsed: recipe?.quantityUsed || 1,
    });
    setIsAddonItemModalOpen(true);
  };

  const handleSaveAddonCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addonCatForm.name.trim()) return;

    try {
      setSubmitting(true);
      await fetch("/api/data?type=save_addon_category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addonCatForm),
      });
      setIsAddonCatModalOpen(false);
      await fetchData();
    } catch (e) {
      console.error("Failed to save addon category:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveAddonItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addonItemForm.name.trim() || !addonItemForm.addonCategoryId) return;

    try {
      setSubmitting(true);
      await fetch("/api/data?type=save_addon_item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addonItemForm),
      });
      setIsAddonItemModalOpen(false);
      await fetchData();
    } catch (e) {
      console.error("Failed to save addon item:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAddonItem = async (id: string, name: string) => {
    if (!confirm(`Hapus item topping "${name}"?`)) return;
    try {
      setSubmitting(true);
      await fetch("/api/data?type=delete_addon_item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await fetchData();
    } catch (e) {
      console.error("Failed to delete addon item:", e);
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================================
  // 9. DISCOUNT CRUD HANDLERS
  // =========================================================================
  const handleSaveDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountForm.name.trim()) return;

    try {
      setSubmitting(true);
      await fetch("/api/data?type=save_discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(discountForm),
      });
      setIsDiscountModalOpen(false);
      await fetchData();
    } catch (e) {
      console.error("Failed to save discount:", e);
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================================
  // 10. CSV EXPORT & IMPORT
  // =========================================================================
  const handleExportCsv = () => {
    const headers = ["SKU", "Nama Menu", "Kategori", "Harga Jual", "Estimasi HPP", "Status"];
    const rows = menus.map((m) => [
      `"${m.sku || ""}"`,
      `"${m.name || ""}"`,
      `"${m.category || ""}"`,
      m.price || 0,
      m.baseHpp || 0,
      m.isActive !== false ? "Aktif" : "Nonaktif",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Katalog_Menu_PERKARA_POS_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleParseCsv = (text: string) => {
    setCsvText(text);
    const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length < 2) return;

    const parsed: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.replace(/^"|"$/g, "").trim());
      if (cols.length >= 3) {
        parsed.push({
          sku: cols[0] || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
          name: cols[1],
          category: cols[2] || "Kopi",
          price: Number(cols[3]) || 20000,
          baseHpp: Number(cols[4]) || 0,
        });
      }
    }
    setCsvPreviewRows(parsed);
  };

  const handleImportCsvSubmit = async () => {
    if (csvPreviewRows.length === 0) return;
    try {
      setSubmitting(true);
      for (const item of csvPreviewRows) {
        await fetch("/api/data?type=save_menu_settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: item.name,
            category: item.category,
            price: Number(item.price),
            baseHpp: Number(item.baseHpp) || 0,
            sku: item.sku,
            isActive: true,
          }),
        });
      }
      setIsCsvModalOpen(false);
      setCsvPreviewRows([]);
      setCsvText("");
      await fetchData();
    } catch (e) {
      console.error("CSV Import error:", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto text-slate-900 space-y-6">
        
        {/* Prominent Outer Card Container */}
        <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xs space-y-6">
          
          {/* Main Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Manajemen Menu</h2>
                {isAdmin && (
                  <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold">
                    Admin
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Kelola menu produk, kategori, topping ekstra, diskon, serta kalkulasi resep HPP dalam 1 dashboard terpadu.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={fetchData} 
                className="text-xs gap-1.5 min-h-[38px] rounded-xl cursor-pointer active:scale-[0.98]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Segarkan</span>
              </Button>

              {isAdmin && activeTab === "PRODUCTS" && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExportCsv}
                    className="text-xs gap-1.5 min-h-[38px] rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer active:scale-[0.98]"
                    title="Unduh data menu ke format CSV / Excel"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Export CSV</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsCsvModalOpen(true)}
                    className="text-xs gap-1.5 min-h-[38px] rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer active:scale-[0.98]"
                    title="Import data menu massal via CSV"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Import CSV</span>
                  </Button>

                  <Button
                    onClick={openAddProductModal}
                    className="bg-stone-800 hover:bg-stone-900 text-white font-semibold text-xs px-4 py-2 rounded-xl min-h-[38px] gap-2 shadow-xs shrink-0 cursor-pointer active:scale-[0.98]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Produk</span>
                  </Button>
                </>
              )}

              {isAdmin && activeTab === "CATEGORIES" && (
                <Button
                  onClick={() => { setEditingCat(null); setCatNameInput(""); setIsCatModalOpen(true); }}
                  className="bg-stone-800 hover:bg-stone-900 text-white font-semibold text-xs px-4 py-2 rounded-xl min-h-[38px] gap-2 shadow-xs shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Kategori Baru</span>
                </Button>
              )}

              {isAdmin && activeTab === "ADDONS" && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={openAddAddonCategory}
                    className="text-xs min-h-[38px] rounded-xl cursor-pointer border-slate-200"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1 text-slate-500" />
                    <span>Grup Topping</span>
                  </Button>
                  <Button
                    onClick={() => openAddAddonItem()}
                    className="bg-stone-800 hover:bg-stone-900 text-white font-semibold text-xs min-h-[38px] rounded-xl gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-white" />
                    <span>Item Topping</span>
                  </Button>
                </div>
              )}

              {isAdmin && activeTab === "DISCOUNTS" && (
                <Button
                  onClick={() => {
                    setEditingDiscount(null);
                    setDiscountForm({ id: "", name: "", type: "PERCENTAGE", value: 10, minOrderAmount: 0, isActive: true });
                    setIsDiscountModalOpen(true);
                  }}
                  className="bg-stone-800 hover:bg-stone-900 text-white font-semibold text-xs px-4 py-2 rounded-xl min-h-[38px] gap-2 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Buat Promo</span>
                </Button>
              )}
            </div>
          </div>

          {/* Unified Tab Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl overflow-x-auto no-scrollbar">
            {[
              { id: "PRODUCTS", label: "Daftar Menu & Produk", icon: Package, count: menus.length },
              { id: "CATEGORIES", label: "Kategori", icon: Tag, count: categories.length },
              { id: "ADDONS", label: "Topping & Add-ons", icon: Layers, count: addonCategories.reduce((acc, c) => acc + (c.items?.length || 0), 0) },
              { id: "DISCOUNTS", label: "Diskon & Promo", icon: Percent, count: discounts.length },
              { id: "RECIPES", label: "Resep & HPP", icon: ClipboardList, count: menus.filter((m) => m.recipeItems?.length > 0).length },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as CatalogTab)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer select-none ${
                    isActive 
                      ? "bg-white text-slate-900 shadow-2xs border border-slate-200/80" 
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/60"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    isActive ? "bg-indigo-50 text-indigo-700" : "bg-slate-200 text-slate-600"
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: PRODUCTS & MENUS MANAGEMENT */}
          {/* ========================================================================= */}
          {activeTab === "PRODUCTS" && (
            <div className="space-y-6">
              
              {/* Quick Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Total Menu</div>
                  <div className="text-xl font-extrabold text-slate-900 mt-0.5">{metrics.total} Item</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Tersedia (Ready)</div>
                  <div className="text-xl font-extrabold text-emerald-600 mt-0.5">{metrics.activeCount} Item</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Habis / Off</div>
                  <div className="text-xl font-extrabold text-rose-500 mt-0.5">{metrics.inactiveCount} Item</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Rata-rata Margin HPP</div>
                  <div className="text-xl font-extrabold text-indigo-600 mt-0.5">{metrics.avgMargin}%</div>
                </div>
              </div>

              {/* Filter Bar (Search + Categories Pill + Status) */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <Input
                      type="text"
                      placeholder="Cari nama menu, SKU, atau kategori..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-slate-50 border-slate-200 text-xs font-medium min-h-[38px] rounded-xl w-full"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value as any)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 min-h-[38px] cursor-pointer"
                    >
                      <option value="ALL">Semua Status</option>
                      <option value="AVAILABLE">Tersedia (Ready)</option>
                      <option value="UNAVAILABLE">Habis (Off)</option>
                    </select>
                  </div>
                </div>

                {/* Category Pills Filter */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  <button
                    onClick={() => setSelectedCategory("ALL")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      selectedCategory === "ALL"
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Semua Kategori ({menus.length})
                  </button>
                  {categories.map((c) => {
                    const count = menus.filter((m) => m.category === c.name).length;
                    return (
                      <button
                        key={c.id || c.name}
                        onClick={() => setSelectedCategory(c.name)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          selectedCategory === c.name
                            ? "bg-slate-900 text-white shadow-2xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {c.name} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bulk Actions Notification Bar (Appears when 1+ selected) */}
              {selectedProductIds.length > 0 && (
                <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-indigo-950">
                      <strong>{selectedProductIds.length}</strong> produk dipilih
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setBulkActionType("STATUS"); setBulkActionCategory("ACTIVE"); setIsBulkModalOpen(true); }}
                      className="text-xs h-7 px-2.5 rounded-lg border-indigo-200 text-indigo-900 hover:bg-indigo-100/80 bg-white"
                    >
                      Set Tersedia
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setBulkActionType("STATUS"); setBulkActionCategory("INACTIVE"); setIsBulkModalOpen(true); }}
                      className="text-xs h-7 px-2.5 rounded-lg border-indigo-200 text-indigo-900 hover:bg-indigo-100/80 bg-white"
                    >
                      Set Habis
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setBulkActionType("CATEGORY"); setIsBulkModalOpen(true); }}
                      className="text-xs h-7 px-2.5 rounded-lg border-indigo-200 text-indigo-900 hover:bg-indigo-100/80 bg-white"
                    >
                      Ubah Kategori
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setBulkActionType("PRICE"); setIsBulkModalOpen(true); }}
                      className="text-xs h-7 px-2.5 rounded-lg border-indigo-200 text-indigo-900 hover:bg-indigo-100/80 bg-white"
                    >
                      Ubah Harga (+/- %)
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => { setBulkActionType("DELETE"); handleExecuteBulkAction(); }}
                      className="text-xs h-7 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-700"
                    >
                      Hapus Terpilih
                    </Button>
                    <button
                      onClick={() => setSelectedProductIds([])}
                      className="text-xs text-slate-500 hover:text-slate-800 font-bold ml-1 cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}

              {/* Data Table Container with Horizontal Scroll */}
              <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
                <div className="overflow-x-auto custom-scrollbar">
                  <div className="min-w-[700px]">
                    {/* Header Row */}
                    <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider items-center">
                      <div className="col-span-1 flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.length === filteredMenus.length && filteredMenus.length > 0}
                          onChange={handleSelectAll}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                        />
                        <span>No</span>
                      </div>
                      <div className="col-span-4">Produk &amp; Kategori</div>
                      <div className="col-span-3 text-right">Harga Jual (Quick Edit)</div>
                      <div className="col-span-2 text-center">Estimasi HPP &amp; Margin</div>
                      <div className="col-span-2 text-right">Ketersediaan &amp; Aksi</div>
                    </div>

                    {/* Body Rows */}
                    <div className="divide-y divide-slate-100 text-xs">
                      {filteredMenus.length > 0 ? (
                        filteredMenus.map((item, idx) => {
                          const isSelected = selectedProductIds.includes(item.id);
                          const isAvailable = item.isActive !== false;
                          const price = Number(item.price) || 0;
                          const hpp = Number(item.baseHpp) || 0;
                          const marginPct = price > 0 ? Math.round(((price - hpp) / price) * 100) : 0;
                          const hasRecipe = item.recipeItems && item.recipeItems.length > 0;

                          return (
                            <div 
                              key={item.id} 
                              className={`grid grid-cols-12 gap-3 px-4 py-3.5 items-center hover:bg-slate-50/60 transition-colors ${
                                isSelected ? "bg-indigo-50/40" : ""
                              }`}
                            >
                              {/* Col 1: Checkbox & Index */}
                              <div className="col-span-1 flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleSelectProduct(item.id)}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                                />
                                <span className="text-slate-400 font-mono text-[11px]">{idx + 1}</span>
                              </div>

                              {/* Col 2: Product Name, SKU, Category Badge */}
                              <div className="col-span-4 space-y-1">
                                <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                                  <span>{item.name}</span>
                                  {hasRecipe && (
                                    <span className="bg-emerald-50 text-emerald-700 text-[9px] font-extrabold px-1.5 py-0.2 rounded border border-emerald-200">
                                      Resep ({item.recipeItems.length})
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                                  <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
                                    {item.category || "Umum"}
                                  </span>
                                  {item.sku && <span>SKU: {item.sku}</span>}
                                </div>
                              </div>

                              {/* Col 3: Inline Price Editor */}
                              <div className="col-span-3 text-right">
                                {editingPriceId === item.id ? (
                                  <div className="flex items-center justify-end gap-1">
                                    <span className="text-[10px] text-slate-400">Rp</span>
                                    <input
                                      type="number"
                                      value={tempPriceValue}
                                      onChange={(e) => setTempPriceValue(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") handleSaveInlinePrice(item.id);
                                        if (e.key === "Escape") setEditingPriceId(null);
                                      }}
                                      autoFocus
                                      className="w-24 h-7 text-right font-mono font-bold text-xs bg-white border border-indigo-400 rounded-lg px-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                    <button
                                      onClick={() => handleSaveInlinePrice(item.id)}
                                      className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setEditingPriceId(null)}
                                      className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleStartEditPrice(item)}
                                    className="group text-right font-mono font-bold text-slate-900 hover:text-indigo-600 hover:bg-indigo-50/60 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                                    title="Klik untuk ubah harga cepat"
                                  >
                                    <span>Rp {price.toLocaleString("id-ID")}</span>
                                    <Pencil className="w-2.5 h-2.5 inline-block ml-1 opacity-0 group-hover:opacity-100 text-indigo-500 transition-opacity" />
                                  </button>
                                )}
                              </div>

                              {/* Col 4: HPP & Profit Margin */}
                              <div className="col-span-2 text-center space-y-0.5">
                                <div className="text-[11px] font-mono text-slate-500">
                                  HPP: Rp {hpp.toLocaleString("id-ID")}
                                </div>
                                <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full inline-block ${
                                  marginPct >= 60 
                                    ? "bg-emerald-100 text-emerald-800" 
                                    : marginPct >= 40 
                                    ? "bg-amber-100 text-amber-800" 
                                    : "bg-rose-100 text-rose-800"
                                }`}>
                                  Margin: {marginPct}%
                                </span>
                              </div>

                              {/* Col 5: Availability Switch & Actions */}
                              <div className="col-span-2 flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleQuickToggleStatus(item)}
                                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all cursor-pointer select-none active:scale-95 ${
                                    isAvailable
                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200"
                                      : "bg-slate-100 text-slate-500 border border-slate-300 hover:bg-slate-200"
                                  }`}
                                  title="Klik untuk ganti status ketersediaan"
                                >
                                  {isAvailable ? "Tersedia" : "Habis"}
                                </button>

                                {isAdmin && (
                                  <div className="flex items-center gap-0.5">
                                    <button
                                      onClick={() => openEditProductModal(item)}
                                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                      title="Edit Produk & Resep"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteProduct(item.id, item.name)}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                      title="Hapus Produk"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-12 text-center text-slate-400 space-y-2">
                          <Package className="w-8 h-8 text-slate-300 mx-auto" />
                          <div className="text-xs font-bold text-slate-600">Tidak ada produk yang sesuai filter</div>
                          <p className="text-[11px] text-slate-400">Silakan tambahkan produk baru atau sesuaikan kata kunci pencarian.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: CATEGORIES MANAGEMENT */}
          {/* ========================================================================= */}
          {activeTab === "CATEGORIES" && (
            <div className="space-y-4">
              <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
                <div className="overflow-x-auto custom-scrollbar">
                  <div className="min-w-[550px]">
                    <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      <div className="col-span-1">No</div>
                      <div className="col-span-6">Nama Kategori</div>
                      <div className="col-span-3 text-center">Jumlah Menu</div>
                      <div className="col-span-2 text-right">Aksi</div>
                    </div>
                    <div className="divide-y divide-slate-100 text-xs">
                      {categories.map((cat, idx) => {
                        const count = menus.filter((m) => m.category === cat.name).length;
                        return (
                          <div key={cat.id || cat.name} className="grid grid-cols-12 gap-3 px-4 py-3.5 items-center hover:bg-slate-50/60">
                            <div className="col-span-1 font-mono text-slate-400">{idx + 1}</div>
                            <div className="col-span-6 font-bold text-slate-900 flex items-center gap-2">
                              <Tag className="w-3.5 h-3.5 text-indigo-600" />
                              <span>{cat.name}</span>
                            </div>
                            <div className="col-span-3 text-center">
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold text-[11px]">
                                {count} Menu
                              </span>
                            </div>
                            <div className="col-span-2 flex items-center justify-end gap-1">
                              <button
                                onClick={() => { setEditingCat(cat); setCatNameInput(cat.name); setIsCatModalOpen(true); }}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: ADDONS & TOPPINGS */}
          {/* ========================================================================= */}
          {activeTab === "ADDONS" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addonCategories.map((group) => (
                  <div key={group.id} className="border border-slate-200/90 rounded-2xl p-4 bg-white space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">{group.name}</h4>
                          <Badge className="bg-indigo-50 text-indigo-700 text-[10px] border-indigo-200">
                            {group.items?.length || 0} Item
                          </Badge>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {group.isRequired ? "Wajib Dipilih" : "Opsional"} &bull; {group.allowMultiple ? "Bisa Multi-pilih" : "Hanya 1 Pilihan"}
                        </span>
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEditAddonCategory(group)}
                            className="w-7 h-7 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                            title="Edit Grup"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteAddonCategory(group.id, group.name)}
                            className="w-7 h-7 text-slate-400 hover:text-destructive hover:bg-red-50 rounded-lg cursor-pointer"
                            title="Hapus Grup"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      {(group.items || []).map((it: any) => {
                        const recipe = it.recipes && it.recipes[0];
                        return (
                          <div key={it.id} className="flex items-center justify-between p-2.5 bg-slate-50/70 hover:bg-slate-100/70 transition-colors rounded-xl border border-slate-200/60 text-xs">
                            <div className="space-y-0.5">
                              <span className="font-semibold text-slate-800 block">{it.name}</span>
                              {recipe?.ingredient && (
                                <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                                  📦 {recipe.ingredient.name}: {recipe.quantityUsed} {recipe.ingredient.unit}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-emerald-700">
                                {Number(it.price || 0) > 0 ? `+Rp ${Number(it.price).toLocaleString("id-ID")}` : "Rp 0"}
                              </span>
                              {isAdmin && (
                                <div className="flex items-center gap-0.5 ml-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => openEditAddonItem(it, group.id)}
                                    className="w-6 h-6 text-slate-400 hover:text-slate-900 rounded-md cursor-pointer"
                                    title="Edit Item"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleDeleteAddonItem(it.id, it.name)}
                                    className="w-6 h-6 text-slate-400 hover:text-destructive rounded-md cursor-pointer"
                                    title="Hapus Item"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {(!group.items || group.items.length === 0) && (
                        <div className="text-[11px] text-slate-400 text-center py-2 italic">Belum ada item topping dalam grup ini.</div>
                      )}
                    </div>

                    {isAdmin && (
                      <div className="pt-2 border-t border-slate-100">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openAddAddonItem(group.id)}
                          className="w-full text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50/50 min-h-[32px] rounded-xl cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          <span>Tambah Topping</span>
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: DISCOUNTS & PROMOTIONS */}
          {/* ========================================================================= */}
          {activeTab === "DISCOUNTS" && (
            <div className="space-y-4">
              <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
                <div className="overflow-x-auto custom-scrollbar">
                  <div className="min-w-[580px]">
                    <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      <div className="col-span-4">Nama Promo / Voucher</div>
                      <div className="col-span-3 text-center">Tipe &amp; Nilai Diskon</div>
                      <div className="col-span-3 text-center">Syarat Min. Order</div>
                      <div className="col-span-2 text-right">Status &amp; Aksi</div>
                    </div>
                    <div className="divide-y divide-slate-100 text-xs">
                      {discounts.map((disc) => (
                        <div key={disc.id} className="grid grid-cols-12 gap-3 px-4 py-3.5 items-center hover:bg-slate-50/60">
                          <div className="col-span-4 font-bold text-slate-900 flex items-center gap-2">
                            <Percent className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{disc.name}</span>
                          </div>
                          <div className="col-span-3 text-center font-extrabold text-emerald-700">
                            {disc.type === "PERCENTAGE" ? `${disc.value}%` : `Rp ${Number(disc.value).toLocaleString("id-ID")}`}
                          </div>
                          <div className="col-span-3 text-center text-slate-500 font-mono">
                            {disc.minOrderAmount ? `Rp ${Number(disc.minOrderAmount).toLocaleString("id-ID")}` : "Tanpa Minimum"}
                          </div>
                          <div className="col-span-2 flex items-center justify-end gap-2">
                            <Badge className={disc.isActive !== false ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}>
                              {disc.isActive !== false ? "Aktif" : "Off"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: RECIPES & LIVE HPP OVERVIEW */}
          {/* ========================================================================= */}
          {activeTab === "RECIPES" && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs text-slate-600 flex items-center justify-between">
                <div>
                  <strong>Kalkulasi Otomatis Stok Bahan &amp; HPP:</strong> Resep menu otomatis memotong stok bahan baku saat transaksi kasir berhasil dan menghitung moving average HPP.
                </div>
              </div>

              <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
                <div className="overflow-x-auto custom-scrollbar">
                  <div className="min-w-[650px]">
                    <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      <div className="col-span-4">Menu Produk</div>
                      <div className="col-span-4">Komposisi Takaran Bahan</div>
                      <div className="col-span-2 text-right">Harga / HPP</div>
                      <div className="col-span-2 text-right">Aksi</div>
                    </div>
                    <div className="divide-y divide-slate-100 text-xs">
                      {menus.map((m) => {
                        const hasRecipes = m.recipeItems && m.recipeItems.length > 0;
                        return (
                          <div key={m.id} className="grid grid-cols-12 gap-3 px-4 py-3.5 items-center hover:bg-slate-50/60">
                            <div className="col-span-4 space-y-0.5">
                              <span className="font-bold text-slate-900 block">{m.name}</span>
                              <span className="text-[10px] text-slate-400">{m.category}</span>
                            </div>

                            <div className="col-span-4 space-y-1">
                              {hasRecipes ? (
                                <div className="flex flex-wrap gap-1">
                                  {m.recipeItems.map((r: any, rIdx: number) => {
                                    const ing = ingredients.find((i) => i.id === r.ingredientId);
                                    return (
                                      <span key={rIdx} className="bg-slate-100 text-slate-700 text-[10px] font-medium px-1.5 py-0.5 rounded">
                                        {ing?.name || "Bahan"}: {r.quantityUsed} {ing?.unit || "gr"}
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">Belum ada resep bahan</span>
                              )}
                            </div>

                            <div className="col-span-2 text-right font-mono">
                              <span className="font-bold text-slate-900 block">Rp {Number(m.price || 0).toLocaleString("id-ID")}</span>
                              <span className="text-[10px] text-emerald-700 block">HPP: Rp {Number(m.baseHpp || 0).toLocaleString("id-ID")}</span>
                            </div>

                            <div className="col-span-2 text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditProductModal(m)}
                                className="text-xs h-7 px-2.5 rounded-lg border-slate-200"
                              >
                                Edit Resep
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT PRODUCT WITH INTEGRATED RECIPE & HPP CALCULATOR */}
      {/* ========================================================================= */}
      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-xl max-h-[90dvh] overflow-y-auto rounded-2xl p-5 bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center justify-between">
              <span>{editingProduct ? "Edit Detail Produk & Resep" : "Tambah Produk Baru"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Isi informasi menu, harga jual, dan racikan resep bahan baku untuk otomatisasi HPP.
            </DialogDescription>
          </DialogHeader>

          {/* Form Tabs: Info vs Recipe */}
          <div className="flex items-center gap-2 border-b pb-2 pt-1">
            <button
              type="button"
              onClick={() => setProductFormTab("INFO")}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                productFormTab === "INFO"
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              1. Informasi Produk
            </button>
            <button
              type="button"
              onClick={() => setProductFormTab("RECIPE")}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                productFormTab === "RECIPE"
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              <span>2. Resep Bahan &amp; HPP</span>
              {productForm.recipeIngredients.length > 0 && (
                <span className="bg-emerald-500 text-white text-[9px] px-1 rounded-full font-bold">
                  {productForm.recipeIngredients.length}
                </span>
              )}
            </button>
          </div>

          <form onSubmit={handleSaveProduct} className="space-y-4 pt-2 text-xs">
            {productFormTab === "INFO" ? (
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Nama Menu / Produk *</label>
                  <Input
                    required
                    placeholder="Contoh: Kopi Susu Aren Gula Merah"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="min-h-[38px] text-xs rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Kategori Menu</label>
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      className="w-full min-h-[38px] px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    >
                      {categories.map((c) => (
                        <option key={c.id || c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">SKU / Kode Menu</label>
                    <Input
                      placeholder="SKU-1001"
                      value={productForm.sku}
                      onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                      className="min-h-[38px] text-xs rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Harga Jual (Rp) *</label>
                    <Input
                      type="number"
                      required
                      min={0}
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                      className="min-h-[38px] text-xs rounded-xl font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Estimasi HPP Standar (Rp)</label>
                    <Input
                      type="number"
                      min={0}
                      value={calculatedFormHpp > 0 ? calculatedFormHpp : productForm.baseHpp}
                      disabled={calculatedFormHpp > 0}
                      onChange={(e) => setProductForm({ ...productForm, baseHpp: Number(e.target.value) })}
                      className="min-h-[38px] text-xs rounded-xl font-mono"
                    />
                    {calculatedFormHpp > 0 && (
                      <p className="text-[10px] text-emerald-600 font-semibold">*Terhitung otomatis dari resep bahan</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isActiveProduct"
                    checked={productForm.isActive}
                    onChange={(e) => setProductForm({ ...productForm, isActive: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                  />
                  <label htmlFor="isActiveProduct" className="text-xs font-semibold text-slate-800 cursor-pointer">
                    Produk Aktif &amp; Siap Dijual di Kasir POS
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                {/* Live Margin Calculation Card */}
                <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Harga Jual Menu:</span>
                    <strong className="font-mono text-slate-900">Rp {Number(productForm.price || 0).toLocaleString("id-ID")}</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Total HPP Bahan Baku:</span>
                    <strong className="font-mono text-rose-600">Rp {Number(liveMarginInfo.hpp).toLocaleString("id-ID")}</strong>
                  </div>
                  <div className="border-t pt-1.5 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">Margin Keuntungan Bersih:</span>
                    <div className="text-right">
                      <strong className="font-mono text-emerald-700 block">Rp {Number(liveMarginInfo.nominal).toLocaleString("id-ID")}</strong>
                      <span className="text-[10px] font-bold text-emerald-600">({liveMarginInfo.percentage}%)</span>
                    </div>
                  </div>
                </div>

                {/* Recipe Ingredient Rows */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700">Daftar Bahan Baku Pembuat</label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleAddRecipeRow}
                      className="text-[11px] h-7 px-2 rounded-lg gap-1 border-indigo-200 text-indigo-700 bg-indigo-50/50"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Tambah Bahan</span>
                    </Button>
                  </div>

                  {productForm.recipeIngredients.map((row, rIdx) => {
                    const ing = ingredients.find((i) => i.id === row.ingredientId);
                    return (
                      <div key={rIdx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <select
                          value={row.ingredientId}
                          onChange={(e) => handleUpdateRecipeRow(rIdx, "ingredientId", e.target.value)}
                          className="flex-1 min-h-[34px] px-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                        >
                          {ingredients.map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.name} (Satuan: {i.unit || "gr"})
                            </option>
                          ))}
                        </select>

                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min={0.1}
                            step={0.1}
                            value={row.quantityUsed}
                            onChange={(e) => handleUpdateRecipeRow(rIdx, "quantityUsed", Number(e.target.value))}
                            className="w-20 min-h-[34px] text-xs font-mono font-bold text-center"
                          />
                          <span className="text-[10px] text-slate-500 font-semibold min-w-[28px]">
                            {ing?.unit || "gr"}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveRecipeRow(rIdx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}

                  {productForm.recipeIngredients.length === 0 && (
                    <div className="text-center py-4 border border-dashed rounded-xl text-slate-400 text-[11px]">
                      Belum ada bahan baku dalam resep ini. Klik &quot;+ Tambah Bahan&quot; di atas.
                    </div>
                  )}
                </div>
              </div>
            )}

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsProductModalOpen(false)}
                className="w-full sm:w-auto text-xs min-h-[38px] rounded-xl"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto bg-stone-800 hover:bg-stone-900 text-white text-xs min-h-[38px] rounded-xl font-bold"
              >
                {submitting ? "Menyimpan..." : "Simpan Produk"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: BULK ACTIONS CONFIGURATION */}
      {/* ========================================================================= */}
      <Dialog open={isBulkModalOpen} onOpenChange={setIsBulkModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md rounded-2xl p-5 bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Aksi Massal ({selectedProductIds.length} Produk Dipilih)
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Terapkan perubahan serentak untuk seluruh produk yang Anda centang.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {bulkActionType === "CATEGORY" && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700">Pilih Kategori Baru</label>
                <select
                  value={bulkActionCategory}
                  onChange={(e) => setBulkActionCategory(e.target.value)}
                  className="w-full min-h-[38px] px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value="">-- Pilih Kategori --</option>
                  {categories.map((c) => (
                    <option key={c.id || c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {bulkActionType === "PRICE" && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700">Persentase Penyesuaian Harga (%)</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Contoh: 10 untuk naik 10%, -5 untuk diskon 5%"
                    value={bulkPriceChange}
                    onChange={(e) => setBulkPriceChange(Number(e.target.value))}
                    className="min-h-[38px] text-xs font-mono font-bold"
                  />
                  <span className="font-bold text-slate-500">%</span>
                </div>
                <p className="text-[10px] text-slate-400">Harga baru akan dibulatkan otomatis ke kelipatan Rp 500 terdekat.</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => setIsBulkModalOpen(false)} className="text-xs min-h-[38px] rounded-xl">
              Batal
            </Button>
            <Button 
              onClick={handleExecuteBulkAction} 
              disabled={submitting} 
              className="bg-stone-800 hover:bg-stone-900 text-white text-xs min-h-[38px] rounded-xl font-bold"
            >
              {submitting ? "Memproses..." : "Terapkan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: CATEGORY ADD / EDIT */}
      {/* ========================================================================= */}
      <Dialog open={isCatModalOpen} onOpenChange={setIsCatModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-sm rounded-2xl p-5 bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingCat ? "Edit Kategori" : "Tambah Kategori Baru"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCategory} className="space-y-4 py-2 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Nama Kategori</label>
              <Input
                required
                placeholder="Contoh: Signature Coffee"
                value={catNameInput}
                onChange={(e) => setCatNameInput(e.target.value)}
                className="min-h-[38px] text-xs rounded-xl"
              />
            </div>
            <DialogFooter className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCatModalOpen(false)} className="text-xs min-h-[38px] rounded-xl">
                Batal
              </Button>
              <Button type="submit" disabled={submitting} className="bg-stone-800 hover:bg-stone-900 text-white text-xs min-h-[38px] rounded-xl font-bold">
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: ADDON GROUP & ITEM */}
      {/* ========================================================================= */}
      <Dialog open={isAddonCatModalOpen} onOpenChange={setIsAddonCatModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-sm rounded-2xl p-5 bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {addonCatForm.id ? "Edit Grup Topping / Add-on" : "Tambah Grup Topping / Add-on"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveAddonCategory} className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Nama Grup Topping *</label>
              <Input
                required
                placeholder="Nama Grup (e.g. Extra Shot, Varian Base, Sirup)"
                value={addonCatForm.name}
                onChange={(e) => setAddonCatForm({ ...addonCatForm, name: e.target.value })}
                className="min-h-[38px] text-xs rounded-xl"
              />
            </div>

            <div className="space-y-2 pt-1 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isRequiredAddon"
                  checked={addonCatForm.isRequired}
                  onChange={(e) => setAddonCatForm({ ...addonCatForm, isRequired: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 h-4 w-4"
                />
                <label htmlFor="isRequiredAddon" className="text-xs font-semibold text-slate-700">
                  Wajib Dipilih Saat Kasir Checkout
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allowMultipleAddon"
                  checked={addonCatForm.allowMultiple}
                  onChange={(e) => setAddonCatForm({ ...addonCatForm, allowMultiple: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 h-4 w-4"
                />
                <label htmlFor="allowMultipleAddon" className="text-xs font-semibold text-slate-700">
                  Boleh Memilih Lebih dari 1 Item (Multi-select)
                </label>
              </div>
            </div>

            <DialogFooter className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddonCatModalOpen(false)} className="text-xs min-h-[38px] rounded-xl flex-1">
                Batal
              </Button>
              <Button type="submit" disabled={submitting} className="bg-stone-800 hover:bg-stone-900 text-white text-xs min-h-[38px] rounded-xl font-bold flex-1">
                {submitting ? "Menyimpan..." : "Simpan Grup"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddonItemModalOpen} onOpenChange={setIsAddonItemModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-sm rounded-2xl p-5 bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {addonItemForm.id ? "Edit Item Topping" : "Tambah Item Topping"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveAddonItem} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Pilih Grup Topping *</label>
              <select
                value={addonItemForm.addonCategoryId}
                onChange={(e) => setAddonItemForm({ ...addonItemForm, addonCategoryId: e.target.value })}
                className="w-full min-h-[38px] px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
              >
                {addonCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Nama Item Topping *</label>
              <Input
                required
                placeholder="e.g. Grass Jelly / Extra Espresso Shot"
                value={addonItemForm.name}
                onChange={(e) => setAddonItemForm({ ...addonItemForm, name: e.target.value })}
                className="min-h-[38px] text-xs rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Harga Tambahan (Rp)</label>
              <Input
                type="number"
                min={0}
                value={addonItemForm.price}
                onChange={(e) => setAddonItemForm({ ...addonItemForm, price: Number(e.target.value) })}
                className="min-h-[38px] text-xs rounded-xl font-mono font-bold"
              />
            </div>

            {/* Optional Raw Material Ingredient Link */}
            <div className="space-y-2 p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <label className="text-[11px] font-bold text-slate-700 block">Link Potong Stok Bahan (Opsional):</label>
              <select
                value={addonItemForm.ingredientId || ""}
                onChange={(e) => setAddonItemForm({ ...addonItemForm, ingredientId: e.target.value })}
                className="w-full min-h-[36px] px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
              >
                <option value="">-- Tanpa Potong Bahan Baku --</option>
                {ingredients.map((ing) => (
                  <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                ))}
              </select>

              {addonItemForm.ingredientId && (
                <div className="space-y-1 pt-1">
                  <label className="text-[10px] font-bold text-slate-600">Takaran Pengurangan Stok:</label>
                  <Input
                    type="number"
                    step="any"
                    min={0.1}
                    value={addonItemForm.quantityUsed || 1}
                    onChange={(e) => setAddonItemForm({ ...addonItemForm, quantityUsed: Number(e.target.value) })}
                    className="min-h-[34px] text-xs rounded-lg font-mono"
                  />
                </div>
              )}
            </div>

            <DialogFooter className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddonItemModalOpen(false)} className="text-xs min-h-[38px] rounded-xl flex-1">
                Batal
              </Button>
              <Button type="submit" disabled={submitting} className="bg-stone-800 hover:bg-stone-900 text-white text-xs min-h-[38px] rounded-xl font-bold flex-1">
                {submitting ? "Menyimpan..." : "Simpan Item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: CSV IMPORT */}
      {/* ========================================================================= */}
      <Dialog open={isCsvModalOpen} onOpenChange={setIsCsvModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-lg rounded-2xl p-5 bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Import Data Menu Massal via CSV</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Format baris CSV: <code>SKU,Nama Menu,Kategori,Harga Jual,HPP</code>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <textarea
              rows={6}
              placeholder={`SKU,Nama Menu,Kategori,Harga Jual,HPP\nSKU-101,Americano,Kopi,18000,5000\nSKU-102,Matcha Latte,Non-Kopi,22000,8000`}
              value={csvText}
              onChange={(e) => handleParseCsv(e.target.value)}
              className="w-full p-3 font-mono text-[11px] bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />

            {csvPreviewRows.length > 0 && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold">
                Terdeteksi <strong>{csvPreviewRows.length}</strong> menu siap di-import ke katalog.
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setIsCsvModalOpen(false)} className="text-xs min-h-[38px] rounded-xl">
              Batal
            </Button>
            <Button 
              onClick={handleImportCsvSubmit} 
              disabled={submitting || csvPreviewRows.length === 0} 
              className="bg-stone-800 hover:bg-stone-900 text-white text-xs min-h-[38px] rounded-xl font-bold"
            >
              {submitting ? "Mengimport..." : `Import ${csvPreviewRows.length} Menu`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </AppShell>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <AppShell>
        <div className="p-8 text-center text-xs text-slate-400">Memuat Katalog Menu...</div>
      </AppShell>
    }>
      <ProductsContent />
    </Suspense>
  );
}
