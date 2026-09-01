# Spesifikasi Pengembangan Fitur — New PERKARA POS

Dokumen ini merinci kebutuhan pengembangan per modul berdasarkan hasil audit fungsional terhadap kode dan skema database yang ada sekarang.

---

## 1. Kasir / POS

### 1.1 Audit Log Pembatalan Transaksi (Void)
**Kondisi sekarang:** Void transaksi sudah berfungsi (dengan PIN supervisor), tapi tidak tercatat kemana pun. Model `CancellationAuditLog` sudah ada di skema tapi tidak dipakai.

**Yang perlu ditambahkan:**
- Setiap kali void dikonfirmasi, simpan record ke `CancellationAuditLog` berisi: ID order/transaksi, nama kasir yang login, nama supervisor yang approve PIN, waktu, daftar item yang dibatalkan beserta nilainya, dan **alasan pembatalan** (wajib diisi lewat dropdown: salah input, permintaan pelanggan, item habis, lainnya + catatan bebas).
- Halaman baru "Riwayat Pembatalan" (bisa di bawah `/reports` atau `/orders`) khusus admin, menampilkan semua void yang pernah terjadi, filter per tanggal/kasir/outlet, dengan total nilai kerugian dari pembatalan.
- Ganti pesan error PIN yang saat ini menampilkan default PIN (`"PIN Supervisor salah! (Default PIN: 9999)"`) — jangan bocorkan PIN default di pesan error produksi.

### 1.2 Split Payment
**Kondisi sekarang:** Satu transaksi hanya bisa dibayar dengan satu metode pembayaran.

**Yang perlu ditambahkan:**
- UI pembayaran mendukung multi-baris: pilih metode 1 (misal Cash) + nominal, tambah metode 2 (misal QRIS) + nominal, sistem otomatis menghitung sisa yang harus dibayar hingga total lunas.
- Tabel relasi baru `OrderPayment` (orderId, paymentMethodId, amount) agar satu `Order` bisa punya banyak baris pembayaran — saat ini `Order`/`Receipt` sepertinya cuma menyimpan satu metode pembayaran.
- Laporan kas & rekap harian perlu disesuaikan untuk memecah total per metode pembayaran dari transaksi split.

### 1.3 Alur Refund
**Kondisi sekarang:** Tidak ada mekanisme mengembalikan uang/barang setelah transaksi selesai (berbeda dengan void yang membatalkan transaksi yang *belum* selesai).

**Yang perlu ditambahkan:**
- Fitur "Refund" di halaman `/orders`: cari transaksi yang sudah selesai, pilih item yang dikembalikan (bisa sebagian), input alasan, butuh approval PIN supervisor.
- Refund harus: (a) mengembalikan stok bahan baku sesuai resep item yang direfund, (b) mencatat pengurangan di `CashTransaction`, (c) tercatat di `StockMovement` dengan tipe `REFUND`.
- Beda dengan void: refund terjadi *setelah* uang sudah tercatat masuk kas, jadi harus ada jejak kas keluar yang jelas, bukan sekadar menghapus order.

---

## 2. Stok & Bahan Baku

### 2.1 Melengkapi Pencatatan `StockMovement`
**Kondisi sekarang:** Tabel ini hanya terisi dari alur nota/webhook. Penjualan POS dan input pembelian manual tidak menulis ke sana meski field `type` sudah menyediakan opsi `SALE`, `PURCHASE`, `OPNAME_ADJUSTMENT`, `SPILLAGE`, `TRANSFER`.

**Yang perlu ditambahkan:**
- Di fungsi checkout POS: setiap kali stok bahan baku dikurangi karena penjualan, tulis juga baris `StockMovement` (`type: SALE`, `referenceId: orderId`, `quantity` negatif, `balanceAfter` diisi stok setelah dikurangi).
- Di fungsi `savePurchase`: tulis baris `StockMovement` (`type: PURCHASE`, `referenceId: purchaseId`, quantity positif).
- Halaman baru "Kartu Stok" per bahan baku: menampilkan histori keluar-masuk lengkap dengan saldo berjalan, bisa difilter per tanggal — ini laporan dasar yang biasa diminta pemilik usaha F&B/retail untuk audit stok.

### 2.2 Fitur Waste / Spillage (Barang Tumpah/Rusak)
**Kondisi sekarang:** Model `SpillageLog` ada di database, sama sekali belum ada UI atau fungsi pemanggilnya.

**Yang perlu ditambahkan:**
- Form input cepat di halaman inventory: pilih bahan baku, jumlah yang terbuang, alasan (tumpah, kadaluarsa, rusak saat produksi, lainnya), otomatis dikaitkan ke karyawan yang input & shift saat itu.
- Setiap input waste: kurangi stok bahan baku, tulis ke `SpillageLog` dan `StockMovement` (`type: SPILLAGE`).
- Laporan bulanan "Kerugian Bahan Baku" — total nilai rupiah yang hilang karena waste, berguna untuk evaluasi biaya operasional (COGS).

