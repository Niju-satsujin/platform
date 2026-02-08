"use client";

import { useState } from "react";
import { CARD_TYPES } from "@/lib/flashcard-scheduler";

interface CardCreatorProps {
  onCreated: () => void;
  prefillTags?: Record<string, string>;
}

export function CardCreator({ onCreated, prefillTags }: CardCreatorProps) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [type, setType] = useState("concept");
  const [hint, setHint] = useState("");
  const [sourceRef, setSourceRef] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim()) {
      setError("Front and back are required.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/flashcards/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          front: front.trim(),
          back: back.trim(),
          type,
          hint: hint.trim() || null,
          tags: prefillTags || {},
          sourceRef: sourceRef.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create card");
      }

      setSuccess(true);
      setFront("");
      setBack("");
      setHint("");
      setSourceRef("");

      setTimeout(() => {
        setSuccess(false);
        onCreated();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="game-card p-6 max-w-2xl mx-auto">
      <h3 className="text-sm font-semibold text-gray-300 mb-4">Create New Flashcard</h3>

      {success && (
        <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
          ✓ Card created successfully!
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type */}
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Type</label>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(CARD_TYPES).map(([key, info]) => (
              <button
                key={key}
                type="button"
                onClick={() => setType(key)}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                  type === key
                    ? "bg-gray-700 border-yellow-500/50 text-gray-200"
                    : "bg-gray-800/50 border-gray-700 text-gray-500 hover:text-gray-300"
                }`}
              >
                {info.icon} {info.label}
              </button>
            ))}
          </div>
        </div>

        {/* Front */}
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">
            Front (Question)
          </label>
          <textarea
            value={front}
            onChange={(e) => setFront(e.target.value)}
            rows={3}
            placeholder="What is the purpose of a Write-Ahead Log?"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500 resize-y"
          />
        </div>

        {/* Back */}
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">
            Back (Answer)
          </label>
          <textarea
            value={back}
            onChange={(e) => setBack(e.target.value)}
            rows={4}
            placeholder="A WAL ensures durability by writing changes to a sequential log before applying them..."
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500 resize-y"
          />
        </div>

        {/* Hint (for debug/gotcha) */}
        {(type === "debug" || type === "gotcha") && (
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">
              💡 Why This Trips People Up
            </label>
            <textarea
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              rows={2}
              placeholder="Common misconception: people assume..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500 resize-y"
            />
          </div>
        )}

        {/* Source ref */}
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">
            Source Reference (optional)
          </label>
          <input
            type="text"
            value={sourceRef}
            onChange={(e) => setSourceRef(e.target.value)}
            placeholder="e.g. w03-d01 or lesson slug"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn-primary w-full disabled:opacity-50"
        >
          {saving ? "Creating…" : "Create Card"}
        </button>
      </form>
    </div>
  );
}
