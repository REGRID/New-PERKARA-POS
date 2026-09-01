# Panduan Implementasi: Role Jelas + Manajemen Akun + Audit Log Per-Akun

Dokumen ini adalah spesifikasi siap-pakai (bisa langsung ditempel ke Claude Code/Cursor/AI coding tool lain) untuk menambahkan:
1. Role yang jelas: **Owner, Admin, Supervisor, Kasir (Karyawan)**.
2. Fitur **buat akun baru** di halaman Settings, khusus untuk yang login sebagai **Owner**.
3. **Audit log** yang mencatat setiap aksi sensitif dengan identitas akun asli — tidak tercampur/generik.
4. Menutup celah PIN cadangan (backdoor `9999`/`1234`) yang sebelumnya bikin log tidak bisa dipercaya.

Konteks proyek: Next.js + Prisma (`prisma/schema.prisma`), sudah ada sesi login berbasis cookie httpOnly (`src/lib/session.ts`, `src/middleware.ts`), tapi role cuma dua: `"admin"` dan `"karyawan"`.

---

## 1. Perubahan Skema Database (`prisma/schema.prisma`)

Tambahkan field berikut ke model `Employee` yang sudah ada:

```prisma
model Employee {
  // ...field yang sudah ada tetap dipakai (name, username, password, pin, role, dst)
  isActive  Boolean  @default(true)   // nonaktifkan akun tanpa menghapus data historisnya
}
```

Tambahkan model baru untuk audit log umum (terpisah dari `CancellationAuditLog` yang sudah ada khusus untuk void/refund):

```prisma
model AuditLog {
  id         String   @id @default(uuid())
  actorName  String              // nama akun yang melakukan aksi — WAJIB diisi identitas asli
  actorRole  String?             // role akun saat aksi dilakukan
  action     String              // contoh: "CREATE_ACCOUNT", "DEACTIVATE_ACCOUNT", "UPDATE_PRICE"
  targetType String?             // contoh: "Employee", "Menu", "Discount"
  targetId   String?
  details    String   @db.Text   // ringkasan aksi/perubahan
  createdAt  DateTime @default(now())
}
```

Setelah menambahkan ini, jalankan migrasi (`npx prisma migrate dev` atau `npx prisma db push`, sesuaikan dengan setup project).

**Catatan soal `role`:** field ini tetap string bebas di database (tidak diubah jadi enum, supaya tidak breaking terhadap data lama), tapi di level aplikasi dibatasi ke 4 nilai yang diizinkan: `owner`, `admin`, `supervisor`, `cashier`.

---

## 2. Peta Role & Hak Akses

| Role (nilai di DB) | Role di sesi login | Akses |
|---|---|---|
| `owner` | `owner` | Semua akses admin **+ Kelola Akun** (buat/nonaktifkan akun) + lihat semua Audit Log |
| `admin` / `manager` | `admin` | ERP penuh (produk, stok, pembelian, diskon, laporan, karyawan) — **tidak** bisa kelola akun |
| `supervisor` | `admin` (untuk sementara, bisa dipecah lebih lanjut kalau perlu granularitas lebih) | Approve void/refund, lihat laporan |
| `cashier` (karyawan lain) | `karyawan` | POS, absensi sendiri, meja, pelanggan |

Kalau ke depan Anda ingin Supervisor punya batasan lebih ketat dari Admin (mis. tidak bisa ubah harga produk), sesi login (`SessionPayload.role`) perlu diperluas jadi menyimpan role asli (`owner`/`admin`/`supervisor`/`karyawan`) alih-alih dipetakan jadi cuma 2-3 nilai. Untuk versi awal ini, Supervisor disamakan dulu dengan Admin supaya scope implementasi tidak terlalu besar.

---

## 3. `src/lib/session.ts` — Perluas Tipe Role

```ts
export interface SessionPayload {
  id: string;
  name: string;
  role: "owner" | "admin" | "karyawan"; // sebelumnya cuma "admin" | "karyawan"
  username?: string;
  outletName?: string;
  exp: number;
}
```

Tidak ada perubahan logic lain di file ini — signing/verifying token sudah generic terhadap isi payload.

---

## 4. `src/lib/auth-context.tsx` — Tambah `isOwner`

