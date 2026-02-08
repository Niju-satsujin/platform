import { NextResponse } from "next/server";
import {
  logoutUser,
  SESSION_COOKIE_NAME,
  SESSION_EMBED_COOKIE_NAME,
} from "@/lib/auth";

export async function POST() {
  try {
    await logoutUser();
    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });
    response.cookies.set(SESSION_EMBED_COOKIE_NAME, "", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 0,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
