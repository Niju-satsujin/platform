"use client";

import { useState } from "react";

interface ProofBoxProps {
  lessonId: string;
  partSlug: string;
  lessonSlug: string;
  passed: boolean;
  proofInstructions: string;
  whatCounts?: string;
  /** "lesson" (default) or "quest" — determines submission API */
  mode?: "lesson" | "quest";
}

export function ProofBox({
  lessonId,
  partSlug,
  lessonSlug,
  passed,
  proofInstructions,
  whatCounts,
  mode = "lesson",
}: ProofBoxProps) {
  const [text, setText] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    status: string;
    message: string;
  } | null>(null);

  async function submit(manualPass: boolean) {
    if (!text.trim() && !proofFile) {
      setResult({
        status: "failed",
        message: "Paste output or attach a proof file.",
      });
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    const formData = new FormData();
    if (mode === "quest") {
      formData.set("questId", lessonId);
      formData.set("partSlug", partSlug);
    } else {
      formData.set("lessonId", lessonId);
      formData.set("partSlug", partSlug);
      formData.set("lessonSlug", lessonSlug);
    }
    formData.set("pastedText", text);
    formData.set("manualPass", manualPass ? "true" : "false");
    if (proofFile) {
      formData.set("proofFile", proofFile);
    }

    try {
      const endpoint =
        mode === "quest"
          ? "/api/submissions/quest"
          : "/api/submissions/lesson";
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        setResult({
          status: "failed",
          message: data.error || "Submission failed.",
        });
        return;
      }

      setResult({ status: data.status, message: data.message });
      if (data.status === "passed") {
        setText("");
        setProofFile(null);
      }
    } catch {
      setResult({
        status: "failed",
        message: "Network error while submitting proof.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const resultBg =
    result?.status === "passed"
      ? "bg-green-950/50 border-green-800/20 text-green-400"
      : "bg-red-950/50 border-red-500/20 text-red-400";

  return (
    <section className="game-card p-5">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h2 className="text-lg font-bold text-gray-100">Proof Submission</h2>
        {passed && <span className="badge badge-success">Passed ✓</span>}
      </div>

      {/* What counts as proof */}
      {whatCounts && (
        <p className="text-sm text-gray-300 mb-3 border-l-2 border-yellow-600/40 pl-3">
          <span className="text-yellow-400 font-semibold">What counts:</span>{" "}
          {whatCounts}
        </p>
      )}

      <p className="text-sm text-gray-400 mb-4">{proofInstructions}</p>

      <div className="flex flex-col gap-3">
        {/* Text area */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste command output, summary, or verification notes..."
          className="w-full h-36 bg-gray-900 border border-gray-700 rounded-xl p-4 text-gray-200 text-sm leading-relaxed placeholder:text-gray-550 resize-y focus:outline-none focus:border-yellow-500 transition-colors"
          disabled={isSubmitting}
        />

        {/* File upload */}
        <input
          type="file"
          onChange={(e) => setProofFile(e.target.files?.[0] || null)}
          className="w-full text-xs text-gray-300 file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border file:border-gray-600 file:bg-gray-800 file:text-gray-200 file:cursor-pointer"
          disabled={isSubmitting}
        />

        {/* Result banner */}
        {result && (
          <div
            className={`text-sm p-3 rounded-lg border font-medium ${resultBg}`}
          >
            {result.status === "passed" ? "✅ " : "❌ "}
            {result.message}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => submit(false)}
            disabled={isSubmitting}
            className="btn-primary disabled:opacity-40"
          >
            {isSubmitting ? "Checking..." : "Auto Check"}
          </button>
          <button
            type="button"
            onClick={() => submit(true)}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-600 text-gray-200 hover:border-yellow-500 transition-colors disabled:opacity-40"
          >
            Mark Passed
          </button>
        </div>

        {passed && !result && (
          <p className="text-xs text-green-500">
            ✓ Already passed. New submissions are still allowed.
          </p>
        )}
      </div>
    </section>
  );
}
