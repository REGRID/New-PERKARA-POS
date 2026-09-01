import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getOrSeedCategories } from "@/lib/categories";
import { recordLearnedMemory } from "@/lib/selfLearningEngine";
import { compressBase64Image } from "@/lib/imageCompressor";
import { prisma as db } from "@/lib/prisma";
import { generateItemSku, detectUnitsFromItemName } from "@/lib/utils";
import { requireRole } from "@/lib/authHelper";

export const dynamic = "force-dynamic";

let listCache: { key: string; data: any; timestamp: number } | null = null;
const LIST_CACHE_TTL = 3000; // 3 seconds cache

export function invalidateReceiptsListCache() {
  listCache = null;
}

const RECEIPT_LIST_SELECT = `
  id,
  merchantName,
  date,
  subtotal,
  taxAmount,
  totalAmount,
  paymentMethod,
  paymentStatus,
  note,
  imageUrl,
  createdAt,
  updatedAt,
  items:receipt_items(id, name, category, subCategory, price, quantity)
`;

export async function GET(req: NextRequest) {
  try {
    const { errorResponse } = await requireRole(req, ["admin", "karyawan"]);
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const limit = searchParams.has("limit") || searchParams.has("take")
      ? Math.min(Math.max(Number(searchParams.get("limit") || searchParams.get("take")), 1), 1000)
      : undefined;

    const cacheKey = `${search}_${category}_${limit || "all"}`;
    const now = Date.now();

    if (listCache && listCache.key === cacheKey && now - listCache.timestamp < LIST_CACHE_TTL) {
      const cachedResponse = NextResponse.json(listCache.data);
      cachedResponse.headers.set("Cache-Control", "public, s-maxage=5, stale-while-revalidate=30");
      return cachedResponse;
    }

    const rootKeyword = category ? category.split("/")[0].trim() : "";
    let receipts: any[] = [];
    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from("receipts")
          .select(RECEIPT_LIST_SELECT)
          .order("createdAt", { ascending: false });

        if (limit) {
          query = query.limit(limit);
        }

        const { data: rawReceipts, error } = await query;
        if (!error && rawReceipts) {
          receipts = rawReceipts;
        } else if (error) {
          console.warn("GET Receipts Supabase warning (falling back to local Prisma):", error.message);
        }
      } catch (supaErr) {
        console.warn("Supabase fetch caught error:", supaErr);
      }
    }

    // Local Prisma DB fallback if Supabase is unavailable or returned empty
    if (receipts.length === 0) {
      try {
        const localReceipts = await db.receipt.findMany({
          take: limit || 100,
          orderBy: { createdAt: "desc" },
          include: { items: true },
        });

        if (localReceipts && localReceipts.length > 0) {
          receipts = localReceipts.map((r: any) => ({
            id: r.id,
            merchantName: r.vendorName || "Merchant",
            date: r.receiptDate ? new Date(r.receiptDate).toISOString() : new Date().toISOString(),
            subtotal: r.totalAmount || 0,
            taxAmount: 0,
            totalAmount: r.totalAmount || 0,
            paymentMethod: "CASH",
            paymentStatus: r.status || "Lunas",
            note: null,
            imageUrl: r.imageUrl,
            createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
            updatedAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
            items: (r.items || []).map((it: any) => ({
              id: it.id,
              name: it.itemName,
              category: "Bahan Baku",
              subCategory: null,
              price: it.unitPrice || it.totalPrice || 0,
              quantity: it.quantity || 1,
            })),
          }));
        }
      } catch (dbErr) {
        console.warn("Prisma receipts fallback query error:", dbErr);
      }
    }

    // In-memory filter for complex relational search/category criteria
    if (search || category) {
      const searchLower = search.toLowerCase().trim();
      const categoryLower = category.toLowerCase().trim();
      const rootLower = rootKeyword.toLowerCase().trim();

      receipts = receipts.filter((r: any) => {
        const matchesSearch = !searchLower || (
          (r.merchantName || "").toLowerCase().includes(searchLower) ||
          (r.note || "").toLowerCase().includes(searchLower) ||
          (r.paymentMethod || "").toLowerCase().includes(searchLower) ||
          (r.items || []).some((i: any) =>
            (i.name || "").toLowerCase().includes(searchLower) ||
            (i.category || "").toLowerCase().includes(searchLower) ||
            (i.subCategory || "").toLowerCase().includes(searchLower)
          )
        );

        const matchesCategory = !categoryLower || (
          (r.items || []).some((i: any) => {
            const itemCat = (i.category || "").toLowerCase();
            const itemSub = (i.subCategory || "").toLowerCase();
            return (
              itemCat.includes(categoryLower) ||
              itemSub.includes(categoryLower) ||
              (rootLower && itemCat.includes(rootLower))
            );
          })
        );

        return matchesSearch && matchesCategory;
      });
    }

    // Fetch cached Custom Categories to map legacy category names
    const categoryHierarchy = await getOrSeedCategories();
    const parentNames: string[] = categoryHierarchy.map((c) => c.name);

    const normalizedReceipts = receipts.map((r: any) => {
      const isPersonal =
        r.paymentMethod === "Dana Pribadi Owner" || r.paymentMethod === "Talangan Karyawan";
      const cleanedNote =
        !isPersonal && r.note
          ? r.note.replace(/\[Dibayar oleh: [^\]]+\]\s*/g, "").trim() || null
          : r.note;

      return {
        ...r,
        note: cleanedNote,
        items: (r.items || []).map((item: any) => {
          const itemCat = item.category || "Lain-lain";
          const itemRoot = itemCat.split("/")[0].trim().toLowerCase();

          const matchedParent = parentNames.find((p) => {
            const pRoot = p.split("/")[0].trim().toLowerCase();
            return pRoot === itemRoot || p.toLowerCase() === itemCat.toLowerCase();
          });

          return {
            ...item,
            category: matchedParent || itemCat.split("/")[0].trim(),
          };
        }),
      };
    });

    listCache = { key: cacheKey, data: normalizedReceipts, timestamp: now };

    const response = NextResponse.json(normalizedReceipts);
    response.headers.set("Cache-Control", "public, s-maxage=5, stale-while-revalidate=30");
    return response;
  } catch (error: any) {
    console.error("GET Receipts Error:", error);
    return NextResponse.json({ error: "Gagal mengambil data nota" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { errorResponse } = await requireRole(req, ["admin", "karyawan"]);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { merchantName, date, imageUrl, subtotal, taxAmount, totalAmount, paymentMethod, paymentStatus, note, items, userRole } = body;

    if (!date) {
      return NextResponse.json({ error: "Tanggal nota wajib diisi" }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Nota harus memiliki minimal 1 item produk" }, { status: 400 });
    }

    invalidateReceiptsListCache();

    const isPersonal =
      paymentMethod === "Dana Pribadi Owner" || paymentMethod === "Talangan Karyawan";
    const cleanedNote = note
      ? isPersonal
        ? note
        : note.replace(/\[Dibayar oleh: [^\]]+\]\s*/g, "").trim() || null
      : null;

    const compressedImageUrl = await compressBase64Image(imageUrl);
    const nowIso = new Date().toISOString();
    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

    let fullReceipt: any = null;

    if (isSupabaseConfigured) {
      try {
        const { data: newReceipt, error: receiptErr } = await supabase
          .from("receipts")
          .insert({
            merchantName: merchantName || "Nota / Toko",
            date: date,
            imageUrl: compressedImageUrl || null,
            subtotal: Number(subtotal) || 0,
            taxAmount: Number(taxAmount) || 0,
            totalAmount: Number(totalAmount) || 0,
            paymentMethod: paymentMethod || "Cash",
            paymentStatus: paymentStatus || "Lunas",
            note: cleanedNote,
            createdAt: nowIso,
            updatedAt: nowIso,
          })
          .select("id, merchantName, date, subtotal, taxAmount, totalAmount, paymentMethod, paymentStatus, note, createdAt, updatedAt")
          .single();

        if (newReceipt) {
          const itemsToCreate = items.map((it: any) => ({
            receiptId: newReceipt.id,
            name: it.name || "Item",
            category: it.category ? it.category.split("/")[0].trim() : "Lain-lain",
            subCategory: it.subCategory || "Umum",
            price: Number(it.price) || 0,
            quantity: Number(it.quantity) || 1,
            sku: it.sku || generateItemSku(it.name || "Item", it.category),
          }));

          const { data: createdItems } = await supabase
            .from("receipt_items")
            .insert(itemsToCreate)
            .select("*");

          fullReceipt = {
            ...newReceipt,
            items: createdItems || itemsToCreate,
          };
        }
      } catch (supaErr) {
        console.warn("Supabase POST error, falling back to local DB:", supaErr);
      }
    }

    // Local DB fallback for receipt persistence
    if (!fullReceipt) {
      try {
        const savedReceipt = await db.receipt.create({
          data: {
            imageUrl: compressedImageUrl || "",
            vendorName: merchantName || "Nota / Toko",
            receiptDate: new Date(date),
            totalAmount: Number(totalAmount) || 0,
            status: paymentStatus || "VERIFIED",
            items: {
              create: items.map((it: any) => ({
                itemName: it.name || "Item",
                quantity: Number(it.quantity) || 1,
                unitPrice: Number(it.price) || 0,
                totalPrice: (Number(it.price) || 0) * (Number(it.quantity) || 1),
                isStockItem: (it.category || "").toLowerCase().includes("bahan") || (it.category || "").toLowerCase().includes("stok"),
              })),
            },
          },
          include: { items: true },
        });

        fullReceipt = {
          id: savedReceipt.id,
          merchantName: savedReceipt.vendorName,
          date: savedReceipt.receiptDate.toISOString(),
          subtotal: Number(subtotal) || 0,
          taxAmount: Number(taxAmount) || 0,
          totalAmount: savedReceipt.totalAmount,
          paymentMethod: paymentMethod || "Cash",
          paymentStatus: savedReceipt.status,
          note: cleanedNote,
          createdAt: savedReceipt.createdAt.toISOString(),
          updatedAt: savedReceipt.createdAt.toISOString(),
          items: (savedReceipt.items || []).map((it: any) => ({
            id: it.id,
            name: it.itemName,
            category: it.isStockItem ? "Bahan Baku" : "Operasional",
            price: it.unitPrice,
            quantity: it.quantity,
          })),
        };
      } catch (dbErr) {
        console.warn("Local DB create receipt error:", dbErr);
        fullReceipt = {
          id: `rec_${Date.now()}`,
          merchantName: merchantName || "Nota / Toko",
          date: date,
          subtotal: Number(subtotal) || 0,
          taxAmount: Number(taxAmount) || 0,
          totalAmount: Number(totalAmount) || 0,
          paymentMethod: paymentMethod || "Cash",
          paymentStatus: paymentStatus || "Lunas",
          note: cleanedNote,
          createdAt: nowIso,
          updatedAt: nowIso,
          items: items,
        };
      }
    }

    // 1. Continuous Self-Learning Engine: Record verified user input
    void recordLearnedMemory(merchantName, items).catch((err) =>
      console.warn("Background self-learning error:", err)
    );

    // 2. Dual-Sync: Sync to Local MySQL POS/ERP if available
    try {
      const anyDb = db as any;
      if (anyDb) {
        for (const it of items) {
          try {
            const cat = (it.category || "").toLowerCase();
            const itemName = it.name || "Barang Nota";
            const itemPrice = Number(it.price) || 0;
            const itemQty = Number(it.quantity) || 1;
            const totalItemCost = itemPrice * itemQty;
            const itemSku = it.sku || generateItemSku(itemName, it.category);

            // 1. Record EVERY item to Purchases table
            const purchaseModel = anyDb.purchase || anyDb.Purchase;
            if (purchaseModel) {
              await purchaseModel.create({
                data: {
                  itemName: `[${itemSku}] ${itemName}`,
                  quantity: itemQty,
                  unitPrice: itemPrice,
                  totalPrice: totalItemCost,
                  supplierName: merchantName || "Nota Pembelian",
                  purchaseDate: new Date(date),
                  notes: `Auto-sync dari AI Nota (${fullReceipt.id}) SKU: ${itemSku} | Kategori: ${it.category || "Lain-lain"}`,
                },
              });
            }

            if (cat.includes("bahan baku") || cat.includes("stok")) {
              // 2. Sync to Ingredient Master & Stock
              const ingredientModel = anyDb.ingredient || anyDb.Ingredient;
              const stockMovementModel = anyDb.stockMovement || anyDb.StockMovement;

              if (ingredientModel) {
                const matchedIng = await ingredientModel.findFirst({
                  where: {
                    OR: [
                      { sku: itemSku },
                      { name: { equals: itemName } },
                      { name: { contains: itemName } }
                    ]
                  },
                });

                if (matchedIng) {
                  // Update existing ingredient stock & HPP with safety guards
                  const conversion = (matchedIng.conversionRatio && matchedIng.conversionRatio > 0) ? matchedIng.conversionRatio : 1;
                  const addedStockUnits = itemQty * conversion;
                  const newFloorQty = Number(matchedIng.floorQuantity || 0) + addedStockUnits;
                  const newCostPerUnit = itemPrice > 0 ? (itemPrice / conversion) : (matchedIng.costPerUseUnit || 0);

                  const updatedIng = await ingredientModel.update({
                    where: { id: matchedIng.id },
                    data: {
                      sku: matchedIng.sku || itemSku,
                      floorQuantity: newFloorQty,
                      hargaBeli: itemPrice > 0 ? itemPrice : undefined,
                      costPerUseUnit: newCostPerUnit > 0 ? newCostPerUnit : undefined,
                    },
                  });

                  // Record Stock Movement log
                  if (stockMovementModel) {
                    await stockMovementModel.create({
                      data: {
                        ingredientId: updatedIng.id,
                        type: "PURCHASE",
                        quantity: addedStockUnits,
                        balanceAfter: newFloorQty,
                        fromSource: merchantName || "Nota Toko",
                        referenceId: fullReceipt.id,
                        note: `Auto-sync AI Nota [SKU: ${itemSku}]: ${merchantName || "Pembelian Toko"}`,
                      },
                    });
                  }
                } else {
                  // Auto-detect unit & conversion ratio
                  const unitInfo = detectUnitsFromItemName(itemName);
                  const safeConversion = (unitInfo.conversionRatio && unitInfo.conversionRatio > 0) ? unitInfo.conversionRatio : 1;
                  const totalUseStock = itemQty * safeConversion;
                  const costPerUse = itemPrice > 0 ? (itemPrice / safeConversion) : itemPrice;

                  // Auto-create new Ingredient in POS with SKU
                  const newIng = await ingredientModel.create({
                    data: {
                      sku: itemSku,
                      name: itemName,
                      category: "Bahan Baku",
                      buyUnit: unitInfo.buyUnit,
                      unit: unitInfo.unit,
                      conversionRatio: safeConversion,
                      floorQuantity: totalUseStock,
                      warehouseQuantity: 0,
                      hargaBeli: itemPrice,
                      costPerUseUnit: costPerUse,
                      minStockAlert: 5,
                    },
                  });

                  // Record initial Stock Movement log
                  if (stockMovementModel) {
                    await stockMovementModel.create({
                      data: {
                        ingredientId: newIng.id,
                        type: "PURCHASE",
                        quantity: totalUseStock,
                        balanceAfter: totalUseStock,
                        fromSource: merchantName || "Nota Toko",
                        referenceId: fullReceipt.id,
                        note: `Stok awal auto-create AI Nota [SKU: ${itemSku}]: ${merchantName || "Pembelian Toko"}`,
                      },
                    });
                  }
                }
              }
            } else {
              // Record to OPEX / Expenses
              const expenseModel = anyDb.opexRecord || anyDb.OpexRecord || anyDb.expense || anyDb.Expense;
              if (expenseModel) {
                await expenseModel.create({
                  data: {
                    category: it.category || "Operasional",
                    amount: totalItemCost,
                    expenseDate: new Date(date),
                    notes: `[Nota: ${merchantName}] [SKU: ${itemSku}] ${itemName} (${itemQty}x @ Rp ${itemPrice.toLocaleString("id-ID")})`,
                  },
                });
              }
            }
          } catch (itemSyncErr) {
            console.warn(`Per-item sync warning for item '${it.name}':`, itemSyncErr);
          }
        }
      }
    } catch (syncErr) {
      console.warn("Local MySQL sync warning (non-fatal):", syncErr);
    }

    return NextResponse.json(fullReceipt, { status: 201 });
  } catch (error: any) {
    console.error("POST Receipt Error:", error);
    return NextResponse.json({ error: error.message || "Gagal menyimpan nota ke database" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { ids } = await req.json();
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ID nota yang akan dihapus tidak valid" }, { status: 400 });
    }

    invalidateReceiptsListCache();

    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");
    if (isSupabaseConfigured) {
      try {
        await supabase.from("receipts").delete().in("id", ids);
      } catch (e) {
        console.warn("Supabase delete warning:", e);
      }
    }

    try {
      await db.receipt.deleteMany({
        where: { id: { in: ids } },
      });
    } catch (e) {
      console.warn("Prisma delete receipt warning:", e);
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil menghapus ${ids.length} nota.`,
    });
  } catch (error: any) {
    console.error("Bulk DELETE Receipts Error:", error);
    return NextResponse.json({ error: "Gagal menghapus nota secara massal" }, { status: 500 });
  }
}
