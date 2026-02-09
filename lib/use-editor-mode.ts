"use client";

import { useState, useEffect, useCallback } from "react";

export type EditorMode = "vscode" | "nvim";

/**
 * Hook to fetch and update the user's preferred editor mode.
 * Falls back to localStorage for unauthenticated / fast-load scenarios.
 */
export function useEditorMode() {
  const [mode, setMode] = useState<EditorMode>(() => {
    if (typeof window === "undefined") return "vscode";
    return (localStorage.getItem("tsp_editor_mode") as EditorMode) || "vscode";
  });
  const [loading, setLoading] = useState(true);

  // Fetch from server on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/settings/editor", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          const m = data.editorMode === "nvim" ? "nvim" : "vscode";
          setMode(m);
          localStorage.setItem("tsp_editor_mode", m);
        }
      } catch {
        // keep localStorage / default
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const setEditorMode = useCallback(async (newMode: EditorMode) => {
    setMode(newMode);
    localStorage.setItem("tsp_editor_mode", newMode);
    try {
      await fetch("/api/settings/editor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ editorMode: newMode }),
      });
    } catch {
      // optimistic update already applied
    }
  }, []);

  return { editorMode: mode, setEditorMode, loading };
}