```ts
export type UserRole = "owner" | "admin" | "karyawan";

// di dalam AuthProvider, setelah isAdmin:
const isAdmin = user?.role === "admin" || user?.role === "owner";
const isOwner = user?.role === "owner";

// tambahkan isOwner ke AuthContextType, default value, dan value={{ ..., isOwner }}
```

`isAdmin` sengaja tetap `true` untuk `owner` juga, supaya semua pengecekan akses admin yang sudah ada di halaman-halaman lain (`if (!isAdmin) redirect`) otomatis tetap berlaku untuk Owner tanpa perlu diubah satu-satu.

---

## 5. `src/lib/authHelper.ts` — Perluas `requireRole`

```ts
export async function requireRole(
  req: NextRequest | Request,
  allowedRoles: Array<"owner" | "admin" | "karyawan"> = ["admin"]
): Promise<{ errorResponse: NextResponse | null; session: SessionPayload | null }> {
  // logic tetap sama, cuma tipe parameter yang diperluas
}
```

---

## 6. `src/middleware.ts` — Redirect Setelah Login

Cari baris ini:
```ts
const targetUrl = session.role === "admin" ? new URL("/", request.url) : new URL("/pos", request.url);
```
Ganti jadi:
```ts
const targetUrl = (session.role === "admin" || session.role === "owner")
  ? new URL("/", request.url)
  : new URL("/pos", request.url);
```

Bagian yang mengarahkan karyawan menjauh dari halaman admin (`session.role === "karyawan"`) tidak perlu diubah — Owner otomatis tidak kena blokir itu karena rolenya bukan `"karyawan"`.

---

## 7. `src/lib/actions.ts` — Bagian Inti

### 7a. Ganti fungsi `authenticateUser` (hapus backdoor, tambah hashing, tambah role Owner)

```ts
// --- Password hashing (pakai modul bawaan Node `crypto`, tidak perlu install bcrypt) ---
// Format tersimpan: "scrypt:<saltHex>:<hashHex>"
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

export function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(plain, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(plain: string, stored: string): boolean {
  if (!stored) return false;
  if (stored.startsWith("scrypt:")) {
    const [, salt, hashHex] = stored.split(":");
    if (!salt || !hashHex) return false;
    try {
      const candidate = scryptSync(plain, salt, 64);
      const expected = Buffer.from(hashHex, "hex");
      if (candidate.length !== expected.length) return false;
      return timingSafeEqual(candidate, expected);
    } catch {
      return false;
    }
  }
  // Akun lama yang passwordnya masih plaintext (dibuat sebelum hashing ada).
  return plain === stored;
}

function resolveSessionRole(dbRole: string | null | undefined): "owner" | "admin" | "karyawan" {
  const r = (dbRole || "").toLowerCase();
  if (r === "owner") return "owner";
  if (r === "admin" || r === "manager" || r === "supervisor") return "admin";
  return "karyawan";
}

export async function authenticateUser(data: { username: string; password?: string }) {
  const inputId = (data.username || "").trim();
  const inputPass = (data.password || "").trim();
  if (!inputId) return { success: false, error: "ID Pengguna wajib diisi." };

  const envAdminId = (process.env.ADMIN_ID || "admin").trim();
  const envAdminPass = (process.env.ADMIN_PASSWORD || "admin123").trim();
  const envKaryawanId = (process.env.KARYAWAN_ID || "karyawan").trim();
  const envKaryawanPass = (process.env.KARYAWAN_PASSWORD || "kasir123").trim();

  // 1. Akun Owner bootstrap dari .env — TANPA PIN cadangan apa pun.
  //    Ini satu-satunya akun yang selalu ada, supaya selalu ada yang bisa
  //    membuat akun lain dari Settings.
  if (inputId.toLowerCase() === envAdminId.toLowerCase() && inputPass === envAdminPass) {
    return {
      success: true,
      user: { id: "owner-1", name: "Owner", username: envAdminId, role: "owner" as const, outletName: "Outlet Utama" },
    };
  }

  // 2. Akun Karyawan generik dari .env
  if (inputId.toLowerCase() === envKaryawanId.toLowerCase() && inputPass === envKaryawanPass) {
    return {
      success: true,
      user: { id: "emp-1", name: "Kasir Outlet (Karyawan)", username: envKaryawanId, role: "karyawan" as const, outletName: "Outlet Utama" },
    };
  }

  // 3. Cari akun di database (exact match saja, TIDAK pakai `contains` supaya tidak ambigu)
  try {
    const employeeModel = db.employee || db.Employee;
    if (employeeModel) {
      const emp = await employeeModel.findFirst({
        where: { OR: [{ username: inputId }, { id: inputId }] },
      });

      if (emp) {
        if (emp.isActive === false) {
          return { success: false, error: "Akun ini telah dinonaktifkan. Hubungi Owner/Admin." };
        }
        const empPin = (emp.pin || "").trim();
        const empPass = (emp.password || "").trim();
        const isPinMatch = empPin && inputPass === empPin;
        const isPassMatch = empPass && verifyPassword(inputPass, empPass);

        // Akun tanpa PIN & password sama sekali dianggap belum aktif — TIDAK
        // meloloskan sembarang input (beda dari perilaku lama).
        if (empPin || empPass) {
          if (isPinMatch || isPassMatch) {
            return {
              success: true,
              user: {
                id: emp.id,
                name: emp.name,
                username: emp.username || emp.name,
                role: resolveSessionRole(emp.role),
                outletName: "Outlet Utama",
              },
            };
          }
          return { success: false, error: "PIN atau Kata Sandi salah." };
        }
      }
    }
  } catch (err) {
    console.error("Error authenticating against DB employee table:", err);
  }

  return { success: false, error: "ID Pengguna atau Kata Sandi tidak ditemukan." };
}
```

