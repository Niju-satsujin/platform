"use client";

import dynamic from "next/dynamic";

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
  return (
    <div className={`monaco-wrapper h-full w-full ${className}`}>
      <MonacoEditor
        height={height}
        language={language}
        value={value}
        onChange={(val) => onChange?.(val || "")}
        theme="vs-dark"
        options={{
          readOnly,
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          minimap: { enabled: false },
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 16, bottom: 16 },
          renderLineHighlight: "line",
          cursorBlinking: "smooth",
          smoothScrolling: true,
          tabSize: 4,
          wordWrap: "on",
          bracketPairColorization: { enabled: true },
        }}
      />
    </div>
  );
}
