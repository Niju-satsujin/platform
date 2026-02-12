"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import dynamic from "next/dynamic";
import { Panel, Group, Separator } from "react-resizable-panels";

/* ── Monaco (client-only) ── */
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-[#1a1b26] text-gray-500">
      Loading editor…
    </div>
  ),
});

/* ── Types ── */
interface TreeEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: TreeEntry[];
}

interface OpenTab {
  path: string;
  name: string;
  content: string;
  dirty: boolean;
  language: string;
}

/* ── Language detection ── */
function detectLanguage(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript",
    json: "json", md: "markdown", css: "css", scss: "scss", html: "html",
    py: "python", rs: "rust", go: "go", cpp: "cpp", c: "c", h: "c",
    hpp: "cpp", java: "java", rb: "ruby", sh: "shell", bash: "shell",
    zsh: "shell", yml: "yaml", yaml: "yaml", toml: "ini", sql: "sql",
    graphql: "graphql", prisma: "graphql", dockerfile: "dockerfile",
    makefile: "makefile", xml: "xml", svg: "xml",
  };
  if (filename.toLowerCase() === "makefile") return "makefile";
  if (filename.toLowerCase() === "dockerfile") return "dockerfile";
  return map[ext] || "plaintext";
}

/* ── File icon ── */
function fileIcon(name: string, type: "file" | "directory", isExpanded?: boolean): string {
  if (type === "directory") return isExpanded ? "📂" : "📁";
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const icons: Record<string, string> = {
    ts: "🟦", tsx: "⚛️", js: "🟨", jsx: "⚛️", json: "📋", md: "📝",
    css: "🎨", html: "🌐", py: "🐍", rs: "🦀", go: "🐹", cpp: "⚙️",
    c: "⚙️", h: "📎", java: "☕", rb: "💎", sh: "🖥️", yml: "⚙️",
    yaml: "⚙️", sql: "🗄️", prisma: "🔷",
  };
  if (name.toLowerCase() === "makefile") return "🔧";
  return icons[ext] || "📄";
}

/* ── Helper: recursively update children in tree ── */
function updateTreeChildren(
  tree: TreeEntry[],
  targetPath: string,
  newChildren: TreeEntry[]
): TreeEntry[] {
  return tree.map((entry) => {
    if (entry.path === targetPath) {
      return { ...entry, children: newChildren };
    }
    if (entry.children) {
      return { ...entry, children: updateTreeChildren(entry.children, targetPath, newChildren) };
    }
    return entry;
  });
}

