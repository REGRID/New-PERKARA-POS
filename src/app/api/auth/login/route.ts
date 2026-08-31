import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/actions";
import { signSession, SESSION_COOKIE_NAME } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await authenticateUser(body);

    if (!result.success || !result.user) {
      return NextResponse.json(
        { error: result.error || "ID Pengguna atau Kata Sandi salah" },
        { status: 401 }
      );
    }

    // Sign a cryptographically secure token
    const token = await signSession({
      id: result.user.id,
      name: result.user.name,
      role: result.user.role,
      username: result.user.username,
      outletName: result.user.outletName,
    });

    const response = NextResponse.json({
      success: true,
      user: result.user,
    });

    // Set secure HTTP-Only cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });

    return response;
  } catch (error: any) {
    console.error("Error in /api/auth/login:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server saat login." }, { status: 500 });
  }
}
