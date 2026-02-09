"use client";

import { useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import type { editor as monacoEditor } from "monaco-editor";
import { useEditorMode } from "@/lib/use-editor-mode";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-gray-850">
        <div className="flex items-center gap-3 text-gray-500">
          <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
          <span className="text-sm">Loading editor...</span>
        </div>
      </div>
    ),
  },
);

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  height?: string;
  className?: string;
}

export function CodeEditor({
  value,
  onChange,
  language = "cpp",
  readOnly = false,
  height = "100%",
  className = "",
}: CodeEditorProps) {
  const { editorMode } = useEditorMode();
  const vimStatusRef = useRef<HTMLDivElement>(null);
  const vimModeRef = useRef<{ dispose: () => void } | null>(null);
  const editorRef = useRef<monacoEditor.IStandaloneCodeEditor | null>(null);

  const attachVim = useCallback(async () => {
    if (!editorRef.current || !vimStatusRef.current) return;
    // Clean up previous vim instance
    if (vimModeRef.current) {
      vimModeRef.current.dispose();
      vimModeRef.current = null;
    }
    if (editorMode === "nvim") {
      const { initVimMode } = await import("monaco-vim");
      vimModeRef.current = initVimMode(editorRef.current, vimStatusRef.current);
    }
  }, [editorMode]);

  // Re-attach vim mode when editorMode changes
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
    editorRef.current = editor;
    attachVim();
  }

  return (
    <div className={`monaco-wrapper h-full w-full flex flex-col ${className}`}>
      <div className="flex-1 min-h-0">
        <MonacoEditor
          height={height}
          language={language}
          value={value}
          onChange={(val) => onChange?.(val || "")}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            readOnly,
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            minimap: { enabled: false },
            lineNumbers: editorMode === "nvim" ? "relative" : "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 16, bottom: 16 },
            renderLineHighlight: "line",
            cursorBlinking: editorMode === "nvim" ? "solid" : "smooth",
            cursorStyle: editorMode === "nvim" ? "block" : "line",
            smoothScrolling: true,
            tabSize: 4,
            wordWrap: "on",
            bracketPairColorization: { enabled: true },
          }}
        />
      </div>
      {editorMode === "nvim" && (
        <div
          ref={vimStatusRef}
          className="h-6 px-3 flex items-center text-xs font-mono bg-[#1a1b26] text-[#7aa2f7] border-t border-gray-700 shrink-0"
        />
      )}
    </div>
  );
}
