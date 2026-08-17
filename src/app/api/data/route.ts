import { NextResponse } from "next/server";
import { 
  getDashboardData, 
  getIngredients, 
  getEmployees, 
  getMenusWithRecipes, 
  createIngredient, 
  updateIngredientStock,
  updateIngredientDetail,
  deleteIngredient,
  saveMenuSettings,
  processOrderCheckout,
  authenticateUser
} from "@/lib/actions";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  try {
    if (type === "ingredients") {
      const data = await getIngredients();
      return NextResponse.json(data);
    }
    if (type === "employees") {
      const data = await getEmployees();
      return NextResponse.json(data);
    }
    if (type === "menus" || type === "menus_with_recipes") {
      const data = await getMenusWithRecipes();
      return NextResponse.json(data);
    }

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

    if (type === "login") {
      const result = await authenticateUser(body);
      return NextResponse.json(result);
    }

    if (type === "update_stock") {
      const result = await updateIngredientStock(body);
      return NextResponse.json(result);
    }

    if (type === "update_ingredient_detail") {
      const result = await updateIngredientDetail(body);
      return NextResponse.json(result);
    }

    if (type === "delete_ingredient") {
      const result = await deleteIngredient(body.id);
      return NextResponse.json(result);
    }

    if (type === "ingredient") {
      const result = await createIngredient(body);
      return NextResponse.json(result);
    }

    if (type === "save_menu_settings") {
      const result = await saveMenuSettings(body);
      return NextResponse.json(result);
    }

    if (type === "checkout") {
      const result = await processOrderCheckout(body);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid action type" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
