"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import type { editor as monacoEditor } from "monaco-editor";
import { Group, Panel, Separator } from "react-resizable-panels";
import { FileTree } from "./file-tree";
import { FolderPicker } from "./folder-picker";
import { guessLanguage, type StarterFiles } from "@/lib/starter-code";
import { useEditorMode } from "@/lib/use-editor-mode";

/** localStorage key for persisted workspace directory */
function workspaceStorageKey(lessonId: string) {
  return `tsp_workspace_${lessonId}`;
}

// Dynamic imports for heavy client-only components
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-gray-900 text-gray-500 text-sm">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-gray-600 border-t-yellow-500 rounded-full animate-spin" />
        Loading editor…
      </div>
    </div>
  ),
});

const CloudTerminal = dynamic(() => import("./cloud-terminal"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-[#0a0a0f] text-gray-600 text-sm">
      Loading terminal…
    </div>
  ),
});

/* ─── Types ─── */
interface OpenFile {
  path: string;
  name: string;
  content: string;
  dirty: boolean;
}

interface CodeEditorPanelProps {
  lessonId: string;
  partSlug: string;
  lessonSlug: string;
  starter: StarterFiles;
  mode: "lesson" | "quest";
  passed: boolean;
}

export function CodeEditorPanel({
  lessonId,
  partSlug,
  lessonSlug,
  starter,
  mode,
  passed,
}: CodeEditorPanelProps) {
  const [workspaceDir, setWorkspaceDir] = useState<string>("");
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [showTree, setShowTree] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);
  const [folderPickerOpen, setFolderPickerOpen] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const initRef = useRef(false);
  const { editorMode } = useEditorMode();
  const vimStatusRef = useRef<HTMLDivElement>(null);
  const vimModeRef = useRef<{ dispose: () => void } | null>(null);
  const editorInstanceRef = useRef<monacoEditor.IStandaloneCodeEditor | null>(null);

  /* ── Open a workspace directory (re-usable) ── */
  const openWorkspace = useCallback(
    async (dir: string) => {
      setWorkspaceDir(dir);
      setOpenFiles([]);
      setActiveIdx(0);
      setReady(true);

      // Persist choice
      try {
        localStorage.setItem(workspaceStorageKey(lessonId), dir);
      } catch { /* full */ }

      // Try to open a sensible default file
      try {
        const treeRes = await fetch(
          `/api/fs/tree?path=${encodeURIComponent(dir)}&depth=1`
        );
        if (treeRes.ok) {
          const treeData = await treeRes.json();
          const firstFile = (treeData.entries || []).find(
            (e: { type: string }) => e.type === "file"
          );
          if (firstFile) {
            const readRes = await fetch(
              `/api/fs/read?path=${encodeURIComponent(firstFile.path)}`
            );
            if (readRes.ok) {
              const fileData = await readRes.json();
              setOpenFiles([
                {
                  path: firstFile.path,
                  name: firstFile.name,
                  content: fileData.content,
                  dirty: false,
                },
              ]);
            }
          }
        }
      } catch { /* ignore */ }
    },
    [lessonId]
  );

  /* ── Initialize workspace on mount ── */
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    async function initWorkspace() {
      // Check if user previously chose a custom workspace for this lesson
      let savedDir = "";
      try {
        savedDir = localStorage.getItem(workspaceStorageKey(lessonId)) || "";
      } catch { /* ignore */ }

      if (savedDir) {
        // Verify the saved directory still exists
        try {
          const checkRes = await fetch(
            `/api/fs/tree?path=${encodeURIComponent(savedDir)}&depth=1`
          );
          if (checkRes.ok) {
            await openWorkspace(savedDir);
            return;
          }
        } catch { /* fall through to default */ }
      }

      // Default: init the standard workspace with starter files
      try {
        const res = await fetch("/api/fs/init-workspace", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dir: "",
            partSlug,
            lessonSlug,
            files: starter.files,
          }),
        });
        const data = await res.json();
        const dir = data.dir as string;
        setWorkspaceDir(dir);

        // Persist default workspace
        try {
          localStorage.setItem(workspaceStorageKey(lessonId), dir);
        } catch { /* full */ }

        // Open the main starter file from disk
        const mainPath = `${dir}/${starter.mainFile}`;
        const readRes = await fetch(
          `/api/fs/read?path=${encodeURIComponent(mainPath)}`
        );
        if (readRes.ok) {
          const fileData = await readRes.json();
          setOpenFiles([
            {
              path: mainPath,
              name: starter.mainFile,
              content: fileData.content,
              dirty: false,
            },
          ]);
        } else {
          setOpenFiles([
            {
              path: mainPath,
              name: starter.mainFile,
              content: starter.files[starter.mainFile] || "",
              dirty: false,
            },
          ]);
        }
      } catch (err) {
        console.error("Failed to init workspace:", err);
        setOpenFiles(
          Object.entries(starter.files).map(([name, content]) => ({
            path: name,
            name,
            content,
            dirty: false,
          }))
        );
      } finally {
        setReady(true);
      }
    }

    initWorkspace();
  }, [partSlug, lessonSlug, lessonId, starter, openWorkspace]);

  /* ── Open a file from the tree ── */
  const handleOpenFile = useCallback(
    async (filePath: string) => {
      // If already open, just switch to it
      const existingIdx = openFiles.findIndex((f) => f.path === filePath);
      if (existingIdx >= 0) {
        setActiveIdx(existingIdx);
        return;
      }
      try {
        const res = await fetch(
          `/api/fs/read?path=${encodeURIComponent(filePath)}`
        );
        if (!res.ok) return;
        const data = await res.json();
        const name = filePath.split("/").pop() || filePath;
        setOpenFiles((prev) => [
          ...prev,
          { path: filePath, name, content: data.content, dirty: false },
        ]);
        setActiveIdx(openFiles.length);
      } catch {
        // ignore
      }
    },
    [openFiles]
  );

  /* ── Close a tab ── */
  const handleCloseFile = useCallback((idx: number) => {
    setOpenFiles((prev) => prev.filter((_, i) => i !== idx));
    setActiveIdx((prev) => {
      if (idx < prev) return prev - 1;
      if (idx === prev) return Math.max(0, prev - 1);
      return prev;
    });
  }, []);

  /* ── Save file to disk ── */
  const saveFile = useCallback(async (filePath: string, content: string) => {
    try {
      setSaving(true);
      await fetch("/api/fs/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: filePath, content }),
      });
      setOpenFiles((prev) =>
        prev.map((f) => (f.path === filePath ? { ...f, dirty: false } : f))
      );
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }, []);

  /* ── Handle Monaco code changes (debounced auto-save to disk) ── */
  const handleCodeChange = useCallback(
    (value: string | undefined) => {
      const active = openFiles[activeIdx];
      if (!active) return;
      const code = value ?? "";

      setOpenFiles((prev) =>
        prev.map((f, i) =>
          i === activeIdx ? { ...f, content: code, dirty: true } : f
        )
      );

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveFile(active.path, code);
      }, 1000);
    },
    [activeIdx, openFiles, saveFile]
  );

  /* ── Ctrl+S instant save ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        const active = openFiles[activeIdx];
        if (active?.dirty) saveFile(active.path, active.content);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIdx, openFiles, saveFile]);

  /* ── Vim mode attach/detach ── */
  const attachVim = useCallback(async () => {
    if (!editorInstanceRef.current || !vimStatusRef.current) return;
    if (vimModeRef.current) {
      vimModeRef.current.dispose();
      vimModeRef.current = null;
    }
    if (editorMode === "nvim") {
      const { initVimMode } = await import("monaco-vim");
      vimModeRef.current = initVimMode(editorInstanceRef.current, vimStatusRef.current);
    }
  }, [editorMode]);

  useEffect(() => {
    attachVim();
    return () => {
      if (vimModeRef.current) {
        vimModeRef.current.dispose();
        vimModeRef.current = null;
      }
    };
  }, [attachVim]);

  function handleEditorDidMount(editor: monacoEditor.IStandaloneCodeEditor) {
    editorInstanceRef.current = editor;
    attachVim();
  }

  const activeFile = openFiles[activeIdx];
  const currentLang = activeFile ? guessLanguage(activeFile.name) : "plaintext";

  return (
    <div className="flex h-full">
      {/* ── File tree sidebar ── */}
      {/* ── Folder picker modal ── */}
      {folderPickerOpen && (
        <FolderPicker
          currentDir={workspaceDir || undefined}
          onSelect={(dir) => {
            setFolderPickerOpen(false);
            openWorkspace(dir);
          }}
          onClose={() => setFolderPickerOpen(false)}
        />
      )}

      {/* ── File tree sidebar ── */}
      {showTree && workspaceDir && (
        <div className="w-48 shrink-0 border-r border-gray-700 overflow-hidden">
          <FileTree
            rootDir={workspaceDir}
            activeFile={activeFile?.path}
            onOpenFile={handleOpenFile}
            onOpenFolder={() => setFolderPickerOpen(true)}
          />
        </div>
      )}

      {/* ── Editor + terminal area ── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Tab bar */}
        <div className="flex items-center border-b border-gray-700 bg-gray-900 shrink-0">
          {/* Tree toggle */}
          <button
            type="button"
            onClick={() => setShowTree((v) => !v)}
            className="px-2 py-2 text-gray-500 hover:text-gray-300 transition-colors text-sm border-r border-gray-700"
            title={showTree ? "Hide files" : "Show files"}
          >
            {showTree ? "◀" : "▶"}
          </button>

          {/* Open file tabs */}
          <div className="flex items-center overflow-x-auto flex-1 min-w-0">
            {openFiles.map((file, idx) => (
              <button
                key={file.path}
                type="button"
                onClick={() => setActiveIdx(idx)}
                className={`
                  flex items-center gap-1.5 px-3 py-2 text-xs font-medium
                  whitespace-nowrap transition-colors shrink-0 group
                  ${idx === activeIdx
                    ? "text-yellow-400 border-b-2 border-yellow-500 bg-gray-850"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-800 border-b-2 border-transparent"
                  }
                `}
              >
                {file.dirty && <span className="text-yellow-600">●</span>}
                <span>{file.name}</span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseFile(idx);
                  }}
                  className="ml-1 text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                >
                  ✕
                </span>
              </button>
            ))}
          </div>

          {/* Status + actions */}
          <div className="ml-auto flex items-center gap-1 px-2 shrink-0">
            <button
              type="button"
              onClick={() => setFolderPickerOpen(true)}
              className="editor-btn text-[11px]"
              title="Open folder…"
            >
              📂 Open Folder
            </button>
            {saving && <span className="text-[10px] text-gray-500">saving…</span>}
            {activeFile && (
              <>
                <button
                  type="button"
                  onClick={async () => {
                    try { await navigator.clipboard.writeText(activeFile.content); } catch { /* */ }
                  }}
                  className="editor-btn"
                  title="Copy code"
                >
                  📋
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([activeFile.content], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = activeFile.name;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="editor-btn"
                  title="Download file"
                >
                  📥
                </button>
              </>
            )}
          </div>
        </div>

        {/* Vertical split: editor + terminal */}
        <Group orientation="vertical" className="flex-1 min-h-0" id="tsp-editor-terminal">
          {/* Editor pane */}
          <Panel defaultSize={60} minSize={20}>
            <div className="h-full monaco-wrapper flex flex-col">
              {activeFile ? (
                <div className="flex-1 min-h-0">
                  <MonacoEditor
                    height="100%"
                    language={currentLang}
                    theme="vs-dark"
                    value={activeFile.content}
                    onChange={handleCodeChange}
                    onMount={handleEditorDidMount}
                    path={activeFile.path}
                    options={{
                      fontSize: 14,
                      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                      minimap: { enabled: false },
                      lineNumbers: editorMode === "nvim" ? "relative" : "on",
                      scrollBeyondLastLine: false,
                      wordWrap: "on",
                      padding: { top: 12, bottom: 12 },
                      renderLineHighlight: "line",
                      cursorBlinking: editorMode === "nvim" ? "solid" : "smooth",
                      cursorStyle: editorMode === "nvim" ? "block" : "line",
                      smoothScrolling: true,
                      bracketPairColorization: { enabled: true },
                      tabSize: 4,
                      insertSpaces: true,
                      automaticLayout: true,
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-600 text-sm">
                  Open a file from the tree to start editing
                </div>
              )}
              {editorMode === "nvim" && (
                <div
                  ref={vimStatusRef}
                  className="h-6 px-3 flex items-center text-xs font-mono bg-[#1a1b26] text-[#7aa2f7] border-t border-gray-700 shrink-0"
                />
              )}
            </div>
          </Panel>

          {/* Resize handle */}
          <Separator className="terminal-resize-handle" />

          {/* Cloud terminal */}
          <Panel defaultSize={40} minSize={15}>
            {ready ? (
              <CloudTerminal
                getCode={() => openFiles[activeIdx]?.content ?? ""}
                getFiles={() =>
                  openFiles.map((f) => ({ name: f.name, content: f.content }))
                }
                language={currentLang}
                lessonId={lessonId}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-[#0a0a0f] text-gray-600 text-sm">
                Initializing…
              </div>
            )}
          </Panel>
        </Group>
      </div>
    </div>
  );
}
