import { NextRequest, NextResponse } from "next/server";
import { getUserBySessionToken } from "@/lib/auth";

/** Lightweight session-check endpoint.
 *  Returns { ok: true, username } if the token is valid,
 *  or { ok: false } if not.
 */
export async function GET(req: NextRequest) {
  const token =
    req.nextUrl.searchParams.get("t") ??
    req.headers.get("x-session-token") ??
    req.cookies.get("tsp_session")?.value;

  if (!token) {
    return NextResponse.json({ ok: false });
  }

  try {
    const user = await getUserBySessionToken(token);
    if (!user) {
      return NextResponse.json({ ok: false });
    }
    return NextResponse.json({ ok: true, username: user.username });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
