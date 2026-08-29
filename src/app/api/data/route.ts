import { NextResponse } from "next/server";
import { 
  getDashboardData, 
  getIngredients, 
  getEmployees, 
  saveEmployee,
  deleteEmployee,
  getEmployeeAttendances,
  saveAttendanceRecord,
  deleteAttendanceRecord,
  getMenusWithRecipes, 
  createIngredient, 
  updateIngredientStock,
  updateIngredientDetail,
  deleteIngredient,
  saveMenuSettings,
  deleteMenu,
  getAddonCategories,
  saveAddonCategory,
  deleteAddonCategory,
  saveAddonItem,
  deleteAddonItem,
  processOrderCheckout,
  authenticateUser,
  getCategories,
  saveCategory,
  deleteCategory,
  getPurchases,
  savePurchase,
  deletePurchase,
  getDiscounts,
  saveDiscount,
  deleteDiscount,
  getDiningTables,
  saveDiningTable,
  deleteDiningTable,
  getCustomers,
  saveCustomer,
  deleteCustomer,
  getExpenses,
  saveExpense,
  deleteExpense,
  getOrdersHistory,
  updateOrderStatus,
  deleteOrder,
  getPaymentMethods,
  savePaymentMethod,
  deletePaymentMethod,
  getSystemSettings,
  saveSystemSetting
} from "@/lib/actions";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  try {
    if (type === "ingredients") return NextResponse.json(await getIngredients());
    if (type === "employees") return NextResponse.json(await getEmployees());
    if (type === "attendances") return NextResponse.json(await getEmployeeAttendances());
    if (type === "menus" || type === "menus_with_recipes") return NextResponse.json(await getMenusWithRecipes());
    if (type === "addon_categories") return NextResponse.json(await getAddonCategories());
    if (type === "categories") return NextResponse.json(await getCategories());
    if (type === "purchases") return NextResponse.json(await getPurchases());
    if (type === "discounts") return NextResponse.json(await getDiscounts());
    if (type === "tables") return NextResponse.json(await getDiningTables());
    if (type === "customers") return NextResponse.json(await getCustomers());
    if (type === "expenses") return NextResponse.json(await getExpenses());
    if (type === "orders_history") return NextResponse.json(await getOrdersHistory());
    if (type === "payment_methods") return NextResponse.json(await getPaymentMethods());
    if (type === "settings") return NextResponse.json(await getSystemSettings());

    // Default: Dashboard data
    const data = await getDashboardData();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  try {
    const body = await request.json();

    if (type === "login") return NextResponse.json(await authenticateUser(body));
    if (type === "update_stock") return NextResponse.json(await updateIngredientStock(body));
    if (type === "update_ingredient_detail") return NextResponse.json(await updateIngredientDetail(body));
    if (type === "delete_ingredient") return NextResponse.json(await deleteIngredient(body.id));
    if (type === "ingredient") return NextResponse.json(await createIngredient(body));
    
    // Menus & Addons
    if (type === "save_menu_settings") return NextResponse.json(await saveMenuSettings(body));
    if (type === "delete_menu") return NextResponse.json(await deleteMenu(body.id));
    if (type === "save_addon_category") return NextResponse.json(await saveAddonCategory(body));
    if (type === "delete_addon_category") return NextResponse.json(await deleteAddonCategory(body.id));
    if (type === "save_addon_item") return NextResponse.json(await saveAddonItem(body));
    if (type === "delete_addon_item") return NextResponse.json(await deleteAddonItem(body.id));
    
    // Checkout & Orders
    if (type === "checkout") return NextResponse.json(await processOrderCheckout(body));
    if (type === "update_order_status") return NextResponse.json(await updateOrderStatus(body));
    if (type === "delete_order") return NextResponse.json(await deleteOrder(body.id));
    
    // Extended Modules POST Handlers
    if (type === "save_employee") return NextResponse.json(await saveEmployee(body));
    if (type === "delete_employee") return NextResponse.json(await deleteEmployee(body.id));
    if (type === "save_attendance") return NextResponse.json(await saveAttendanceRecord(body));
    if (type === "delete_attendance") return NextResponse.json(await deleteAttendanceRecord(body.id));
    if (type === "save_category") return NextResponse.json(await saveCategory(body));
    if (type === "delete_category") return NextResponse.json(await deleteCategory(body.id));
    if (type === "save_purchase") return NextResponse.json(await savePurchase(body));
    if (type === "delete_purchase") return NextResponse.json(await deletePurchase(body.id));
    if (type === "save_discount") return NextResponse.json(await saveDiscount(body));
    if (type === "delete_discount") return NextResponse.json(await deleteDiscount(body.id));
    if (type === "save_table") return NextResponse.json(await saveDiningTable(body));
    if (type === "delete_table") return NextResponse.json(await deleteDiningTable(body.id));
    if (type === "save_customer") return NextResponse.json(await saveCustomer(body));
    if (type === "delete_customer") return NextResponse.json(await deleteCustomer(body.id));
    if (type === "save_expense") return NextResponse.json(await saveExpense(body));
    if (type === "delete_expense") return NextResponse.json(await deleteExpense(body.id));
    if (type === "save_payment_method") return NextResponse.json(await savePaymentMethod(body));
    if (type === "delete_payment_method") return NextResponse.json(await deletePaymentMethod(body.id));
    if (type === "save_setting") return NextResponse.json(await saveSystemSetting(body.key, body.value));

    return NextResponse.json({ error: "Invalid action type" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