### 7b. Fungsi baru — Manajemen Akun (khusus dipanggil dari endpoint yang dibatasi Owner)

```ts
const ASSIGNABLE_ROLES = ["owner", "admin", "supervisor", "cashier"] as const;

export async function getAccounts() {
  const employeeModel = db.employee || db.Employee;
  if (!employeeModel) return [];
  const rows = await employeeModel.findMany({ orderBy: { createdAt: "asc" } });
  // Jangan pernah kirim hash password ke client.
  return rows.map((r: any) => ({
    id: r.id, name: r.name, username: r.username, role: r.role,
    isActive: r.isActive !== false, hasPin: !!r.pin, createdAt: r.createdAt,
  }));
}

export async function createAccount(data: {
  name: string; username: string; password: string; pin?: string; role: string; createdBy?: string;
}) {
  const name = (data.name || "").trim();
  const username = (data.username || "").trim();
  const password = (data.password || "").trim();
  const pin = (data.pin || "").trim();
  const role = (data.role || "").trim().toLowerCase();

  if (!name || !username || !password) throw new Error("Nama, Username, dan Password wajib diisi.");
  if (password.length < 6) throw new Error("Password minimal 6 karakter.");
  if (!ASSIGNABLE_ROLES.includes(role as any)) throw new Error(`Role tidak valid. Pilihan: ${ASSIGNABLE_ROLES.join(", ")}.`);
  if (pin && !/^\d{4,6}$/.test(pin)) throw new Error("PIN harus 4-6 digit angka.");

  const employeeModel = db.employee || db.Employee;
  const existing = await employeeModel.findFirst({ where: { username } }).catch(() => null);
  if (existing) throw new Error("Username sudah dipakai akun lain.");

  const newAccount = await employeeModel.create({
    data: { name, username, password: hashPassword(password), pin: pin || null, role, isActive: true },
  });

  await createAuditLogEntry({
    actorName: data.createdBy || "Owner",
    action: "CREATE_ACCOUNT",
    targetType: "Employee",
    targetId: newAccount.id,
    details: `Membuat akun baru "${name}" (username: ${username}, role: ${role})`,
  });

  return { success: true, id: newAccount.id };
}

export async function setAccountActive(data: { id: string; isActive: boolean; actorName?: string }) {
  const employeeModel = db.employee || db.Employee;
  const updated = await employeeModel.update({ where: { id: data.id }, data: { isActive: !!data.isActive } });

  await createAuditLogEntry({
    actorName: data.actorName || "Owner",
    action: data.isActive ? "ACTIVATE_ACCOUNT" : "DEACTIVATE_ACCOUNT",
    targetType: "Employee",
    targetId: data.id,
    details: `${data.isActive ? "Mengaktifkan" : "Menonaktifkan"} akun "${updated.name}"`,
  });

  return { success: true };
}
```

### 7c. Fungsi baru — Audit Log Umum

