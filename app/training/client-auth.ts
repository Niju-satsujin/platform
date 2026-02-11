"use client";

const TOKEN_PARAM_KEYS = ["t", "sessionToken", "session"] as const;
const STORAGE_KEY = "tsp_session_token";
type SearchParamsLike = Pick<URLSearchParams, "get">;

function getTokenFromParams(params: SearchParamsLike): string | null {
  for (const key of TOKEN_PARAM_KEYS) {
    const value = params.get(key);
    if (value && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

export function getClientSessionToken(
  currentSearchParams?: SearchParamsLike | null
): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const fromCurrentParams = currentSearchParams
    ? getTokenFromParams(currentSearchParams)
    : null;
  if (fromCurrentParams) {
    return fromCurrentParams;
  }

  const fromUrl = getTokenFromParams(new URLSearchParams(window.location.search));
  if (fromUrl) {
    return fromUrl;
  }

  try {
    const fromStorage = localStorage.getItem(STORAGE_KEY);
    return fromStorage && fromStorage.trim() ? fromStorage.trim() : null;
  } catch {
    return null;
  }
}

export function withSessionToken(
  path: string,
  currentSearchParams?: SearchParamsLike | null
): string {
  const token = getClientSessionToken(currentSearchParams);
  if (!token) {
    return path;
  }

  if (typeof window === "undefined") {
    const separator = path.includes("?") ? "&" : "?";
    return `${path}${separator}t=${encodeURIComponent(token)}`;
  }

  try {
    const url = new URL(path, window.location.origin);
    if (!url.searchParams.has("t")) {
      url.searchParams.set("t", token);
    }

    if (/^https?:\/\//i.test(path)) {
      return url.toString();
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    const separator = path.includes("?") ? "&" : "?";
    return `${path}${separator}t=${encodeURIComponent(token)}`;
  }
}
