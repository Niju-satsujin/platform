"use client";

import { useState, useEffect, useCallback } from "react";

interface TreeEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: TreeEntry[];
}

interface FileTreeProps {
  /** Root directory to display */
  rootDir: string;
  /** Currently open file path */
  activeFile?: string;
  /** Called when user clicks a file */
  onOpenFile: (filePath: string) => void;
  /** Called when user wants to open a different folder */
  onOpenFolder?: () => void;
}

export function FileTree({
  rootDir,
  activeFile,
  onOpenFile,
  onOpenFolder,
}: FileTreeProps) {
  const [entries, setEntries] = useState<TreeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTree = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `/api/fs/tree?path=${encodeURIComponent(rootDir)}&depth=4`
      );
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to load");
        return;
      }
      const data = await res.json();
      setEntries(data.entries || []);
    } catch {
      setError("Failed to load file tree");
    } finally {
      setLoading(false);
    }
  }, [rootDir]);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  // Folder name for the header
  const rootName = rootDir.split("/").filter(Boolean).pop() || rootDir;

  return (
    <div className="flex flex-col h-full bg-gray-950 text-sm select-none overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-900 border-b border-gray-700 shrink-0">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">
          {rootName}
        </span>
        <div className="flex items-center gap-1">
          {onOpenFolder && (
            <button
              type="button"
              onClick={onOpenFolder}
              className="text-gray-500 hover:text-yellow-400 transition-colors text-xs p-0.5"
              title="Open folder…"
            >
              📂
            </button>
          )}
          <button
            type="button"
            onClick={loadTree}
            className="text-gray-500 hover:text-gray-300 transition-colors text-xs p-0.5"
            title="Refresh file tree"
          >
            ↻
          </button>
        </div>
      </div>

      {/* Tree body */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-1">
        {loading && (
          <div className="px-3 py-2 text-gray-500 text-xs">Loading…</div>
        )}
        {error && (
          <div className="px-3 py-2 text-red-400 text-xs">{error}</div>
        )}
        {!loading && !error && entries.length === 0 && (
          <div className="px-3 py-2 text-gray-600 text-xs">Empty directory</div>
        )}
        {entries.map((entry) => (
          <TreeNode
            key={entry.path}
            entry={entry}
            depth={0}
            activeFile={activeFile}
            onOpenFile={onOpenFile}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Recursive tree node ─── */

function TreeNode({
  entry,
  depth,
  activeFile,
  onOpenFile,
}: {
  entry: TreeEntry;
  depth: number;
  activeFile?: string;
  onOpenFile: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 1);
  const isDir = entry.type === "directory";
  const isActive = entry.path === activeFile;
  const paddingLeft = 12 + depth * 14;

  if (isDir) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-1 py-[3px] hover:bg-gray-800/60 transition-colors text-left"
          style={{ paddingLeft }}
        >
          <span className="text-[10px] text-gray-500 w-3 shrink-0">
            {expanded ? "▾" : "▸"}
          </span>
          <span className="text-xs text-gray-400">{entry.name}</span>
        </button>
        {expanded && entry.children && (
          <div>
            {entry.children.map((child) => (
              <TreeNode
                key={child.path}
                entry={child}
                depth={depth + 1}
                activeFile={activeFile}
                onOpenFile={onOpenFile}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // File
  return (
    <button
      type="button"
      onClick={() => onOpenFile(entry.path)}
      className={`
        w-full flex items-center gap-1.5 py-[3px] transition-colors text-left
        ${isActive ? "bg-gray-800 text-yellow-400" : "text-gray-300 hover:bg-gray-800/40 hover:text-gray-100"}
      `}
      style={{ paddingLeft: paddingLeft + 14 }}
    >
      <FileIcon name={entry.name} />
      <span className="text-xs truncate">{entry.name}</span>
    </button>
  );
}

/* ─── File icon by extension ─── */

function FileIcon({ name }: { name: string }) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const icons: Record<string, string> = {
    cpp: "⚙️",
    cc: "⚙️",
    cxx: "⚙️",
    c: "⚙️",
    h: "⚙️",
    hpp: "⚙️",
    py: "🐍",
    js: "📜",
    ts: "📜",
    tsx: "📜",
    jsx: "📜",
    rs: "🦀",
    go: "🔵",
    json: "📋",
    md: "📝",
    txt: "📄",
    sh: "🖥️",
    bash: "🖥️",
    makefile: "🔧",
    cmake: "🔧",
    toml: "⚙️",
    yaml: "⚙️",
    yml: "⚙️",
  };
  // Handle Makefile, CMakeLists.txt etc.
  const lowerName = name.toLowerCase();
  if (lowerName === "makefile" || lowerName === "cmakelists.txt") {
    return <span className="text-[10px] shrink-0">🔧</span>;
  }
  return <span className="text-[10px] shrink-0">{icons[ext] || "📄"}</span>;
}
