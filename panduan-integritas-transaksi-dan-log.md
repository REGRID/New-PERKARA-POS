# Panduan Implementasi: Integritas Transaksi (Validasi Harga, Stok, Transaction) + Halaman Log Aktivitas

Lanjutan dari `panduan-role-dan-manajemen-akun.md` — sebagian besar isi dokumen itu sudah diterapkan (role Owner, hapus PIN cadangan, proteksi API, dsb). Dokumen ini fokus ke 4 celah yang masih tersisa, ditemukan setelah audit ulang commit `0d68c77`.

Konteks: `src/lib/actions.ts` pakai Prisma Client via `const db = prisma as any;`. Model relevan: `Menu` (punya `price`), `Ingredient` (`floorQuantity`, `minStockAlert`), `RecipeItem` (`quantityUsed`).

---

## 1. Validasi Ulang Harga & Total di Server Saat Checkout

**Masalah:** `processOrderCheckout()` di `src/lib/actions.ts` menyimpan `price`, `subtotal`, `discount`, `totalAmount` persis seperti yang dikirim dari aplikasi kasir (client), tanpa dicocokkan ke harga `Menu` yang sebenarnya di database. Kalau ada yang memodifikasi request (lewat DevTools, atau bug di frontend), transaksi dengan harga palsu akan tetap tersimpan sebagai sah.

**Perbaikan** — tambahkan fungsi validasi sebelum `orderModel.create(...)` di `processOrderCheckout`:

```ts
// Ditaruh sebelum processOrderCheckout, atau di atasnya di file yang sama
async function validateAndRecalculateOrder(orderData: {
  items: Array<{ menuId?: string; menuName: string; quantity: number; price: number }>;
  discount?: number;
  totalAmount: number;
}) {
  const menuModel = db.menu || db.Menu;
  let recalculatedSubtotal = 0;

  for (const item of orderData.items) {
    if (!item.menuId) {
      // Item tanpa menuId (misal produk custom) — lewati pengecekan harga per-item,
      // tapi tetap ikut dihitung dari nilai yang dikirim agar subtotal tetap masuk akal.
      recalculatedSubtotal += Number(item.price) * Number(item.quantity);
      continue;
    }

    const menu = await menuModel.findUnique({ where: { id: item.menuId } });
    if (!menu) {
      throw new Error(`Menu "${item.menuName}" tidak ditemukan di database.`);
    }

    const expectedPrice = Number(menu.price);
    const sentPrice = Number(item.price);

    // Toleransi kecil untuk pembulatan, tapi bukan untuk selisih signifikan
    if (Math.abs(expectedPrice - sentPrice) > 1) {
      throw new Error(
        `Harga "${item.menuName}" tidak sesuai (sistem: Rp${expectedPrice}, diterima: Rp${sentPrice}). Transaksi dibatalkan demi keamanan.`
      );
    }

    recalculatedSubtotal += expectedPrice * Number(item.quantity);
  }

  const discount = Number(orderData.discount) || 0;
  const expectedTotal = recalculatedSubtotal - discount;
  const sentTotal = Number(orderData.totalAmount);

  if (Math.abs(expectedTotal - sentTotal) > 1) {
    throw new Error(
      `Total transaksi tidak sesuai perhitungan sistem (seharusnya Rp${expectedTotal}, diterima Rp${sentTotal}).`
    );
  }

  return { recalculatedSubtotal, expectedTotal };
}
```

Lalu di awal `processOrderCheckout`, sebelum langkah `orderModel.create`:

```ts
export async function processOrderCheckout(orderData: { /* ...tetap sama... */ }) {
  try {
    // Validasi dulu sebelum ada perubahan apa pun ke database
    await validateAndRecalculateOrder(orderData);

    const orderModel = db.order || db.Order;
    // ...lanjut kode yang sudah ada seperti biasa
```

> Catatan: kalau ke depan Anda menambahkan pajak/service charge yang dihitung dari `Settings`, masukkan juga perhitungannya ke `expectedTotal` di atas supaya validasinya tetap akurat.

---

## 2. Pengecekan Stok Cukup Sebelum Checkout Diproses

**Masalah:** Bagian auto-deduct stok di `processOrderCheckout` langsung `decrement` tanpa mengecek dulu apakah `floorQuantity` cukup — jadi stok bisa jadi minus tanpa peringatan.

**Perbaikan** — pisahkan jadi 2 tahap: **cek dulu semuanya**, baru **eksekusi pengurangan** kalau semua aman (supaya tidak ada transaksi yang setengah jalan gagal karena satu bahan baku kurang, sementara bahan baku lain sudah kadung dikurangi):

