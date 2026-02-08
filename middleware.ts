import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware that handles session token propagation.
 *
 * Problem: VS Code Simple Browser (sandboxed iframe) blocks cookies entirely —
 * both Set-Cookie headers AND document.cookie. Cookies never persist across
 * page loads.
 *
 * Solution: The session token lives in the URL (?t=<token>) AND in localStorage.
 * This middleware:
 *   1. Reads the token from the URL query param
 *   2. Injects it into the request's Cookie header so server components see it
 *   3. Does NOT redirect — keeps the token in the URL for reload persistence
 *   4. Also sets Set-Cookie as a best-effort (works in normal browsers)
 *
 * A client-side <SessionGuard> ensures the token is always in the URL by
 * reading from localStorage and updating the URL via history.replaceState.
 */
export function middleware(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const sessionToken =
    searchParams.get("t") ??
    searchParams.get("sessionToken") ??
    searchParams.get("session");

  if (sessionToken) {
    // Inject the token into the request via BOTH a custom header
    // (reliable in Next.js 15) and the Cookie header (best-effort).
    const existingCookies = request.headers.get("cookie") || "";
    const hasCookie = existingCookies.includes("tsp_session=");

    const requestHeaders = new Headers(request.headers);

    // Custom header — getSessionToken() checks this as a fallback.
    // This is guaranteed to propagate via NextResponse.next({ request }).
    requestHeaders.set("x-session-token", sessionToken);

    if (!hasCookie) {
      requestHeaders.set(
        "cookie",
        existingCookies
          ? `${existingCookies}; tsp_session=${sessionToken}`
          : `tsp_session=${sessionToken}`
      );
    }

    // Pass through WITHOUT redirecting — keep the token in the URL
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });

    // Best-effort: also set the cookie on the response (works in normal browsers)
    response.cookies.set("tsp_session", sessionToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|img|fonts|.*\\.).*)",
  ],
};
