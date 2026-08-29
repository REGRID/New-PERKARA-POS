import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { error } = await supabase
      .from("scan_limits")
      .select("id")
      .limit(1);

    if (error) {
      return NextResponse.json(
        {
          status: "degraded",
          message: "Supabase ping returned an error",
          details: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        status: "healthy",
        message: "Supabase database ping successful - project active",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        error: error?.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