```ts
// Ganti bagian "Auto-deduct stock if recipes exist & record StockMovement"
// yang sudah ada dengan ini:

if (recipeModel && ingredientModel) {
  // TAHAP 1: Kumpulkan semua kebutuhan bahan baku dan cek kecukupannya dulu
  const deductionPlan: Array<{ ingredientId: string; ingredientName: string; totalDeduct: number; currentStock: number }> = [];

  for (const item of orderData.items) {
    if (!item.menuId) continue;
    const recipes = await recipeModel.findMany({ where: { menuId: item.menuId } });

    for (const rec of recipes) {
      const totalDeduct = (Number(rec.quantityUsed) || 1) * item.quantity;
      const existingPlan = deductionPlan.find((p) => p.ingredientId === rec.ingredientId);
      if (existingPlan) {
        existingPlan.totalDeduct += totalDeduct;
      } else {
        const ing = await ingredientModel.findUnique({ where: { id: rec.ingredientId } });
        deductionPlan.push({
          ingredientId: rec.ingredientId,
          ingredientName: ing?.name || rec.ingredientId,
          totalDeduct,
          currentStock: Number(ing?.floorQuantity) || 0,
        });
      }
    }
  }

  // TAHAP 2: Validasi kecukupan stok — GAGALKAN checkout kalau ada yang kurang
  const insufficient = deductionPlan.filter((p) => p.currentStock < p.totalDeduct);
  if (insufficient.length > 0) {
    const list = insufficient
      .map((p) => `${p.ingredientName} (stok: ${p.currentStock}, butuh: ${p.totalDeduct})`)
      .join(", ");
    throw new Error(`Stok bahan baku tidak cukup: ${list}`);
  }

  // TAHAP 3: Baru eksekusi pengurangan (kode yang sudah ada, tidak berubah)
  for (const plan of deductionPlan) {
    const updatedIng = await ingredientModel.update({
      where: { id: plan.ingredientId },
      data: { floorQuantity: { decrement: plan.totalDeduct } },
    }).catch(() => null);

    if (stockMovementModel && updatedIng) {
      await stockMovementModel.create({
        data: {
          ingredientId: plan.ingredientId,
          type: "SALE",
          quantity: -plan.totalDeduct,
          balanceAfter: Number(updatedIng.floorQuantity) || 0,
          referenceId: order.orderNumber,
          employeeName: orderData.employeeName || "Kasir Outlet",
          note: `Penjualan POS #${order.orderNumber}`,
        },
      }).catch(() => null);
    }
  }
}
```

**Bonus — pakai field `minStockAlert` yang sudah ada di `Ingredient` tapi belum dipakai:** setelah pengurangan, cek kalau `floorQuantity` turun di bawah `minStockAlert`, kirim notifikasi/badge di dashboard (lihat bagian terpisah kalau Anda ingin ini juga dibuatkan panduannya).

---

## 3. Bungkus Checkout/Void/Refund/Pembelian dengan `$transaction`

**Masalah:** Semua langkah (buat order → simpan item → catat pembayaran → kurangi stok → catat pergerakan stok) dieksekusi sebagai query terpisah. Kalau satu langkah gagal di tengah, data jadi tidak konsisten.

**Perbaikan** — bungkus seluruh isi `processOrderCheckout` (setelah validasi di Bagian 1 & 2) dengan `db.$transaction`:

```ts
export async function processOrderCheckout(orderData: { /* ... */ }) {
  // Validasi di luar transaction (read-only, tidak perlu dikunci)
  await validateAndRecalculateOrder(orderData);

  try {
    const result = await db.$transaction(async (tx: any) => {
      const orderModel = tx.order;
      const ingredientModel = tx.ingredient;
      const recipeModel = tx.recipeItem;
      const stockMovementModel = tx.stockMovement;
      const orderPaymentModel = tx.orderPayment;
      const shiftModel = tx.shiftLog;

      // ...seluruh isi fungsi yang sudah ada, tinggal ganti `db.xxxModel` jadi `tx.xxx`
      // (nama variabel model di dalam transaction harus konsisten pakai `tx`, bukan `db`)

      return { order };
    });

    return { success: true, order: result.order };
  } catch (error) {
    console.error("Error processing order checkout:", error);
    throw error;
  }
}
```

Lakukan pola yang sama untuk `voidOrderWithAuditLog`, `refundOrder`, dan `savePurchase` — bungkus semua langkah tulis-menulis database dalam satu fungsi jadi satu `db.$transaction(async (tx) => { ... })`, ganti semua referensi `db.modelName` di dalamnya jadi `tx.modelName`.

> Kenapa penting: kalau server crash atau koneksi database putus di tengah proses (misalnya setelah stok dikurangi tapi sebelum order tersimpan), `$transaction` otomatis membatalkan (rollback) semua perubahan yang sudah sempat jalan — jadi tidak ada data yang "nyangkut" setengah jalan.

---

## 4. Hapus Default PIN `"1234"` Saat Membuat Karyawan

**Masalah:** Di `saveEmployee()`, kalau PIN tidak diisi, sistem otomatis pakai `"1234"` — nilai yang mudah ditebak.

**Cari baris ini (muncul 2×, di path create dan update):**
```ts
pin: data.pin || "1234",
```

**Ganti dengan salah satu dari dua opsi ini, sesuaikan dengan alur yang Anda mau:**

**Opsi A — wajib diisi manual (paling aman):**
```ts
if (!data.pin) {
  throw new Error("PIN karyawan wajib diisi (4-6 digit angka).");
}
pin: data.pin,
```

**Opsi B — kalau kosong, generate PIN acak 4 digit (lebih ramah untuk alur cepat tambah karyawan):**
```ts
function generateRandomPin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
// ...
pin: data.pin || generateRandomPin(),
```
Kalau pakai Opsi B, pastikan PIN yang di-generate ditampilkan ke Admin/Owner setelah akun dibuat (misalnya lewat notifikasi/modal "PIN karyawan baru: 4821 — catat dan sampaikan ke karyawan"), supaya tidak hilang begitu saja.

---

## 5. Halaman "Log Aktivitas" untuk Owner/Admin

**Kondisi sekarang:** Backend (`getAuditLogs()` di `actions.ts`, endpoint `/api/data?type=audit_logs`) sudah ada dan sudah dibatasi ke role `owner`/`admin`, tapi belum ada halaman untuk menampilkannya.

**Buat file baru** `src/app/activity-log/page.tsx`:

```tsx
"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth-context";
import { RefreshCw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/data?type=audit_logs");
      if (res.ok) setLogs(await res.json());
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
        <div className="p-6 text-center text-slate-500 text-sm">Akses ditolak.</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-600" />
              Log Aktivitas
            </h1>
            <p className="text-xs text-slate-500">
              Semua aksi sensitif (buat akun, nonaktifkan akun, dsb.) tercatat di sini per akun.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={loadLogs} className="text-xs gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Segarkan
          </Button>
        </div>

        <div className="divide-y divide-slate-100 border rounded-xl overflow-hidden bg-white">
          {logs.length === 0 && !loading && (
            <div className="p-6 text-center text-xs text-slate-400">Belum ada aktivitas tercatat.</div>
          )}
          {logs.map((log) => (
            <div key={log.id} className="p-3 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{log.actorName}</span>
                <span className="text-slate-400">
                  {new Date(log.createdAt).toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="text-[10px]">{log.action}</Badge>
                {log.actorRole && <span className="text-slate-400">({log.actorRole})</span>}
              </div>
              <p className="text-slate-600">{log.details}</p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
```

Tambahkan juga link ke halaman ini di sidebar (`src/components/layout/sidebar.tsx`) dan di `navGroups` pada `src/app/settings/page.tsx`, di grup "PENGATURAN SISTEM", supaya muncul di daftar visibilitas menu — dan tambahkan `/activity-log` ke `ADMIN_ROUTES` di `src/middleware.ts` supaya karyawan biasa tidak bisa mengaksesnya.

---

## Urutan Pengerjaan yang Disarankan

1. **Bagian 1 (validasi harga/total)** — paling kritis, langsung berkaitan dengan kecurangan/kesalahan pencatatan uang.
2. **Bagian 2 (cek stok cukup)** — mencegah data stok jadi tidak masuk akal.
3. **Bagian 3 (`$transaction`)** — pondasi keandalan, sebaiknya dikerjakan bersamaan dengan Bagian 1 & 2 karena saling terkait (kode yang sama disentuh).
4. **Bagian 4 (PIN default)** — perubahan kecil, cepat dikerjakan kapan saja.
5. **Bagian 5 (halaman Log Aktivitas)** — tidak kritis untuk keamanan data, tapi penting supaya kerja keras Bagian 1-4 (dan sistem role Owner) benar-benar bisa dipakai/dipantau.
