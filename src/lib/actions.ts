import prisma from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

const db = prisma as any;

// =============================================================================
// 1. DASHBOARD DATA FETCHER
// =============================================================================
export async function getDashboardData() {
  try {
    const orderModel = db.order || db.Order;
    const orders = orderModel ? await orderModel.findMany({
      orderBy: { createdAt: "desc" },
    }) : [];

    const totalRevenue = orders.reduce((sum: number, o: any) => sum + (Number(o.totalAmount) || 0), 0);
    const totalOrdersCount = orders.length;

    const ingredients = await getIngredients();
    const purchases = await getPurchases();
    const expenses = await getExpenses();

    const criticalIngredients = ingredients.filter((ing: any) => {
      const currentStock = (Number(ing.floorQuantity) || 0) + (Number(ing.warehouseQuantity) || 0);
      const minAlert = Number(ing.minStockAlert) || 10;
      return currentStock <= minAlert;
    });

    const totalOpex = expenses.reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0);
    const totalPurchasesValue = purchases.reduce((sum: number, p: any) => sum + (Number(p.totalPrice) || 0), 0);

    const employeeModel = db.employee || db.Employee;
    const employees = employeeModel ? await employeeModel.findMany() : [];

    const shiftModel = db.shiftLog || db.shiftlog || db.ShiftLog;
    const activeShift = shiftModel ? await shiftModel.findFirst({
      where: { status: "OPEN" },
      orderBy: { startTime: "desc" },
    }) : null;

    const totalStockValue = ingredients.reduce((sum: number, ing: any) => {
      const totalQty = (Number(ing.floorQuantity) || 0) + (Number(ing.warehouseQuantity) || 0);
      const conversion = Number(ing.conversionRatio) || 1;
      const unitCost = Number(ing.costPerUseUnit) || (Number(ing.hargaBeli) > 0 ? Number(ing.hargaBeli) / conversion : 0);
      return sum + (totalQty * unitCost);
    }, 0);

    // Aggregate Payment Methods Breakdown (including split payments)
    const orderPaymentModel = db.orderPayment || db.OrderPayment;
    let paymentBreakdown: { [method: string]: number } = {
      CASH: 0,
      QRIS: 0,
      EDC_CARD: 0,
      TRANSFER: 0,
      OTHER: 0,
    };

    if (orderPaymentModel) {
      const allPayments = await orderPaymentModel.findMany().catch(() => []);
      if (allPayments && allPayments.length > 0) {
        for (const p of allPayments) {
          const m = (p.methodName || "CASH").toUpperCase();
          const amt = Number(p.amount) || 0;
          if (m.includes("CASH") || m.includes("TUNAI")) paymentBreakdown.CASH += amt;
          else if (m.includes("QRIS")) paymentBreakdown.QRIS += amt;
          else if (m.includes("EDC") || m.includes("CARD") || m.includes("DEBIT") || m.includes("KREDIT")) paymentBreakdown.EDC_CARD += amt;
          else if (m.includes("TRANSFER") || m.includes("BANK")) paymentBreakdown.TRANSFER += amt;
          else paymentBreakdown.OTHER += amt;
        }
      } else {
        for (const o of orders) {
          const m = (o.paymentMethod || "CASH").toUpperCase();
          const amt = Number(o.totalAmount) || 0;
          if (m.includes("CASH") || m.includes("TUNAI")) paymentBreakdown.CASH += amt;
          else if (m.includes("QRIS")) paymentBreakdown.QRIS += amt;
          else if (m.includes("EDC") || m.includes("CARD")) paymentBreakdown.EDC_CARD += amt;
          else paymentBreakdown.OTHER += amt;
        }
      }
    }

    const displayRevenue = totalRevenue;
    const displayOpex = totalOpex > 0 ? totalOpex : totalPurchasesValue;

    return {
      totalRevenue: displayRevenue,
      totalOrdersCount: totalOrdersCount,
      totalOpex: displayOpex,
      estimatedProfit: displayRevenue - displayOpex,
      totalStockValue: totalStockValue,
      totalPurchasesValue,
      ingredientsCount: ingredients.length,
      criticalIngredients,
      allIngredients: ingredients,
      recentPurchases: purchases.slice(0, 5),
      employees,
      paymentBreakdown,
      activeShift: activeShift || {
        employeeName: employees[0]?.name || "Budi Santoso",
        status: "OPEN",
        startCash: 500000,
        expectedCash: 2150000,
      },
      recentOrders: orders.slice(0, 5),
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return null;
  }
}

const DEFAULT_SEED_INGREDIENTS = [
  { id: "ing-1", sku: "RAW-KOPI-001", name: "Biji Kopi Espresso Blend", category: "Bahan Baku", buyUnit: "Kg", unit: "gram", conversionRatio: 1000, floorQuantity: 5000, warehouseQuantity: 10000, minStockAlert: 1000, hargaBeli: 180000, costPerUseUnit: 180 },
  { id: "ing-2", sku: "RAW-SUSU-002", name: "Susu UHT Full Cream 1L", category: "Bahan Baku", buyUnit: "Karton", unit: "ml", conversionRatio: 12000, floorQuantity: 24000, warehouseQuantity: 48000, minStockAlert: 5000, hargaBeli: 210000, costPerUseUnit: 17.5 },
  { id: "ing-3", sku: "RAW-SIRU-003", name: "Sirup Gula Aren Premium 1L", category: "Bahan Baku", buyUnit: "Botol", unit: "ml", conversionRatio: 1000, floorQuantity: 3000, warehouseQuantity: 6000, minStockAlert: 1000, hargaBeli: 65000, costPerUseUnit: 65 },
  { id: "ing-4", sku: "RAW-MATC-004", name: "Powder Matcha Uji Pure 500g", category: "Bahan Baku", buyUnit: "Pack", unit: "gram", conversionRatio: 500, floorQuantity: 1500, warehouseQuantity: 3000, minStockAlert: 300, hargaBeli: 145000, costPerUseUnit: 290 },
  { id: "ing-5", sku: "RAW-CUP1-005", name: "Cup Plastik PET 16oz + Lid", category: "Operasional & Perlengkapan", buyUnit: "Karton", unit: "pcs", conversionRatio: 1000, floorQuantity: 800, warehouseQuantity: 2000, minStockAlert: 200, hargaBeli: 350000, costPerUseUnit: 350 },
];

const DEFAULT_SEED_MENUS = [
  { id: "m1", sku: "SKU-KOPI-001", name: "Es Kopi Susu Gula Aren", category: "Kopi", price: 24000, baseHpp: 8500, margin: 15500, isActive: true },
  { id: "m2", sku: "SKU-KOPI-002", name: "Americano Iced", category: "Kopi", price: 18000, baseHpp: 4500, margin: 13500, isActive: true },
  { id: "m3", sku: "SKU-NKOP-003", name: "Matcha Latte Ice", category: "Non-Kopi", price: 26000, baseHpp: 9800, margin: 16200, isActive: true },
  { id: "m4", sku: "SKU-MAKN-004", name: "Croissant Coklat Premium", category: "Makanan", price: 22000, baseHpp: 9000, margin: 13000, isActive: true },
];

// =============================================================================
// 2. INGREDIENTS DATA FETCHER & ACTIONS (EXACT STORE / WAREHOUSE STOCKS)
// =============================================================================
export async function getIngredients() {
  try {
    const ingredientModel = db.ingredient || db.Ingredient;
    const setModel = db.systemSetting || db.SystemSetting;
    let ingredients: any[] = [];
    if (ingredientModel) {
      try {
        ingredients = await ingredientModel.findMany({
          orderBy: [
            { category: "asc" },
            { name: "asc" }
          ],
        });
      } catch {
        ingredients = [];
      }
    }

    let hasSeeded = null;
    if (setModel) {
      hasSeeded = await setModel.findUnique({ where: { key: "seeded_ingredients" } }).catch(() => null);
    }

    if (!hasSeeded && (!ingredients || ingredients.length === 0)) {
      if (ingredientModel) {
        for (const seed of DEFAULT_SEED_INGREDIENTS) {
          try {
            const { id, ...dataToInsert } = seed;
            await ingredientModel.create({ data: dataToInsert });
          } catch {}
        }
        if (setModel) {
          await setModel.upsert({
            where: { key: "seeded_ingredients" },
            update: { value: "true" },
            create: { key: "seeded_ingredients", value: "true" },
          }).catch(() => null);
        }
        try {
          ingredients = await ingredientModel.findMany({
            orderBy: [
              { category: "asc" },
              { name: "asc" }
            ],
          });
        } catch {
          ingredients = [];
        }
      }
    }

    return Array.isArray(ingredients) ? ingredients : [];
  } catch (err) {
    console.error("Error fetching ingredients:", err);
    return [];
  }
}

export async function updateIngredientStock(data: {
  id: string;
  floorQuantity?: number;
  warehouseQuantity?: number;
  employeeName?: string;
  note?: string;
}) {
  try {
    const ingredientModel = db.ingredient || db.Ingredient;
    const stockMovementModel = db.stockMovement || db.StockMovement;

    const prev = await ingredientModel.findUnique({ where: { id: data.id } }).catch(() => null);

    const updated = await ingredientModel.update({
      where: { id: data.id },
      data: {
        ...(data.floorQuantity !== undefined ? { floorQuantity: Number(data.floorQuantity) } : {}),
        ...(data.warehouseQuantity !== undefined ? { warehouseQuantity: Number(data.warehouseQuantity) } : {}),
      },
    });

    if (stockMovementModel && prev) {
      const deltaFloor = data.floorQuantity !== undefined ? Number(data.floorQuantity) - Number(prev.floorQuantity || 0) : 0;
      const deltaWh = data.warehouseQuantity !== undefined ? Number(data.warehouseQuantity) - Number(prev.warehouseQuantity || 0) : 0;
      const totalDelta = deltaFloor + deltaWh;

      if (totalDelta !== 0) {
        await stockMovementModel.create({
          data: {
            ingredientId: data.id,
            type: "OPNAME_ADJUSTMENT",
            quantity: totalDelta,
            balanceAfter: (Number(updated.floorQuantity) || 0) + (Number(updated.warehouseQuantity) || 0),
            employeeName: data.employeeName || "Staf Outlet",
            note: data.note || `Penyesuaian Opname Stok (${totalDelta > 0 ? "+" : ""}${totalDelta})`,
          },
        }).catch(() => null);
      }
    }

    return updated;
  } catch (error) {
    console.error("Error updating ingredient stock:", error);
    throw error;
  }
}

export async function createIngredient(data: {
  name: string;
  sku?: string;
  category?: string;
  buyUnit: string;
  unit: string;
  conversionRatio: number;
  floorQuantity: number;
  warehouseQuantity?: number;
  hasWarehouseStock?: boolean;
  minStockAlert?: number;
  hargaBeli?: number;
  costPerUseUnit?: number;
}) {
  try {
    const conversion = Number(data.conversionRatio) || 1;
    const costPerUseUnit = Number(data.costPerUseUnit) || (Number(data.hargaBeli) > 0 ? Number(data.hargaBeli) / conversion : 0);
    const ingredientModel = db.ingredient || db.Ingredient;

    return await ingredientModel.create({
      data: {
        name: data.name,
        sku: data.sku || `RAW-${Math.floor(Math.random() * 900) + 100}`,
        category: data.category || "Bahan Baku",
        buyUnit: data.buyUnit || "Kg",
        unit: data.unit || "gram",
        conversionRatio: conversion,
        floorQuantity: Number(data.floorQuantity) || 0,
        warehouseQuantity: Number(data.warehouseQuantity) || 0,
        hasWarehouseStock: Boolean(data.hasWarehouseStock ?? (Number(data.warehouseQuantity) > 0)),
        minStockAlert: Number(data.minStockAlert) || 10,
        hargaBeli: Number(data.hargaBeli) || 0,
        costPerUseUnit: Number(costPerUseUnit) || 0,
      },
    });
  } catch (error) {
    console.error("Error creating ingredient:", error);
    throw error;
  }
}

