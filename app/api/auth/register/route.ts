import { NextResponse } from "next/server";
import {
  registerUser,
  SESSION_COOKIE_NAME,
  SESSION_EMBED_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth";

async function parseRegisterBody(request: Request) {
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
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
      displayName: String(formData.get("displayName") ?? ""),
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
    const body = await parseRegisterBody(request);
    const username = String(body.username ?? "").trim();
    const password = String(body.password ?? "");
    const confirmPassword = String(body.confirmPassword ?? body.password ?? "");
    const displayName = String(body.displayName ?? "").trim();

    const err = (msg: string, status = 400) =>
      NextResponse.json({ error: msg }, { status });

    if (!username || !password) return err("Username and password are required");
    if (password.length < 6) return err("Password must be at least 6 characters");
    if (username.length < 3) return err("Username must be at least 3 characters");
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) return err("Username can only contain letters, numbers, underscores, and hyphens");
    if (password !== confirmPassword) return err("Passwords do not match");

    const result = await registerUser(username, password, displayName || username);

    if ("error" in result) return err(result.error ?? "Registration failed", 409);

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
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
