"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import type { editor as monacoEditor } from "monaco-editor";
import { Group, Panel, Separator } from "react-resizable-panels";
import { FileTree, type TreeEntry } from "./file-tree";
import { FolderPicker } from "./folder-picker";
import { guessLanguage, type StarterFiles } from "@/lib/starter-code";
import { useEditorMode } from "@/lib/use-editor-mode";
import type { XtermTerminalHandle } from "./xterm-terminal";

/** localStorage key for persisted workspace directory */
function workspaceStorageKey(lessonId: string, partSlug: string) {
  // Week 01 is one continuous trustctl project across lessons.
  if (partSlug === "w01") {
    return "tsp_workspace_w01_trustctl";
  }
  return `tsp_workspace_${lessonId}`;
}

type WorkspaceMode = "server" | "local";

type BrowserFileWritable = {
  write: (data: string) => Promise<void>;
  close: () => Promise<void>;
};

type BrowserFileHandle = {
  kind: "file";
  name: string;
  getFile: () => Promise<File>;
  createWritable: () => Promise<BrowserFileWritable>;
};

type BrowserDirectoryHandle = {
  kind: "directory";
  name: string;
  entries: () => AsyncIterableIterator<[string, BrowserFileSystemHandle]>;
};

type BrowserFileSystemHandle = BrowserFileHandle | BrowserDirectoryHandle;

type DirectoryPickerFn = (options?: {
  mode?: "read" | "readwrite";
}) => Promise<BrowserDirectoryHandle>;

type VimHook = {
  save: () => Promise<void>;
  quit: () => void;
  writeQuit: () => Promise<void>;
};

type VWindow = Window & {
  __tspVimHook?: VimHook;
  __tspVimCommandsRegistered?: boolean;
};

const LOCAL_IGNORED = new Set([
  "node_modules",
  ".git",
  ".next",
  "__pycache__",
  ".DS_Store",
  "dist",
  "build",
  ".cache",
]);

function sortTreeEntries(entries: TreeEntry[]): TreeEntry[] {
  return entries.sort((a, b) => {
    if (a.type === "directory" && b.type !== "directory") return -1;
    if (a.type !== "directory" && b.type === "directory") return 1;
    return a.name.localeCompare(b.name);
  });
}

async function buildBrowserLocalTree(
  dir: BrowserDirectoryHandle,
  depth: number,
  basePath: string,
  hidden: Set<string>,
  fileMap: Map<string, BrowserFileHandle>
): Promise<TreeEntry[]> {
  if (depth <= 0) return [];

  const entries: TreeEntry[] = [];
  for await (const [name, handle] of dir.entries()) {
    if (LOCAL_IGNORED.has(name)) continue;
    if (name.startsWith(".")) continue;

    const relPath = basePath ? `${basePath}/${name}` : name;

    if (handle.kind === "directory") {
      const childEntries = await buildBrowserLocalTree(
        handle,
        depth - 1,
        relPath,
        hidden,
        fileMap
      );
      entries.push({
        name,
        path: relPath,
        type: "directory",
        children: sortTreeEntries(childEntries),
      });
      continue;
    }

    if (hidden.has(name.toLowerCase())) continue;
    fileMap.set(relPath, handle);
    entries.push({ name, path: relPath, type: "file" });
  }

  return sortTreeEntries(entries);
}

function collectFilePaths(entries: TreeEntry[]): string[] {
  const files: string[] = [];
  const walk = (nodes: TreeEntry[]) => {
    for (const node of nodes) {
      if (node.type === "file") {
        files.push(node.path);
      } else if (node.children?.length) {
        walk(node.children);
      }
    }
  };
  walk(entries);
  return files;
}

