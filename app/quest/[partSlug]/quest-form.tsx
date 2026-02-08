"use client";

import { useState } from "react";

export function QuestSubmissionForm({
  questId,
  partSlug,
  passed,
}: {
  questId: string;
  partSlug: string;
  passed: boolean;
}) {
  const [text, setText] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ status: string; message: string } | null>(null);

  async function submit(manualPass: boolean) {
    if (!text.trim() && !proofFile) {
      setResult({ status: "failed", message: "Paste output or attach a proof file." });
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    const formData = new FormData();
    formData.set("questId", questId);
    formData.set("partSlug", partSlug);
    formData.set("pastedText", text);
    formData.set("manualPass", manualPass ? "true" : "false");
    if (proofFile) {
      formData.set("proofFile", proofFile);
    }

    try {
      const response = await fetch("/api/submissions/quest", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        setResult({ status: "failed", message: data.error || "Submission failed." });
        return;
      }

      setResult({ status: data.status, message: data.message });
      if (data.status === "passed") {
        setText("");
        setProofFile(null);
      }
    } catch {
      setResult({ status: "failed", message: "Network error while submitting proof." });
    } finally {
      setIsSubmitting(false);
    }
  }

  const resultClass = result?.status === "passed"
    ? "bg-green-950/50 border-green-800/20 text-green-500"
    : "bg-red-950/50 border-red-500/20 text-red-400";

  return (
    <div className="flex flex-col gap-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste command output, verification notes, or summary..."
        className="w-full h-48 bg-gray-800 border border-gray-700 rounded-xl p-4 text-gray-200 placeholder:text-gray-500 resize-y focus:outline-none focus:border-red-400"
        disabled={isSubmitting}
      />

      <input
        type="file"
        onChange={(e) => setProofFile(e.target.files?.[0] || null)}
        className="w-full text-xs text-gray-300 file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border file:border-gray-600 file:bg-gray-800 file:text-gray-200"
        disabled={isSubmitting}
      />

      {result && <div className={`text-sm p-3 rounded-lg border ${resultClass}`}>{result.message}</div>}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => submit(false)}
          disabled={isSubmitting}
          className="btn-primary disabled:opacity-40"
        >
          {isSubmitting ? "Submitting..." : "Auto Check"}
        </button>
        <button
          type="button"
          onClick={() => submit(true)}
          disabled={isSubmitting}
          className="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-600 text-gray-200 hover:border-yellow-500 disabled:opacity-40"
        >
          Mark Passed
        </button>
      </div>

      {passed && !result && (
        <div className="text-xs text-green-500">This quest is already passed. New submissions are still allowed.</div>
      )}
    </div>
  );
}
