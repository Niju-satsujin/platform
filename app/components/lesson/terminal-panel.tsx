"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface TerminalPanelProps {
  /** The compile/run command for this lesson */
  runCommand: string;
  /** Lesson ID for proof submission */
  lessonId: string;
  partSlug: string;
  lessonSlug: string;
  /** lesson or quest */
  mode: "lesson" | "quest";
  /** Whether already passed */
  passed: boolean;
}

interface TerminalLine {
  type: "prompt" | "output" | "error" | "success" | "info";
  text: string;
}

export function TerminalPanel({
  runCommand,
  lessonId,
  partSlug,
  lessonSlug,
  mode,
  passed: initialPassed,
}: TerminalPanelProps) {
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: "info", text: "Terminal ready. Type a command or paste output below." },
    { type: "info", text: `Compile: ${runCommand}` },
    { type: "prompt", text: "" },
  ]);
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [passed, setPassed] = useState(initialPassed);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new lines arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const addLines = useCallback((...newLines: TerminalLine[]) => {
    setLines((prev) => [...prev, ...newLines]);
  }, []);

  const handleCommand = useCallback(
    async (cmd: string) => {
      const trimmed = cmd.trim();
      if (!trimmed) return;

      // Echo the command
      addLines({ type: "prompt", text: trimmed });

      // Built-in commands
      if (trimmed === "help") {
        addLines(
          { type: "info", text: "Available commands:" },
          { type: "info", text: "  compile    — Show compile/run command" },
          { type: "info", text: "  submit     — Submit pasted output as proof" },
          { type: "info", text: "  paste      — Paste mode (multi-line input)" },
          { type: "info", text: "  clear      — Clear terminal" },
          { type: "info", text: "  help       — Show this help" },
          { type: "prompt", text: "" }
        );
        return;
      }

      if (trimmed === "clear") {
        setLines([
          { type: "info", text: "Terminal cleared." },
          { type: "prompt", text: "" },
        ]);
        return;
      }

      if (trimmed === "compile" || trimmed === "run" || trimmed === "build") {
        addLines(
          { type: "info", text: "Copy and run in your local terminal:" },
          { type: "output", text: `$ ${runCommand}` },
          { type: "info", text: "" },
          { type: "info", text: "Then paste the output here and type 'submit'" },
          { type: "prompt", text: "" }
        );
        return;
      }

      if (trimmed === "submit") {
        // Collect all non-prompt, non-info lines as proof text
        const proofLines = lines
          .filter((l) => l.type === "output" || l.type === "error")
          .map((l) => l.text);

        if (proofLines.length === 0) {
          addLines(
            {
              type: "error",
              text: "Nothing to submit. Paste your terminal output first, then type 'submit'.",
            },
            { type: "prompt", text: "" }
          );
          return;
        }

        const proofText = proofLines.join("\n");
        addLines({ type: "info", text: "Submitting proof…" });
        setSubmitting(true);

        const formData = new FormData();
        if (mode === "quest") {
          formData.set("questId", lessonId);
          formData.set("partSlug", partSlug);
        } else {
          formData.set("lessonId", lessonId);
          formData.set("partSlug", partSlug);
          formData.set("lessonSlug", lessonSlug);
        }
        formData.set("pastedText", proofText);
        formData.set("manualPass", "false");

        try {
          const endpoint =
            mode === "quest"
              ? "/api/submissions/quest"
              : "/api/submissions/lesson";
          const res = await fetch(endpoint, { method: "POST", body: formData });
          const data = await res.json();

          if (!res.ok) {
            addLines(
              { type: "error", text: `✗ ${data.error || "Submission failed."}` },
              { type: "prompt", text: "" }
            );
          } else if (data.status === "passed") {
            setPassed(true);
            addLines(
              { type: "success", text: `✓ PASSED — ${data.message}` },
              {
                type: "success",
                text: `  +${data.xp || 0} XP awarded`,
              },
              { type: "prompt", text: "" }
            );
          } else {
            addLines(
              { type: "error", text: `✗ FAILED — ${data.message}` },
              { type: "info", text: "Fix your code and try again." },
              { type: "prompt", text: "" }
            );
          }
        } catch {
          addLines(
            { type: "error", text: "✗ Network error while submitting." },
            { type: "prompt", text: "" }
          );
        } finally {
          setSubmitting(false);
        }
        return;
      }

      // Anything else → treat as pasted output
      addLines({ type: "output", text: trimmed }, { type: "prompt", text: "" });
    },
    [addLines, lines, runCommand, lessonId, partSlug, lessonSlug, mode]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !submitting) {
      handleCommand(input);
      setInput("");
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text");
    if (pasted.includes("\n")) {
      e.preventDefault();
      // Multi-line paste → add each line as output
      const pastedLines = pasted.split("\n").filter((l) => l.length > 0);
      const newLines: TerminalLine[] = pastedLines.map((text) => ({
        type: "output" as const,
        text,
      }));
      addLines(...newLines, { type: "prompt", text: "" });
      addLines({
        type: "info",
        text: `Pasted ${pastedLines.length} lines. Type 'submit' to send as proof.`,
      });
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 font-mono text-sm">
      {/* Terminal header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-900 border-b border-gray-700 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">⬤</span>
          <span className="text-xs font-semibold text-gray-400">Terminal</span>
          {passed && (
            <span className="text-xs text-green-400 font-semibold ml-2">
              ✓ Passed
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(runCommand);
            }}
            className="text-[10px] text-gray-500 hover:text-yellow-400 transition-colors px-1.5 py-0.5 rounded hover:bg-gray-800"
            title="Copy compile command"
          >
            📋 cmd
          </button>
          <button
            type="button"
            onClick={() =>
              setLines([
                { type: "info", text: "Terminal cleared." },
                { type: "prompt", text: "" },
              ])
            }
            className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors px-1.5 py-0.5 rounded hover:bg-gray-800"
            title="Clear terminal"
          >
            ✕ clear
          </button>
        </div>
      </div>

      {/* Terminal output area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-0.5 min-h-0 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {lines.map((line, i) => (
          <div key={i} className="flex items-start gap-0 leading-5">
            {line.type === "prompt" && line.text === "" ? null : (
              <>
                {line.type === "prompt" && (
                  <span className="text-green-400 select-none mr-1">$</span>
                )}
                <span
                  className={
                    line.type === "prompt"
                      ? "text-gray-100"
                      : line.type === "output"
                        ? "text-gray-300"
                        : line.type === "error"
                          ? "text-red-400"
                          : line.type === "success"
                            ? "text-green-400"
                            : "text-gray-500"
                  }
                >
                  {line.text}
                </span>
              </>
            )}
          </div>
        ))}

        {/* Input line */}
        <div className="flex items-center gap-0">
          <span className="text-green-400 select-none mr-1">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={submitting}
            placeholder={submitting ? "submitting…" : "type command or paste output…"}
            className="flex-1 bg-transparent text-gray-100 outline-none placeholder-gray-600 caret-yellow-400 disabled:opacity-50"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
