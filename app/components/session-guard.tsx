"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * SessionGuard — keeps the session token alive across page loads.
 *
 * VS Code Simple Browser (sandboxed iframe) blocks ALL cookies.
 * This component stores the token in localStorage and ensures it's
 * always present in the URL as `?t=<token>` so the middleware can
 * inject it into server-side requests.
 *
 * Flow:
 *   1. Login page stores token in localStorage after successful auth
 *   2. On every page load / navigation, this component checks:
 *      - If on /login but localStorage has a VALID token → redirect to /?t=TOKEN
 *      - If localStorage has a token but the URL doesn't → update URL + reload
 *      - If the URL has a token but localStorage doesn't → save it
 *   3. Middleware reads `?t=` and injects into request via x-session-token header
 *   4. Server components see the token → user is authenticated
 */

const STORAGE_KEY = "tsp_session_token";
const URL_PARAM = "t";

export function SessionGuard() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const validatingRef = useRef(false);

  useEffect(() => {
    const urlToken = searchParams.get(URL_PARAM)
      ?? searchParams.get("sessionToken")
      ?? searchParams.get("session");
    let storedToken: string | null = null;

    try {
      storedToken = localStorage.getItem(STORAGE_KEY);
    } catch {
      // localStorage might be blocked too — nothing we can do
    }

    // ── On auth pages (/login, /register): if we have a stored token,
    //    validate it first. Only redirect if it's actually valid.
    //    This prevents an infinite loop when the token is stale/expired.
    if (pathname === "/login" || pathname === "/register") {
      if (storedToken && !validatingRef.current) {
        validatingRef.current = true;
        fetch(`/api/auth/me?t=${encodeURIComponent(storedToken)}`)
          .then((r) => r.json())
          .then((data) => {
            if (data?.ok) {
              // Token is valid — redirect to dashboard
              window.location.replace(`/?${URL_PARAM}=${encodeURIComponent(storedToken!)}`);
            } else {
              // Token is invalid/expired — clear it and stay on login
              try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
            }
          })
          .catch(() => {
            // Network error — don't redirect, stay on login
          })
          .finally(() => {
            validatingRef.current = false;
          });
      }
      return;
    }

    // ── Sync: URL → localStorage
    if (urlToken && !storedToken) {
      try { localStorage.setItem(STORAGE_KEY, urlToken); } catch { /* ignore */ }
      storedToken = urlToken;
    }
    if (urlToken && storedToken && urlToken !== storedToken) {
      try { localStorage.setItem(STORAGE_KEY, urlToken); } catch { /* ignore */ }
    }

    // ── Best-effort: also set document.cookie so soft navigations
    //    might carry the token (works in normal browsers).
    const token = urlToken || storedToken;
    if (token) {
      try {
        document.cookie = `tsp_session=${token}; path=/; max-age=2592000; SameSite=Lax`;
      } catch { /* ignore */ }
    }

    // ── If localStorage has a token but URL doesn't — inject into URL
    //    and do a hard reload so middleware can inject it server-side.
    if (token && !urlToken) {
      const url = new URL(window.location.href);
      url.searchParams.set(URL_PARAM, token);
      // replaceState updates URL without triggering navigation
      window.history.replaceState(window.history.state, "", url.toString());
      // Hard reload so middleware runs with the token in the URL
      window.location.reload();
    }
  }, [pathname, searchParams]);

  return null;
}

/**
 * Helper: save session token to localStorage.
 * Called from login/register pages after successful auth.
 */
export function saveSessionToken(token: string) {
  try {
    localStorage.setItem(STORAGE_KEY, token);
  } catch { /* ignore */ }
}

/**
 * Helper: clear session token from localStorage.
 * Called from logout.
 */
export function clearSessionToken() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
}

/**
 * Helper: get the token for building URLs.
 */
export function getSessionToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
