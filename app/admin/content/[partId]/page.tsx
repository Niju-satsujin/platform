"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { getSessionToken } from "@/app/components/session-guard";

interface Lesson {
  id: string;
  slug: string;
  title: string;
  order: number;
  durationMinutes: number;
  markdownContent: string;
  proofRules: string;
  proofRulesJson: string;
  xpReward: number;
  starterCode: string;
  testCode: string;
  solutionCode: string;
  contentId: string;
}

interface Quest {
  id: string;
  slug: string;
  title: string;
  markdownContent: string;
  proofRules: string;
  proofRulesJson: string;
  xpReward: number;
  starterCode: string;
  testCode: string;
  contentId: string;
}

interface PartDetail {
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

export default function PartEditorPage({ params }: { params: Promise<{ partId: string }> }) {
  const { partId } = use(params);

  const [part, setPart] = useState<PartDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Part edit state
  const [editingPart, setEditingPart] = useState(false);
  const [partTitle, setPartTitle] = useState("");
  const [partSlug, setPartSlug] = useState("");
  const [partDesc, setPartDesc] = useState("");
  const [partOrder, setPartOrder] = useState(0);

  // Lesson editor
  const [editingLesson, setEditingLesson] = useState<string | null>(null); // lesson ID or "new"
  const [lessonSlug, setLessonSlug] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonOrder, setLessonOrder] = useState(1);
  const [lessonDuration, setLessonDuration] = useState(30);
  const [lessonXp, setLessonXp] = useState(100);
  const [lessonMarkdown, setLessonMarkdown] = useState("");
  const [lessonProof, setLessonProof] = useState("{}");
  const [lessonStarter, setLessonStarter] = useState("");
  const [lessonTest, setLessonTest] = useState("");
  const [lessonSolution, setLessonSolution] = useState("");

