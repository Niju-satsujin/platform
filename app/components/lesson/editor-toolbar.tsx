"use client";

import { useState, useCallback } from "react";

interface EditorToolbarProps {
  /** Current code in editor */
  code: string;
  /** All files for download */
  files: Record<string, string>;
  /** Run command hint */
  runCommand: string;
  /** Lesson ID for proof submission */
  lessonId: string;
  partSlug: string;
  lessonSlug: string;
  /** lesson or quest */
  mode: "lesson" | "quest";
  /** Whether already passed */
  passed: boolean;
  /** Callback to reset editor to starter code */
  onReset: () => void;
}

export function EditorToolbar({
  code,
  files,
  runCommand,
  lessonId,
  partSlug,
  lessonSlug,
  mode,
  passed,
  onReset,
}: EditorToolbarProps) {
  const [copied, setCopied] = useState(false);
  const [showRunCmd, setShowRunCmd] = useState(false);
  const [showProof, setShowProof] = useState(false);
  const [proofText, setProofText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    status: string;
    message: string;
  } | null>(null);

  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [code]);

  const downloadZip = useCallback(async () => {
    // Create a simple multi-file download as a tar-like text blob
    // For v1, download each file separately or a concatenated text
    const filenames = Object.keys(files);
    if (filenames.length === 1) {
      // Single file download
      const [name, content] = Object.entries(files)[0];
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Multiple files — download each
      for (const [name, content] of Object.entries(files)) {
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        a.click();
        URL.revokeObjectURL(url);
      }
    }
  }, [files]);

  const submitProof = useCallback(async () => {
    if (!proofText.trim()) return;
    setSubmitting(true);
    setSubmitResult(null);

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
        setSubmitResult({
          status: "failed",
          message: data.error || "Submission failed.",
        });
      } else {
        setSubmitResult({ status: data.status, message: data.message });
        if (data.status === "passed") setProofText("");
      }
    } catch {
      setSubmitResult({
        status: "failed",
        message: "Network error while submitting.",
      });
    } finally {
      setSubmitting(false);
    }
  }, [proofText, lessonId, partSlug, lessonSlug, mode]);

  return (
    <div className="border-t border-gray-700 bg-gray-900 shrink-0">
      {/* Button row */}
      <div className="flex items-center gap-2 px-3 py-2 flex-wrap">
        {/* Copy */}
        <button
          type="button"
          onClick={copyCode}
          className="editor-btn"
          title="Copy code to clipboard"
        >
          {copied ? "✅ Copied" : "📋 Copy"}
        </button>

        {/* Download */}
        <button
          type="button"
          onClick={downloadZip}
          className="editor-btn"
          title="Download starter files"
        >
          📥 Download
        </button>

        {/* Run command */}
        <button
          type="button"
          onClick={() => setShowRunCmd(!showRunCmd)}
          className="editor-btn"
          title="Show the command to run locally"
        >
          🖥️ Run cmd
        </button>

        {/* Paste proof */}
        <button
          type="button"
          onClick={() => setShowProof(!showProof)}
          className={`editor-btn ${showProof ? "editor-btn-active" : ""}`}
          title="Paste your proof output"
        >
          🧾 Paste proof
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Reset */}
        <button
          type="button"
          onClick={onReset}
          className="editor-btn text-red-400 hover:text-red-300"
          title="Reset to starter code"
        >
          ↩ Reset
        </button>

        {passed && (
          <span className="text-xs text-green-400 font-semibold">
            ✓ Passed
          </span>
        )}
      </div>

      {/* Run command panel */}
      {showRunCmd && (
        <div className="px-3 pb-2 animate-fade-in">
          <div className="bg-gray-800 rounded-lg p-3 font-mono text-sm text-gray-200 flex items-center gap-2">
            <span className="text-gray-500 select-none">$</span>
            <code className="flex-1 select-all">{runCommand}</code>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(runCommand);
              }}
              className="text-gray-400 hover:text-yellow-400 text-xs"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {/* Proof paste panel */}
      {showProof && (
        <div className="px-3 pb-3 space-y-2 animate-fade-in">
          <textarea
            value={proofText}
            onChange={(e) => setProofText(e.target.value)}
            placeholder="Paste your terminal output here..."
            rows={4}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-gray-200 font-mono placeholder-gray-500 focus:border-yellow-500/50 focus:outline-none resize-y"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={submitProof}
              disabled={submitting || !proofText.trim()}
              className="btn-primary text-sm py-1.5 px-4 disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit Proof"}
            </button>
            {submitResult && (
              <span
                className={`text-sm font-semibold ${
                  submitResult.status === "passed"
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {submitResult.status === "passed" ? "✅" : "❌"}{" "}
                {submitResult.message}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
