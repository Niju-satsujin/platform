"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { getSessionToken } from "@/app/components/session-guard";

interface Lesson {
  id: string;
  slug: string;
  title: string;
  order: number;
  durationMinutes: number;
}

interface Quest {
  id: string;
  slug: string;
  title: string;
}

interface Part {
  id: string;
  slug: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
  quest: Quest | null;
}

function apiUrl(path: string) {
  const token = getSessionToken();
  return token ? `${path}?t=${encodeURIComponent(token)}` : path;
}

export default function AdminDashboard() {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreatePart, setShowCreatePart] = useState(false);
  const [expandedPart, setExpandedPart] = useState<string | null>(null);

  // Create part form
  const [newSlug, setNewSlug] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newOrder, setNewOrder] = useState("");
  const [creating, setCreating] = useState(false);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchParts = async () => {
    try {
      const res = await fetch(apiUrl("/api/admin/parts"), { credentials: "include" });
      if (!res.ok) {
        if (res.status === 403) { setError("Access denied — admin only"); setLoading(false); return; }
        throw new Error("Failed to fetch");
      }
      const json = await res.json();
      setParts(json.parts || []);
    } catch {
      setError("Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchParts(); }, []);

  const createPart = async () => {
    if (!newSlug || !newTitle || !newOrder) return;
    setCreating(true);
    try {
      const res = await fetch(apiUrl("/api/admin/parts"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: newSlug, title: newTitle, description: newDesc, order: Number(newOrder) }),
      });
      if (!res.ok) {
        const j = await res.json();
        setError(j.error || "Failed to create");
        return;
      }
      setNewSlug(""); setNewTitle(""); setNewDesc(""); setNewOrder("");
      setShowCreatePart(false);
      fetchParts();
    } catch {
      setError("Failed to create part");
    } finally {
      setCreating(false);
    }
  };

  const deletePart = async (partId: string) => {
    try {
      await fetch(apiUrl(`/api/admin/parts/${partId}`), {
        method: "DELETE",
        credentials: "include",
      });
      setDeleteConfirm(null);
      fetchParts();
    } catch {
      setError("Failed to delete part");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400 text-lg">Loading content...</div>
      </div>
    );
  }

  if (error === "Access denied — admin only") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-200 mb-2">Admin Access Required</h2>
          <p className="text-gray-400">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-3">
            <span className="text-3xl">⚙️</span> Content Management
          </h1>
          <p className="text-gray-400 mt-1">Create and manage paths, lessons, and quests</p>
        </div>
        <button
          onClick={() => setShowCreatePart(!showCreatePart)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <span className="text-lg">+</span> New Path
        </button>
      </div>

      {error && error !== "Access denied — admin only" && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-lg px-4 py-3 mb-6 text-red-300 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-red-400 hover:text-red-200">✕</button>
        </div>
      )}

      {/* Create Part Form */}
      {showCreatePart && (
        <div className="game-card p-6 mb-6 border border-blue-700/30">
          <h2 className="text-lg font-bold text-gray-100 mb-4">Create New Path</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Slug (URL-safe ID)</label>
              <input
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value.replace(/[^a-z0-9-]/g, ""))}
                placeholder="e.g. w25"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Order</label>
              <input
                type="number"
                value={newOrder}
                onChange={(e) => setNewOrder(e.target.value)}
                placeholder={String(parts.length + 1)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Title</label>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Advanced Consensus Protocols"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Description</label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Brief description of what this path covers..."
                rows={2}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={createPart}
              disabled={!newSlug || !newTitle || !newOrder || creating}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
            >
              {creating ? "Creating..." : "Create Path"}
            </button>
            <button
              onClick={() => setShowCreatePart(false)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="game-card p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{parts.length}</div>
          <div className="text-sm text-gray-400">Paths</div>
        </div>
        <div className="game-card p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{parts.reduce((s, p) => s + p.lessons.length, 0)}</div>
          <div className="text-sm text-gray-400">Lessons</div>
        </div>
        <div className="game-card p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">{parts.filter(p => p.quest).length}</div>
          <div className="text-sm text-gray-400">Quests</div>
        </div>
      </div>

      {/* Parts List */}
      <div className="space-y-3">
        {parts.map((part) => (
          <div key={part.id} className="game-card overflow-hidden">
            {/* Part Header */}
            <div
              className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-700/30 transition-colors"
              onClick={() => setExpandedPart(expandedPart === part.id ? null : part.id)}
            >
              <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400 font-bold text-lg">
                {part.order}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-100 truncate">{part.title}</h3>
                <p className="text-sm text-gray-400 truncate">
                  {part.slug} · {part.lessons.length} lessons {part.quest ? "· 1 quest" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/content/${part.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded-lg text-sm transition-colors"
                >
                  Edit
                </Link>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteConfirm(deleteConfirm === part.id ? null : part.id); }}
                  className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-300 rounded-lg text-sm transition-colors"
                >
                  Delete
                </button>
                <span className={`transition-transform ${expandedPart === part.id ? "rotate-180" : ""} text-gray-400`}>▾</span>
              </div>
            </div>

            {/* Delete Confirmation */}
            {deleteConfirm === part.id && (
              <div className="px-4 pb-3 bg-red-900/10 border-t border-red-800/30">
                <p className="text-red-300 text-sm py-2">
                  Delete &quot;{part.title}&quot; and all its {part.lessons.length} lessons? This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => deletePart(part.id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-sm"
                  >
                    Yes, Delete
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Expanded Lessons */}
            {expandedPart === part.id && (
              <div className="border-t border-gray-700/50 px-4 py-3 bg-gray-800/30">
                {part.lessons.length === 0 ? (
                  <p className="text-gray-500 text-sm py-2">No lessons yet</p>
                ) : (
                  <div className="space-y-1">
                    {part.lessons.map((lesson, i) => (
                      <div key={lesson.id} className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-gray-700/30">
                        <span className="text-gray-500 text-sm w-6 text-right">{lesson.order}.</span>
                        <span className="flex-1 text-gray-300 text-sm truncate">{lesson.title}</span>
                        <span className="text-gray-500 text-xs">{lesson.durationMinutes}min</span>
                      </div>
                    ))}
                  </div>
                )}
                {part.quest && (
                  <div className="flex items-center gap-3 py-1.5 px-2 mt-2 rounded bg-purple-900/10 border border-purple-800/20">
                    <span className="text-purple-400 text-sm">⚔️</span>
                    <span className="flex-1 text-purple-300 text-sm">{part.quest.title}</span>
                    <span className="text-purple-500 text-xs">Quest</span>
                  </div>
                )}
                <Link
                  href={`/admin/content/${part.id}`}
                  className="inline-block mt-3 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors"
                >
                  Manage Lessons →
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>

      {parts.length === 0 && !loading && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📚</div>
          <h2 className="text-xl font-bold text-gray-300 mb-2">No Paths Yet</h2>
          <p className="text-gray-500 mb-4">Create your first learning path to get started.</p>
          <button
            onClick={() => setShowCreatePart(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
          >
            + Create First Path
          </button>
        </div>
      )}
    </div>
  );
}