### 2.3 Alert Stok Menipis (Reorder Point)
**Kondisi sekarang:** Tidak ada. Pemilik harus cek manual satu-satu.

**Yang perlu ditambahkan:**
- Tambah kolom `minStockLevel` pada model `Ingredient`.
- Dashboard/notifikasi (badge di sidebar atau halaman inventory) menampilkan daftar bahan baku yang stoknya di bawah ambang batas, supaya bisa segera dibuatkan pembelian.
- Opsional: integrasi ke WhatsApp (kode sudah punya `messageTemplate` di `VendorContact`) untuk auto-generate draft pesan order ke supplier saat stok menipis.

---

## 3. Pembelian (Purchasing)

### 3.1 Perbaiki Pencocokan Nama Bahan Baku
**Kondisi sekarang:** Sinkronisasi stok dari pembelian ke `Ingredient` dicari pakai `contains` (pencocokan teks sebagian), rawan salah kalau ada bahan baku dengan nama mirip.

**Yang perlu ditambahkan:**
- Ubah form pembelian dari input nama bebas menjadi **dropdown pilih bahan baku** dari daftar `Ingredient` yang sudah ada (dengan opsi "tambah bahan baku baru" kalau memang belum ada). Ini menghilangkan risiko salah sinkron sepenuhnya.

### 3.2 Hubungkan Pembelian dengan Data Supplier
**Kondisi sekarang:** `VendorContact` (daftar supplier) berdiri sendiri; form pembelian pakai nama supplier sebagai teks bebas, tidak terhubung.

**Yang perlu ditambahkan:**
- Ganti input nama supplier di form pembelian jadi dropdown dari `VendorContact` (`supplierId` sebagai foreign key di `Purchase`, bukan `supplierName` teks).
- Halaman detail per-supplier: riwayat semua pembelian ke supplier tsb, total belanja, rata-rata harga barang dari supplier tsb dari waktu ke waktu (berguna untuk negosiasi harga).

### 3.3 Status & Approval Pembelian
**Kondisi sekarang:** Semua pembelian langsung final begitu disimpan — tidak ada jenjang approval untuk pengeluaran besar.

**Yang perlu ditambahkan:**
- Tambah field `status` di `Purchase`: `DRAFT` → `MENUNGGU_APPROVAL` → `DISETUJUI` → `DITERIMA`.
- Untuk pembelian di atas nominal tertentu (bisa diatur di `/settings`), butuh approval admin sebelum kas tercatat keluar.
- Field `outletId` perlu ditambahkan ke `Purchase` supaya laporan belanja bisa dipisah per cabang saat nanti multi-outlet.

---

## 4. Diskon

**Kondisi sekarang:** Model `Discount` cuma punya nama + tipe (persen/nominal) + status aktif — sangat dasar.

**Yang perlu ditambahkan (semua sebagai field/logic baru di model `Discount`):**
- `minPurchaseAmount` — diskon hanya berlaku jika total belanja minimal sekian.
- `applicableCategoryIds` / `applicableMenuIds` — diskon hanya berlaku untuk kategori atau menu tertentu (bukan seluruh transaksi).
- `validFrom` / `validUntil` dan opsional jam berlaku (misal promo "Happy Hour" 14:00–17:00).
- `voucherCode` — diskon berbasis kode yang diinput pelanggan/kasir, bukan cuma dipilih dari daftar.
- `usageLimit` / `usageCount` — batasi berapa kali kode voucher bisa dipakai (total atau per pelanggan).
- Halaman laporan "Penggunaan Diskon" — total diskon yang diberikan per periode, per jenis, untuk melihat dampaknya ke omzet bersih.

---

## 5. Pelanggan & Loyalitas

**Kondisi sekarang:** Field `points` di `Customer` cuma bisa diedit manual dari halaman pelanggan.

**Yang perlu ditambahkan:**
- Logic otomatis di proses checkout: jika transaksi terhubung ke `Customer`, tambahkan poin otomatis (misal 1 poin per Rp10.000 belanja — aturan rasio ini sebaiknya bisa diatur di `/settings`).
- Fitur **redeem poin** saat checkout di POS: kasir bisa pilih "tukar poin" untuk memotong sebagian tagihan, dengan aturan konversi yang jelas (misal 100 poin = Rp10.000).
- Riwayat poin per pelanggan (kapan dapat, kapan dipakai) — bukan cuma angka total, supaya bisa diaudit dan pelanggan bisa komplain kalau ada yang salah.
- Halaman profil pelanggan menampilkan riwayat transaksi mereka (frekuensi belanja, rata-rata nilai transaksi) — berguna untuk identifikasi pelanggan loyal.

---

## 6. Karyawan & Payroll

### 6.1 Masukkan Insentif ke Kalkulasi Payroll
**Kondisi sekarang:** Field `incentiveRate` dan `eligibleForIncentive` sudah ada di model `Employee` tapi tidak dipakai di perhitungan payroll (payroll sekarang murni jumlah shift × upah per shift).

