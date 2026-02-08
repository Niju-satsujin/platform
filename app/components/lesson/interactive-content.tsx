"use client";

import { useEffect, useRef, useCallback } from "react";

interface InteractiveContentProps {
  /** The rendered HTML from markdown (may contain disabled checkboxes) */
  html: string;
  /** Unique key for persisting checkbox state (e.g. lessonId or partSlug/lessonSlug) */
  storageKey: string;
  /** Additional className for the wrapper */
  className?: string;
}

/**
 * Renders markdown HTML with interactive checkboxes.
 *
 * - Removes `disabled` from GFM task-list checkboxes
 * - Persists checked state in localStorage per lesson
 * - Adds strikethrough + fade on checked items
 */
export function InteractiveContent({ html, storageKey, className }: InteractiveContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lsKey = `checklist:${storageKey}`;

  // Load saved state and apply to checkboxes
  const applySavedState = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const saved = loadState(lsKey);
    const checkboxes = el.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');

    checkboxes.forEach((cb, i) => {
      // Remove disabled so user can interact
      cb.removeAttribute("disabled");
      // Restore saved state
      if (saved[i]) {
        cb.checked = true;
      }
      // Style the parent <li>
      updateItemStyle(cb);
    });
  }, [lsKey]);

  // Handle checkbox clicks
  const handleChange = useCallback(
    (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.type !== "checkbox") return;

      updateItemStyle(target);

      // Save all checkbox states
      const el = containerRef.current;
      if (!el) return;
      const checkboxes = el.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
      const state: Record<number, boolean> = {};
      checkboxes.forEach((cb, i) => {
        if (cb.checked) state[i] = true;
      });
      saveState(lsKey, state);
    },
    [lsKey]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Apply on mount
    applySavedState();

    // Listen for changes
    el.addEventListener("change", handleChange);
    return () => el.removeEventListener("change", handleChange);
  }, [applySavedState, handleChange, html]);

  // Strip disabled from checkboxes in the HTML string before rendering
  const processedHtml = html.replace(
    /<input\s+([^>]*)disabled\s*/gi,
    "<input $1"
  );

  return (
    <div
      ref={containerRef}
      className={className}
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  );
}

/** Apply visual styling to checked/unchecked list items */
function updateItemStyle(checkbox: HTMLInputElement) {
  const li = checkbox.closest("li");
  if (!li) return;

  if (checkbox.checked) {
    li.style.opacity = "0.55";
    li.style.textDecoration = "line-through";
    li.style.textDecorationColor = "var(--green-600)";
    li.style.transition = "all 0.2s ease";
  } else {
    li.style.opacity = "1";
    li.style.textDecoration = "none";
    li.style.transition = "all 0.2s ease";
  }
}

function loadState(key: string): Record<number, boolean> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveState(key: string, state: Record<number, boolean>) {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // localStorage full or unavailable — silent fail
  }
}
