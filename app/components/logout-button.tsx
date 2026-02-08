"use client";

import { useState } from "react";

export default function LogoutButton({ compact = false }: { compact?: boolean }) {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      // Clear all session storage
      try { localStorage.removeItem("tsp_session_token"); } catch { /* ignore */ }
      document.cookie = "tsp_session=; path=/; max-age=0; SameSite=Lax";
      document.cookie = "tsp_session_embed=; path=/; max-age=0; SameSite=None; Secure";
      window.location.href = "/login";
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={
        compact
          ? "px-2 py-1 text-xs font-medium text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50"
          : "px-3 py-1.5 text-sm font-medium text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50"
      }
      title="Log out"
    >
      {loading ? "..." : "Logout"}
    </button>
  );
}
