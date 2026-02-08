"use client";

import type { StarterFiles } from "@/lib/starter-code";
import { guessLanguage } from "@/lib/starter-code";

interface FileTabsProps {
  files: StarterFiles["files"];
  activeFile: string;
  onSelect: (filename: string) => void;
}

export function FileTabs({ files, activeFile, onSelect }: FileTabsProps) {
  const filenames = Object.keys(files);

  if (filenames.length <= 1) {
    // Single file — just show the filename as a static tab
    return (
      <div className="flex items-center bg-gray-900 px-2 shrink-0">
        <div className="flex items-center gap-2 px-3 py-2 text-sm text-yellow-400 border-b-2 border-yellow-500 bg-gray-850">
          <FileIcon filename={activeFile} />
          <span className="font-medium">{activeFile}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center bg-gray-900 overflow-x-auto shrink-0">
      {filenames.map((name) => {
        const isActive = name === activeFile;
        return (
          <button
            key={name}
            type="button"
            onClick={() => onSelect(name)}
            className={`
              flex items-center gap-2 px-3 py-2 text-sm font-medium
              whitespace-nowrap transition-colors shrink-0
              ${isActive
                ? "text-yellow-400 border-b-2 border-yellow-500 bg-gray-850"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800 border-b-2 border-transparent"
              }
            `}
          >
            <FileIcon filename={name} />
            {name}
          </button>
        );
      })}
    </div>
  );
}

function FileIcon({ filename }: { filename: string }) {
  const lang = guessLanguage(filename);
  const icons: Record<string, string> = {
    cpp: "⚙️",
    c: "⚙️",
    python: "🐍",
    javascript: "📜",
    typescript: "📜",
    rust: "🦀",
    makefile: "🔧",
    cmake: "🔧",
    json: "📋",
    shell: "🖥️",
    markdown: "📝",
  };
  return <span className="text-xs">{icons[lang] || "📄"}</span>;
}
