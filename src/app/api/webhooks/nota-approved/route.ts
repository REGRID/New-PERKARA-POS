import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/lib/prisma";
import { getAuthSession } from "@/lib/authHelper";

const EXPECTED_SECRET = (process.env.POS_WEBHOOK_SECRET || "perkara_pos_secret_key_2026").trim();

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();

    const isSecretValid = token && token === EXPECTED_SECRET;
    const session = await getAuthSession(req);
    const isSessionValid = session && (session.role === "admin" || session.role === "karyawan");

    if (!isSecretValid && !isSessionValid) {
      return NextResponse.json({ error: "Unauthorized: Invalid Webhook Secret or Session" }, { status: 401 });
    }

    const payload = await req.json();
    const {
      receiptId,
      merchantName,
      date,
      totalAmount,
      subtotal,
      taxAmount,
      discountAmount,
      paymentMethod,
      paymentStatus,
      note,
      imageUrl,
      staffName,
      approvedBy,
      stockDestination,
      items,
    } = payload;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Payload harus memiliki minimal 1 item" }, { status: 400 });
    }

    const anyDb = db as any;
    if (!anyDb) {
      return NextResponse.json({ error: "Database POS tidak tersedia" }, { status: 500 });
    }

    // 1. Ambil setting default lokasi stok (BAR vs WAREHOUSE)
    let defaultDestination = "BAR";
    try {
      const setModel = anyDb.systemSetting || anyDb.SystemSetting;
      if (setModel) {
        const destSetting = await setModel.findUnique({
          where: { key: "default_stock_destination" },
        });
        if (destSetting && destSetting.value) {
          defaultDestination = destSetting.value.trim().toUpperCase();
        }
      }
    } catch (sErr) {
      console.warn("Could not load default_stock_destination setting:", sErr);
    }

    const targetDestination = stockDestination ? stockDestination.toUpperCase() : defaultDestination;

    const ingredientModel = anyDb.ingredient || anyDb.Ingredient;
    const stockMovementModel = anyDb.stockMovement || anyDb.StockMovement;
    const purchaseModel = anyDb.purchase || anyDb.Purchase;

    const processedItems: any[] = [];
    const unmatchedItems: any[] = [];

    for (const item of items) {
      const itemName = (item.name || "").trim();
      const itemPrice = Number(item.price) || 0;
      const itemQty = Number(item.quantity) || 1;
      const itemSku = (item.sku || "").trim();
      const itemCategory = (item.category || "").toLowerCase();

      // Cek apakah item adalah pengeluaran non-stok
      const isNonStock =
        itemCategory.includes("operasional") ||
        itemCategory.includes("utilitas") ||
        itemCategory.includes("listrik") ||
        itemCategory.includes("beban");

      if (isNonStock) {
        // Catat sebagai Purchase pengeluaran operasional saja tanpa menambah stok bahan baku
        if (purchaseModel) {
          await purchaseModel.create({
            data: {
              itemName: itemName,
              quantity: itemQty,
              unitPrice: itemPrice,
              totalPrice: itemPrice * itemQty,
              supplierName: merchantName || "Nota Toko",
              purchaseDate: date ? new Date(date) : new Date(),
              notes: `[NON-STOK] Pengeluaran Operasional dari Nota (${receiptId})`,
            },
          });
        }
        processedItems.push({
          name: itemName,
          type: "NON_STOCK_EXPENSE",
          totalPrice: itemPrice * itemQty,
        });
        continue;
      }

      // Cari bahan baku di Ingredient model
      let matchedIng: any = null;
      if (ingredientModel) {
        if (itemSku) {
          matchedIng = await ingredientModel.findFirst({
            where: { sku: itemSku },
          });
        }

        if (!matchedIng && itemName) {
          matchedIng = await ingredientModel.findFirst({
            where: {
              OR: [
                { name: { equals: itemName } },
                { name: { contains: itemName } },
              ],
            },
          });
        }
      }

      if (matchedIng) {
        // Hitung rasio konversi satuan pakai
        const conversion = matchedIng.conversionRatio && matchedIng.conversionRatio > 0 ? matchedIng.conversionRatio : 1;
        const addedUnits = itemQty * conversion;

        // Hitung stok baru berdasarkan target destinasi
        const isBar = targetDestination === "BAR";
        const currentStock = isBar ? Number(matchedIng.floorQuantity || 0) : Number(matchedIng.warehouseQuantity || 0);
        const newStock = currentStock + addedUnits;

        // Hitung Moving Average HPP
        const currentUnitCost = Number(matchedIng.costPerUseUnit || 0);
        const newItemTotalCost = itemPrice * itemQty;
        const totalNewStockUnits = currentStock + addedUnits;
        const newAverageHpp =
          totalNewStockUnits > 0
            ? ((currentStock * currentUnitCost) + newItemTotalCost) / totalNewStockUnits
            : itemPrice > 0
            ? itemPrice / conversion
            : currentUnitCost;

        // Update master bahan baku di database
        const updateData: any = {
          hargaBeli: itemPrice > 0 ? itemPrice : matchedIng.hargaBeli,
          costPerUseUnit: newAverageHpp > 0 ? newAverageHpp : matchedIng.costPerUseUnit,
          updatedAt: new Date(),
        };

        if (isBar) {
          updateData.floorQuantity = newStock;
        } else {
          updateData.warehouseQuantity = newStock;
        }

        const updatedIng = await ingredientModel.update({
          where: { id: matchedIng.id },
          data: updateData,
        });

        // Catat kartu mutasi stok (Stock Movement)
        if (stockMovementModel) {
          await stockMovementModel.create({
            data: {
              ingredientId: updatedIng.id,
              type: "PURCHASE",
              quantity: addedUnits,
              balanceAfter: newStock,
              fromSource: merchantName || "Nota Toko",
              toDestination: isBar ? "Stok Bar / Toko" : "Stok Gudang",
              referenceId: receiptId,
              note: `Auto-sync Nota Perkara-Nota (${merchantName || "Toko"}): ${itemQty} ${matchedIng.buyUnit || "Unit"} @ Rp ${itemPrice.toLocaleString("id-ID")}`,
            },
          });
        }

        // Catat riwayat pembelian (Purchase)
        if (purchaseModel) {
          await purchaseModel.create({
            data: {
              itemName: `[${matchedIng.sku || "BAHAN"}] ${matchedIng.name}`,
              quantity: itemQty,
              unitPrice: itemPrice,
              totalPrice: itemPrice * itemQty,
              supplierName: merchantName || "Nota Toko",
              purchaseDate: date ? new Date(date) : new Date(),
              notes: `Auto-sync Nota (${receiptId}) -> +${addedUnits} ${matchedIng.unit} ke ${isBar ? 'Bar' : 'Gudang'}`,
            },
          });
        }

        processedItems.push({
          ingredientId: updatedIng.id,
          name: matchedIng.name,
          addedUnits,
          unit: matchedIng.unit,
          destination: isBar ? "BAR" : "WAREHOUSE",
          newStock,
          newAverageHpp,
        });
      } else {
        // Item belum ada di master bahan baku POS -> Butuh Mapping Manual
        if (purchaseModel) {
          await purchaseModel.create({
            data: {
              itemName: itemName,
              quantity: itemQty,
              unitPrice: itemPrice,
              totalPrice: itemPrice * itemQty,
              supplierName: merchantName || "Nota Toko",
              purchaseDate: date ? new Date(date) : new Date(),
              notes: `[PERLU MAPPING] Item nota belum terhubung ke master bahan baku POS (Nota ID: ${receiptId})`,
            },
          });
        }

        unmatchedItems.push({
          receiptId,
          merchantName,
          itemName,
          price: itemPrice,
          quantity: itemQty,
          category: item.category || "Lain-lain",
          date: date || new Date().toISOString().split("T")[0],
          imageUrl: imageUrl || null,
        });
      }
    }

    // Jika ada item yang belum di-mapping, simpan ke antrean notifikasi mapping POS
    if (unmatchedItems.length > 0) {
      try {
        const setModel = anyDb.systemSetting || anyDb.SystemSetting;
        if (setModel) {
          const currentQueueSetting = await setModel.findUnique({
            where: { key: "pending_unmatched_receipt_items" },
          });

          let currentQueue: any[] = [];
          if (currentQueueSetting && currentQueueSetting.value) {
            try {
              currentQueue = JSON.parse(currentQueueSetting.value);
            } catch (e) {
              currentQueue = [];
            }
          }

          // Tambahkan item baru ke antrean tanpa duplikasi
          const mergedQueue = [...currentQueue, ...unmatchedItems];
          await setModel.upsert({
            where: { key: "pending_unmatched_receipt_items" },
            update: { value: JSON.stringify(mergedQueue), updatedAt: new Date() },
            create: { key: "pending_unmatched_receipt_items", value: JSON.stringify(mergedQueue) },
          });
        }
      } catch (qErr) {
        console.warn("Could not save pending_unmatched_receipt_items queue:", qErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil memproses ${processedItems.length} item stok. ${unmatchedItems.length > 0 ? `${unmatchedItems.length} item memerlukan mapping manual.` : ''}`,
      processedItems,
      unmatchedItems,
      receiptId,
    });
  } catch (error: any) {
    console.error("[POS Webhook Ingest Error]:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memproses sinkronisasi nota ke stok POS" },
      { status: 500 }
    );
  }
}