```ts
export async function createAuditLogEntry(data: {
  actorName: string; actorRole?: string; action: string; targetType?: string; targetId?: string; details?: string;
}) {
  try {
    const auditLogModel = db.auditLog || db.AuditLog;
    if (!auditLogModel) return; // Model belum di-migrate — jangan sampai memblokir aksi utamanya.
    await auditLogModel.create({
      data: {
        actorName: data.actorName,
        actorRole: data.actorRole || "",
        action: data.action,
        targetType: data.targetType || null,
        targetId: data.targetId || null,
        details: data.details || "",
      },
    });
  } catch (err) {
    console.error("Error writing AuditLog entry:", err);
  }
}

export async function getAuditLogs() {
  const auditLogModel = db.auditLog || db.AuditLog;
  if (!auditLogModel) return [];
  return await auditLogModel.findMany({ orderBy: { createdAt: "desc" }, take: 500 });
}
```

### 7d. Hapus PIN Cadangan di `voidOrderWithAuditLog` dan `refundOrder`

Cari baris ini di kedua fungsi (muncul 2×):
```ts
let isAuthorized = data.supervisorPin === "9999" || data.supervisorPin === "1234";
```
Ganti jadi:
```ts
let isAuthorized = false; // tidak ada PIN cadangan — harus cocok dengan PIN akun asli di database
```
Sisa logic di bawahnya (`if (empModel && !isAuthorized) { ... }`) sudah benar mencari PIN dari tabel `Employee`, jadi otomatis akan memvalidasi terhadap akun Supervisor/Admin/Owner asli begitu baris di atas diganti. Ini penting supaya `approverName` yang tercatat di `CancellationAuditLog` selalu nama akun asli, bukan "Supervisor" generik.

---

## 8. `src/app/api/data/route.ts` — Endpoint Baru & Proteksi Owner-Only

Tambahkan import:
```ts
import { getAccounts, createAccount, setAccountActive, getAuditLogs } from "@/lib/actions";
```

Tambahkan set baru di atas `ADMIN_ONLY_ACTIONS`:
```ts
const OWNER_ONLY_ACTIONS = new Set(["create_account", "set_account_active"]);
```

Di dalam `POST(request)`, sebelum pengecekan `ADMIN_ONLY_ACTIONS`, tambahkan:
```ts
if (type && OWNER_ONLY_ACTIONS.has(type)) {
  const { errorResponse, session } = await requireRole(request, ["owner"]);
  if (errorResponse) return errorResponse;

  if (type === "create_account") {
    return NextResponse.json(await createAccount({ ...body, createdBy: session!.name }));
  }
  if (type === "set_account_active") {
    return NextResponse.json(await setAccountActive({ ...body, actorName: session!.name }));
  }
}
```

Di dalam `GET(request)`, tambahkan (dengan proteksi — jangan biarkan siapa pun bisa lihat daftar akun):
```ts
if (type === "accounts") {
  const { errorResponse } = await requireRole(request, ["owner"]);
  if (errorResponse) return errorResponse;
  return NextResponse.json(await getAccounts());
}
if (type === "audit_logs") {
  const { errorResponse } = await requireRole(request, ["owner", "admin"]);
  if (errorResponse) return errorResponse;
  return NextResponse.json(await getAuditLogs());
}
```

---

## 9. `src/app/settings/page.tsx` — UI "Kelola Akun"

Tambahkan di bagian atas komponen:
```tsx
import { useAuth } from "@/lib/auth-context";
// ...
const { user } = useAuth();
const isOwner = user?.role === "owner";

const [accounts, setAccounts] = useState<any[]>([]);
const [newAccount, setNewAccount] = useState({ name: "", username: "", password: "", pin: "", role: "cashier" });
const [creatingAccount, setCreatingAccount] = useState(false);
const [accountError, setAccountError] = useState("");

const loadAccounts = async () => {
  const res = await fetch("/api/data?type=accounts");
  if (res.ok) setAccounts(await res.json());
};

useEffect(() => {
  if (isOwner) loadAccounts();
}, [isOwner]);

const handleCreateAccount = async (e: React.FormEvent) => {
  e.preventDefault();
  setAccountError("");
  setCreatingAccount(true);
  try {
    const res = await fetch("/api/data?type=create_account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAccount),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Gagal membuat akun");
    setNewAccount({ name: "", username: "", password: "", pin: "", role: "cashier" });
    await loadAccounts();
  } catch (err: any) {
    setAccountError(err.message);
  } finally {
    setCreatingAccount(false);
  }
};

const handleToggleActive = async (id: string, isActive: boolean) => {
  await fetch("/api/data?type=set_account_active", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, isActive }),
  });
  await loadAccounts();
};
```

