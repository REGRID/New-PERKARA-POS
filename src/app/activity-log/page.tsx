"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth-context";
import { RefreshCw, ShieldAlert, Search, Filter, History, UserCheck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface AuditLogEntry {
  id: string;
  actorName: string;
  actorRole?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  details: string;
  createdAt: string;
}

export default function ActivityLogPage() {
  const { isAdmin, user } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState<string>("ALL");

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/data?type=audit_logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  if (!isAdmin) {
    return (
      <AppShell>
        <div className="p-12 text-center text-muted-foreground text-sm flex flex-col items-center justify-center space-y-3">
          <ShieldAlert className="w-10 h-10 text-rose-500 stroke-[1.5]" />
          <p className="font-semibold text-slate-800 dark:text-slate-200">Akses Ditolak</p>
          <p className="text-xs text-slate-500 max-w-sm">
            Halaman Log Aktivitas hanya dapat diakses oleh Owner dan Administrator.
          </p>
        </div>
      </AppShell>
    );
  }

  // Filter logs based on search query and action filter
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchQuery === "" ||
      log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.actorRole && log.actorRole.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesAction = filterAction === "ALL" || log.action === filterAction;

    return matchesSearch && matchesAction;
  });

  const uniqueActions = Array.from(new Set(logs.map((l) => l.action).filter(Boolean)));

  const getActionBadgeVariant = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("CREATE") || act.includes("TAMBAH") || act.includes("BUAT")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300";
    }
    if (act.includes("DELETE") || act.includes("NONAKTIF") || act.includes("DEACTIVATE") || act.includes("HAPUS")) {
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300";
    }
    if (act.includes("UPDATE") || act.includes("EDIT") || act.includes("UBAH")) {
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300";
    }
    return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300";
  };

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              Log Aktivitas Sistem
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Audit trail dan riwayat aksi administratif sensitif yang tercatat secara real-time.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={loadLogs}
              disabled={loading}
              className="text-xs gap-1.5 h-9"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Segarkan
            </Button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama pelaku, aksi, atau detail log..."
              className="pl-9 text-xs h-9"
            />
          </div>
          {uniqueActions.length > 0 && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="ALL">Semua Tipe Aksi</option>
                {uniqueActions.map((act) => (
                  <option key={act} value={act}>
                    {act}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Log Entries Card */}
        <Card className="overflow-hidden border shadow-xs">
          <CardHeader className="py-3 px-4 bg-muted/30 border-b flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-xs font-semibold">Riwayat Catatan ({filteredLogs.length})</CardTitle>
            </div>
            {user?.role === "owner" && (
              <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200">
                Mode Owner
              </Badge>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center space-y-2">
                <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
                <span>Memuat log aktivitas...</span>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground">
                {searchQuery || filterAction !== "ALL"
                  ? "Tidak ada catatan aktivitas yang cocok dengan pencarian."
                  : "Belum ada catatan aktivitas administratif yang tercatat."}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-muted/20 transition-colors space-y-1.5 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-foreground flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                          {log.actorName}
                        </span>
                        {log.actorRole && (
                          <span className="text-muted-foreground text-[11px]">({log.actorRole})</span>
                        )}
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-2 py-0.5 border font-semibold ${getActionBadgeVariant(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </Badge>
                        {log.targetType && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                            {log.targetType}
                          </Badge>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground shrink-0 font-mono">
                        {new Date(log.createdAt).toLocaleString("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed pl-5">
                      {log.details}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