export async function updateIngredientDetail(data: {
  id: string;
  name?: string;
  category?: string;
  buyUnit?: string;
  unit?: string;
  conversionRatio?: number;
  hargaBeli?: number;
  minStockAlert?: number;
  costPerUseUnit?: number;
  floorQuantity?: number;
  warehouseQuantity?: number;
  hasWarehouseStock?: boolean;
}) {
  try {
    const conversion = data.conversionRatio !== undefined ? Number(data.conversionRatio) || 1 : undefined;
    const hargaBeli = data.hargaBeli !== undefined ? Number(data.hargaBeli) || 0 : undefined;
    const costPerUseUnit = data.costPerUseUnit !== undefined 
      ? Number(data.costPerUseUnit) 
      : (hargaBeli !== undefined && conversion ? hargaBeli / conversion : undefined);

    const ingredientModel = db.ingredient || db.Ingredient;

    return await ingredientModel.update({
      where: { id: data.id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.category !== undefined ? { category: data.category } : {}),
        ...(data.buyUnit !== undefined ? { buyUnit: data.buyUnit } : {}),
        ...(data.unit !== undefined ? { unit: data.unit } : {}),
        ...(conversion !== undefined ? { conversionRatio: conversion } : {}),
        ...(hargaBeli !== undefined ? { hargaBeli } : {}),
        ...(costPerUseUnit !== undefined ? { costPerUseUnit } : {}),
        ...(data.minStockAlert !== undefined ? { minStockAlert: Number(data.minStockAlert) } : {}),
        ...(data.floorQuantity !== undefined ? { floorQuantity: Number(data.floorQuantity) } : {}),
        ...(data.warehouseQuantity !== undefined ? { warehouseQuantity: Number(data.warehouseQuantity) } : {}),
        ...(data.hasWarehouseStock !== undefined ? { hasWarehouseStock: Boolean(data.hasWarehouseStock) } : {}),
      },
    });
  } catch (error) {
    console.error("Error updating ingredient detail:", error);
    throw error;
  }
}

export async function deleteIngredient(id: string) {
  try {
    const ingredientModel = db.ingredient || db.Ingredient;
    const setModel = db.systemSetting || db.SystemSetting;

    if (setModel) {
      await setModel.upsert({
        where: { key: "seeded_ingredients" },
        update: { value: "true" },
        create: { key: "seeded_ingredients", value: "true" },
      }).catch(() => null);
    }

    if (ingredientModel) {
      const existing = await ingredientModel.findUnique({ where: { id } }).catch(() => null);
      if (existing) {
        return await ingredientModel.delete({ where: { id } });
      }
    }
    return { success: true };
  } catch (error) {
    console.error("Error deleting ingredient:", error);
    throw error;
  }
}


// =============================================================================
import { seedOfficialPerkaraData } from "./seedPerkaraOfficial";

export { seedOfficialPerkaraData };

// =============================================================================
// 3. MENU & RECIPE SETTINGS (SETTING APA YANG ADA DI MENU)
// =============================================================================
export async function getMenusWithRecipes() {
  try {
    const menuModel = db.menu || db.Menu;
    const setModel = db.systemSetting || db.SystemSetting;
    let menus: any[] = [];

    let hasOfficialSeeded = null;
    if (setModel) {
      hasOfficialSeeded = await setModel.findUnique({ where: { key: "seeded_perkara_official_v2" } }).catch(() => null);
    }

    if (!hasOfficialSeeded) {
      await seedOfficialPerkaraData();
      if (setModel) {
        await setModel.upsert({
          where: { key: "seeded_perkara_official_v2" },
          update: { value: "true" },
          create: { key: "seeded_perkara_official_v2", value: "true" },
        }).catch(() => null);
      }
    }

    if (menuModel) {
      try {
        menus = await menuModel.findMany({
          include: {
            recipeItems: {
              include: {
                ingredient: true,
              },
            },
          },
          orderBy: { name: "asc" },
        });
      } catch {
        menus = [];
      }
    }

    return Array.isArray(menus) ? menus : [];
  } catch (err) {
    console.error("Error fetching menus:", err);
    return [];
  }
}

export async function saveMenuSettings(data: {
  id?: string;
  name: string;
  category: string;
  price: number;
  baseHpp?: number;
  sku?: string;
  margin?: number;
  isActive?: boolean;
  recipeIngredients: Array<{
    ingredientId: string;
    quantityUsed: number;
  }>;
}) {
  try {
    const menuModel = db.menu || db.Menu;
    const recipeModel = db.recipeItem || db.RecipeItem;

    let menuId = data.id;

    if (menuId) {
      // Update existing menu
      await menuModel.update({
        where: { id: menuId },
        data: {
          name: data.name,
          category: data.category,
          price: Number(data.price),
          baseHpp: data.baseHpp !== undefined ? Number(data.baseHpp) : undefined,
          sku: data.sku || undefined,
          margin: data.margin !== undefined ? Number(data.margin) : undefined,
          isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
        },
      });

      // Delete old recipes and recreate
      if (recipeModel) {
        await recipeModel.deleteMany({
          where: { menuId },
        });
      }
    } else {
      // Create new menu
      const newMenu = await menuModel.create({
        data: {
          name: data.name,
          category: data.category,
          price: Number(data.price),
          baseHpp: Number(data.baseHpp) || 0,
          sku: data.sku || null,
          margin: Number(data.margin) || 0,
          isActive: true,
        },
      });
      menuId = newMenu.id;
    }

    // Insert recipe items
    if (recipeModel && data.recipeIngredients && data.recipeIngredients.length > 0) {
      for (const item of data.recipeIngredients) {
        if (item.ingredientId && item.quantityUsed > 0) {
          await recipeModel.create({
            data: {
              menuId,
              ingredientId: item.ingredientId,
              quantityUsed: Number(item.quantityUsed),
            },
          });
        }
      }
    }

    return { success: true, menuId };
  } catch (error) {
    console.error("Error saving menu settings:", error);
    throw error;
  }
}

export async function deleteMenu(id: string) {
  try {
    const menuModel = db.menu || db.Menu;
    const recipeModel = db.recipeItem || db.RecipeItem;
    const setModel = db.systemSetting || db.SystemSetting;

    if (setModel) {
      await setModel.upsert({
        where: { key: "seeded_menus" },
        update: { value: "true" },
        create: { key: "seeded_menus", value: "true" },
      }).catch(() => null);
    }

    if (recipeModel) {
      await recipeModel.deleteMany({ where: { menuId: id } }).catch(() => null);
    }
    if (menuModel) {
      const existing = await menuModel.findUnique({ where: { id } }).catch(() => null);
      if (existing) {
        return await menuModel.delete({ where: { id } });
      }
    }
    return { success: true };
  } catch (error) {
    console.error("Error deleting menu:", error);
    throw error;
  }
}

export async function quickUpdateMenu(id: string, data: { price?: number; isActive?: boolean; category?: string; name?: string }) {
  try {
    const menuModel = db.menu || db.Menu;
    if (!menuModel) return { success: false };

    const updateData: any = {};
    if (data.price !== undefined) updateData.price = Number(data.price);
    if (data.isActive !== undefined) updateData.isActive = Boolean(data.isActive);
    if (data.category !== undefined) updateData.category = String(data.category);
    if (data.name !== undefined) updateData.name = String(data.name);

    const updated = await menuModel.update({
      where: { id },
      data: updateData,
    });
    return { success: true, menu: updated };
  } catch (error) {
    console.error("Error in quickUpdateMenu:", error);
    throw error;
  }
}

export async function bulkUpdateMenus(ids: string[], updates: { category?: string; isActive?: boolean; priceChangePercent?: number }) {
  try {
    const menuModel = db.menu || db.Menu;
    if (!menuModel || !ids || ids.length === 0) return { success: false, count: 0 };

    if (updates.category !== undefined) {
      await menuModel.updateMany({
        where: { id: { in: ids } },
        data: { category: updates.category },
      });
    }

    if (updates.isActive !== undefined) {
      await menuModel.updateMany({
        where: { id: { in: ids } },
        data: { isActive: Boolean(updates.isActive) },
      });
    }

    if (updates.priceChangePercent !== undefined && updates.priceChangePercent !== 0) {
      const items = await menuModel.findMany({ where: { id: { in: ids } } });
      for (const item of items) {
        const factor = 1 + (updates.priceChangePercent / 100);
        const newPrice = Math.round((item.price * factor) / 500) * 500;
        await menuModel.update({
          where: { id: item.id },
          data: { price: Math.max(0, newPrice) },
        });
      }
    }

    return { success: true, count: ids.length };
  } catch (error) {
    console.error("Error in bulkUpdateMenus:", error);
    throw error;
  }
}

export async function bulkDeleteMenus(ids: string[]) {
  try {
    const menuModel = db.menu || db.Menu;
    const recipeModel = db.recipeItem || db.RecipeItem;
    if (!ids || ids.length === 0) return { success: false };

    if (recipeModel) {
      await recipeModel.deleteMany({ where: { menuId: { in: ids } } }).catch(() => null);
    }
    if (menuModel) {
      await menuModel.deleteMany({ where: { id: { in: ids } } });
    }
    return { success: true, count: ids.length };
  } catch (error) {
    console.error("Error in bulkDeleteMenus:", error);
    throw error;
  }
}

