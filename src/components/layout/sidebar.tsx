import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
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
  ShieldCheck, 
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
  TrendingUp,
  Wallet
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

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const navigation: NavGroup[] = [
    {
      id: "OPERATIONS",
      groupName: "OPERATIONS",
      items: [
        { name: "POS Terminal", href: "/pos", icon: ShoppingCart, badge: "Live" },
        { name: "Transactions", href: "/orders", icon: FileText },
        { name: "Tables", href: "/tables", icon: Grid },
        { name: "Customers", href: "/customers", icon: Users },
        { name: "QR Menu", href: "/qr-menu/outlet-1", icon: CircleDot },
        { name: "Attendance", href: "/attendance", icon: Clock },
      ]
    },
    {
      id: "CATALOG",
      groupName: "CATALOG",
      items: [
        { name: "Categories", href: "/categories", icon: Tag },
        { name: "Products", href: "/products", icon: Package },
        { name: "Add-Ons", href: "/inventory/addons", icon: Layers },
        { name: "Discounts", href: "/discounts", icon: Percent },
      ]
    },
    {
      id: "INVENTORY",
      groupName: "INVENTORY",
      items: [
        { name: "Raw Materials", href: "/inventory/raw-materials", icon: Boxes },
        { name: "Purchases", href: "/purchases", icon: ShoppingCart },
        { name: "Recipes & HPP", href: "/inventory/recipes", icon: ClipboardList },
        { name: "Scan Receipt AI", href: "/receipts/upload", icon: Camera },
      ]
    },
    {
      id: "REPORTS",
      groupName: "REPORTS",
      items: [
        { name: "Kas Shift & Laci", href: "/reports/cash-flow", icon: Wallet },
        { name: "Daily Recaps", href: "/reports/daily-recaps", icon: ClipboardList },
      ]
    },
    {
      id: "SYSTEM",
      groupName: "SYSTEM",
      items: [
        { name: "Employees", href: "/employees", icon: Users },
        { name: "Payment Methods", href: "/payment-methods", icon: CreditCard },
        { name: "Settings", href: "/settings", icon: SettingsIcon },
      ]
    }
  ];

  // Hidden navs state from localStorage (updated via Settings)
  const [hiddenNavs, setHiddenNavs] = useState<string[]>([]);

  useEffect(() => {
    const loadHidden = () => {
      try {
        const saved = localStorage.getItem("perkara_pos_hidden_navs");
        if (saved) {
          setHiddenNavs(JSON.parse(saved));
        } else {
          setHiddenNavs([]);
        }
      } catch (e) {
        console.error(e);
      }
    };

    loadHidden();
    window.addEventListener("storage", loadHidden);
    window.addEventListener("nav_visibility_changed", loadHidden);
    return () => {
      window.removeEventListener("storage", loadHidden);
      window.removeEventListener("nav_visibility_changed", loadHidden);
    };
  }, []);

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
      } catch (e) {}
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
      } catch (e) {}
    }
  }, [openGroups]);

  // Ensure group containing active pathname is expanded on page change without reopening closed groups
  useEffect(() => {
    navigation.forEach((group) => {
      if (group.items.some((item) => item.href === pathname)) {
        setOpenGroups((prev) => {
          if (prev[group.id]) return prev;
          const next = { ...prev, [group.id]: true };
          try { sessionStorage.setItem("perkara_pos_sidebar_open_groups", JSON.stringify(next)); } catch (e) {}
          return next;
        });
      }
    });
  }, [pathname]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  return (
    <>
      {/* Mobile / Small Tablet Top Header Bar */}
      <div className="lg:hidden flex items-center justify-between p-3.5 bg-card border-b sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
            P
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight text-foreground">PERKARA POS</h1>
            <p className="text-[11px] text-muted-foreground">{user?.name || "Outlet Utama"}</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setMobileOpen(!mobileOpen)} 
          className="min-h-[44px] min-w-[44px]"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-xs transition-opacity" 
          onClick={() => setMobileOpen(false)} 
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-card border-r flex flex-col justify-between transition-transform duration-200 ease-in-out
        lg:translate-x-0 lg:static lg:z-auto
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Sidebar Header / Branding */}
        <div className="p-4 border-b">
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
                <span>{user?.outletName || "Outlet Utama"}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items (Scrollable Dropdowns) */}
        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
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
                  onClick={() => setMobileOpen(false)}
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
                  onClick={() => setMobileOpen(false)}
                  className={`
                    flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all min-h-[48px] border shadow-2xs mt-1
                    ${pathname === "/pos" 
                      ? "bg-indigo-50/80 text-indigo-900 border-indigo-200/90 dark:bg-indigo-950/50 dark:text-indigo-200 ring-1 ring-indigo-200/80" 
                      : "bg-white text-slate-700 border-slate-200/60 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300"
                    }
                  `}
                >
                  <ShoppingCart className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="text-slate-900 dark:text-slate-100">POS Terminal</span>
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
                      const isActive = pathname === item.href;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={`
                            group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all min-h-[40px]
                            ${isActive 
                              ? "bg-slate-100 text-indigo-600 font-bold dark:bg-slate-800 dark:text-indigo-400" 
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
        <div className="p-3 border-t bg-muted/20 space-y-2">
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
              className="w-full text-xs min-h-[36px] justify-between text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900"
            >
              <span>Keluar (Logout)</span>
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

