import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/authHelper";

export async function GET(request: Request) {
  const session = await getAuthSession(request);

  if (!session) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.id,
      name: session.name,
      role: session.role,
      username: session.username,
      outletName: session.outletName,
    },
  });
}