  // Quest editor
  const [editingQuest, setEditingQuest] = useState(false);
  const [questTitle, setQuestTitle] = useState("");
  const [questXp, setQuestXp] = useState(250);
  const [questMarkdown, setQuestMarkdown] = useState("");
  const [questProof, setQuestProof] = useState("{}");
  const [questStarter, setQuestStarter] = useState("");
  const [questTest, setQuestTest] = useState("");

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "code" | "proof">("content");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchPart = async () => {
    try {
      const res = await fetch(apiUrl(`/api/admin/parts/${partId}`), { credentials: "include" });
      if (!res.ok) {
        if (res.status === 403) { setError("Access denied"); setLoading(false); return; }
        throw new Error("Failed to fetch");
      }
      const json = await res.json();
      setPart(json.part);

      // Initialize part edit fields
      setPartTitle(json.part.title);
      setPartSlug(json.part.slug);
      setPartDesc(json.part.description);
      setPartOrder(json.part.order);
    } catch {
      setError("Failed to load part");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPart(); }, [partId]);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };

  // ── Part actions ────────────────────────────────
  const savePart = async () => {
    setSaving(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/parts/${partId}`), {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: partSlug, title: partTitle, description: partDesc, order: partOrder }),
      });
      if (!res.ok) { const j = await res.json(); setError(j.error || "Failed"); return; }
      setEditingPart(false);
      showSuccess("Path updated!");
      fetchPart();
    } catch { setError("Save failed"); }
    finally { setSaving(false); }
  };

  // ── Lesson actions ──────────────────────────────
  const openLessonEditor = (lesson?: Lesson) => {
    if (lesson) {
      setEditingLesson(lesson.id);
      setLessonSlug(lesson.slug);
      setLessonTitle(lesson.title);
      setLessonOrder(lesson.order);
      setLessonDuration(lesson.durationMinutes);
      setLessonXp(lesson.xpReward);
      setLessonMarkdown(lesson.markdownContent);
      setLessonProof(lesson.proofRulesJson || lesson.proofRules);
      setLessonStarter(lesson.starterCode);
      setLessonTest(lesson.testCode);
      setLessonSolution(lesson.solutionCode);
    } else {
      setEditingLesson("new");
      setLessonSlug("");
      setLessonTitle("");
      setLessonOrder((part?.lessons.length || 0) + 1);
      setLessonDuration(30);
      setLessonXp(100);
      setLessonMarkdown("");
      setLessonProof("{}");
      setLessonStarter("");
      setLessonTest("");
      setLessonSolution("");
    }
    setActiveTab("content");
  };

  const saveLesson = async () => {
    if (!lessonSlug || !lessonTitle) { setError("Slug and title are required"); return; }
    setSaving(true);
    try {
      const payload = {
        slug: lessonSlug, title: lessonTitle, order: lessonOrder,
        durationMinutes: lessonDuration, xpReward: lessonXp,
        markdownContent: lessonMarkdown, proofRules: lessonProof,
        starterCode: lessonStarter, testCode: lessonTest, solutionCode: lessonSolution,
      };

      const isNew = editingLesson === "new";
      const url = isNew
        ? apiUrl(`/api/admin/parts/${partId}/lessons`)
        : apiUrl(`/api/admin/parts/${partId}/lessons/${editingLesson}`);

      const res = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) { const j = await res.json(); setError(j.error || "Failed"); return; }
      setEditingLesson(null);
      showSuccess(isNew ? "Lesson created!" : "Lesson updated!");
      fetchPart();
    } catch { setError("Save failed"); }
    finally { setSaving(false); }
  };

  const deleteLesson = async (lessonId: string) => {
    try {
      await fetch(apiUrl(`/api/admin/parts/${partId}/lessons/${lessonId}`), {
        method: "DELETE", credentials: "include",
      });
      setDeleteConfirm(null);
      showSuccess("Lesson deleted");
      fetchPart();
    } catch { setError("Delete failed"); }
  };

  // ── Quest actions ───────────────────────────────
  const openQuestEditor = () => {
    setEditingQuest(true);
    if (part?.quest) {
      setQuestTitle(part.quest.title);
      setQuestXp(part.quest.xpReward);
      setQuestMarkdown(part.quest.markdownContent);
      setQuestProof(part.quest.proofRulesJson || part.quest.proofRules);
      setQuestStarter(part.quest.starterCode);
      setQuestTest(part.quest.testCode);
    } else {
      setQuestTitle("");
      setQuestXp(250);
      setQuestMarkdown("");
      setQuestProof("{}");
      setQuestStarter("");
      setQuestTest("");
    }
    setActiveTab("content");
  };

  const saveQuest = async () => {
    if (!questTitle) { setError("Title is required"); return; }
    setSaving(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/parts/${partId}/quest`), {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: questTitle, xpReward: questXp,
          markdownContent: questMarkdown, proofRules: questProof,
          starterCode: questStarter, testCode: questTest,
        }),
      });
      if (!res.ok) { const j = await res.json(); setError(j.error || "Failed"); return; }
      setEditingQuest(false);
      showSuccess("Quest saved!");
      fetchPart();
    } catch { setError("Save failed"); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400 text-lg">Loading...</div>
      </div>
    );
  }

  if (!part) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-gray-400">{error || "Part not found"}</p>
          <Link href="/admin/content" className="text-blue-400 hover:text-blue-300 mt-2 inline-block">← Back</Link>
        </div>
      </div>
    );
  }

  // ── Lesson/Quest Editor Modal ────────────────────────
  const renderEditor = (
    mode: "lesson" | "quest",
    title: string, setTitle: (v: string) => void,
    markdown: string, setMarkdown: (v: string) => void,
    proof: string, setProof: (v: string) => void,
    starter: string, setStarter: (v: string) => void,
    test: string, setTest: (v: string) => void,
    onSave: () => void,
    onCancel: () => void,
    extra?: React.ReactNode,
  ) => (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-600 w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Editor Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-gray-100">
            {mode === "quest" ? "⚔️ Quest Editor" : (editingLesson === "new" ? "📝 New Lesson" : "📝 Edit Lesson")}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-200 text-xl">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {(["content", "code", "proof"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-blue-500 text-blue-400"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {tab === "content" ? "📄 Content" : tab === "code" ? "💻 Code" : "✅ Proof Rules"}
            </button>
          ))}
        </div>

        {/* Editor Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "content" && (
            <div className="space-y-4">
              {extra}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Content (Markdown)</label>
                <textarea
                  value={markdown}
                  onChange={(e) => setMarkdown(e.target.value)}
                  rows={16}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 font-mono text-sm focus:border-blue-500 focus:outline-none resize-y"
                  placeholder="# Lesson Title&#10;&#10;## Goal&#10;&#10;Write your lesson content in Markdown..."
                />
              </div>
            </div>
          )}

          {activeTab === "code" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Starter Code (given to student)</label>
                <textarea
                  value={starter}
                  onChange={(e) => setStarter(e.target.value)}
                  rows={10}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 font-mono text-sm focus:border-blue-500 focus:outline-none resize-y"
                  placeholder="#include <iostream>&#10;&#10;int main() {&#10;    // Your code here&#10;    return 0;&#10;}"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Test Code</label>
                <textarea
                  value={test}
                  onChange={(e) => setTest(e.target.value)}
                  rows={10}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 font-mono text-sm focus:border-blue-500 focus:outline-none resize-y"
                  placeholder="// Test code to validate student solution..."
                />
              </div>
              {mode === "lesson" && (
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Solution Code (hidden)</label>
                  <textarea
                    value={lessonSolution}
                    onChange={(e) => setLessonSolution(e.target.value)}
                    rows={10}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 font-mono text-sm focus:border-blue-500 focus:outline-none resize-y"
                    placeholder="// Reference solution..."
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === "proof" && (
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">
                Proof rules determine how student submissions are validated. JSON format.
              </p>
              <textarea
                value={proof}
                onChange={(e) => setProof(e.target.value)}
                rows={12}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 font-mono text-sm focus:border-blue-500 focus:outline-none resize-y"
                placeholder={`{
  "mode": "manual_or_regex",
  "input": "paste_or_upload",
  "regexPatterns": [],
  "instructions": "Submit proof for review."
}`}
              />
              <div className="text-xs text-gray-500 space-y-1">
                <p><strong>mode:</strong> &quot;manual&quot; | &quot;regex&quot; | &quot;manual_or_regex&quot;</p>
                <p><strong>input:</strong> &quot;paste&quot; | &quot;upload&quot; | &quot;paste_or_upload&quot;</p>
                <p><strong>regexPatterns:</strong> array of regex strings to match against submission</p>
              </div>
            </div>
          )}
        </div>

        {/* Editor Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700 bg-gray-800/80">
          {error && <span className="text-red-400 text-sm">{error}</span>}
          <div className="flex-1" />
          <div className="flex gap-3">
            <button onClick={onCancel} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="px-4 sm:px-6 py-6 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Link href="/admin/content" className="hover:text-blue-400">Content</Link>
        <span>›</span>
        <span className="text-gray-200">{part.title}</span>
      </div>

      {/* Success toast */}
      {success && (
        <div className="fixed top-20 right-4 bg-green-900/80 border border-green-700/50 text-green-300 px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
          ✓ {success}
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-lg px-4 py-3 mb-4 text-red-300 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-red-400 hover:text-red-200">✕</button>
        </div>
      )}

      {/* Part Header */}
      <div className="game-card p-6 mb-6">
        {editingPart ? (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-100 mb-2">Edit Path</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Slug</label>
                <input value={partSlug} onChange={e => setPartSlug(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Order</label>
                <input type="number" value={partOrder} onChange={e => setPartOrder(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:border-blue-500 focus:outline-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Title</label>
                <input value={partTitle} onChange={e => setPartTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:border-blue-500 focus:outline-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea value={partDesc} onChange={e => setPartDesc(e.target.value)} rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:border-blue-500 focus:outline-none resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={savePart} disabled={saving}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors">
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button onClick={() => setEditingPart(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400 font-bold text-xl">
                  {part.order}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-100">{part.title}</h1>
                  <p className="text-sm text-gray-400">{part.slug} · {part.lessons.length} lessons</p>
                </div>
              </div>
              {part.description && <p className="text-gray-400 mt-3">{part.description}</p>}
            </div>
            <button onClick={() => setEditingPart(true)}
              className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded-lg transition-colors">
              Edit Path
            </button>
          </div>
        )}
      </div>

      {/* Lessons Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
            <span>📄</span> Lessons ({part.lessons.length})
          </h2>
          <button onClick={() => openLessonEditor()}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1">
            <span>+</span> New Lesson
          </button>
        </div>

        {part.lessons.length === 0 ? (
          <div className="game-card p-8 text-center">
            <p className="text-gray-500 mb-3">No lessons yet. Create your first one!</p>
            <button onClick={() => openLessonEditor()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors">
              + Create Lesson
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {part.lessons.map(lesson => (
              <div key={lesson.id} className="game-card p-4 flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center text-gray-300 font-mono text-sm">
                  {lesson.order}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-200 truncate">{lesson.title}</h3>
                  <p className="text-xs text-gray-500">{lesson.slug} · {lesson.durationMinutes}min · {lesson.xpReward}xp</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openLessonEditor(lesson)}
                    className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded text-sm transition-colors">
                    Edit
                  </button>
                  {deleteConfirm === lesson.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => deleteLesson(lesson.id)}
                        className="px-2 py-1 bg-red-600 text-white rounded text-xs">Confirm</button>
                      <button onClick={() => setDeleteConfirm(null)}
                        className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">No</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(lesson.id)}
                      className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-300 rounded text-sm transition-colors">
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quest Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
            <span>⚔️</span> Quest
          </h2>
        </div>

        {part.quest ? (
          <div className="game-card p-4 flex items-center gap-4 border border-purple-800/20">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center text-purple-400 text-xl">
              ⚔️
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-purple-200">{part.quest.title}</h3>
              <p className="text-xs text-gray-500">{part.quest.xpReward}xp</p>
            </div>
            <button onClick={openQuestEditor}
              className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 rounded text-sm transition-colors">
              Edit Quest
            </button>
          </div>
        ) : (
          <div className="game-card p-8 text-center border border-purple-800/10">
            <p className="text-gray-500 mb-3">No quest for this path yet.</p>
            <button onClick={openQuestEditor}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm transition-colors">
              + Create Quest
            </button>
          </div>
        )}
      </div>

      {/* Lesson Editor Modal */}
      {editingLesson !== null && renderEditor(
        "lesson",
        lessonTitle, setLessonTitle,
        lessonMarkdown, setLessonMarkdown,
        lessonProof, setLessonProof,
        lessonStarter, setLessonStarter,
        lessonTest, setLessonTest,
        saveLesson,
        () => setEditingLesson(null),
        /* extra fields for lesson */
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Slug</label>
              <input value={lessonSlug} onChange={e => setLessonSlug(e.target.value.replace(/[^a-z0-9-]/g, ""))}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="lesson-slug" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Order</label>
              <input type="number" value={lessonOrder} onChange={e => setLessonOrder(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Duration (min)</label>
              <input type="number" value={lessonDuration} onChange={e => setLessonDuration(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">XP Reward</label>
              <input type="number" value={lessonXp} onChange={e => setLessonXp(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
          </div>
        </>
      )}

      {/* Quest Editor Modal */}
      {editingQuest && renderEditor(
        "quest",
        questTitle, setQuestTitle,
        questMarkdown, setQuestMarkdown,
        questProof, setQuestProof,
        questStarter, setQuestStarter,
        questTest, setQuestTest,
        saveQuest,
        () => setEditingQuest(false),
        /* extra fields for quest */
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">XP Reward</label>
            <input type="number" value={questXp} onChange={e => setQuestXp(Number(e.target.value))}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 text-sm focus:border-blue-500 focus:outline-none" />
          </div>
        </div>
      )}
    </div>
  );
}