Tambahkan section baru di JSX (setelah bagian "Visibilitas Menu Navigasi", sebelum "Bottom Actions"), **hanya dirender kalau `isOwner`**:

```tsx
{isOwner && (
  <div className="space-y-4 pt-6 border-t border-slate-200/60">
    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
      <Users className="w-4 h-4 text-indigo-600" />
      <span>Kelola Akun (Khusus Owner)</span>
    </h3>
    <p className="text-xs text-slate-500 font-medium">
      Buat akun baru untuk Admin, Supervisor, atau Kasir. Setiap akun punya
      hak akses sesuai role dan tercatat terpisah di log aktivitas.
    </p>

    {/* Form buat akun baru */}
    <form onSubmit={handleCreateAccount} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
      {accountError && (
        <div className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
          {accountError}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input placeholder="Nama Lengkap" value={newAccount.name}
          onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })} required />
        <Input placeholder="Username" value={newAccount.username}
          onChange={(e) => setNewAccount({ ...newAccount, username: e.target.value })} required />
        <Input type="password" placeholder="Password (min. 6 karakter)" value={newAccount.password}
          onChange={(e) => setNewAccount({ ...newAccount, password: e.target.value })} required />
        <Input placeholder="PIN Kasir (opsional, 4-6 digit)" value={newAccount.pin}
          onChange={(e) => setNewAccount({ ...newAccount, pin: e.target.value })} />
        <select value={newAccount.role} onChange={(e) => setNewAccount({ ...newAccount, role: e.target.value })}
          className="border rounded-xl px-3 py-2 text-xs font-semibold">
          <option value="cashier">Kasir</option>
          <option value="supervisor">Supervisor</option>
          <option value="admin">Admin</option>
          <option value="owner">Owner</option>
        </select>
      </div>
      <Button type="submit" disabled={creatingAccount} className="text-xs">
        {creatingAccount ? "Membuat Akun..." : "Buat Akun Baru"}
      </Button>
    </form>

    {/* Daftar akun */}
    <div className="divide-y divide-slate-100 border rounded-xl overflow-hidden">
      {accounts.map((acc) => (
        <div key={acc.id} className="flex items-center justify-between p-3 text-xs">
          <div>
            <div className="font-bold text-slate-900">{acc.name} <span className="text-slate-400 font-normal">@{acc.username}</span></div>
            <Badge className="mt-1 text-[10px]">{acc.role}</Badge>
          </div>
          <Button size="sm" variant="outline" onClick={() => handleToggleActive(acc.id, !acc.isActive)}>
            {acc.isActive ? "Nonaktifkan" : "Aktifkan"}
          </Button>
        </div>
      ))}
    </div>
  </div>
)}
```

---

## 10. Langkah Menjalankan

1. Terapkan semua perubahan di atas.
2. Jalankan `npx prisma migrate dev --name add_owner_role_and_audit_log` (atau `db push` sesuai setup).
3. Set `.env`: `ADMIN_ID`, `ADMIN_PASSWORD` — ini otomatis jadi akun **Owner** pertama Anda begitu login.
4. Login dengan akun Owner tersebut → buka **Settings** → bagian "Kelola Akun" akan muncul di paling bawah, khusus untuk Owner.
5. Buat akun Admin/Supervisor/Kasir baru dari situ — masing-masing dapat username & password sendiri, tidak perlu berbagi kredensial lagi.

---

## Ringkasan Perilaku Baru

- **Owner**: satu-satunya role yang bisa membuka & memakai "Kelola Akun" di Settings.
- **Setiap akun baru wajib** nama, username, password (di-hash, minimal 6 karakter) — PIN opsional untuk keperluan kasir cepat.
- **Tidak ada lagi PIN cadangan** di login, void, maupun refund — semua approval divalidasi ke akun asli di database.
- **Setiap aksi sensitif tercatat ke `AuditLog`** dengan nama akun asli yang melakukannya (bukan label generik), terpisah dari `CancellationAuditLog` yang tetap khusus mencatat void/refund transaksi.
- Akun bisa **dinonaktifkan** (bukan dihapus) — riwayat transaksi/log lama tetap menunjukkan nama akun yang benar meski akunnya sudah tidak aktif.
