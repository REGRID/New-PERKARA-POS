import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  ShoppingCart, 
  Boxes, 
  ClipboardList, 
  Layers, 
  Camera, 
  Clock, 
  Users, 
  Menu, 
  X, 
  Store, 
  CircleDot,
  Database,
  LogOut,
  ChevronDown,
  ChevronUp,
  Tag,
  Package,
  Percent,
  Grid,
  LayoutGrid,
  FileText,
  CreditCard,
  Settings as SettingsIcon,
  Wallet,
  ShieldAlert
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavGroup {
  id: string;
  groupName: string;
  items: NavItem[];
}

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAdmin } = useAuth();

  const handleClose = () => {
    if (onMobileClose) onMobileClose();
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const rawNavigation: NavGroup[] = [
    {
      id: "OPERATIONS",
      groupName: "OPERASIONAL",
      items: [
        { name: "Kasir POS", href: "/pos", icon: ShoppingCart, badge: "Live" },
        { name: "Transaksi", href: "/orders", icon: FileText },
        { name: "Meja", href: "/tables", icon: Grid },
        { name: "Pelanggan", href: "/customers", icon: Users },
        { name: "Menu QR", href: "/qr-menu/outlet-1", icon: CircleDot },
        { name: "Absensi & Shift", href: "/attendance", icon: Clock },
      ]
    },
    {
      id: "INVENTORY",
      groupName: "INVENTARIS & STOK",
      items: [
        { name: "Manajemen Menu", href: "/products", icon: Package },
        { name: "Bahan Baku", href: "/inventory/raw-materials", icon: Boxes },
        { name: "Pembelian Bahan", href: "/purchases", icon: ShoppingCart },
        { name: "Resep & HPP", href: "/inventory/recipes", icon: ClipboardList },
        { name: "Pindai Nota AI", href: "/receipts/upload", icon: Camera },
      ]
    },
    {
      id: "REPORTS",
      groupName: "LAPORAN",
      items: [
        { name: "Kas Shift & Laci", href: "/reports/cash-flow", icon: Wallet },
        { name: "Rekap Harian", href: "/reports/daily-recaps", icon: ClipboardList },
      ]
    },
    {
      id: "SYSTEM",
      groupName: "PENGATURAN SISTEM",
      items: [
        { name: "Karyawan", href: "/employees", icon: Users },
        { name: "Metode Pembayaran", href: "/payment-methods", icon: CreditCard },
        { name: "Log Aktivitas", href: "/activity-log", icon: ShieldAlert },
        { name: "Pengaturan", href: "/settings", icon: SettingsIcon },
      ]
    }
  ];

  // Cashier Role Restriction: Only allowed operational pages for non-admin
  const navigation = isAdmin 
    ? rawNavigation 
    : rawNavigation.map((group) => ({
        ...group,
        items: group.items.filter((item) => 
          ["/pos", "/products", "/orders", "/tables", "/customers", "/attendance", "/reports/cash-flow", "/inventory/raw-materials"].includes(item.href) || item.href.startsWith("/qr-menu")
        ),
      })).filter((group) => group.items.length > 0);

  // Hidden navs state from localStorage (updated via Settings)
  const [hiddenNavs, setHiddenNavs] = useState<string[]>([]);
  const [currentOutletName, setCurrentOutletName] = useState<string>(user?.outletName || "Outlet Utama");

  useEffect(() => {
    const loadSettings = () => {
      try {
        const saved = localStorage.getItem("perkara_pos_hidden_navs");
        if (saved) {
          setHiddenNavs(JSON.parse(saved));
        } else {
          setHiddenNavs([]);
        }

        const savedSettings = localStorage.getItem("perkara_pos_settings");
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          if (parsed.outletName) setCurrentOutletName(parsed.outletName);
        }
      } catch (e) {
        console.error(e);
      }
    };

    loadSettings();
    window.addEventListener("storage", loadSettings);
    window.addEventListener("nav_visibility_changed", loadSettings);
    window.addEventListener("settings_updated", loadSettings);
    return () => {
      window.removeEventListener("storage", loadSettings);
      window.removeEventListener("nav_visibility_changed", loadSettings);
      window.removeEventListener("settings_updated", loadSettings);
    };
  }, [user]);

  const [workspaceOpen, setWorkspaceOpen] = useState(true);

  // Open groups state (persisted in sessionStorage so user toggles are strictly respected across navigation)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("perkara_pos_sidebar_open_groups");
        if (saved) {
          const parsed = JSON.parse(saved);
          navigation.forEach((group) => {
            if (group.items.some((item) => item.href === pathname)) {
              parsed[group.id] = true;
            }
          });
          return parsed;
        }
      } catch {}
    }

    const initial: Record<string, boolean> = { OPERATIONS: false, CATALOG: false, INVENTORY: false, REPORTS: false, SYSTEM: false };
    navigation.forEach((group) => {
      if (group.items.some((item) => item.href === pathname)) {
        initial[group.id] = true;
      }
    });
    return initial;
  });

  // Save to sessionStorage when openGroups state changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("perkara_pos_sidebar_open_groups", JSON.stringify(openGroups));
      } catch {}
    }
  }, [openGroups]);

  // Ensure group containing active pathname is expanded on page change without reopening closed groups
  useEffect(() => {
    navigation.forEach((group) => {
      if (group.items.some((item) => item.href === pathname)) {
        setOpenGroups((prev) => {
          if (prev[group.id]) return prev;
          const next = { ...prev, [group.id]: true };
          try { sessionStorage.setItem("perkara_pos_sidebar_open_groups", JSON.stringify(next)); } catch {}
          return next;
        });
      }
    });
  }, [pathname, navigation]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 lg:hidden backdrop-blur-xs transition-opacity animate-in fade-in duration-200" 
          onClick={handleClose} 
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-72 max-w-[85vw] bg-card border-r flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none select-none min-h-[100dvh] h-[100dvh]
        lg:translate-x-0 lg:static lg:h-full lg:w-64 lg:shrink-0 lg:z-auto
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Sidebar Header / Branding */}
        <div className="p-4 border-b shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center text-white font-bold text-base shadow-sm">
              P
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="font-bold text-sm tracking-tight text-foreground truncate">PERKARA POS</h2>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300 font-medium">
                  v2.0
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                <Store className="w-3 h-3 text-muted-foreground shrink-0" />
                <span>{currentOutletName}</span>
              </p>
            </div>
          </div>

          {/* Close button inside mobile drawer */}
          <button
            type="button"
            onClick={handleClose}
            className="lg:hidden p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            title="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items (Independent Scrollable Area) */}
        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {/* WORKSPACE Header Block (At Top of Sidebar, Collapsible Dropdown) */}
          <div className="space-y-1.5 mb-2">
            <button
              type="button"
              onClick={() => setWorkspaceOpen(!workspaceOpen)}
              className="w-full flex items-center justify-between px-3 text-[11px] font-extrabold text-slate-400 hover:text-slate-800 uppercase tracking-widest cursor-pointer select-none"
            >
              <span>WORKSPACE</span>
              {workspaceOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {workspaceOpen && (
              isAdmin ? (
                <Link
                  href="/"
                  onClick={handleClose}
                  className={`
                    flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all min-h-[48px] border shadow-2xs mt-1
                    ${pathname === "/" 
                      ? "bg-slate-50/90 text-slate-900 border-slate-200/90 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 ring-1 ring-slate-200/80" 
                      : "bg-white text-slate-700 border-slate-200/60 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300"
                    }
                  `}
                >
                  <LayoutGrid className="w-5 h-5 text-slate-600 dark:text-slate-300 shrink-0" />
                  <span className="text-slate-900 dark:text-slate-100">Dashboard</span>
                </Link>
              ) : (
                <Link
                  href="/pos"
                  onClick={handleClose}
                  className={`
                    flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all min-h-[48px] border shadow-2xs mt-1
                    ${pathname === "/pos" 
                      ? "bg-indigo-50/80 text-indigo-900 border-indigo-200/90 dark:bg-indigo-950/50 dark:text-indigo-200 ring-1 ring-indigo-200/80" 
                      : "bg-white text-slate-700 border-slate-200/60 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300"
                    }
                  `}
                >
                  <ShoppingCart className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="text-slate-900 dark:text-slate-100">Kasir POS</span>
                </Link>
              )
            )}
          </div>

          {navigation.map((group) => {
            const visibleItems = group.items.filter((item) => !hiddenNavs.includes(item.href));
            if (visibleItems.length === 0) return null;

            const isOpen = !!openGroups[group.id];
            return (
              <div key={group.id} className="space-y-1">
                {/* Collapsible Header */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold text-slate-400 hover:text-slate-800 tracking-wider uppercase transition-colors cursor-pointer select-none"
                >
                  <span>{group.groupName}</span>
                  {isOpen ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>

                {/* Collapsible Dropdown Items */}
                {isOpen && (
                  <div className="space-y-0.5 pt-0.5 pl-1 transition-all">
                    {visibleItems.map((item) => {
                      const isActive = pathname === item.href || (item.href.startsWith("/products") && pathname === "/products" && !item.href.includes("?"));
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={handleClose}
                          className={`
                            group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all min-h-[42px]
                            ${isActive 
                              ? "bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/80 shadow-2xs dark:bg-slate-800 dark:text-indigo-400" 
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100"
                            }
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 group-hover:text-slate-600"}`} />
                            <span>{item.name}</span>
                          </div>
                          {item.badge && (
                            <Badge 
                              variant="secondary" 
                              className="text-[10px] px-1.5 py-0 h-4 font-semibold bg-emerald-100 text-emerald-800"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer: Active User & Role Profile */}
        <div className="p-3 border-t bg-muted/20 space-y-2 shrink-0">
          <div className="p-2.5 rounded-lg bg-card border shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground truncate">{user?.name || "Pengguna POS"}</span>
              {isAdmin ? (
                <Badge className="text-[10px] px-1.5 py-0 h-4 bg-indigo-600 text-white font-medium">
                  ADMIN
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300 font-medium">
                  KARYAWAN
                </Badge>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full text-xs min-h-[36px] justify-between text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900 cursor-pointer"
            >
              <span>Keluar</span>
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="flex items-center justify-between px-2 py-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3 text-muted-foreground" />
              MySQL Local
            </span>
            <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Port 3306</span>
          </div>
        </div>
      </aside>
    </>
  );
}
