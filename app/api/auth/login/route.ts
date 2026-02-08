import { NextResponse } from "next/server";
import {
  loginUser,
  SESSION_COOKIE_NAME,
  SESSION_EMBED_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth";

async function parseLoginBody(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      return await request.json();
    } catch {
      return {};
    }
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await request.formData();
    return {
      username: String(formData.get("username") ?? ""),
      password: String(formData.get("password") ?? ""),
    };
  }

  return {};
}

function getCookieSecurity(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const hostHeader =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "";
  const isLocalhost = /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(
    hostHeader
  );

  if (forwardedProto) {
    return {
      secure: forwardedProto === "https",
      secureEmbed: forwardedProto === "https" || isLocalhost,
    };
  }

  return {
    secure: !isLocalhost,
    secureEmbed: true,
  };
}

export async function POST(request: Request) {
  try {
    const body = await parseLoginBody(request);
    const username = String(body.username ?? "").trim();
    const password = String(body.password ?? "");

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const result = await loginUser(username, password);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      token: result.token,
      cookieName: SESSION_COOKIE_NAME,
      embedCookieName: SESSION_EMBED_COOKIE_NAME,
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    const cookieSecurity = getCookieSecurity(request);

    // Primary path: secure HttpOnly cookie for normal browsers.
    response.cookies.set(SESSION_COOKIE_NAME, result.token, {
      httpOnly: true,
      secure: cookieSecurity.secure,
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: "/",
    });

    // Fallback for embedded browsers (iframe/webview) that require third-party cookies.
    response.cookies.set(SESSION_EMBED_COOKIE_NAME, result.token, {
      httpOnly: true,
      secure: cookieSecurity.secureEmbed,
      sameSite: "none",
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
