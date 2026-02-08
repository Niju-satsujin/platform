"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface BrowseEntry {
  name: string;
  path: string;
  type: "directory" | "file";
}

interface FolderPickerProps {
  /** Currently selected directory (shown in the path bar) */
  currentDir?: string;
  /** Called when user confirms a folder selection */
  onSelect: (dirPath: string) => void;
  /** Called when user cancels */
  onClose: () => void;
}

export function FolderPicker({ currentDir, onSelect, onClose }: FolderPickerProps) {
  const [browsePath, setBrowsePath] = useState<string | null>(currentDir || null);
  const [entries, setEntries] = useState<BrowseEntry[]>([]);
  const [parent, setParent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pathInput, setPathInput] = useState(currentDir || "");
  const [editingPath, setEditingPath] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const browse = useCallback(async (dirPath: string | null) => {
    try {
      setLoading(true);
      setError(null);
      const url = dirPath
        ? `/api/fs/browse?path=${encodeURIComponent(dirPath)}`
        : "/api/fs/browse";
      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to browse");
        return;
      }
      const data = await res.json();
      setEntries(data.entries || []);
      setParent(data.parent || null);
      if (data.path) {
        setBrowsePath(data.path);
        setPathInput(data.path);
      } else {
        setBrowsePath(null);
        setPathInput("");
      }
    } catch {
      setError("Failed to browse filesystem");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    browse(currentDir || null);
  }, [browse, currentDir]);

  // Focus the input when entering edit mode
  useEffect(() => {
    if (editingPath && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingPath]);

  const handleGoToPath = useCallback(() => {
    const trimmed = pathInput.trim();
    if (trimmed && trimmed.startsWith("/")) {
      browse(trimmed);
    }
    setEditingPath(false);
  }, [pathInput, browse]);

  const handleConfirm = useCallback(() => {
    if (browsePath) {
      onSelect(browsePath);
    }
  }, [browsePath, onSelect]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-[560px] max-w-[95vw] max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-900 shrink-0">
          <h2 className="text-sm font-semibold text-gray-200">Open Folder</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Path bar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-800 bg-gray-950 shrink-0">
          {/* Up button */}
          <button
            type="button"
            onClick={() => parent && browse(parent)}
            disabled={!parent}
            className="text-gray-500 hover:text-gray-300 disabled:opacity-30 disabled:cursor-default transition-colors text-sm shrink-0"
            title="Go up"
          >
            ⬆
          </button>

          {/* Quick nav roots */}
          {!browsePath && (
            <span className="text-xs text-gray-500 italic">Choose a starting point</span>
          )}

          {/* Editable path */}
          {editingPath ? (
            <input
              ref={inputRef}
              type="text"
              value={pathInput}
              onChange={(e) => setPathInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleGoToPath();
                if (e.key === "Escape") setEditingPath(false);
              }}
              onBlur={handleGoToPath}
              className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-gray-200 font-mono outline-none focus:border-yellow-500"
              placeholder="/path/to/folder"
              spellCheck={false}
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingPath(true)}
              className="flex-1 text-left px-2 py-1 text-xs text-gray-300 font-mono bg-gray-800/50 rounded hover:bg-gray-800 transition-colors truncate"
              title="Click to type a path directly"
            >
              {browsePath || "~"}
            </button>
          )}

          {/* Home button */}
          <button
            type="button"
            onClick={() => browse(null)}
            className="text-gray-500 hover:text-gray-300 transition-colors text-sm shrink-0"
            title="Quick access"
          >
            🏠
          </button>
        </div>

        {/* Directory listing */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading && (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">Loading…</div>
          )}
          {error && (
            <div className="px-4 py-4 text-red-400 text-sm">{error}</div>
          )}
          {!loading && !error && entries.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-600 text-sm">
              Empty directory
            </div>
          )}
          {!loading &&
            !error &&
            entries.map((entry) => (
              <button
                key={entry.path}
                type="button"
                onClick={() => {
                  if (entry.type === "directory") {
                    browse(entry.path);
                  }
                }}
                className={`
                  w-full flex items-center gap-2.5 px-4 py-2 text-left transition-colors
                  ${entry.type === "directory"
                    ? "text-gray-200 hover:bg-gray-800/70 cursor-pointer"
                    : "text-gray-500 cursor-default"
                  }
                `}
              >
                <span className="text-sm shrink-0">
                  {entry.type === "directory" ? "📁" : "📄"}
                </span>
                <span className="text-sm truncate">{entry.name}</span>
              </button>
            ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700 bg-gray-900 shrink-0">
          <div className="text-[11px] text-gray-500 truncate max-w-[60%] font-mono">
            {browsePath || "No folder selected"}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 bg-gray-800 border border-gray-700 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!browsePath}
              className="px-3 py-1.5 text-xs font-semibold text-gray-900 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-default rounded transition-colors"
            >
              Open Folder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