**Yang perlu ditambahkan:**
- Logic payroll ditambah komponen insentif: bisa berbasis target penjualan personal/tim, jumlah transaksi yang ditangani, atau kehadiran penuh sebulan — sesuaikan dengan skema insentif riil yang dipakai bisnis Anda.
- Tampilkan breakdown di slip payroll: upah pokok + insentif + potongan = total diterima (bukan cuma satu angka gabungan).

### 6.2 Pengajuan Izin/Cuti/Sakit
**Kondisi sekarang:** Sistem absensi cuma merekam hadir/telat/pulang cepat — tidak ada mekanisme izin resmi.

**Yang perlu ditambahkan:**
- Model baru `LeaveRequest` (employeeId, jenis: cuti/sakit/izin, tanggal mulai-selesai, alasan, status: menunggu/disetujui/ditolak, disetujui oleh siapa).
- Halaman karyawan: form ajukan izin, lihat status pengajuan sendiri.
- Halaman admin: daftar pengajuan yang perlu di-approve/reject, terintegrasi ke kalender absensi (supaya hari izin tidak dianggap "tidak hadir tanpa keterangan" saat hitung payroll).

### 6.3 Potongan Payroll & Slip Gaji
**Kondisi sekarang:** Belum ada mekanisme potongan (kasbon, keterlambatan, dll.), dan perlu dipastikan tombol "Cetak Slip Payroll" benar-benar menghasilkan dokumen yang bisa diunduh/dicetak.

**Yang perlu ditambahkan:**
- Model `PayrollDeduction` (employeeId, jenis potongan, nominal, periode) — misal kasbon yang dicicil, potongan karena telat berulang, dll.
- Slip gaji digenerate sebagai PDF per karyawan per periode, berisi rincian: upah pokok, insentif, potongan, total bersih diterima, dengan tanda tangan digital/approval dari admin.

---

## 7. Approval Workflow (Umum, Bukan Hanya Nota)

**Kondisi sekarang:** Sistem approval yang ada (`/api/approvals`) khusus untuk verifikasi nota hasil OCR.

**Yang perlu ditambahkan (jika dibutuhkan bisnis Anda):**
- Generalisasi tabel approval supaya bisa dipakai untuk jenis lain: approval pembelian besar (lihat poin 3.3), approval diskon manual yang diberikan kasir di luar aturan standar, approval refund (lihat poin 1.3).
- Halaman terpusat "Pusat Approval" untuk admin — semua jenis pengajuan yang menunggu keputusan tampil di satu tempat, bukan tersebar di masing-masing modul.

---

## 8. Rekap Harian & Laporan

### 8.1 Perbaiki Halaman Rekap Harian Kasir
**Kondisi sekarang:** Saat data kosong/gagal load, halaman menampilkan angka contoh yang di-hardcode (nama "Budi Santoso", Rp500.000, dst.) — bukan data nyata dan tidak ada filter.

**Yang perlu ditambahkan:**
- Hapus data dummy fallback; tampilkan status kosong yang jujur jika memang belum ada shift/transaksi.
- Tambahkan filter tanggal, filter outlet (untuk nanti multi-outlet), dan filter per-shift/per-karyawan.
- Tampilkan daftar riwayat rekap harian (bukan cuma shift yang sedang berjalan) — bisa lihat rekap H-1, H-2, dst., dengan status "sudah ditutup/diverifikasi admin" agar ada kepastian kas cocok setiap hari.

### 8.2 Laporan Komparatif & Analitik
**Kondisi sekarang:** Belum ada.

**Yang perlu ditambahkan:**
- Grafik omzet: hari ini vs kemarin, minggu ini vs minggu lalu, bulan ini vs bulan lalu.
- Laporan produk terlaris & paling tidak laku (per periode) — dasar untuk keputusan menu.
- Laporan jam/hari paling ramai — dasar untuk atur jadwal shift karyawan secara lebih efisien.
- Laporan margin per menu (harga jual dikurangi biaya bahan baku dari resep) — mengukur profitabilitas per item, bukan cuma omzet total.

---

## Saran Urutan Pengerjaan

Kalau harus diprioritaskan berdasarkan dampak langsung ke kepercayaan atas uang & data:

1. **Rekap harian yang benar (8.1)** + **audit log void (1.1)** — keduanya langsung berkaitan dengan kontrol kas harian.
2. **Kelengkapan StockMovement (2.1)** — supaya laporan stok bisa diaudit.
3. **Dropdown supplier & bahan baku di pembelian (3.1, 3.2)** — mencegah kesalahan data yang sudah terjadi berulang.
4. Sisanya (split payment, refund, loyalitas otomatis, diskon lanjutan, cuti karyawan, laporan analitik) dikerjakan sesuai kebutuhan operasional yang paling sering dikeluhkan tim di lapangan.
