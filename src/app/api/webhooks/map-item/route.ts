import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/lib/prisma";
import { requireRole } from "@/lib/authHelper";

export async function GET(req: NextRequest) {
  try {
    const { errorResponse } = await requireRole(req, ["admin", "karyawan"]);
    if (errorResponse) return errorResponse;

    const anyDb = db as any;
    if (!anyDb) {
      return NextResponse.json({ error: "Database not connected" }, { status: 500 });
    }

    const setModel = anyDb.systemSetting || anyDb.SystemSetting;
    let queue: any[] = [];
    if (setModel) {
      const setting = await setModel.findUnique({
        where: { key: "pending_unmatched_receipt_items" },
      });
      if (setting && setting.value) {
        try {
          queue = JSON.parse(setting.value);
        } catch (e) {
          queue = [];
        }
      }
    }

    return NextResponse.json({ success: true, count: queue.length, items: queue });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { errorResponse } = await requireRole(req, ["admin"]);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { action, itemIndex, itemData, ingredientId, newIngredientData, destination = "BAR" } = body;

    const anyDb = db as any;
    if (!anyDb) {
      return NextResponse.json({ error: "Database not connected" }, { status: 500 });
    }

    const setModel = anyDb.systemSetting || anyDb.SystemSetting;
    const ingredientModel = anyDb.ingredient || anyDb.Ingredient;
    const stockMovementModel = anyDb.stockMovement || anyDb.StockMovement;

    // 1. Ambil antrean saat ini
    let queue: any[] = [];
    if (setModel) {
      const setting = await setModel.findUnique({
        where: { key: "pending_unmatched_receipt_items" },
      });
      if (setting && setting.value) {
        try {
          queue = JSON.parse(setting.value);
        } catch (e) {
          queue = [];
        }
      }
    }

    const targetItem = itemData || (itemIndex !== undefined ? queue[itemIndex] : null);
    if (!targetItem) {
      return NextResponse.json({ error: "Item data tidak ditemukan" }, { status: 400 });
    }

    const itemPrice = Number(targetItem.price || 0);
    const itemQty = Number(targetItem.quantity || 1);
    const isBar = destination === "BAR";

    if (action === "MAP_TO_EXISTING" && ingredientId) {
      const matchedIng = await ingredientModel.findUnique({
        where: { id: ingredientId },
      });

      if (!matchedIng) {
        return NextResponse.json({ error: "Bahan baku tujuan tidak ditemukan" }, { status: 404 });
      }

      const conversion = matchedIng.conversionRatio && matchedIng.conversionRatio > 0 ? matchedIng.conversionRatio : 1;
      const addedUnits = itemQty * conversion;
      const currentStock = isBar ? Number(matchedIng.floorQuantity || 0) : Number(matchedIng.warehouseQuantity || 0);
      const newStock = currentStock + addedUnits;

      // Moving average HPP
      const currentUnitCost = Number(matchedIng.costPerUseUnit || 0);
      const totalNewUnits = currentStock + addedUnits;
      const newAvgHpp = totalNewUnits > 0
        ? ((currentStock * currentUnitCost) + (itemPrice * itemQty)) / totalNewUnits
        : itemPrice / conversion;

      const updateFields: any = {
        hargaBeli: itemPrice > 0 ? itemPrice : matchedIng.hargaBeli,
        costPerUseUnit: newAvgHpp > 0 ? newAvgHpp : matchedIng.costPerUseUnit,
        updatedAt: new Date(),
      };
      if (isBar) updateFields.floorQuantity = newStock;
      else updateFields.warehouseQuantity = newStock;

      await ingredientModel.update({
        where: { id: matchedIng.id },
        data: updateFields,
      });

      if (stockMovementModel) {
        await stockMovementModel.create({
          data: {
            ingredientId: matchedIng.id,
            type: "PURCHASE",
            quantity: addedUnits,
            balanceAfter: newStock,
            fromSource: targetItem.merchantName || "Manual Mapping Nota",
            toDestination: isBar ? "Stok Bar / Toko" : "Stok Gudang",
            referenceId: targetItem.receiptId || null,
            note: `Manual Mapping Nota (${targetItem.itemName}): +${addedUnits} ${matchedIng.unit}`,
          },
        });
      }
    } else if (action === "CREATE_NEW_INGREDIENT" && newIngredientData) {
      const {
        name,
        category = "Bahan Baku",
        buyUnit = "Kg",
        unit = "gram",
        conversionRatio = 1000,
        sku,
      } = newIngredientData;

      const conversion = Number(conversionRatio) > 0 ? Number(conversionRatio) : 1;
      const addedUnits = itemQty * conversion;
      const costPerUse = itemPrice > 0 ? itemPrice / conversion : 0;

      const newIng = await ingredientModel.create({
        data: {
          name: name || targetItem.itemName,
          category: category,
          buyUnit: buyUnit,
          unit: unit,
          conversionRatio: conversion,
          sku: sku || null,
          floorQuantity: isBar ? addedUnits : 0,
          warehouseQuantity: !isBar ? addedUnits : 0,
          hargaBeli: itemPrice,
          costPerUseUnit: costPerUse,
        },
      });

      if (stockMovementModel) {
        await stockMovementModel.create({
          data: {
            ingredientId: newIng.id,
            type: "PURCHASE",
            quantity: addedUnits,
            balanceAfter: addedUnits,
            fromSource: targetItem.merchantName || "Nota Baru",
            toDestination: isBar ? "Stok Bar / Toko" : "Stok Gudang",
            referenceId: targetItem.receiptId || null,
            note: `Bahan Baru dari Nota: +${addedUnits} ${unit}`,
          },
        });
      }
    }

    // Hapus item yang sudah di-mapping dari antrean
    const updatedQueue = queue.filter((it: any, idx: number) => {
      if (itemIndex !== undefined && idx === itemIndex) return false;
      if (targetItem.receiptId && targetItem.itemName) {
        return !(it.receiptId === targetItem.receiptId && it.itemName === targetItem.itemName);
      }
      return true;
    });

    if (setModel) {
      await setModel.upsert({
        where: { key: "pending_unmatched_receipt_items" },
        update: { value: JSON.stringify(updatedQueue), updatedAt: new Date() },
        create: { key: "pending_unmatched_receipt_items", value: JSON.stringify(updatedQueue) },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Item berhasil diproses dan disinkronkan ke stok POS",
      remainingCount: updatedQueue.length,
    });
  } catch (error: any) {
    console.error("Map Item Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