// Add-ons Management
export async function getAddonCategories() {
  try {
    const catModel = db.addonCategory || db.AddonCategory;
    if (!catModel) return [];
    return await catModel.findMany({
      include: {
        items: {
          include: {
            recipes: {
              include: { ingredient: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });
  } catch (err) {
    console.error("Error fetching addon categories:", err);
    return [];
  }
}

export async function saveAddonCategory(data: { id?: string; name: string; isRequired?: boolean; allowMultiple?: boolean }) {
  try {
    const catModel = db.addonCategory || db.AddonCategory;
    if (data.id) {
      return await catModel.update({
        where: { id: data.id },
        data: {
          name: data.name,
          isRequired: Boolean(data.isRequired),
          allowMultiple: data.allowMultiple !== undefined ? Boolean(data.allowMultiple) : true,
        },
      });
    }
    return await catModel.create({
      data: {
        name: data.name,
        isRequired: Boolean(data.isRequired),
        allowMultiple: data.allowMultiple !== undefined ? Boolean(data.allowMultiple) : true,
      },
    });
  } catch (err) {
    console.error("Error saving addon category:", err);
    throw err;
  }
}

export async function deleteAddonCategory(id: string) {
  try {
    const catModel = db.addonCategory || db.AddonCategory;
    if (catModel) {
      const existing = await catModel.findUnique({ where: { id } }).catch(() => null);
      if (existing) {
        return await catModel.delete({ where: { id } });
      }
    }
    return { success: true };
  } catch (err) {
    console.error("Error deleting addon category:", err);
    throw err;
  }
}

export async function saveAddonItem(data: {
  id?: string;
  addonCategoryId: string;
  name: string;
  price: number;
  ingredientId?: string;
  quantityUsed?: number;
}) {
  try {
    const itemModel = db.addonItem || db.AddonItem;
    const recipeModel = db.addonRecipe || db.AddonRecipe;

    let itemId = data.id;
    if (itemId) {
      await itemModel.update({
        where: { id: itemId },
        data: {
          name: data.name,
          price: Number(data.price) || 0,
        },
      });
      if (recipeModel) {
        await recipeModel.deleteMany({ where: { addonItemId: itemId } });
      }
    } else {
      const newItem = await itemModel.create({
        data: {
          addonCategoryId: data.addonCategoryId,
          name: data.name,
          price: Number(data.price) || 0,
        },
      });
      itemId = newItem.id;
    }

    if (recipeModel && data.ingredientId && Number(data.quantityUsed) > 0) {
      await recipeModel.create({
        data: {
          addonItemId: itemId,
          ingredientId: data.ingredientId,
          quantityUsed: Number(data.quantityUsed),
        },
      });
    }

    return { success: true, itemId };
  } catch (err) {
    console.error("Error saving addon item:", err);
    throw err;
  }
}

export async function deleteAddonItem(id: string) {
  try {
    const itemModel = db.addonItem || db.AddonItem;
    if (itemModel) {
      const existing = await itemModel.findUnique({ where: { id } }).catch(() => null);
      if (existing) {
        return await itemModel.delete({ where: { id } });
      }
    }
    return { success: true };
  } catch (err) {
    console.error("Error deleting addon item:", err);
    throw err;
  }
}

const DEFAULT_SEED_EMPLOYEES = [
  { id: "emp-cheisa", name: "Cheisa", role: "BARISTA", pin: "5555", employmentType: "SHIFT", dailyRate: 35000, flatSalaryAmount: 0 },
  { id: "emp-galang", name: "Galang", role: "BARISTA", pin: "3333", employmentType: "SHIFT", dailyRate: 50000, flatSalaryAmount: 0 },
  { id: "emp-reza", name: "Reza", role: "BARISTA", pin: "1111", employmentType: "SHIFT", dailyRate: 50000, flatSalaryAmount: 0 },
  { id: "emp-ummu", name: "Ummu", role: "BARISTA", pin: "2222", employmentType: "SHIFT", dailyRate: 50000, flatSalaryAmount: 0 },
];

export async function getEmployees() {
  try {
    const empModel = db.employee || db.Employee;
    const setModel = db.systemSetting || db.SystemSetting;
    let employees: any[] = [];
    if (empModel) {
      try {
        employees = await empModel.findMany({ orderBy: { name: "asc" } });
      } catch {
        employees = [];
      }
    }

    let hasSeeded = null;
    if (setModel) {
      hasSeeded = await setModel.findUnique({ where: { key: "seeded_employees" } }).catch(() => null);
    }

    if (!hasSeeded && (!employees || employees.length === 0)) {
      if (empModel) {
        for (const seed of DEFAULT_SEED_EMPLOYEES) {
          try {
            const { id, ...dataToInsert } = seed;
            await empModel.create({ data: dataToInsert });
          } catch {}
        }
        if (setModel) {
          await setModel.upsert({
            where: { key: "seeded_employees" },
            update: { value: "true" },
            create: { key: "seeded_employees", value: "true" },
          }).catch(() => null);
        }
        try {
          employees = await empModel.findMany({ orderBy: { name: "asc" } });
        } catch {
          employees = [];
        }
      }
    }

    return Array.isArray(employees) ? employees : [];
  } catch (err) {
    console.error("Error fetching employees:", err);
    return [];
  }
}

// =============================================================================
// 5. POS CHECKOUT ACTION (AUTO DEDUCT REAL STOCKS & SAVE ORDER & SPLIT PAYMENTS)
// =============================================================================
export async function processOrderCheckout(orderData: {
  orderNumber: string;
  channel?: string;
  customerName?: string;
  tableNumber?: string;
  employeeName?: string;
  shiftLogId?: string;
  subtotal: number;
  discount?: number;
  totalAmount: number;
  cashPaid?: number;
  cashChange?: number;
  paymentMethod?: string;
  splitPayments?: Array<{ method: string; amount: number }>;
  items: Array<{
    menuId?: string;
    menuName: string;
    variantName?: string;
    price: number;
    quantity: number;
    subtotal: number;
  }>;
}) {
  try {
    const orderModel = db.order || db.Order;
    const ingredientModel = db.ingredient || db.Ingredient;
    const recipeModel = db.recipeItem || db.RecipeItem;
    const shiftModel = db.shiftLog || db.shiftlog || db.ShiftLog;

    // Find active shift if not provided
    let activeShiftId = orderData.shiftLogId;
    if (!activeShiftId && shiftModel) {
      try {
        const foundShift = await shiftModel.findFirst({
          where: { status: "OPEN" },
          orderBy: { startTime: "desc" },
        });
        if (foundShift) activeShiftId = foundShift.id;
      } catch {}
    }

    // Format paymentMethod string if split
    let finalPaymentMethod = orderData.paymentMethod || "CASH";
    if (orderData.splitPayments && orderData.splitPayments.length > 0) {
      const splitDesc = orderData.splitPayments
        .map((p) => `${p.method}: Rp ${Number(p.amount).toLocaleString("id-ID")}`)
        .join(" + ");
      finalPaymentMethod = `SPLIT (${splitDesc})`;
    }

    const order = await orderModel.create({
      data: {
        orderNumber: orderData.orderNumber,
        channel: orderData.channel || "DINE_IN",
        customerName: orderData.customerName || "Pelanggan Toko",
        tableNumber: orderData.tableNumber || undefined,
        employeeName: orderData.employeeName || "Kasir Outlet",
        shiftLogId: activeShiftId || undefined,
        subtotal: Number(orderData.subtotal) || 0,
        discount: Number(orderData.discount) || 0,
        totalAmount: Number(orderData.totalAmount) || 0,
        cashPaid: orderData.cashPaid ? Number(orderData.cashPaid) : undefined,
        cashChange: orderData.cashChange ? Number(orderData.cashChange) : undefined,
        paymentMethod: finalPaymentMethod,
        paymentStatus: "PAID",
        orderStatus: "COMPLETED",
        items: {
          create: orderData.items.map((item) => ({
            menuId: item.menuId,
            menuName: item.menuName,
            variantName: item.variantName || "Regular",
            price: Number(item.price) || 0,
            quantity: Number(item.quantity) || 1,
            subtotal: Number(item.subtotal) || 0,
          })),
        },
      },
    });

    // Save payments into OrderPayment model
    const orderPaymentModel = db.orderPayment || db.OrderPayment;
    if (orderPaymentModel) {
      if (orderData.splitPayments && orderData.splitPayments.length > 0) {
        for (const sp of orderData.splitPayments) {
          if (Number(sp.amount) > 0) {
            await orderPaymentModel.create({
              data: {
                orderId: order.id,
                methodName: sp.method || "CASH",
                amount: Number(sp.amount),
              },
            }).catch(() => null);
          }
        }
      } else {
        await orderPaymentModel.create({
          data: {
            orderId: order.id,
            methodName: orderData.paymentMethod || "CASH",
            amount: Number(orderData.totalAmount) || 0,
          },
        }).catch(() => null);
      }
    }

    // Auto-deduct stock if recipes exist & record StockMovement
    const stockMovementModel = db.stockMovement || db.StockMovement;
    if (recipeModel && ingredientModel) {
      for (const item of orderData.items) {
        if (item.menuId) {
          const recipes = await recipeModel.findMany({
            where: { menuId: item.menuId },
          });

          for (const rec of recipes) {
            const totalDeduct = (Number(rec.quantityUsed) || 1) * item.quantity;
            const updatedIng = await ingredientModel.update({
              where: { id: rec.ingredientId },
              data: {
                floorQuantity: {
                  decrement: totalDeduct,
                },
              },
            }).catch(() => null);

            if (stockMovementModel && updatedIng) {
              await stockMovementModel.create({
                data: {
                  ingredientId: rec.ingredientId,
                  type: "SALE",
                  quantity: -totalDeduct,
                  balanceAfter: Number(updatedIng.floorQuantity) || 0,
                  referenceId: order.orderNumber,
                  employeeName: orderData.employeeName || "Kasir Outlet",
                  note: `Penjualan POS #${order.orderNumber} (${item.menuName} x${item.quantity})`,
                },
              }).catch(() => null);
            }
          }
        }
      }
    }

    return { success: true, order };
  } catch (error) {
    console.error("Error processing order checkout:", error);
    throw error;
  }
}

// =============================================================================
// 6. AUTHENTICATION & PASSWORD HASHING (SECURE SCRYPT & MULTI-ROLE)
// =============================================================================

export function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(plain, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
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
  // Backward compatibility for legacy plaintext records
  return plain === stored;
}

export function resolveSessionRole(dbRole: string | null | undefined): "owner" | "admin" | "karyawan" {
  const r = (dbRole || "").toLowerCase();
  if (r === "owner") return "owner";
  if (r === "admin" || r === "manager" || r === "supervisor") return "admin";
  return "karyawan";
}

export async function authenticateUser(data: { username: string; password?: string }) {
  const inputId = (data.username || "").trim();
  const inputPass = (data.password || "").trim();

  if (!inputId) {
    return { success: false, error: "ID Pengguna wajib diisi." };
  }

  const envAdminId = (process.env.ADMIN_ID || "admin").trim();
  const envAdminPass = (process.env.ADMIN_PASSWORD || "").trim();

  const envKaryawanId = (process.env.KARYAWAN_ID || "karyawan").trim();
  const envKaryawanPass = (process.env.KARYAWAN_PASSWORD || "").trim();

  // 1. Akun Owner bootstrap dari .env
  if (
    envAdminPass &&
    inputId.toLowerCase() === envAdminId.toLowerCase() &&
    inputPass === envAdminPass
  ) {
    return {
      success: true,
      user: {
        id: "owner-1",
        name: "Owner",
        username: envAdminId,
        role: "owner" as const,
        outletName: "Outlet Utama",
      },
    };
  }

  // 2. Akun Generic Karyawan dari .env
  if (
    envKaryawanPass &&
    inputId.toLowerCase() === envKaryawanId.toLowerCase() &&
    inputPass === envKaryawanPass
  ) {
    return {
      success: true,
      user: {
        id: "emp-1",
        name: "Kasir Outlet (Karyawan)",
        username: envKaryawanId,
        role: "karyawan" as const,
        outletName: "Outlet Utama",
      },
    };
  }

  // 3. Database Employee Lookup
  try {
    const employeeModel = db.employee || db.Employee;
    if (employeeModel) {
      const emp = await employeeModel.findFirst({
        where: {
          OR: [
            { username: inputId },
            { id: inputId }
          ]
        }
      });

      if (emp) {
        if (emp.isActive === false) {
          return { success: false, error: "Akun ini telah dinonaktifkan. Hubungi Owner/Admin." };
        }

        const empPin = (emp.pin || "").trim();
        const empPass = (emp.password || "").trim();

        if (!empPin && !empPass) {
          return { success: false, error: "Akun belum memiliki PIN/Kata Sandi yang diatur. Silakan hubungi Administrator." };
        }

        const isPinMatch = empPin && inputPass === empPin;
        const isPassMatch = empPass && verifyPassword(inputPass, empPass);

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
        } else {
          return { success: false, error: "PIN atau Kata Sandi salah." };
        }
      }
    }
  } catch (err) {
    console.error("Error authenticating against DB employee table:", err);
  }

  // 4. Strict Failure
  return {
    success: false,
    error: "ID Pengguna atau Kata Sandi tidak ditemukan.",
  };
}

// =============================================================================
// ACCOUNT MANAGEMENT & AUDIT LOGS (FOR OWNER & ADMIN)
// =============================================================================

const ASSIGNABLE_ROLES = ["owner", "admin", "supervisor", "cashier"] as const;

export async function getAccounts() {
  const employeeModel = db.employee || db.Employee;
  if (!employeeModel) return [];
  const rows = await employeeModel.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    username: r.username,
    role: r.role,
    isActive: r.isActive !== false,
    hasPin: !!r.pin,
    createdAt: r.createdAt,
  }));
}

export async function createAccount(data: {
  name: string;
  username: string;
  password: string;
  pin?: string;
  role: string;
  createdBy?: string;
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
    data: {
      name,
      username,
      password: hashPassword(password),
      pin: pin || null,
      role,
      isActive: true,
    },
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
  const updated = await employeeModel.update({
    where: { id: data.id },
    data: { isActive: !!data.isActive },
  });

  await createAuditLogEntry({
    actorName: data.actorName || "Owner",
    action: data.isActive ? "ACTIVATE_ACCOUNT" : "DEACTIVATE_ACCOUNT",
    targetType: "Employee",
    targetId: data.id,
    details: `${data.isActive ? "Mengaktifkan" : "Menonaktifkan"} akun "${updated.name}"`,
  });

  return { success: true };
}

export async function createAuditLogEntry(data: {
  actorName: string;
  actorRole?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: string;
}) {
  try {
    const auditLogModel = db.auditLog || db.AuditLog;
    if (!auditLogModel) return;
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
  try {
    const auditLogModel = db.auditLog || db.AuditLog;
    if (!auditLogModel) return [];
    return await auditLogModel.findMany({ orderBy: { createdAt: "desc" }, take: 500 });
  } catch (err) {
    console.error("Error fetching AuditLogs:", err);
    return [];
  }
}

// =============================================================================
// 7. EXTENDED MODULE ACTIONS FOR 100% FEATURE PARITY
// =============================================================================

// Categories
const DEFAULT_SEED_CATEGORIES = [
  { name: "Kopi" },
  { name: "Non-Kopi" },
  { name: "Makanan" },
  { name: "Bahan Baku" },
  { name: "Kemasan" },
  { name: "Operasional" },
];

export async function getCategories() {
  try {
    const catModel = db.category || db.Category;
    const setModel = db.systemSetting || db.SystemSetting;
    let categories: any[] = [];
    if (catModel) {
      try {
        categories = await catModel.findMany({ orderBy: { name: "asc" } });
      } catch {
        categories = [];
      }
    }

    let hasSeeded = null;
    if (setModel) {
      hasSeeded = await setModel.findUnique({ where: { key: "seeded_categories" } }).catch(() => null);
    }

    if (!hasSeeded && (!categories || categories.length === 0)) {
      if (catModel) {
        for (const seed of DEFAULT_SEED_CATEGORIES) {
          try {
            await catModel.create({ data: seed });
          } catch {}
        }
        if (setModel) {
          await setModel.upsert({
            where: { key: "seeded_categories" },
            update: { value: "true" },
            create: { key: "seeded_categories", value: "true" },
          }).catch(() => null);
        }
        try {
          categories = await catModel.findMany({ orderBy: { name: "asc" } });
        } catch {
          categories = [];
        }
      }
    }

    return Array.isArray(categories) ? categories : [];
  } catch (err) {
    console.error("Error fetching categories:", err);
    return [];
  }
}

export async function saveCategory(data: { id?: string; name: string }) {
  try {
    const catModel = db.category || db.Category;
    if (data.id) {
      const existing = await catModel.findUnique({ where: { id: data.id } }).catch(() => null);
      if (existing) {
        return await catModel.update({ where: { id: data.id }, data: { name: data.name } });
      }
    }
    return await catModel.create({ data: { ...(data.id ? { id: data.id } : {}), name: data.name } });
  } catch (err) {
    console.error("Error saving category:", err);
    throw err;
  }
}

export async function deleteCategory(id: string) {
  try {
    const catModel = db.category || db.Category;
    const setModel = db.systemSetting || db.SystemSetting;

    if (setModel) {
      await setModel.upsert({
        where: { key: "seeded_categories" },
        update: { value: "true" },
        create: { key: "seeded_categories", value: "true" },
      }).catch(() => null);
    }

    if (catModel) {
      const existing = await catModel.findUnique({ where: { id } }).catch(() => null);
      if (existing) {
        return await catModel.delete({ where: { id } });
      }
    }
    return { success: true };
  } catch (err) {
    console.error("Error deleting category:", err);
    throw err;
  }
}

const DEFAULT_SEED_PURCHASES = [
  { id: "pur-1", itemName: "[RAW-KOPI-001] Biji Kopi Espresso Blend 1kg", quantity: 5, unitPrice: 180000, totalPrice: 900000, supplierName: "Kopi Nusantara Supplier", purchaseDate: new Date("2026-08-25"), notes: "Stok Masuk Awal (Supplier Kopi)", isFromScan: false },
  { id: "pur-2", itemName: "[RAW-SUSU-002] Susu UHT Full Cream 1L (Karton/12)", quantity: 2, unitPrice: 210000, totalPrice: 420000, supplierName: "Distributor Susu Diamond", purchaseDate: new Date("2026-08-26"), notes: "Stok Masuk Awal (Distributor)", isFromScan: false },
  { id: "pur-3", itemName: "[RAW-SIRU-003] Sirup Gula Aren Premium 1L", quantity: 3, unitPrice: 65000, totalPrice: 195000, supplierName: "Toko Bahan Kue", purchaseDate: new Date("2026-08-26"), notes: "Auto-sync dari AI Nota (Toko Bahan Kue) | Kategori: Bahan Baku", isFromScan: true },
  { id: "pur-4", itemName: "[RAW-MATC-004] Powder Matcha Uji Pure 500g", quantity: 3, unitPrice: 145000, totalPrice: 435000, supplierName: "Matcha Import Store", purchaseDate: new Date("2026-08-27"), notes: "Auto-sync dari AI Nota (Matcha Import) | Kategori: Powder", isFromScan: true },
  { id: "pur-5", itemName: "[RAW-CUP1-005] Cup Plastik PET 16oz + Lid (1000 pcs)", quantity: 1, unitPrice: 350000, totalPrice: 350000, supplierName: "Kemasan Jaya Grosir", purchaseDate: new Date("2026-08-27"), notes: "Stok Masuk (Kemasan & Cup)", isFromScan: false },
];

// Purchases (Stok Masuk & Integration dari AI Nota)
export async function getPurchases() {
  try {
    const purModel = db.purchase || db.Purchase;
    const setModel = db.systemSetting || db.SystemSetting;
    let localPurchases: any[] = [];
    if (purModel) {
      try {
        localPurchases = await purModel.findMany({ orderBy: { purchaseDate: "desc" } });
      } catch {
        localPurchases = [];
      }
    }

    // Fetch receipts from Supabase & map items to Purchases format
    let supabasePurchases: any[] = [];
    try {
      const { data: receipts } = await supabase
        .from("receipts")
        .select("id, merchantName, date, paymentMethod, items:receipt_items(id, name, category, subCategory, price, quantity, sku)")
        .order("createdAt", { ascending: false });

      if (receipts && receipts.length > 0) {
        supabasePurchases = receipts.flatMap((r: any) =>
          (r.items || []).map((it: any) => ({
            id: `sp-${r.id}-${it.id || it.name}`,
            receiptId: r.id,
            itemName: it.sku ? `[${it.sku}] ${it.name}` : it.name,
            quantity: Number(it.quantity) || 1,
            unitPrice: Number(it.price) || 0,
            totalPrice: (Number(it.price) || 0) * (Number(it.quantity) || 1),
            supplierName: r.merchantName || "Nota Toko",
            purchaseDate: r.date ? new Date(r.date) : new Date(),
            notes: `Auto-sync dari AI Nota (${r.merchantName || "Scan Nota"}) | Kategori: ${it.category || "Umum"}`,
            isFromScan: true,
          }))
        );
      }
    } catch {
      supabasePurchases = [];
    }

    // Combine local & Supabase purchases seamlessly, avoiding exact duplicates
    const combined = [...localPurchases];
    const existingKeys = new Set(localPurchases.map((p) => `${p.itemName}_${p.supplierName}_${p.totalPrice}`));

    for (const sp of supabasePurchases) {
      const key = `${sp.itemName}_${sp.supplierName}_${sp.totalPrice}`;
      if (!existingKeys.has(key)) {
        combined.push(sp);
        existingKeys.add(key);
      }
    }

    let hasSeeded = null;
    if (setModel) {
      hasSeeded = await setModel.findUnique({ where: { key: "seeded_purchases" } }).catch(() => null);
    }

    // Auto-seed into DB if never seeded and empty
    if (!hasSeeded && (!combined || combined.length === 0)) {
      if (purModel) {
        for (const seed of DEFAULT_SEED_PURCHASES) {
          try {
            const { id, isFromScan, ...dataToInsert } = seed;
            await purModel.create({ data: dataToInsert });
          } catch {}
        }
        if (setModel) {
          await setModel.upsert({
            where: { key: "seeded_purchases" },
            update: { value: "true" },
            create: { key: "seeded_purchases", value: "true" },
          }).catch(() => null);
        }
        try {
          const seededLocal = await purModel.findMany({ orderBy: { purchaseDate: "desc" } });
          if (seededLocal && seededLocal.length > 0) {
            return seededLocal;
          }
        } catch {}
      }
    }

    // Sort by purchaseDate descending
    combined.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());

    return combined || [];
  } catch (err) {
    console.error("Error fetching purchases:", err);
    return [];
  }
}

export async function savePurchase(data: {
  id?: string;
  ingredientId?: string;
  vendorId?: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  supplierName?: string;
  status?: "DRAFT" | "ORDERED" | "RECEIVED" | "CANCELLED" | string;
  paymentStatus?: "PAID" | "UNPAID" | "PARTIAL" | string;
  approvedBy?: string;
  recordCashOut?: boolean;
  notes?: string;
}) {
  try {
    const purModel = db.purchase || db.Purchase;
    const ingredientModel = db.ingredient || db.Ingredient;
    const cashTxModel = db.cashTransaction || db.cashtransaction || db.CashTransaction;
    const stockMovementModel = db.stockMovement || db.StockMovement;

    const qty = Number(data.quantity) || 1;
    const price = Number(data.unitPrice) || 0;
    const totalPrice = qty * price;
    const status = data.status || "RECEIVED";
    const paymentStatus = data.paymentStatus || "PAID";

    let purchaseRecord: any = null;

    if (data.id) {
      // Edit existing purchase
      purchaseRecord = await purModel.update({
        where: { id: data.id },
        data: {
          ingredientId: data.ingredientId || undefined,
          vendorId: data.vendorId || undefined,
          itemName: data.itemName,
          quantity: qty,
          unitPrice: price,
          totalPrice: totalPrice,
          supplierName: data.supplierName || "-",
          status,
          paymentStatus,
          approvedBy: data.approvedBy || undefined,
          notes: data.notes || "",
        },
      });
    } else {
      // 1. Create new Purchase record
      purchaseRecord = await purModel.create({
        data: {
          ingredientId: data.ingredientId || undefined,
          vendorId: data.vendorId || undefined,
          itemName: data.itemName,
          quantity: qty,
          unitPrice: price,
          totalPrice: totalPrice,
          supplierName: data.supplierName || "-",
          status,
          paymentStatus,
          approvedBy: data.approvedBy || undefined,
          notes: data.notes || "",
        },
      });
    }

    // 2. Auto-sync to Raw Materials Inventory (Ingredient) ONLY if status is RECEIVED
    if (status === "RECEIVED" && ingredientModel) {
      if (data.ingredientId) {
        // PRECISE ID-BASED SYNC
        const matched = await ingredientModel.findUnique({
          where: { id: data.ingredientId },
        }).catch(() => null);

        if (matched) {
          const conversion = Number(matched.conversionRatio) || 1;
          const addedFloorQty = qty * conversion;
          const newHargaBeli = price > 0 ? price : Number(matched.hargaBeli || 0);
          const newCostPerUseUnit = conversion > 0 ? newHargaBeli / conversion : 0;

          const updated = await ingredientModel.update({
            where: { id: matched.id },
            data: {
              floorQuantity: { increment: addedFloorQty },
              hargaBeli: newHargaBeli,
              costPerUseUnit: newCostPerUseUnit,
            },
          });

          if (stockMovementModel) {
            await stockMovementModel.create({
              data: {
                ingredientId: matched.id,
                type: "PURCHASE",
                quantity: addedFloorQty,
                balanceAfter: (Number(updated.floorQuantity) || 0) + (Number(updated.warehouseQuantity) || 0),
                referenceId: purchaseRecord.id,
                employeeName: data.approvedBy || "Sistem Pengadaan",
                note: `Pembelian: ${matched.name} (${qty} ${matched.buyUnit || matched.unit}) dari ${data.supplierName || "-"}`,
              },
            }).catch(() => null);
          }
        }
      } else {
        // Name-based fallback if no ingredientId specified
        const matched = await ingredientModel.findFirst({
          where: { name: { contains: data.itemName } },
        });

        let targetIngId = matched?.id;
        let balanceAfter = 0;

        if (matched) {
          const updated = await ingredientModel.update({
            where: { id: matched.id },
            data: {
              floorQuantity: { increment: qty },
              hargaBeli: price > 0 ? price : matched.hargaBeli,
            },
          });
          targetIngId = updated.id;
          balanceAfter = (Number(updated.floorQuantity) || 0) + (Number(updated.warehouseQuantity) || 0);
        } else {
          const created = await ingredientModel.create({
            data: {
              name: data.itemName,
              category: "Bahan Baku",
              buyUnit: "pcs",
              unit: "pcs",
              conversionRatio: 1,
              floorQuantity: qty,
              hargaBeli: price,
            },
          });
          targetIngId = created.id;
          balanceAfter = qty;
        }

        if (stockMovementModel && targetIngId) {
          await stockMovementModel.create({
            data: {
              ingredientId: targetIngId,
              type: "PURCHASE",
              quantity: qty,
              balanceAfter,
              referenceId: purchaseRecord.id,
              employeeName: data.approvedBy || "Sistem Pengadaan",
              note: `Pembelian Manual: ${data.itemName} (${qty} item) dari ${data.supplierName || "-"}`,
            },
          }).catch(() => null);
        }
      }
    }

    // 3. Auto-sync to Cash Flow (CashTransaction) if PAID & recordCashOut is true
    if (paymentStatus === "PAID" && data.recordCashOut !== false && cashTxModel && totalPrice > 0) {
      await cashTxModel.create({
        data: {
          type: "CASH_OUT",
          amount: totalPrice,
          note: `Pengadaan: ${data.itemName} (${qty} x Rp ${price.toLocaleString("id-ID")}) [${data.supplierName || 'Vendor'}]`,
          employeeName: data.approvedBy || "Sistem Pengadaan",
        },
      }).catch(() => null);
    }

    return purchaseRecord;
  } catch (err) {
    console.error("Error saving purchase:", err);
    throw err;
  }
}

export async function updatePurchaseStatus(data: {
  id: string;
  status: "DRAFT" | "ORDERED" | "RECEIVED" | "CANCELLED" | string;
  approvedBy?: string;
  recordCashOut?: boolean;
}) {
  try {
    const purModel = db.purchase || db.Purchase;
    const ingredientModel = db.ingredient || db.Ingredient;
    const cashTxModel = db.cashTransaction || db.cashtransaction || db.CashTransaction;
    const stockMovementModel = db.stockMovement || db.StockMovement;

    const existing = await purModel.findUnique({ where: { id: data.id } });
    if (!existing) throw new Error("Data pembelian tidak ditemukan");

    const prevStatus = existing.status;
    const newStatus = data.status;

    const updated = await purModel.update({
      where: { id: data.id },
      data: {
        status: newStatus,
        approvedBy: data.approvedBy || existing.approvedBy,
      },
    });

    // If changing to RECEIVED from non-RECEIVED, add stock
    if (newStatus === "RECEIVED" && prevStatus !== "RECEIVED" && ingredientModel) {
      const qty = Number(existing.quantity) || 1;
      const price = Number(existing.unitPrice) || 0;

      if (existing.ingredientId) {
        const matched = await ingredientModel.findUnique({
          where: { id: existing.ingredientId },
        }).catch(() => null);

        if (matched) {
          const conversion = Number(matched.conversionRatio) || 1;
          const addedFloorQty = qty * conversion;
          const newHargaBeli = price > 0 ? price : Number(matched.hargaBeli || 0);
          const newCostPerUseUnit = conversion > 0 ? newHargaBeli / conversion : 0;

          const updatedIng = await ingredientModel.update({
            where: { id: matched.id },
            data: {
              floorQuantity: { increment: addedFloorQty },
              hargaBeli: newHargaBeli,
              costPerUseUnit: newCostPerUseUnit,
            },
          });

          if (stockMovementModel) {
            await stockMovementModel.create({
              data: {
                ingredientId: matched.id,
                type: "PURCHASE",
                quantity: addedFloorQty,
                balanceAfter: (Number(updatedIng.floorQuantity) || 0) + (Number(updatedIng.warehouseQuantity) || 0),
                referenceId: existing.id,
                employeeName: data.approvedBy || "Supervisor Pengadaan",
                note: `Penerimaan Barang PO #${existing.id.substring(0, 8)}: ${matched.name} (+${addedFloorQty} ${matched.unit})`,
              },
            }).catch(() => null);
          }
        }
      }

      // Record cash out if paid and requested
      if (existing.paymentStatus === "PAID" && data.recordCashOut !== false && cashTxModel && Number(existing.totalPrice) > 0) {
        await cashTxModel.create({
          data: {
            type: "CASH_OUT",
            amount: Number(existing.totalPrice),
            note: `Penerimaan & Bayar PO: ${existing.itemName} (${qty} item)`,
            employeeName: data.approvedBy || "Supervisor Pengadaan",
          },
        }).catch(() => null);
      }
    }

    return updated;
  } catch (err) {
    console.error("Error updating purchase status:", err);
    throw err;
  }
}

export async function deletePurchase(id: string) {
  try {
    const purModel = db.purchase || db.Purchase;
    const setModel = db.systemSetting || db.SystemSetting;

    if (setModel) {
      await setModel.upsert({
        where: { key: "seeded_purchases" },
        update: { value: "true" },
        create: { key: "seeded_purchases", value: "true" },
      }).catch(() => null);
    }

    if (purModel) {
      const existing = await purModel.findUnique({ where: { id } }).catch(() => null);
      if (existing) {
        return await purModel.delete({ where: { id } });
      }
    }
    return { success: true };
  } catch (err) {
    console.error("Error deleting purchase:", err);
    throw err;
  }
}

// =============================================================================
// VENDOR CONTACTS (SUPPLIERS)
// =============================================================================

const DEFAULT_SEED_VENDORS = [
  { id: "ven-1", name: "Kopi Nusantara Supplier", phone: "081234567890", category: "Biji Kopi", messageTemplate: "Halo Kopi Nusantara, mau pesan Biji Kopi Espresso Blend untuk outlet Perkara POS." },
  { id: "ven-2", name: "Distributor Susu Diamond", phone: "081987654321", category: "Dairy & Susu", messageTemplate: "Halo Distributor Susu, mau order Susu UHT Full Cream 1L Karton." },
  { id: "ven-3", name: "Toko Bahan Kue Sejahtera", phone: "085712345678", category: "Sirup & Topping", messageTemplate: "Halo Toko Bahan Kue, mau order Sirup Gula Aren & Flavouring." },
  { id: "ven-4", name: "Kemasan Jaya Grosir", phone: "087812345678", category: "Kemasan & Cup", messageTemplate: "Halo Kemasan Jaya, mau order Cup Plastik 16oz + Sealer Roll." },
];

export async function getVendors() {
  try {
    const vendorModel = db.vendorContact || db.VendorContact;
    const purModel = db.purchase || db.Purchase;

    if (!vendorModel) return DEFAULT_SEED_VENDORS;

    let vendors = await vendorModel.findMany({ orderBy: { name: "asc" } }).catch(() => []);

    if (!vendors || vendors.length === 0) {
      for (const s of DEFAULT_SEED_VENDORS) {
        try {
          await vendorModel.create({ data: s });
        } catch {}
      }
      vendors = await vendorModel.findMany({ orderBy: { name: "asc" } }).catch(() => []);
    }

    // Augment with purchase statistics per vendor
    if (purModel) {
      const allPurchases = await purModel.findMany().catch(() => []);
      return vendors.map((v: any) => {
        const vPurchases = allPurchases.filter((p: any) => p.vendorId === v.id || p.supplierName === v.name);
        const totalSpent = vPurchases.reduce((sum: number, p: any) => sum + (Number(p.totalPrice) || 0), 0);
        const unpaidSpent = vPurchases.filter((p: any) => p.paymentStatus === "UNPAID").reduce((sum: number, p: any) => sum + (Number(p.totalPrice) || 0), 0);
        return {
          ...v,
          totalPurchasesCount: vPurchases.length,
          totalPurchasesAmount: totalSpent,
          unpaidAmount: unpaidSpent,
        };
      });
    }

    return vendors;
  } catch (err) {
    console.error("Error fetching vendors:", err);
    return DEFAULT_SEED_VENDORS;
  }
}

export async function saveVendor(data: {
  id?: string;
  name: string;
  phone?: string;
  category?: string;
  messageTemplate?: string;
}) {
  try {
    const vendorModel = db.vendorContact || db.VendorContact;
    if (!vendorModel) throw new Error("Vendor model not found");

    if (data.id) {
      return await vendorModel.update({
        where: { id: data.id },
        data: {
          name: data.name,
          phone: data.phone || undefined,
          category: data.category || undefined,
          messageTemplate: data.messageTemplate || undefined,
        },
      });
    } else {
      return await vendorModel.create({
        data: {
          name: data.name,
          phone: data.phone || undefined,
          category: data.category || "Supplier Umum",
          messageTemplate: data.messageTemplate || undefined,
        },
      });
    }
  } catch (err) {
    console.error("Error saving vendor:", err);
    throw err;
  }
}

export async function deleteVendor(id: string) {
  try {
    const vendorModel = db.vendorContact || db.VendorContact;
    if (!vendorModel) throw new Error("Vendor model not found");
    return await vendorModel.delete({ where: { id } });
  } catch (err) {
    console.error("Error deleting vendor:", err);
    throw err;
  }
}

// Discounts
export async function getDiscounts() {
  try {
    const discModel = db.discount || db.Discount;
    return discModel ? await discModel.findMany({ orderBy: { name: "asc" } }) : [];
  } catch (err) {
    console.error("Error fetching discounts:", err);
    return [];
  }
}

export async function saveDiscount(data: { id?: string; name: string; type?: string; amount: number; isActive?: boolean }) {
  try {
    const discModel = db.discount || db.Discount;
    if (data.id) {
      const existing = await discModel.findUnique({ where: { id: data.id } }).catch(() => null);
      if (existing) {
        return await discModel.update({
          where: { id: data.id },
          data: { 
            name: data.name, 
            type: data.type || "PERCENT", 
            amount: Number(data.amount),
            ...(data.isActive !== undefined ? { isActive: Boolean(data.isActive) } : {})
          },
        });
      }
    }
    return await discModel.create({
      data: { 
        ...(data.id ? { id: data.id } : {}),
        name: data.name, 
        type: data.type || "PERCENT", 
        amount: Number(data.amount),
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true
      },
    });
  } catch (err) {
    console.error("Error saving discount:", err);
    throw err;
  }
}

export async function deleteDiscount(id: string) {
  try {
    const discModel = db.discount || db.Discount;
    if (discModel) {
      const existing = await discModel.findUnique({ where: { id } }).catch(() => null);
      if (existing) {
        return await discModel.delete({ where: { id } });
      }
    }
    return { success: true };
  } catch (err) {
    console.error("Error deleting discount:", err);
    throw err;
  }
}

// Dining Tables
export async function getDiningTables() {
  try {
    const tableModel = db.diningTable || db.DiningTable;
    return tableModel ? await tableModel.findMany({ orderBy: { number: "asc" } }) : [];
  } catch (err) {
    console.error("Error fetching tables:", err);
    return [];
  }
}

export async function saveDiningTable(data: { id?: string; number: string; capacity: number; status?: string }) {
  try {
    const tableModel = db.diningTable || db.DiningTable;
    if (data.id) {
      const existing = await tableModel.findUnique({ where: { id: data.id } }).catch(() => null);
      if (existing) {
        return await tableModel.update({
          where: { id: data.id },
          data: { number: data.number, capacity: Number(data.capacity), status: data.status || "AVAILABLE" },
        });
      }
    }
    return await tableModel.create({
      data: { ...(data.id ? { id: data.id } : {}), number: data.number, capacity: Number(data.capacity), status: data.status || "AVAILABLE" },
    });
  } catch (err) {
    console.error("Error saving table:", err);
    throw err;
  }
}

export async function deleteDiningTable(id: string) {
  try {
    const tableModel = db.diningTable || db.DiningTable;
    if (tableModel) {
      const existing = await tableModel.findUnique({ where: { id } }).catch(() => null);
      if (existing) {
        return await tableModel.delete({ where: { id } });
      }
    }
    return { success: true };
  } catch (err) {
    console.error("Error deleting dining table:", err);
    throw err;
  }
}

// Customers
const DEFAULT_SEED_CUSTOMERS = [
  { name: "Budi Pratama", phone: "081298765432", email: "budi@gmail.com", points: 150 },
  { name: "Siti Rahma", phone: "085612348899", email: "siti.rahma@yahoo.com", points: 80 },
  { name: "Dimas Anggara", phone: "087899001122", email: "dimas@outlook.com", points: 220 },
];

export async function getCustomers() {
  try {
    const custModel = db.customer || db.Customer;
    const setModel = db.systemSetting || db.SystemSetting;

    if (!custModel) return [];

    let customers = await custModel.findMany({ orderBy: { name: "asc" } }).catch(() => []);

    let hasSeeded = null;
    if (setModel) {
      hasSeeded = await setModel.findUnique({ where: { key: "seeded_customers" } }).catch(() => null);
    }

    if (!hasSeeded && (!customers || customers.length === 0)) {
      for (const seed of DEFAULT_SEED_CUSTOMERS) {
        try {
          await custModel.create({ data: seed });
        } catch {}
      }
      if (setModel) {
        await setModel.upsert({
          where: { key: "seeded_customers" },
          update: { value: "true" },
          create: { key: "seeded_customers", value: "true" },
        }).catch(() => null);
      }
      customers = await custModel.findMany({ orderBy: { name: "asc" } }).catch(() => []);
    }

    return Array.isArray(customers) ? customers : [];
  } catch (err) {
    console.error("Error fetching customers:", err);
    return [];
  }
}

export async function saveCustomer(data: { id?: string; name: string; phone?: string; email?: string; points?: number }) {
  try {
    const custModel = db.customer || db.Customer;
    if (!custModel) throw new Error("Customer model not found");

    if (data.id) {
      const existing = await custModel.findUnique({ where: { id: data.id } }).catch(() => null);
      if (existing) {
        return await custModel.update({
          where: { id: data.id },
          data: { 
            name: data.name, 
            phone: data.phone || "", 
            email: data.email || "",
            points: Number(data.points) || 0
          },
        });
      }
    }

    return await custModel.create({
      data: { 
        name: data.name, 
        phone: data.phone || "", 
        email: data.email || "",
        points: Number(data.points) || 0
      },
    });
  } catch (err) {
    console.error("Error saving customer:", err);
    throw err;
  }
}

export async function deleteCustomer(id: string) {
  try {
    const custModel = db.customer || db.Customer;
    const setModel = db.systemSetting || db.SystemSetting;

    if (setModel) {
      await setModel.upsert({
        where: { key: "seeded_customers" },
        update: { value: "true" },
        create: { key: "seeded_customers", value: "true" },
      }).catch(() => null);
    }

    if (custModel) {
      const existing = await custModel.findUnique({ where: { id } }).catch(() => null);
      if (existing) {
        return await custModel.delete({ where: { id } });
      }
    }
    return { success: true };
  } catch (err) {
    console.error("Error deleting customer:", err);
    throw err;
  }
}

// Expenses (Beban Operational & Integration AI Nota)
export async function getExpenses() {
  try {
    const cashTxModel = db.cashTransaction || db.cashtransaction || db.CashTransaction;
    let localExpenses: any[] = [];
    if (cashTxModel) {
      try {
        localExpenses = await cashTxModel.findMany({ where: { type: "CASH_OUT" }, orderBy: { timestamp: "desc" } });
      } catch {
        localExpenses = [];
      }
    }

    // Fetch scanned receipts from Supabase for operational expense integration
    let scannedExpenses: any[] = [];
    try {
      const { data: receipts } = await supabase
        .from("receipts")
        .select("id, merchantName, date, totalAmount, paymentMethod, note")
        .order("createdAt", { ascending: false });

      if (receipts && receipts.length > 0) {
        scannedExpenses = receipts.map((r: any) => ({
          id: `rec-exp-${r.id}`,
          amount: Number(r.totalAmount) || 0,
          note: `[AI Nota] ${r.merchantName || "Pembelian Nota Toko"}${r.note ? ` - ${r.note}` : ""}`,
          employeeName: r.paymentMethod || "Kas Outlet",
          timestamp: r.date ? new Date(r.date) : new Date(),
          isFromScan: true,
        }));
      }
    } catch {
      scannedExpenses = [];
    }

    const combined = [...localExpenses, ...scannedExpenses];
    combined.sort((a, b) => new Date(b.timestamp || b.createdAt || 0).getTime() - new Date(a.timestamp || a.createdAt || 0).getTime());

    return combined;
  } catch (err) {
    console.error("Error fetching expenses:", err);
    return [];
  }
}

export async function saveExpense(data: { id?: string; amount: number; note?: string; employeeName?: string; type?: string; shiftLogId?: string }) {
  try {
    const cashTxModel = db.cashTransaction || db.cashtransaction || db.CashTransaction;
    const shiftModel = db.shiftLog || db.shiftlog || db.ShiftLog;

    let activeShiftId = data.shiftLogId;
    if (!activeShiftId && shiftModel && data.employeeName) {
      try {
        const foundShift = await shiftModel.findFirst({
          where: {
            employeeName: data.employeeName,
            status: "OPEN",
          },
          orderBy: { startTime: "desc" },
        });
        if (foundShift) activeShiftId = foundShift.id;
      } catch {}
    }

    const txType = data.type === "CASH_IN" || data.type === "IN" ? "CASH_IN" : "CASH_OUT";

    if (data.id) {
      return await cashTxModel.update({
        where: { id: data.id },
        data: {
          amount: Number(data.amount) || 0,
          note: data.note || "Beban Operasional",
          employeeName: data.employeeName || "Staf Outlet",
          type: txType,
          shiftLogId: activeShiftId || undefined,
        },
      });
    }
    return await cashTxModel.create({
      data: {
        type: txType,
        amount: Number(data.amount) || 0,
        note: data.note || "Beban Operasional",
        employeeName: data.employeeName || "Staf Outlet",
        shiftLogId: activeShiftId || undefined,
      },
    });
  } catch (err) {
    console.error("Error saving expense:", err);
    throw err;
  }
}

export async function deleteExpense(id: string) {
  try {
    const cashTxModel = db.cashTransaction || db.cashtransaction || db.CashTransaction;
    if (cashTxModel) {
      const existing = await cashTxModel.findUnique({ where: { id } }).catch(() => null);
      if (existing) {
        return await cashTxModel.delete({ where: { id } });
      }
    }
    return { success: true };
  } catch (err) {
    console.error("Error deleting expense:", err);
    throw err;
  }
}

// Orders History & Order Status
const DEFAULT_SEED_ORDERS = [
  {
    orderNumber: "POS-101",
    customerName: "Rian Pratama",
    channel: "DINE_IN",
    subtotal: 48000,
    discount: 0,
    totalAmount: 48000,
    paymentMethod: "QRIS",
    paymentStatus: "PAID",
    orderStatus: "COMPLETED",
    createdAt: new Date(),
    items: [
      { menuName: "Es Kopi Susu Gula Aren", variantName: "Regular", price: 24000, quantity: 2, subtotal: 48000 }
    ]
  },
  {
    orderNumber: "POS-102",
    customerName: "Siti Rahma",
    channel: "TAKEAWAY",
    subtotal: 50000,
    discount: 0,
    totalAmount: 50000,
    paymentMethod: "CASH",
    paymentStatus: "PAID",
    orderStatus: "COMPLETED",
    createdAt: new Date(),
    items: [
      { menuName: "Americano Iced", variantName: "Large", price: 24000, quantity: 1, subtotal: 24000 },
      { menuName: "Matcha Latte Ice", variantName: "Regular", price: 26000, quantity: 1, subtotal: 26000 }
    ]
  },
  {
    orderNumber: "POS-103",
    customerName: "Dimas Anggara",
    channel: "DINE_IN",
    subtotal: 46000,
    discount: 0,
    totalAmount: 46000,
    paymentMethod: "EDC_CARD",
    paymentStatus: "PAID",
    orderStatus: "COMPLETED",
    createdAt: new Date(),
    items: [
      { menuName: "Es Kopi Susu Gula Aren", variantName: "Regular", price: 24000, quantity: 1, subtotal: 24000 },
      { menuName: "Croissant Coklat Premium", variantName: "Standard", price: 22000, quantity: 1, subtotal: 22000 }
    ]
  }
];

export async function getOrdersHistory() {
  try {
    const orderModel = db.order || db.Order;
    const setModel = db.systemSetting || db.SystemSetting;
    let orders: any[] = [];
    if (orderModel) {
      try {
        orders = await orderModel.findMany({
          include: { items: true, payments: true },
          orderBy: { createdAt: "desc" },
        });
      } catch {
        orders = [];
      }
    }

    let hasSeeded = null;
    if (setModel) {
      hasSeeded = await setModel.findUnique({ where: { key: "seeded_orders" } }).catch(() => null);
    }

    // Only seed on first run if database has never been seeded and table is empty
    if (!hasSeeded && (!orders || orders.length === 0)) {
      if (orderModel) {
        for (const seed of DEFAULT_SEED_ORDERS) {
          try {
            const { items: seedItems, ...orderData } = seed;
            await orderModel.create({
              data: {
                ...orderData,
                items: {
                  create: seedItems,
                },
              },
            });
          } catch {}
        }
        if (setModel) {
          await setModel.upsert({
            where: { key: "seeded_orders" },
            update: { value: "true" },
            create: { key: "seeded_orders", value: "true" },
          }).catch(() => null);
        }
        try {
          orders = await orderModel.findMany({
            include: { items: true, payments: true },
            orderBy: { createdAt: "desc" },
          });
        } catch {
          orders = [];
        }
      }
    }

    return orders || [];
  } catch (err) {
    console.error("Error fetching orders history:", err);
    return [];
  }
}

export async function updateOrderStatus(data: { id: string; orderStatus?: string; paymentStatus?: string }) {
  try {
    const orderModel = db.order || db.Order;
    return await orderModel.update({
      where: { id: data.id },
      data: {
        ...(data.orderStatus ? { orderStatus: data.orderStatus } : {}),
        ...(data.paymentStatus ? { paymentStatus: data.paymentStatus } : {}),
      },
    });
  } catch (err) {
    console.error("Error updating order status:", err);
    throw err;
  }
}

export async function deleteOrder(id: string) {
  try {
    const orderModel = db.order || db.Order;
    const itemModel = db.orderItem || db.OrderItem;
    const setModel = db.systemSetting || db.SystemSetting;

    // Mark as seeded so clearing orders won't trigger re-seed
    if (setModel) {
      await setModel.upsert({
        where: { key: "seeded_orders" },
        update: { value: "true" },
        create: { key: "seeded_orders", value: "true" },
      }).catch(() => null);
    }

    if (itemModel) {
      await itemModel.deleteMany({ where: { orderId: id } }).catch(() => null);
    }
    if (orderModel) {
      await orderModel.delete({ where: { id } }).catch(() => null);
    }
    return { success: true };
  } catch (err) {
    console.error("Error deleting order:", err);
    throw err;
  }
}

export async function deleteAllOrders() {
  try {
    const orderModel = db.order || db.Order;
    const itemModel = db.orderItem || db.OrderItem;
    const setModel = db.systemSetting || db.SystemSetting;

    // Mark as seeded so clearing orders won't trigger re-seed
    if (setModel) {
      await setModel.upsert({
        where: { key: "seeded_orders" },
        update: { value: "true" },
        create: { key: "seeded_orders", value: "true" },
      }).catch(() => null);
    }

    if (itemModel) {
      await itemModel.deleteMany({}).catch(() => null);
    }
    if (orderModel) {
      await orderModel.deleteMany({}).catch(() => null);
    }
    return { success: true };
  } catch (err) {
    console.error("Error deleting all orders:", err);
    throw err;
  }
}

// Void Order with CancellationAuditLog & Stock Restoration
export async function voidOrderWithAuditLog(data: {
  orderId: string;
  supervisorPin: string;
  approvedBy?: string;
  reason: string;
  customReason?: string;
  restoreStock?: boolean;
}) {
  try {
    const orderModel = db.order || db.Order;
    const auditModel = db.cancellationAuditLog || db.CancellationAuditLog;
    const empModel = db.employee || db.Employee;
    const ingredientModel = db.ingredient || db.Ingredient;
    const recipeModel = db.recipeItem || db.RecipeItem;

    let approverName = data.approvedBy || "Supervisor";
    let isAuthorized = false;

    // 1. Check against process.env.SUPERVISOR_PIN or process.env.ADMIN_PASSWORD
    const envSupervisorPin = (process.env.SUPERVISOR_PIN || process.env.ADMIN_PASSWORD || "").trim();
    if (envSupervisorPin && data.supervisorPin === envSupervisorPin) {
      isAuthorized = true;
      approverName = "Administrator";
    }

    // 2. Check against Database Employee with Admin / Supervisor / Manager role
    if (!isAuthorized && empModel) {
      const emp = await empModel.findFirst({
        where: { 
          pin: data.supervisorPin,
          role: { in: ["ADMIN", "MANAGER", "SUPERVISOR", "admin", "manager", "supervisor", "owner", "OWNER"] }
        },
      }).catch(() => null);
      if (emp) {
        approverName = emp.name;
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      throw new Error("PIN Supervisor salah. Silakan periksa kembali PIN Anda.");
    }

    const order = await orderModel.findUnique({
      where: { id: data.orderId },
      include: { items: true },
    });

    if (!order) {
      throw new Error("Order tidak ditemukan");
    }

    // Format structured reason
    const finalReason = data.reason === "Lainnya" && data.customReason 
      ? `Lainnya: ${data.customReason}` 
      : data.reason || "Salah input kasir / salah menu";

    // Update order status
    const updatedOrder = await orderModel.update({
      where: { id: data.orderId },
      data: {
        orderStatus: "CANCELLED",
        paymentStatus: "CANCELLED",
      },
    });

    // Create record in CancellationAuditLog with snapshot
    const itemsSnapshot = JSON.stringify(
      (order.items || []).map((it: any) => ({
        menuName: it.menuName,
        variantName: it.variantName || "Regular",
        quantity: it.quantity,
        price: it.price,
        subtotal: it.subtotal || it.price * it.quantity,
      }))
    );

    if (auditModel) {
      await auditModel.create({
        data: {
          orderId: order.id,
          cashierName: order.employeeName || "Kasir Outlet",
          approvedBy: approverName,
          reason: finalReason,
          itemsSnapshot,
          amount: Number(order.totalAmount) || 0,
        },
      }).catch((e: any) => console.warn("Failed creating audit log:", e));
    }

    // Restore stock if requested and recipes exist & log StockMovement
    const stockMovementModel = db.stockMovement || db.StockMovement;
    if (data.restoreStock !== false && recipeModel && ingredientModel && order.items) {
      for (const item of order.items) {
        if (item.menuId) {
          const recipes = await recipeModel.findMany({
            where: { menuId: item.menuId },
          }).catch(() => []);

          for (const rec of recipes) {
            const totalAdd = (Number(rec.quantityUsed) || 1) * (Number(item.quantity) || 1);
            const updatedIng = await ingredientModel.update({
              where: { id: rec.ingredientId },
              data: {
                floorQuantity: {
                  increment: totalAdd,
                },
              },
            }).catch(() => null);

            if (stockMovementModel && updatedIng) {
              await stockMovementModel.create({
                data: {
                  ingredientId: rec.ingredientId,
                  type: "CANCEL_RETURN",
                  quantity: totalAdd,
                  balanceAfter: Number(updatedIng.floorQuantity) || 0,
                  referenceId: order.orderNumber,
                  employeeName: approverName,
                  note: `Pengembalian Stok Void Order #${order.orderNumber} (${item.menuName})`,
                },
              }).catch(() => null);
            }
          }
        }
      }
    }

    return { success: true, order: updatedOrder, approverName };
  } catch (err) {
    console.error("Error voiding order:", err);
    throw err;
  }
}

// Refund Order with Cash Drawer Deduction, CancellationAuditLog & Stock Restoration (Full & Partial)
export async function refundOrder(data: {
  orderId: string;
  supervisorPin: string;
  approvedBy?: string;
  reason: string;
  customReason?: string;
  refundMethod: "CASH" | "NON_CASH" | string;
  refundItems?: Array<{
    orderItemId?: string;
    menuId?: string;
    menuName: string;
    variantName?: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  amount?: number;
  restoreStock?: boolean;
  shiftLogId?: string;
}) {
  try {
    const orderModel = db.order || db.Order;
    const auditModel = db.cancellationAuditLog || db.CancellationAuditLog;
    const empModel = db.employee || db.Employee;
    const cashTxModel = db.cashTransaction || db.cashtransaction || db.CashTransaction;
    const shiftModel = db.shiftLog || db.shiftlog || db.ShiftLog;
    const ingredientModel = db.ingredient || db.Ingredient;
    const recipeModel = db.recipeItem || db.RecipeItem;
    const stockMovementModel = db.stockMovement || db.StockMovement;

    let approverName = data.approvedBy || "Supervisor";
    let isAuthorized = false;

    // 1. Check against process.env.SUPERVISOR_PIN or process.env.ADMIN_PASSWORD
    const envSupervisorPin = (process.env.SUPERVISOR_PIN || process.env.ADMIN_PASSWORD || "").trim();
    if (envSupervisorPin && data.supervisorPin === envSupervisorPin) {
      isAuthorized = true;
      approverName = "Administrator";
    }

    // 2. Check against Database Employee with Admin / Supervisor / Manager role
    if (!isAuthorized && empModel) {
      const emp = await empModel.findFirst({
        where: { 
          pin: data.supervisorPin,
          role: { in: ["ADMIN", "MANAGER", "SUPERVISOR", "admin", "manager", "supervisor", "owner", "OWNER"] }
        },
      }).catch(() => null);
      if (emp) {
        approverName = emp.name;
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      throw new Error("PIN Supervisor salah. Silakan periksa kembali PIN Anda.");
    }

    const order = await orderModel.findUnique({
      where: { id: data.orderId },
      include: { items: true },
    });

    if (!order) {
      throw new Error("Transaksi order tidak ditemukan");
    }

    // Determine refund items and total amount
    const itemsToRefund = data.refundItems && data.refundItems.length > 0 
      ? data.refundItems 
      : (order.items || []).map((it: any) => ({
          orderItemId: it.id,
          menuId: it.menuId,
          menuName: it.menuName,
          variantName: it.variantName,
          quantity: it.quantity,
          unitPrice: it.price,
          subtotal: it.subtotal || it.price * it.quantity,
        }));

    const calculatedRefundAmount = itemsToRefund.reduce((sum: number, it: any) => sum + (Number(it.subtotal) || 0), 0);
    const refundAmount = calculatedRefundAmount > 0 
      ? calculatedRefundAmount 
      : (Number(data.amount) > 0 ? Number(data.amount) : Number(order.totalAmount || 0));

    const isPartial = itemsToRefund.length < (order.items || []).length;
    const finalReason = data.reason === "Lainnya" && data.customReason 
      ? `Lainnya: ${data.customReason}` 
      : data.reason || "Komplain pelanggan";

    // Update order status
    const updatedOrder = await orderModel.update({
      where: { id: data.orderId },
      data: {
        paymentStatus: isPartial ? "REFUNDED" : "REFUNDED",
        orderStatus: "REFUNDED",
      },
    });

    // Create Audit Log
    const itemsSnapshot = JSON.stringify(itemsToRefund);
    if (auditModel) {
      await auditModel.create({
        data: {
          orderId: order.id,
          cashierName: order.employeeName || "Kasir Outlet",
          approvedBy: approverName,
          reason: `[REFUND ${isPartial ? "PARSIAL" : "TOTAL"} - ${data.refundMethod === "CASH" ? "Kas Tunai" : "Non-Tunai"}] ${finalReason}`,
          itemsSnapshot,
          amount: refundAmount,
        },
      }).catch((e: any) => console.warn("Failed creating refund audit log:", e));
    }

    // If refund was paid out from cash drawer, record CASH_OUT in CashTransaction for active shift
    if (data.refundMethod === "CASH" && cashTxModel) {
      let activeShiftId = data.shiftLogId || order.shiftLogId;
      if (!activeShiftId && shiftModel) {
        const activeShift = await shiftModel.findFirst({
          where: { status: "OPEN" },
          orderBy: { startTime: "desc" },
        }).catch(() => null);
        if (activeShift) activeShiftId = activeShift.id;
      }

      await cashTxModel.create({
        data: {
          type: "CASH_OUT",
          amount: refundAmount,
          note: `Refund Kasir Order #${order.orderNumber} (${finalReason})`,
          employeeName: approverName,
          shiftLogId: activeShiftId || undefined,
        },
      }).catch((e: any) => console.warn("Failed creating cash out for refund:", e));
    }

    // Restore stock for refunded items & record StockMovement
    if (data.restoreStock !== false && recipeModel && ingredientModel && itemsToRefund.length > 0) {
      for (const item of itemsToRefund) {
        if (item.menuId) {
          const recipes = await recipeModel.findMany({
            where: { menuId: item.menuId },
          }).catch(() => []);

          for (const rec of recipes) {
            const totalAdd = (Number(rec.quantityUsed) || 1) * (Number(item.quantity) || 1);
            const updatedIng = await ingredientModel.update({
              where: { id: rec.ingredientId },
              data: {
                floorQuantity: {
                  increment: totalAdd,
                },
              },
            }).catch(() => null);

            if (stockMovementModel && updatedIng) {
              await stockMovementModel.create({
                data: {
                  ingredientId: rec.ingredientId,
                  type: "REFUND_RETURN",
                  quantity: totalAdd,
                  balanceAfter: Number(updatedIng.floorQuantity) || 0,
                  referenceId: order.orderNumber,
                  employeeName: approverName,
                  note: `Pengembalian Stok Refund Order #${order.orderNumber} (${item.menuName} x${item.quantity})`,
                },
              }).catch(() => null);
            }
          }
        }
      }
    }

    return { 
      success: true, 
      order: updatedOrder, 
      refundAmount, 
      approverName, 
      refundedItems: itemsToRefund 
    };
  } catch (err) {
    console.error("Error processing refund:", err);
    throw err;
  }
}

// Get Cancellation & Refund Audit Logs
export async function getCancellationAuditLogs() {
  try {
    const auditModel = db.cancellationAuditLog || db.CancellationAuditLog;
    if (!auditModel) return [];
    return await auditModel.findMany({
      include: {
        order: {
          include: {
            items: true,
            payments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (err) {
    console.error("Error fetching cancellation audit logs:", err);
    return [];
  }
}

// =============================================================================
// 8. WASTE / SPILLAGE LOGS & STOCK MOVEMENTS (FOR 100% INVENTORY INTEGRITY)
// =============================================================================

export async function createSpillageLog(data: {
  ingredientId: string;
  quantity: number;
  reason: string;
  reportedBy?: string;
  location?: "floor" | "warehouse";
}) {
  try {
    const spillageModel = db.spillageLog || db.spillagelog || db.SpillageLog;
    const ingredientModel = db.ingredient || db.Ingredient;
    const stockMovementModel = db.stockMovement || db.StockMovement;

    const qty = Number(data.quantity) || 0;
    if (qty <= 0) throw new Error("Jumlah waste harus lebih dari 0");

    const ingredient = await ingredientModel.findUnique({
      where: { id: data.ingredientId },
    });

    if (!ingredient) throw new Error("Bahan baku tidak ditemukan");

    // Deduct stock from floor or warehouse
    const isWarehouse = data.location === "warehouse";
    const updateData = isWarehouse
      ? { warehouseQuantity: { decrement: qty } }
      : { floorQuantity: { decrement: qty } };

    const updatedIng = await ingredientModel.update({
      where: { id: data.ingredientId },
      data: updateData,
    });

    // Create SpillageLog
    let newLog = null;
    if (spillageModel) {
      newLog = await spillageModel.create({
        data: {
          ingredientId: data.ingredientId,
          quantity: qty,
          reason: data.reason || "Barang Rusak / Tumpah (Waste)",
          reportedBy: data.reportedBy || "Staf Outlet",
        },
      });
    }

    // Create StockMovement
    if (stockMovementModel) {
      await stockMovementModel.create({
        data: {
          ingredientId: data.ingredientId,
          type: "SPILLAGE",
          quantity: -qty,
          balanceAfter: Number(isWarehouse ? updatedIng.warehouseQuantity : updatedIng.floorQuantity) || 0,
          employeeName: data.reportedBy || "Staf Outlet",
          note: `Waste/Tumpah: ${data.reason || "Barang Rusak"} (${isWarehouse ? "Gudang" : "Bar/Store"})`,
          referenceId: newLog?.id || undefined,
        },
      }).catch(() => null);
    }

    return { success: true, log: newLog, updatedIng };
  } catch (err) {
    console.error("Error creating spillage log:", err);
    throw err;
  }
}

export async function getSpillageLogs() {
  try {
    const spillageModel = db.spillageLog || db.spillagelog || db.SpillageLog;
    if (!spillageModel) return [];
    return await spillageModel.findMany({
      include: {
        ingredient: true,
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (err) {
    console.error("Error fetching spillage logs:", err);
    return [];
  }
}

export async function getStockMovements(ingredientId?: string) {
  try {
    const stockMovementModel = db.stockMovement || db.StockMovement;
    if (!stockMovementModel) return [];
    return await stockMovementModel.findMany({
      where: ingredientId ? { ingredientId } : undefined,
      include: {
        ingredient: true,
      },
      orderBy: { timestamp: "desc" },
      take: 200,
    });
  } catch (err) {
    console.error("Error fetching stock movements:", err);
    return [];
  }
}

// Payment Methods
const DEFAULT_SEED_PAYMENT_METHODS = [
  { id: "pm-1", name: "Tunai", code: "CASH", type: "CASH", isActive: true },
  { id: "pm-2", name: "QRIS BCA / Mandiri", code: "QRIS", type: "E_WALLET", isActive: true },
  { id: "pm-3", name: "EDC Debit / Kredit", code: "EDC", type: "CARD", isActive: true },
  { id: "pm-4", name: "Transfer Bank", code: "TRANSFER", type: "BANK_TRANSFER", isActive: true },
];

export async function getPaymentMethods() {
  try {
    const pmModel = db.paymentMethod || db.PaymentMethod;
    const setModel = db.systemSetting || db.SystemSetting;

    if (!pmModel) return DEFAULT_SEED_PAYMENT_METHODS;

    let methods = await pmModel.findMany({ orderBy: { name: "asc" } }).catch(() => []);

    // Check if initial seeding has occurred
    let hasSeeded = null;
    if (setModel) {
      hasSeeded = await setModel.findUnique({ where: { key: "seeded_payment_methods" } }).catch(() => null);
    }

    if (!hasSeeded && (!methods || methods.length === 0)) {
      for (const seed of DEFAULT_SEED_PAYMENT_METHODS) {
        try {
          await pmModel.create({ data: seed });
        } catch {}
      }
      if (setModel) {
        await setModel.upsert({
          where: { key: "seeded_payment_methods" },
          update: { value: "true" },
          create: { key: "seeded_payment_methods", value: "true" },
        }).catch(() => null);
      }
      methods = await pmModel.findMany({ orderBy: { name: "asc" } }).catch(() => []);
    }

    return Array.isArray(methods) ? methods : [];
  } catch (err) {
    console.error("Error fetching payment methods:", err);
    return [];
  }
}

export async function savePaymentMethod(data: { id?: string; name: string; code?: string; type?: string; isActive?: boolean }) {
  try {
    const pmModel = db.paymentMethod || db.PaymentMethod;
    const finalCode = (data.code || data.name || "").trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_").slice(0, 16) || `PM_${Math.floor(100 + Math.random() * 900)}`;

    if (pmModel) {
      if (data.id) {
        const existing = await pmModel.findUnique({ where: { id: data.id } }).catch(() => null);
        if (existing) {
          return await pmModel.update({
            where: { id: data.id },
            data: { 
              name: data.name, 
              code: finalCode, 
              type: data.type || "CASH",
              ...(data.isActive !== undefined ? { isActive: Boolean(data.isActive) } : {})
            },
          });
        }

        const existingByCode = await pmModel.findFirst({ where: { code: finalCode } }).catch(() => null);
        if (existingByCode) {
          return await pmModel.update({
            where: { id: existingByCode.id },
            data: { 
              name: data.name, 
              code: finalCode, 
              type: data.type || "CASH",
              ...(data.isActive !== undefined ? { isActive: Boolean(data.isActive) } : {})
            },
          });
        }
      }

      return await pmModel.create({
        data: { 
          ...(data.id ? { id: data.id } : {}),
          name: data.name, 
          code: finalCode, 
          type: data.type || "CASH",
          isActive: data.isActive !== undefined ? Boolean(data.isActive) : true
        },
      });
    }
    return data;
  } catch (err) {
    console.error("Error saving payment method:", err);
    throw err;
  }
}

export async function deletePaymentMethod(id: string) {
  try {
    const pmModel = db.paymentMethod || db.PaymentMethod;
    const setModel = db.systemSetting || db.SystemSetting;

    // Mark as seeded so deletion won't trigger re-seed
    if (setModel) {
      await setModel.upsert({
        where: { key: "seeded_payment_methods" },
        update: { value: "true" },
        create: { key: "seeded_payment_methods", value: "true" },
      }).catch(() => null);
    }

    if (pmModel) {
      const existing = await pmModel.findUnique({ where: { id } }).catch(() => null);
      if (existing) {
        return await pmModel.delete({ where: { id } });
      }

      const existingByCode = await pmModel.findFirst({ where: { code: id } }).catch(() => null);
      if (existingByCode) {
        return await pmModel.delete({ where: { id: existingByCode.id } });
      }
    }
    return { success: true };
  } catch (err) {
    console.error("Error deleting payment method:", err);
    throw err;
  }
}

// System Settings
export async function getSystemSettings() {
  try {
    const setModel = db.systemSetting || db.SystemSetting;
    return setModel ? await setModel.findMany() : [];
  } catch (err) {
    console.error("Error fetching system settings:", err);
    return [];
  }
}

export async function saveSystemSetting(key: string, value: string) {
  try {
    const setModel = db.systemSetting || db.SystemSetting;
    return await setModel.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  } catch (err) {
    console.error("Error saving system setting:", err);
    throw err;
  }
}

// =============================================================================
// EMPLOYEES & ATTENDANCE MANAGEMENT (PER-SHIFT ONLY - NO FLAT MONTHLY SALARY)
// =============================================================================

export async function saveEmployee(data: {
  id?: string;
  name: string;
  pin?: string;
  role?: string;
  employmentType?: string;
  shiftRate?: number;
  dailyRate?: number;
}) {
  try {
    const empModel = db.employee || db.Employee;
    const rate = Number(data.shiftRate || data.dailyRate || 75000);
    if (data.id) {
      const existing = await empModel.findUnique({ where: { id: data.id } }).catch(() => null);
      if (existing) {
        return await empModel.update({
          where: { id: data.id },
          data: {
            name: data.name,
            pin: data.pin || "1234",
            role: data.role || "cashier",
            employmentType: "SHIFT",
            dailyRate: rate,
            flatSalaryAmount: 0,
          },
        });
      }
    }
    return await empModel.create({
      data: {
        ...(data.id ? { id: data.id } : {}),
        name: data.name,
        pin: data.pin || "1234",
        role: data.role || "cashier",
        employmentType: "SHIFT",
        dailyRate: rate,
        flatSalaryAmount: 0,
      },
    });
  } catch (err) {
    console.error("Error saving employee:", err);
    throw err;
  }
}

export async function deleteEmployee(id: string) {
  try {
    const empModel = db.employee || db.Employee;
    const setModel = db.systemSetting || db.SystemSetting;

    if (setModel) {
      await setModel.upsert({
        where: { key: "seeded_employees" },
        update: { value: "true" },
        create: { key: "seeded_employees", value: "true" },
      }).catch(() => null);
    }

    if (empModel) {
      const existing = await empModel.findUnique({ where: { id } }).catch(() => null);
      if (existing) {
        return await empModel.delete({ where: { id } });
      }
    }
    return { success: true };
  } catch (err) {
    console.error("Error deleting employee:", err);
    throw err;
  }
}

export async function getEmployeeAttendances() {
  try {
    const attModel = db.attendance || db.Attendance;
    return attModel
      ? await attModel.findMany({
          include: { employee: true },
          orderBy: { clockIn: "desc" },
        })
      : [];
  } catch (err) {
    console.error("Error fetching attendances:", err);
    return [];
  }
}

export async function saveAttendanceRecord(data: {
  id?: string;
  employeeId: string;
  status?: string;
  notes?: string;
}) {
  try {
    const attModel = db.attendance || db.Attendance;
    if (data.id) {
      return await attModel.update({
        where: { id: data.id },
        data: {
          employeeId: data.employeeId,
          status: data.status || "ON_TIME",
          notes: data.notes || "Absensi manual admin",
        },
      });
    }
    return await attModel.create({
      data: {
        employeeId: data.employeeId,
        status: data.status || "ON_TIME",
        notes: data.notes || "Absensi manual admin",
      },
    });
  } catch (err) {
    console.error("Error saving attendance record:", err);
    throw err;
  }
}

export async function deleteAttendanceRecord(id: string) {
  try {
    const attModel = db.attendance || db.Attendance;
    if (attModel) {
      const existing = await attModel.findUnique({ where: { id } }).catch(() => null);
      if (existing) {
        return await attModel.delete({ where: { id } });
      }
    }
    return { success: true };
  } catch (err) {
    console.error("Error deleting attendance record:", err);
    throw err;
  }
}