function pickDefaultPath(entries: TreeEntry[]): string | null {
  const files = collectFilePaths(entries);
  const srcMain = files.find((p) => /(^|\/)src\/main\.cpp$/i.test(p));
  return srcMain || files[0] || null;
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

const XtermTerminal = dynamic(() => import("./xterm-terminal"), {
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

interface ProofRulesInput {
  mode: string;
  regexPatterns: string[];
  instructions: string;
}

interface TestResult {
  status: "running" | "passed" | "failed" | "error";
  message: string;
  output?: string;
  xpAwarded?: number;
}

interface CodeEditorPanelProps {
  lessonId: string;
  partSlug: string;
  lessonSlug: string;
  starter: StarterFiles;
  mode: "lesson" | "quest";
  passed: boolean;
  proofRules?: ProofRulesInput;
}

export function CodeEditorPanel({
  lessonId,
  partSlug,
  lessonSlug,
  starter,
  mode,
  passed: initialPassed,
  proofRules,
}: CodeEditorPanelProps) {
  const hiddenRootFileNames = partSlug === "w01"
    ? ["Makefile", "CMakeLists.txt"]
    : [];
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("server");
  const [workspaceDir, setWorkspaceDir] = useState<string>("");
  const [localRootName, setLocalRootName] = useState<string>("");
  const [localEntries, setLocalEntries] = useState<TreeEntry[]>([]);
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [showTree, setShowTree] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingLocal, setSyncingLocal] = useState(false);
  const [ready, setReady] = useState(false);
  const [folderPickerOpen, setFolderPickerOpen] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [lessonPassed, setLessonPassed] = useState(initialPassed);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const initRef = useRef(false);
  const terminalRef = useRef<XtermTerminalHandle>(null);
  const { editorMode } = useEditorMode();
  const vimStatusRef = useRef<HTMLDivElement>(null);
  const vimModeRef = useRef<{ dispose: () => void } | null>(null);
  const editorInstanceRef = useRef<monacoEditor.IStandaloneCodeEditor | null>(null);
  const vimFocusListenerRef = useRef<{ dispose: () => void } | null>(null);
  const openFilesRef = useRef<OpenFile[]>([]);
  const activeIdxRef = useRef(0);
  const localRootHandleRef = useRef<BrowserDirectoryHandle | null>(null);
  const localFileMapRef = useRef<Map<string, BrowserFileHandle>>(new Map());

  useEffect(() => {
    openFilesRef.current = openFiles;
  }, [openFiles]);

  useEffect(() => {
    activeIdxRef.current = activeIdx;
  }, [activeIdx]);

  const refreshLocalTree = useCallback(async () => {
    const rootHandle = localRootHandleRef.current;
    if (!rootHandle) return [] as TreeEntry[];

    setLocalLoading(true);
    setLocalError(null);
    try {
      const hidden = new Set(hiddenRootFileNames.map((name) => name.toLowerCase()));
      const fileMap = new Map<string, BrowserFileHandle>();
      const tree = await buildBrowserLocalTree(rootHandle, 6, "", hidden, fileMap);
      localFileMapRef.current = fileMap;
      setLocalEntries(tree);
      return tree;
    } catch {
      setLocalError("Failed to load local folder. Reconnect and try again.");
      return [] as TreeEntry[];
    } finally {
      setLocalLoading(false);
    }
  }, [hiddenRootFileNames]);

  const connectLocalFolder = useCallback(async () => {
    const picker = (window as Window & { showDirectoryPicker?: DirectoryPickerFn }).showDirectoryPicker;
    if (!picker) {
      const msg = "Local folder connection requires Chromium and localhost/https.";
      setLocalError(msg);
      window.alert(msg);
      return;
    }

    try {
      const handle = await picker({ mode: "readwrite" });
      localRootHandleRef.current = handle;
      setWorkspaceMode("local");
      setLocalRootName(handle.name || "Local Folder");
      setOpenFiles([]);
      setActiveIdx(0);
      setReady(true);

      const tree = await refreshLocalTree();
      const defaultPath = pickDefaultPath(tree);
      if (defaultPath) {
        const fileHandle = localFileMapRef.current.get(defaultPath);
        if (fileHandle) {
          const file = await fileHandle.getFile();
          const content = await file.text();
          setOpenFiles([
            {
              path: defaultPath,
              name: defaultPath.split("/").pop() || defaultPath,
              content,
              dirty: false,
            },
          ]);
        }
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setLocalError("Failed to connect local folder.");
    }
  }, [refreshLocalTree]);

  const syncLocalToServerWorkspace = useCallback(async () => {
    if (!workspaceDir) {
      throw new Error("Server workspace is not initialized.");
    }
    const rootHandle = localRootHandleRef.current;
    if (!rootHandle) {
      throw new Error("No local folder connected.");
    }

    setSyncingLocal(true);
    try {
      const tree = await refreshLocalTree();
      const filePaths = collectFilePaths(tree);

      let syncErrors = 0;
      for (const relativePath of filePaths) {
        const handle = localFileMapRef.current.get(relativePath);
        if (!handle) continue;
        try {
          const file = await handle.getFile();
          const content = await file.text();
          const serverPath = `${workspaceDir}/${relativePath}`;
          const res = await fetch("/api/fs/write", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: serverPath, content }),
          });
          if (!res.ok) {
            console.warn(`Skipping sync for ${relativePath}: server returned ${res.status}`);
            syncErrors++;
          }
        } catch (err) {
          console.warn(`Skipping sync for ${relativePath}:`, err);
          syncErrors++;
        }
      }
      if (syncErrors > 0) {
        console.warn(`${syncErrors} file(s) failed to sync`);
      }
    } finally {
      setSyncingLocal(false);
    }
  }, [refreshLocalTree, workspaceDir]);

  /* ── Open a workspace directory (re-usable) ── */
  const openWorkspace = useCallback(
    async (dir: string) => {
      setWorkspaceMode("server");
      setWorkspaceDir(dir);
      setLocalError(null);
      setOpenFiles([]);
      setActiveIdx(0);
      setReady(true);

      // Persist choice
      try {
        localStorage.setItem(workspaceStorageKey(lessonId, partSlug), dir);
      } catch { /* full */ }

      // Try to open a sensible default file
      try {
        const treeRes = await fetch(
          `/api/fs/tree?path=${encodeURIComponent(dir)}&depth=2`
        );
        if (treeRes.ok) {
          const treeData = await treeRes.json();
          const entries = (treeData.entries || []) as Array<{
            type: string;
            path: string;
            name: string;
            children?: Array<{ type: string; path: string; name: string }>;
          }>;

          const hidden = new Set(hiddenRootFileNames.map((n) => n.toLowerCase()));

          let candidatePath = "";
          const srcDir = entries.find(
            (e) => e.type === "directory" && e.name === "src"
          );
          if (srcDir?.children) {
            const srcMain = srcDir.children.find(
              (c) => c.type === "file" && c.name === "main.cpp"
            );
            if (srcMain) {
              candidatePath = srcMain.path;
            }
          }

          if (!candidatePath) {
            const firstFile = entries.find(
              (e) => e.type === "file" && !hidden.has(e.name.toLowerCase())
            );
            if (firstFile) {
              candidatePath = firstFile.path;
            }
          }

          if (candidatePath) {
            const readRes = await fetch(
              `/api/fs/read?path=${encodeURIComponent(candidatePath)}`
            );
            if (readRes.ok) {
              const fileData = await readRes.json();
              const name = candidatePath.split("/").pop() || candidatePath;
              setOpenFiles([
                {
                  path: candidatePath,
                  name,
                  content: fileData.content,
                  dirty: false,
                },
              ]);
            }
          }
        }
      } catch { /* ignore */ }
    },
    [hiddenRootFileNames, lessonId, partSlug]
  );

  /* ── Initialize workspace on mount ── */
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    async function initWorkspace() {
      // Check if user previously chose a custom workspace for this lesson
      let savedDir = "";
      try {
        savedDir = localStorage.getItem(workspaceStorageKey(lessonId, partSlug)) || "";
      } catch { /* ignore */ }

      // Force Week 01 to use the real starter/trustctl workspace path.
      if (
        partSlug === "w01" &&
        savedDir &&
        !/[\\/]starter[\\/]trustctl$/.test(savedDir)
      ) {
        savedDir = "";
      }

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
          localStorage.setItem(workspaceStorageKey(lessonId, partSlug), dir);
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
      if (workspaceMode === "local") {
        try {
          const handle = localFileMapRef.current.get(filePath);
          if (!handle) return;
          const file = await handle.getFile();
          const content = await file.text();
          const name = filePath.split("/").pop() || filePath;
          setOpenFiles((prev) => {
            const next = [...prev, { path: filePath, name, content, dirty: false }];
            setActiveIdx(next.length - 1);
            return next;
          });
        } catch {
          // ignore
        }
        return;
      }

      try {
        const res = await fetch(`/api/fs/read?path=${encodeURIComponent(filePath)}`);
        if (!res.ok) return;
        const data = await res.json();
        const name = filePath.split("/").pop() || filePath;
        setOpenFiles((prev) => {
          const next = [...prev, { path: filePath, name, content: data.content, dirty: false }];
          setActiveIdx(next.length - 1);
          return next;
        });
      } catch {
        // ignore
      }
    },
    [openFiles, workspaceMode]
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
      if (workspaceMode === "local") {
        const handle = localFileMapRef.current.get(filePath);
        if (!handle) throw new Error("Local file handle not found");
        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
      } else {
        await fetch("/api/fs/write", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: filePath, content }),
        });
      }
      setOpenFiles((prev) =>
        prev.map((f) => (f.path === filePath ? { ...f, dirty: false } : f))
      );
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }, [workspaceMode]);

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

  const vimSave = useCallback(async () => {
    const idx = activeIdxRef.current;
    const file = openFilesRef.current[idx];
    if (!file) return;
    await saveFile(file.path, file.content);
  }, [saveFile]);

  const vimQuit = useCallback(() => {
    const idx = activeIdxRef.current;
    const file = openFilesRef.current[idx];
    if (!file) return;
    if (file.dirty) {
      window.alert("No write since last change (:q! to force is not supported). Use :w first.");
      return;
    }
    handleCloseFile(idx);
  }, [handleCloseFile]);

  const vimWriteQuit = useCallback(async () => {
    await vimSave();
    const idx = activeIdxRef.current;
    if (openFilesRef.current[idx]) {
      handleCloseFile(idx);
    }
  }, [handleCloseFile, vimSave]);

  /* ── Vim mode attach/detach ── */
  const attachVim = useCallback(async () => {
    if (!editorInstanceRef.current || !vimStatusRef.current) return;
    if (vimModeRef.current) {
      vimModeRef.current.dispose();
      vimModeRef.current = null;
    }
    if (vimFocusListenerRef.current) {
      vimFocusListenerRef.current.dispose();
      vimFocusListenerRef.current = null;
    }
    if (editorMode === "nvim") {
      const { initVimMode, VimMode } = await import("monaco-vim");
      const w = window as VWindow;
      w.__tspVimHook = {
        save: vimSave,
        quit: vimQuit,
        writeQuit: vimWriteQuit,
      };

      if (!w.__tspVimCommandsRegistered) {
        const vimApi = (VimMode as unknown as { Vim?: {
          defineEx: (name: string, shortName: string, fn: () => void) => void;
          map: (lhs: string, rhs: string, context?: string) => void;
        } }).Vim;
        if (vimApi) {
          vimApi.defineEx("write", "w", () => {
            void (window as VWindow).__tspVimHook?.save();
          });
          vimApi.defineEx("quit", "q", () => {
            (window as VWindow).__tspVimHook?.quit();
          });
          vimApi.defineEx("wq", "wq", () => {
            void (window as VWindow).__tspVimHook?.writeQuit();
          });
          vimApi.defineEx("xit", "x", () => {
            void (window as VWindow).__tspVimHook?.writeQuit();
          });
          vimApi.defineEx("bdelete", "bd", () => {
            (window as VWindow).__tspVimHook?.quit();
          });
          vimApi.map("jj", "<Esc>", "insert");
          vimApi.map("jk", "<Esc>", "insert");
        }
        w.__tspVimCommandsRegistered = true;
      }

      vimModeRef.current = initVimMode(editorInstanceRef.current, vimStatusRef.current);
      vimFocusListenerRef.current = editorInstanceRef.current.onDidFocusEditorText(() => {
        (window as VWindow).__tspVimHook = {
          save: vimSave,
          quit: vimQuit,
          writeQuit: vimWriteQuit,
        };
      });
    }
  }, [editorMode, vimQuit, vimSave, vimWriteQuit]);

  useEffect(() => {
    attachVim();
    return () => {
      if (vimModeRef.current) {
        vimModeRef.current.dispose();
        vimModeRef.current = null;
      }
      if (vimFocusListenerRef.current) {
        vimFocusListenerRef.current.dispose();
        vimFocusListenerRef.current = null;
      }
    };
  }, [attachVim]);

  function handleEditorDidMount(editor: monacoEditor.IStandaloneCodeEditor) {
    editorInstanceRef.current = editor;
    attachVim();
  }

  const switchToServerWorkspace = useCallback(async () => {
    if (!workspaceDir) return;
    await openWorkspace(workspaceDir);
  }, [openWorkspace, workspaceDir]);

  const activeFile = openFiles[activeIdx];
  const currentLang = activeFile ? guessLanguage(activeFile.name) : "plaintext";
  const hasWorkspaceRoot = workspaceMode === "local"
    ? Boolean(localRootHandleRef.current)
    : Boolean(workspaceDir);

  /* ── Run test: read output files from local folder, validate against proof rules ── */
  const runTest = useCallback(async () => {
    setTestResult({ status: "running", message: "Reading output files from local folder..." });

    // 1. Collect output from local folder files
    const outputExts = [".txt", ".log", ".out", ".output", ".result"];
    const outputNames = [
      "output.txt", "output.log", "test_output.txt", "results.txt",
      "stdout.txt", "log.txt", "result.txt", "test.log", "run.log",
    ];
    const isOutputFile = (n: string) => {
      const lower = n.toLowerCase();
      const base = lower.split("/").pop() || lower;
      if (outputNames.includes(base)) return true;
      return outputExts.some((e) => base.endsWith(e));
    };

    let collectedOutput = "";
    const outputFiles: { name: string; content: string; modified: number }[] = [];

    // Read output files from connected local folder
    const localMap = localFileMapRef.current;
    if (localMap.size > 0) {
      for (const [relPath, handle] of localMap.entries()) {
        if (!isOutputFile(relPath)) continue;
        try {
          const file = await handle.getFile();
          const text = await file.text();
          if (text.trim()) {
            outputFiles.push({
              name: relPath,
              content: text.trim(),
              modified: file.lastModified,
            });
          }
        } catch {
          // permission expired — skip
        }
      }
    }

    // Also check open editor tabs for output/log files
    for (const f of openFiles) {
      if (isOutputFile(f.name) && f.content.trim()) {
        // Don't duplicate if already read from local folder
        if (!outputFiles.some((o) => o.name === f.name)) {
          outputFiles.push({ name: f.name, content: f.content.trim(), modified: Date.now() });
        }
      }
    }

    if (outputFiles.length === 0) {
      setTestResult({
        status: "error",
        message: "No output file found. Run your program locally and save output to output.txt, then try again.",
        output: "How to test:\n1. Compile: g++ -o main main.cpp\n2. Run: ./main > output.txt 2>&1\n3. Click Testing again",
      });
      return;
    }

    // Sort by most recently modified and concatenate all output
    outputFiles.sort((a, b) => b.modified - a.modified);
    collectedOutput = outputFiles.map((f) => f.content).join("\n");

    setTestResult({
      status: "running",
      message: `Validating ${outputFiles.length} output file(s)...`,
    });

    // 2. Validate output against proof regex patterns
    const patterns = proofRules?.regexPatterns || [];
    let proofPassed = true;
    let validationMessage = `Output read from: ${outputFiles.map((f) => f.name).join(", ")}`;

    if (patterns.length > 0) {
      const checks = patterns.map((p: string) => {
        try {
          return { pattern: p, matched: new RegExp(p, "im").test(collectedOutput) };
        } catch {
          return { pattern: p, matched: false };
        }
      });
      const matchedCount = checks.filter((c: { matched: boolean }) => c.matched).length;
      proofPassed = matchedCount === checks.length;

      if (proofPassed) {
        validationMessage = `All ${checks.length} check(s) passed!`;
      } else {
        const missing = checks
          .filter((c: { matched: boolean }) => !c.matched)
          .map((c: { pattern: string }) => c.pattern);
        validationMessage = `${matchedCount}/${checks.length} checks passed. Missing patterns: ${missing.join(", ")}`;
      }
    }

    if (!proofPassed) {
      setTestResult({
        status: "failed",
        message: validationMessage,
        output: collectedOutput.slice(-500),
      });
      return;
    }

    // 3. Auto-submit proof to earn XP (skip defense challenge for automated tests)
    try {
      const formData = new FormData();
      if (mode === "quest") {
        formData.set("questId", lessonId);
        formData.set("partSlug", partSlug);
      } else {
        formData.set("lessonId", lessonId);
        formData.set("partSlug", partSlug);
        formData.set("lessonSlug", lessonSlug);
      }
      formData.set("pastedText", collectedOutput.slice(-2000));
      formData.set("manualPass", "true");
      formData.set("skipDefense", "true");

      const endpoint = mode === "quest"
        ? "/api/submissions/quest"
        : "/api/submissions/lesson";
      const subRes = await fetch(endpoint, { method: "POST", body: formData });
      const subData = await subRes.json();

      if (subRes.ok && subData.status === "passed") {
        setLessonPassed(true);
        setTestResult({
          status: "passed",
          message: validationMessage,
          output: collectedOutput.slice(-300),
          xpAwarded: subData.xpAwarded || 0,
        });
      } else {
        setTestResult({
          status: "failed",
          message: subData.error || subData.message || "Submission failed",
          output: collectedOutput.slice(-300),
        });
      }
    } catch {
      setTestResult({
        status: "error",
        message: "Could not submit proof — are you logged in?",
        output: collectedOutput.slice(-300),
      });
    }
  }, [openFiles, proofRules, mode, lessonId, partSlug, lessonSlug]);

  /* ── Mark lesson as passed without testing ── */
  const markPassed = useCallback(async () => {
    if (lessonPassed) return;
    setTestResult({ status: "running", message: "Marking as passed..." });

    try {
      const formData = new FormData();
      if (mode === "quest") {
        formData.set("questId", lessonId);
        formData.set("partSlug", partSlug);
      } else {
        formData.set("lessonId", lessonId);
        formData.set("partSlug", partSlug);
        formData.set("lessonSlug", lessonSlug);
      }
      formData.set("pastedText", "Manually marked as passed");
      formData.set("manualPass", "true");
      formData.set("skipDefense", "true");

      const endpoint = mode === "quest"
        ? "/api/submissions/quest"
        : "/api/submissions/lesson";
      const subRes = await fetch(endpoint, { method: "POST", body: formData });
      const subData = await subRes.json();

      if (subRes.ok && subData.status === "passed") {
        setLessonPassed(true);
        setTestResult({
          status: "passed",
          message: "Lesson completed!",
          xpAwarded: subData.xpAwarded || 0,
        });
      } else {
        setTestResult({
          status: "failed",
          message: subData.error || subData.message || "Failed to mark as passed",
        });
      }
    } catch {
      setTestResult({
        status: "error",
        message: "Could not submit — are you logged in?",
      });
    }
  }, [lessonPassed, mode, lessonId, partSlug, lessonSlug]);

  return (
    <div className="flex h-full">
      {/* ── File tree sidebar ── */}
      {/* ── Folder picker modal ── */}
      {workspaceMode === "server" && folderPickerOpen && (
        <FolderPicker
          currentDir={workspaceDir || undefined}
          onSelect={(dir) => {
            setFolderPickerOpen(false);
            void openWorkspace(dir);
          }}
          onClose={() => setFolderPickerOpen(false)}
        />
      )}

      {/* ── File tree sidebar ── */}
      {showTree && hasWorkspaceRoot && (
        <div className="w-48 shrink-0 border-r border-gray-700 overflow-hidden">
          <FileTree
            rootDir={workspaceMode === "local" ? localRootName || "Local Folder" : workspaceDir}
            entries={workspaceMode === "local" ? localEntries : undefined}
            loading={workspaceMode === "local" ? localLoading : undefined}
            error={workspaceMode === "local" ? localError : undefined}
            onRefresh={workspaceMode === "local" ? () => { void refreshLocalTree(); } : undefined}
            activeFile={activeFile?.path}
            onOpenFile={handleOpenFile}
            onOpenFolder={() => {
              if (workspaceMode === "local") {
                void connectLocalFolder();
                return;
              }
              setFolderPickerOpen(true);
            }}
            hiddenFileNames={hiddenRootFileNames}
          />
        </div>
      )}

      {/* ── Editor + terminal area ── */}
      <div className="flex flex-col flex-1 min-w-0 relative">
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
            <span className="text-[10px] uppercase tracking-wide text-gray-500 px-1">
              {workspaceMode === "local" ? "local" : "server"}
            </span>
            <button
              type="button"
              onClick={() => {
                void connectLocalFolder();
              }}
              className="editor-btn text-[11px]"
              title="Connect browser-local folder"
            >
              💻 Local Folder
            </button>
            <button
              type="button"
              onClick={() => {
                void switchToServerWorkspace();
              }}
              className="editor-btn text-[11px]"
              title="Switch back to server workspace"
              disabled={!workspaceDir}
            >
              ☁ Server Folder
            </button>
            <button
              type="button"
              onClick={() => setFolderPickerOpen(true)}
              className="editor-btn text-[11px]"
              title="Browse server workspace folders"
              disabled={workspaceMode !== "server"}
            >
              📂 Open Folder
            </button>
            {workspaceMode === "local" && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await syncLocalToServerWorkspace();
                  } catch (err) {
                    const msg = err instanceof Error ? err.message : "Sync failed";
                    window.alert(msg);
                  }
                }}
                className="editor-btn text-[11px]"
                title="Sync local folder files into server workspace for terminal commands"
                disabled={!workspaceDir || syncingLocal}
              >
                {syncingLocal ? "↻ Syncing" : "⇅ Sync"}
              </button>
            )}
            {workspaceMode === "server" && workspaceDir && (
              <button
                type="button"
                onClick={() => {
                  const normalizedPath = workspaceDir.replace(/\\/g, "/");
                  window.open(`vscode://file/${normalizedPath}`);
                }}
                className="editor-btn text-[11px]"
                title="Open workspace folder in VS Code"
              >
                VS Code
              </button>
            )}
            <button
              type="button"
              onClick={runTest}
              className="editor-btn text-[11px]"
              title="Check output.txt from your local folder — compile & run locally first, then click to validate"
              disabled={testResult?.status === "running"}
            >
              {testResult?.status === "running" ? "⏳ Checking..." : "🧪 Testing"}
            </button>
            <button
              type="button"
              onClick={markPassed}
              className="editor-btn text-[11px] text-green-400 hover:text-green-300"
              title="Mark this lesson as complete and earn XP"
              disabled={lessonPassed || testResult?.status === "running"}
            >
              {lessonPassed ? "✅ Passed" : "✓ Pass"}
            </button>
            {(saving || syncingLocal) && (
              <span className="text-[10px] text-gray-500">
                {syncingLocal ? "syncing…" : "saving…"}
              </span>
            )}
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
            {ready && workspaceDir ? (
              <XtermTerminal
                ref={terminalRef}
                wsUrl="ws://localhost:3061"
                cwd={workspaceDir}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-[#0a0a0f] text-gray-600 text-sm">
                Initializing…
              </div>
            )}
          </Panel>
        </Group>

        {/* ── Test Result Overlay ── */}
        {testResult && testResult.status !== "running" && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className={`
              w-[420px] max-w-[90%] rounded-2xl border p-6 shadow-2xl
              ${testResult.status === "passed"
                ? "bg-green-950/90 border-green-500/40"
                : testResult.status === "failed"
                  ? "bg-red-950/90 border-red-500/40"
                  : "bg-yellow-950/90 border-yellow-500/40"
              }
            `}>
              {/* Status icon + title */}
              <div className="text-center mb-4">
                <div className="text-5xl mb-2">
                  {testResult.status === "passed" ? "✅" : testResult.status === "failed" ? "❌" : "⚠️"}
                </div>
                <h3 className={`text-xl font-bold ${
                  testResult.status === "passed" ? "text-green-300" : testResult.status === "failed" ? "text-red-300" : "text-yellow-300"
                }`}>
                  {testResult.status === "passed" ? "PASSED" : testResult.status === "failed" ? "FAILED" : "ERROR"}
                </h3>
              </div>

              {/* XP award */}
              {testResult.status === "passed" && testResult.xpAwarded !== undefined && testResult.xpAwarded > 0 && (
                <div className="text-center mb-3">
                  <span className="inline-block px-4 py-1.5 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 font-bold text-lg">
                    +{testResult.xpAwarded} XP
                  </span>
                </div>
              )}

              {/* Message */}
              <p className="text-sm text-gray-300 text-center mb-3">
                {testResult.message}
              </p>

              {/* Output preview */}
              {testResult.output && (
                <pre className="text-xs text-gray-400 bg-black/50 rounded-lg p-3 max-h-32 overflow-auto font-mono whitespace-pre-wrap mb-4">
                  {testResult.output.trim()}
                </pre>
              )}

              {/* Dismiss */}
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setTestResult(null)}
                  className={`px-5 py-2 rounded-lg font-semibold text-sm transition-colors ${
                    testResult.status === "passed"
                      ? "bg-green-600 hover:bg-green-500 text-white"
                      : "bg-gray-700 hover:bg-gray-600 text-gray-200"
                  }`}
                >
                  {testResult.status === "passed" ? "Continue" : "Try Again"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
