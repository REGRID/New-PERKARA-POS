"use client";

import React, { useState } from "react";
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
  UserCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  accentColor: string; // Tailored subtle accent color
  badge?: string;
}

interface NavGroup {
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
      groupName: "Menu Utama",
      items: [
        { 
          name: "Dashboard", 
          href: "/", 
          icon: LayoutDashboard, 
          accentColor: "text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-500/10" 
        },
        { 
          name: "Terminal Kasir POS", 
          href: "/pos", 
          icon: ShoppingCart, 
          accentColor: "text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/10",
          badge: "Live"
        },
      ]
    },
    {
      groupName: "Inventaris & Resep",
      items: [
        { 
          name: "Stok Bahan Baku", 
          href: "/inventory/raw-materials", 
          icon: Boxes, 
          accentColor: "text-blue-600 dark:text-blue-400 group-hover:bg-blue-500/10",
          badge: "Urgent"
        },
        { 
          name: "Resep & HPP", 
          href: "/inventory/recipes", 
          icon: ClipboardList, 
          accentColor: "text-violet-600 dark:text-violet-400 group-hover:bg-violet-500/10" 
        },
        { 
          name: "Add-on Terintegrasi", 
          href: "/inventory/addons", 
          icon: Layers, 
          accentColor: "text-amber-600 dark:text-amber-400 group-hover:bg-amber-500/10" 
        },
      ]
    },
    {
      groupName: "Operasional",
      items: [
        { 
          name: "Scan Nota AI", 
          href: "/receipts/upload", 
          icon: Camera, 
          accentColor: "text-rose-600 dark:text-rose-400 group-hover:bg-rose-500/10" 
        },
        { 
          name: "Absensi PIN", 
          href: "/attendance", 
          icon: Clock, 
          accentColor: "text-teal-600 dark:text-teal-400 group-hover:bg-teal-500/10" 
        },
      ]
    }
  ];

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

        {/* Navigation Items (Scrollable) */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {navigation.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <h3 className="px-3 text-[11px] font-semibold text-muted-foreground/80 uppercase tracking-wider">
                {group.groupName}
              </h3>
              <div className="space-y-1 pt-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`
                        group flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all min-h-[44px]
                        ${isActive 
                          ? "bg-indigo-50 text-indigo-900 font-semibold dark:bg-indigo-950/40 dark:text-indigo-200 border border-indigo-200/80 dark:border-indigo-800" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1 rounded-md transition-colors ${isActive ? "text-indigo-600 dark:text-indigo-400" : item.accentColor}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <Badge 
                          variant="secondary" 
                          className={`
                            text-[10px] px-1.5 py-0 h-4 font-semibold
                            ${item.badge === "Live" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : ""}
                            ${item.badge === "Urgent" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" : ""}
                          `}
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
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