/* ── Context Menu Item ── */
function ContextItem({ label, icon, danger, onClick }: {
  label: string; icon: string; danger?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-[#3b3d57] transition-colors ${
        danger ? "text-red-400" : "text-gray-300"
      }`}
    >
      <span className="text-xs">{icon}</span>
      {label}
    </button>
  );
}

/* ── Tree Node Component ── */
function TreeNode({
  entry, depth, expanded, activeTab, toggleExpand, openFile, onContextMenu,
  creating, createName, setCreateName, handleCreate, setCreating,
  renaming, renameName, setRenameName, handleRename, setRenaming,
}: {
  entry: TreeEntry; depth: number; expanded: Set<string>; activeTab: string;
  toggleExpand: (entry: TreeEntry) => void;
  openFile: (path: string, name: string) => void;
  onContextMenu: (e: React.MouseEvent, entry: TreeEntry) => void;
  creating: { parentPath: string; type: "file" | "directory" } | null;
  createName: string; setCreateName: (v: string) => void;
  handleCreate: () => void;
  setCreating: (v: { parentPath: string; type: "file" | "directory" } | null) => void;
  renaming: string | null; renameName: string; setRenameName: (v: string) => void;
  handleRename: (oldPath: string) => void; setRenaming: (v: string | null) => void;
}) {
  const isExpanded = expanded.has(entry.path);
  const isActive = entry.type === "file" && activeTab === entry.path;
  const isRenaming = renaming === entry.path;

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-[3px] cursor-pointer hover:bg-[#232433] group ${
          isActive ? "bg-[#232433] text-blue-400" : "text-gray-400"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => {
          if (entry.type === "directory") toggleExpand(entry);
          else openFile(entry.path, entry.name);
        }}
        onContextMenu={(e) => onContextMenu(e, entry)}
      >
        {entry.type === "directory" ? (
          <span className={`text-[10px] text-gray-500 w-3 transition-transform ${isExpanded ? "rotate-90" : ""}`}>▶</span>
        ) : (
          <span className="w-3" />
        )}
        <span className="text-xs">{fileIcon(entry.name, entry.type, isExpanded)}</span>
        {isRenaming ? (
          <input
            autoFocus
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            onKeyDown={(e: ReactKeyboardEvent) => {
              if (e.key === "Enter") handleRename(entry.path);
              if (e.key === "Escape") { setRenaming(null); setRenameName(""); }
            }}
            onBlur={() => { setRenaming(null); setRenameName(""); }}
            className="flex-1 px-1 py-0 bg-[#232433] border border-blue-500 rounded text-xs text-gray-200 outline-none"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="truncate text-[13px]">{entry.name}</span>
        )}
      </div>
      {entry.type === "directory" && isExpanded && (
        <div>
          {creating && creating.parentPath === entry.path && (
            <div style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }} className="pr-2 py-0.5">
              <input
                autoFocus
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                onKeyDown={(e: ReactKeyboardEvent) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") { setCreating(null); setCreateName(""); }
                }}
                onBlur={() => { setCreating(null); setCreateName(""); }}
                placeholder={creating.type === "file" ? "filename.ext" : "folder-name"}
                className="w-full px-2 py-1 bg-[#232433] border border-blue-500 rounded text-xs text-gray-200 outline-none"
              />
            </div>
          )}
          {entry.children?.map((child) => (
            <TreeNode
              key={child.path} entry={child} depth={depth + 1} expanded={expanded}
              activeTab={activeTab} toggleExpand={toggleExpand} openFile={openFile}
              onContextMenu={onContextMenu} creating={creating} createName={createName}
              setCreateName={setCreateName} handleCreate={handleCreate} setCreating={setCreating}
              renaming={renaming} renameName={renameName} setRenameName={setRenameName}
              handleRename={handleRename} setRenaming={setRenaming}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   IDE Page
   ════════════════════════════════════════════════════════════════════ */
export default function IDEPage() {
  const [rootPath, setRootPath] = useState<string>("");
  const [tree, setTree] = useState<TreeEntry[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [tabs, setTabs] = useState<OpenTab[]>([]);
  const [activeTab, setActiveTab] = useState<string>("");
  const [showPicker, setShowPicker] = useState(true);
  const [pickerPath, setPickerPath] = useState<string>("");
  const [pickerEntries, setPickerEntries] = useState<{ name: string; path: string; type: string }[]>([]);
  const [pickerParent, setPickerParent] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; entry: TreeEntry } | null>(null);
  const [creating, setCreating] = useState<{ parentPath: string; type: "file" | "directory" } | null>(null);
  const [createName, setCreateName] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameName, setRenameName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const termRef = useRef<HTMLDivElement>(null);
  const termInstanceRef = useRef<import("@xterm/xterm").Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fitAddonRef = useRef<import("@xterm/addon-fit").FitAddon | null>(null);

  /* ── Folder Picker ── */
  const browsePicker = useCallback(async (dirPath?: string) => {
    const url = dirPath ? `/api/fs/browse?path=${encodeURIComponent(dirPath)}` : `/api/fs/browse`;
    const res = await fetch(url);
    const json = await res.json();
    setPickerEntries(json.entries || []);
    setPickerPath(json.path || "");
    setPickerParent(json.parent || null);
  }, []);

  useEffect(() => { if (showPicker) browsePicker(); }, [showPicker, browsePicker]);

  /* ── Tree loading ── */
  const loadTree = useCallback(async (dir: string) => {
    const res = await fetch(`/api/fs/tree?path=${encodeURIComponent(dir)}&depth=3`);
    const json = await res.json();
    setTree(json.entries || []);
  }, []);

  const openFolder = useCallback((dir: string) => {
    setRootPath(dir);
    setShowPicker(false);
    loadTree(dir);
    setExpanded(new Set([dir]));
  }, [loadTree]);

  /* ── Lazy subtree ── */
  const loadSubtree = useCallback(async (dir: string) => {
    const res = await fetch(`/api/fs/tree?path=${encodeURIComponent(dir)}&depth=2`);
    const json = await res.json();
    return (json.entries || []) as TreeEntry[];
  }, []);

  const toggleExpand = useCallback(async (entry: TreeEntry) => {
    if (entry.type !== "directory") return;
    const next = new Set(expanded);
    if (next.has(entry.path)) {
      next.delete(entry.path);
    } else {
      next.add(entry.path);
      const children = await loadSubtree(entry.path);
      setTree((prev) => updateTreeChildren(prev, entry.path, children));
    }
    setExpanded(next);
  }, [expanded, loadSubtree]);

  /* ── File operations ── */
  const openFile = useCallback(async (filePath: string, name: string) => {
    const existing = tabs.find((t) => t.path === filePath);
    if (existing) { setActiveTab(filePath); return; }
    const res = await fetch(`/api/fs/read?path=${encodeURIComponent(filePath)}`);
    if (!res.ok) return;
    const json = await res.json();
    const lang = detectLanguage(name);
    setTabs((prev) => [...prev, { path: filePath, name, content: json.content, dirty: false, language: lang }]);
    setActiveTab(filePath);
  }, [tabs]);

  const saveFile = useCallback(async (filePath: string) => {
    const tab = tabs.find((t) => t.path === filePath);
    if (!tab) return;
    setSaving(true);
    await fetch("/api/fs/write", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: filePath, content: tab.content }),
    });
    setTabs((prev) => prev.map((t) => (t.path === filePath ? { ...t, dirty: false } : t)));
    setSaving(false);
  }, [tabs]);

  const closeTab = useCallback((filePath: string) => {
    setTabs((prev) => prev.filter((t) => t.path !== filePath));
    if (activeTab === filePath) {
      const remaining = tabs.filter((t) => t.path !== filePath);
      setActiveTab(remaining.length > 0 ? remaining[remaining.length - 1].path : "");
    }
  }, [activeTab, tabs]);

  const updateContent = useCallback((filePath: string, content: string) => {
    setTabs((prev) => prev.map((t) => t.path === filePath ? { ...t, content, dirty: true } : t));
  }, []);

  /* ── Create file/folder ── */
  const handleCreate = useCallback(async () => {
    if (!creating || !createName.trim()) return;
    const fullPath = `${creating.parentPath}/${createName.trim()}`;
    await fetch("/api/fs/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: fullPath, type: creating.type }),
    });
    setCreating(null);
    setCreateName("");
    loadTree(rootPath);
  }, [creating, createName, rootPath, loadTree]);

  /* ── Delete ── */
  const handleDelete = useCallback(async (targetPath: string) => {
    await fetch("/api/fs/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: targetPath }),
    });
    setTabs((prev) => prev.filter((t) => !t.path.startsWith(targetPath)));
    if (activeTab.startsWith(targetPath)) setActiveTab("");
    setDeleteConfirm(null);
    loadTree(rootPath);
  }, [rootPath, activeTab, loadTree]);

  /* ── Rename ── */
  const handleRename = useCallback(async (oldPath: string) => {
    if (!renameName.trim()) { setRenaming(null); return; }
    const dir = oldPath.substring(0, oldPath.lastIndexOf("/"));
    const newPath = `${dir}/${renameName.trim()}`;
    await fetch("/api/fs/rename", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldPath, newPath }),
    });
    setTabs((prev) => prev.map((t) => {
      if (t.path === oldPath) return { ...t, path: newPath, name: renameName.trim() };
      if (t.path.startsWith(oldPath + "/")) {
        const np = newPath + t.path.substring(oldPath.length);
        return { ...t, path: np };
      }
      return t;
    }));
    if (activeTab === oldPath) setActiveTab(newPath);
    setRenaming(null);
    setRenameName("");
    loadTree(rootPath);
  }, [renameName, rootPath, activeTab, loadTree]);

  /* ── Terminal setup ── */
  useEffect(() => {
    if (!rootPath || !termRef.current) return;
    if (termInstanceRef.current) return;

    let cancelled = false;

    (async () => {
      const { Terminal } = await import("@xterm/xterm");
      const { FitAddon } = await import("@xterm/addon-fit");
      await import("@xterm/xterm/css/xterm.css");

      if (cancelled || !termRef.current) return;

      const term = new Terminal({
        cursorBlink: true,
        fontSize: 13,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        theme: {
          background: "#1a1b26", foreground: "#a9b1d6", cursor: "#c0caf5",
          selectionBackground: "#33467c",
          black: "#15161e", red: "#f7768e", green: "#9ece6a", yellow: "#e0af68",
          blue: "#7aa2f7", magenta: "#bb9af7", cyan: "#7dcfff", white: "#a9b1d6",
        },
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(termRef.current);
      try { fitAddon.fit(); } catch { /* not visible yet */ }

      fitAddonRef.current = fitAddon;
      termInstanceRef.current = term;

      const wsUrl = `ws://localhost:3061?cwd=${encodeURIComponent(rootPath)}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
      };
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === "output") term.write(msg.data);
        } catch { term.write(ev.data); }
      };
      ws.onclose = () => {
        term.write("\r\n\x1b[33m[Terminal disconnected]\x1b[0m\r\n");
      };
      term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "input", data }));
      });
      term.onResize(({ cols, rows }) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "resize", cols, rows }));
      });

      const container = termRef.current;
      const ro = new ResizeObserver(() => { try { fitAddon.fit(); } catch { /* */ } });
      ro.observe(container);

      return () => ro.disconnect();
    })();

    return () => { cancelled = true; };
  }, [rootPath]);

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (activeTab) saveFile(activeTab);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeTab, saveFile]);

  /* ── Close context menu ── */
  useEffect(() => {
    const handler = () => setContextMenu(null);
    if (contextMenu) window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [contextMenu]);

  const activeFile = tabs.find((t) => t.path === activeTab);

  /* ── Folder Picker Screen ── */
  if (showPicker) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="game-card p-8 max-w-lg w-full">
          <h1 className="text-xl font-bold text-gray-100 mb-2 flex items-center gap-2">
            <span className="text-2xl">💻</span> Open Folder
          </h1>
          <p className="text-gray-500 text-sm mb-4">Select a folder to open in the editor.</p>
          <div className="bg-gray-800 rounded-lg px-3 py-2 mb-3 text-sm text-gray-300 font-mono flex items-center gap-2">
            <span className="text-gray-500">📁</span> {pickerPath || "Select a folder…"}
          </div>
          <div className="bg-gray-900/50 rounded-lg max-h-80 overflow-y-auto mb-4">
            {pickerParent && (
              <button onClick={() => browsePicker(pickerParent!)}
                className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-gray-700/50 flex items-center gap-2 border-b border-gray-700/50">
                <span>⬆️</span> ..
              </button>
            )}
            {pickerEntries.map((e) => (
              <button key={e.path}
                onClick={() => { if (e.type === "directory") browsePicker(e.path); }}
                className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 flex items-center gap-2">
                <span>{e.type === "directory" ? "📁" : "📄"}</span> {e.name}
              </button>
            ))}
            {pickerEntries.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">Empty folder</div>
            )}
          </div>
          <button onClick={() => { if (pickerPath) openFolder(pickerPath); }}
            disabled={!pickerPath}
            className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors">
            Open This Folder
          </button>
        </div>
      </div>
    );
  }

  /* ── Main IDE Layout ── */
  return (
    <div className="h-[calc(100vh-60px)] flex flex-col bg-[#1a1b26] overflow-hidden">
      {/* Top bar */}
      <div className="h-9 bg-[#16161e] border-b border-[#232433] flex items-center px-3 gap-3 flex-shrink-0">
        <button
          onClick={() => {
            wsRef.current?.close();
            termInstanceRef.current?.dispose();
            termInstanceRef.current = null;
            wsRef.current = null;
            fitAddonRef.current = null;
            setTabs([]); setActiveTab(""); setTree([]); setRootPath(""); setShowPicker(true);
          }}
          className="text-gray-400 hover:text-yellow-400 text-sm transition-colors flex items-center gap-1">
          📁 Open Folder
        </button>
        <span className="text-gray-600 text-xs font-mono truncate flex-1">{rootPath}</span>
        {saving && <span className="text-yellow-400 text-xs animate-pulse">Saving…</span>}
      </div>

      <Group direction="horizontal" className="flex-1">
        {/* ── File Explorer ── */}
        <Panel defaultSize={20} minSize={12} maxSize={40}>
          <div className="h-full bg-[#1a1b26] border-r border-[#232433] flex flex-col">
            <div className="h-8 px-3 flex items-center justify-between border-b border-[#232433] flex-shrink-0">
              <span className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold">Explorer</span>
              <div className="flex gap-1">
                <button onClick={() => setCreating({ parentPath: rootPath, type: "file" })} title="New File"
                  className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-200 text-xs">📄</button>
                <button onClick={() => setCreating({ parentPath: rootPath, type: "directory" })} title="New Folder"
                  className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-200 text-xs">📁</button>
                <button onClick={() => loadTree(rootPath)} title="Refresh"
                  className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-200 text-xs">🔄</button>
              </div>
            </div>

            {creating && creating.parentPath === rootPath && (
              <div className="px-2 py-1 border-b border-[#232433]">
                <input autoFocus value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  onKeyDown={(e: ReactKeyboardEvent) => {
                    if (e.key === "Enter") handleCreate();
                    if (e.key === "Escape") { setCreating(null); setCreateName(""); }
                  }}
                  onBlur={() => { setCreating(null); setCreateName(""); }}
                  placeholder={creating.type === "file" ? "filename.ext" : "folder-name"}
                  className="w-full px-2 py-1 bg-[#232433] border border-blue-500 rounded text-xs text-gray-200 outline-none" />
              </div>
            )}

            <div className="flex-1 overflow-y-auto overflow-x-hidden py-1 text-[13px]">
              {tree.map((entry) => (
                <TreeNode key={entry.path} entry={entry} depth={0} expanded={expanded}
                  activeTab={activeTab} toggleExpand={toggleExpand} openFile={openFile}
                  onContextMenu={(e, ent) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, entry: ent }); }}
                  creating={creating} createName={createName} setCreateName={setCreateName}
                  handleCreate={handleCreate} setCreating={setCreating}
                  renaming={renaming} renameName={renameName} setRenameName={setRenameName}
                  handleRename={handleRename} setRenaming={setRenaming} />
              ))}
            </div>
          </div>
        </Panel>

        <Separator className="w-[3px] bg-[#232433] hover:bg-blue-600 transition-colors cursor-col-resize" />

        {/* ── Editor + Terminal ── */}
        <Panel defaultSize={80}>
          <Group direction="vertical">
            <Panel defaultSize={65} minSize={20}>
              <div className="h-full flex flex-col bg-[#1a1b26]">
                {/* Tabs */}
                <div className="h-9 bg-[#16161e] border-b border-[#232433] flex items-center overflow-x-auto flex-shrink-0">
                  {tabs.map((tab) => (
                    <div key={tab.path} onClick={() => setActiveTab(tab.path)}
                      className={`flex items-center gap-1.5 px-3 h-full text-xs cursor-pointer border-r border-[#232433] flex-shrink-0 group ${
                        activeTab === tab.path
                          ? "bg-[#1a1b26] text-gray-200 border-t-2 border-t-blue-500"
                          : "text-gray-500 hover:text-gray-300"
                      }`}>
                      <span className="text-[10px]">{fileIcon(tab.name, "file")}</span>
                      <span>{tab.name}</span>
                      {tab.dirty && <span className="w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0" />}
                      <button onClick={(e) => { e.stopPropagation(); closeTab(tab.path); }}
                        className="ml-1 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-200 transition-opacity">✕</button>
                    </div>
                  ))}
                </div>
                <div className="flex-1">
                  {activeFile ? (
                    <MonacoEditor language={activeFile.language} value={activeFile.content}
                      theme="vs-dark"
                      onChange={(value) => updateContent(activeFile.path, value || "")}
                      options={{
                        minimap: { enabled: false }, fontSize: 14,
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        lineNumbers: "on", renderWhitespace: "selection", tabSize: 2,
                        scrollBeyondLastLine: false, automaticLayout: true, padding: { top: 8 },
                      }} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 flex-col gap-3">
                      <span className="text-4xl">💻</span>
                      <span className="text-sm">Open a file from the explorer to start editing</span>
                      <span className="text-xs text-gray-600">Ctrl+S to save • Right-click for options</span>
                    </div>
                  )}
                </div>
              </div>
            </Panel>

            <Separator className="h-[3px] bg-[#232433] hover:bg-blue-600 transition-colors cursor-row-resize" />

            <Panel defaultSize={35} minSize={10}>
              <div className="h-full flex flex-col bg-[#1a1b26]">
                <div className="h-8 px-3 flex items-center border-t border-[#232433] flex-shrink-0">
                  <span className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold flex items-center gap-1.5">
                    🖥️ Terminal
                  </span>
                </div>
                <div ref={termRef} className="flex-1 px-1" />
              </div>
            </Panel>
          </Group>
        </Panel>
      </Group>

      {/* ── Context Menu ── */}
      {contextMenu && (
        <div className="fixed z-50 bg-[#232433] border border-[#3b3d57] rounded-lg shadow-xl py-1 min-w-[180px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}>
          {contextMenu.entry.type === "directory" && (
            <>
              <ContextItem label="New File" icon="📄" onClick={() => {
                setCreating({ parentPath: contextMenu.entry.path, type: "file" });
                setExpanded((prev) => new Set([...prev, contextMenu.entry.path]));
                setContextMenu(null);
              }} />
              <ContextItem label="New Folder" icon="📁" onClick={() => {
                setCreating({ parentPath: contextMenu.entry.path, type: "directory" });
                setExpanded((prev) => new Set([...prev, contextMenu.entry.path]));
                setContextMenu(null);
              }} />
              <div className="border-t border-[#3b3d57] my-1" />
            </>
          )}
          <ContextItem label="Rename" icon="✏️" onClick={() => {
            setRenaming(contextMenu.entry.path);
            setRenameName(contextMenu.entry.name);
            setContextMenu(null);
          }} />
          <ContextItem label="Delete" icon="🗑️" danger onClick={() => {
            setDeleteConfirm(contextMenu.entry.path);
            setContextMenu(null);
          }} />
        </div>
      )}

      {/* ── Delete Confirmation ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="game-card p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-100 mb-2">Delete?</h3>
            <p className="text-gray-400 text-sm mb-4">
              Are you sure you want to delete{" "}
              <span className="text-red-400 font-mono">{deleteConfirm.split("/").pop()}</span>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium">Delete</button>
              <button onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
