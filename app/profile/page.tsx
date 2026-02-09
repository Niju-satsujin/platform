"use client";

import { useState, useEffect, useRef, FormEvent, ChangeEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useEditorMode } from "@/lib/use-editor-mode";

interface ProfileData {
  username: string;
  displayName: string;
  bio: string;
  profileImage: string;
}

interface GitHubSettings {
  connected: boolean;
  githubUsername: string;
  githubRepo: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { editorMode, setEditorMode } = useEditorMode();

  // GitHub settings state
  const [github, setGitHub] = useState<GitHubSettings>({ connected: false, githubUsername: "", githubRepo: "" });
  const [ghToken, setGhToken] = useState("");
  const [ghRepoName, setGhRepoName] = useState("");
  const [ghCreateNew, setGhCreateNew] = useState(false);
  const [ghSaving, setGhSaving] = useState(false);
  const [ghMessage, setGhMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/profile", { credentials: "include" });
        if (!res.ok) {
          setMessage({ type: "error", text: "Failed to load profile" });
          setLoading(false);
          return;
        }
        const data: ProfileData = await res.json();
        setProfile(data);
        setDisplayName(data.displayName);
        setBio(data.bio);
        setProfileImage(data.profileImage);
      } catch {
        setMessage({ type: "error", text: "Network error loading profile" });
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
    loadGitHubSettings();
  }, []);

  async function loadGitHubSettings() {
    try {
      const res = await fetch("/api/settings/github", { credentials: "include" });
      if (res.ok) {
        const data: GitHubSettings = await res.json();
        setGitHub(data);
      }
    } catch {
      // Silently ignore — GitHub settings are optional
    }
  }

  async function handleGitHubConnect() {
    setGhSaving(true);
    setGhMessage(null);

    try {
      const res = await fetch("/api/settings/github", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          token: ghToken,
          repoName: ghRepoName,
          createNew: ghCreateNew,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setGhMessage({ type: "error", text: data.error || "Failed to connect GitHub" });
        return;
      }

      setGitHub(data);
      setGhToken("");
      setGhRepoName("");
      setGhCreateNew(false);
      setGhMessage({ type: "success", text: "GitHub connected successfully!" });
    } catch {
      setGhMessage({ type: "error", text: "Network error — please try again" });
    } finally {
      setGhSaving(false);
    }
  }

  async function handleGitHubDisconnect() {
    setGhSaving(true);
    setGhMessage(null);

    try {
      const res = await fetch("/api/settings/github", {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        setGitHub({ connected: false, githubUsername: "", githubRepo: "" });
        setGhMessage({ type: "success", text: "GitHub disconnected" });
      }
    } catch {
      setGhMessage({ type: "error", text: "Network error — please try again" });
    } finally {
      setGhSaving(false);
    }
  }

  async function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("profileImage", file);

      const res = await fetch("/api/profile/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Upload failed" });
        return;
      }

      setProfile(data);
      setProfileImage(data.profileImage);
      setMessage({ type: "success", text: "Profile image updated!" });
    } catch {
      setMessage({ type: "error", text: "Network error — please try again" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ displayName, bio }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to save" });
        setSaving(false);
        return;
      }

      setProfile(data);
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch {
      setMessage({ type: "error", text: "Network error — please try again" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="px-6 py-6 max-w-2xl mx-auto flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-500 text-sm">Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 max-w-2xl mx-auto animate-float-up">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="badge badge-yellow">SETTINGS</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-100 mb-1">Edit Profile</h1>
        <p className="text-gray-500 text-sm">
          Update your display name, bio, and profile image.
        </p>
      </div>

      {/* Preview card */}
      {profile && (
        <div className="game-card p-5 mb-6 flex items-center gap-4">
          <div
            className={`relative h-20 w-20 rounded-full overflow-hidden border-2 flex-shrink-0 cursor-pointer group transition-all ${
              dragOver ? "border-yellow-400 ring-2 ring-yellow-500/40" : "border-gray-700 hover:border-yellow-500"
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profileImage || "/img/new_boots_profile.webp"}
              alt={displayName || profile.username}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {uploading ? (
                <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
                e.target.value = "";
              }}
            />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-semibold text-gray-100 truncate">
              {displayName || profile.username}
            </p>
            <p className="text-sm text-gray-500">@{profile.username}</p>
            {bio && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{bio}</p>}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="mt-2 text-[11px] text-yellow-500 hover:text-yellow-400 font-semibold transition-colors disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "📷 Change Picture"}
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="game-card p-6 space-y-5">
        {message && (
          <div
            className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
              message.type === "success"
                ? "bg-green-950/50 border border-green-800/30 text-green-400"
                : "bg-red-950/50 border border-red-800/30 text-red-400"
            }`}
          >
            {message.type === "success" ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            )}
            {message.text}
          </div>
        )}

        <div>
          <label htmlFor="displayName" className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
            Display Name
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/30 transition-all text-sm"
            placeholder="Your display name"
            required
            minLength={1}
            maxLength={50}
          />
        </div>

        <div>
          <label htmlFor="bio" className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
            Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/30 transition-all text-sm resize-none"
            placeholder="Tell us about yourself…"
            maxLength={200}
            rows={3}
          />
          <p className="text-xs text-gray-600 mt-1 text-right">{bio.length}/200</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
            Profile Image
          </label>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-gray-700 flex-shrink-0">
              <Image
                src={profileImage || "/img/new_boots_profile.webp"}
                alt="Current avatar"
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageUpload}
                className="hidden"
                id="profileImageUpload"
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary !py-2 !text-xs disabled:opacity-60"
              >
                {uploading ? "Uploading…" : "Upload Photo"}
              </button>
              <p className="text-xs text-gray-600 mt-1">
                JPEG, PNG, WebP, or GIF — max 5 MB.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
            Code Editor
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Choose your preferred code editor for lessons and quests.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setEditorMode("vscode")}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                editorMode === "vscode"
                  ? "border-yellow-500 bg-yellow-500/5"
                  : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
              }`}
            >
              <span className="text-2xl">💻</span>
              <span className={`text-sm font-semibold ${editorMode === "vscode" ? "text-yellow-400" : "text-gray-300"}`}>
                VS Code
              </span>
              <span className="text-[10px] text-gray-500 text-center leading-tight">
                Standard Monaco editor with IntelliSense
              </span>
            </button>
            <button
              type="button"
              onClick={() => setEditorMode("nvim")}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                editorMode === "nvim"
                  ? "border-yellow-500 bg-yellow-500/5"
                  : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
              }`}
            >
              <span className="text-2xl">⌨️</span>
              <span className={`text-sm font-semibold ${editorMode === "nvim" ? "text-yellow-400" : "text-gray-300"}`}>
                Neovim (LazyVim)
              </span>
              <span className="text-[10px] text-gray-500 text-center leading-tight">
                Vim keybindings, relative line numbers &amp; block cursor
              </span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary !py-2.5 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <Link href="/progress" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            Cancel
          </Link>
        </div>
      </form>

      {/* GitHub Integration */}
      <div className="game-card p-6 mt-6 space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-gray-300">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
              GitHub Integration
            </label>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Link a GitHub repository to automatically save your learning progress. Each completed lesson or quest will be committed to your repo.
          </p>

          {ghMessage && (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg text-sm mb-4 ${
                ghMessage.type === "success"
                  ? "bg-green-950/50 border border-green-800/30 text-green-400"
                  : "bg-red-950/50 border border-red-800/30 text-red-400"
              }`}
            >
              {ghMessage.type === "success" ? "✅" : "❌"} {ghMessage.text}
            </div>
          )}

          {github.connected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-950/30 border border-green-800/20">
                <span className="text-green-400 text-sm">✓ Connected</span>
                <span className="text-gray-300 text-sm font-mono">@{github.githubUsername}</span>
                {github.githubRepo && (
                  <a
                    href={`https://github.com/${github.githubRepo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-yellow-500 hover:text-yellow-400 text-sm underline ml-auto"
                  >
                    {github.githubRepo}
                  </a>
                )}
              </div>
              <button
                type="button"
                onClick={handleGitHubDisconnect}
                disabled={ghSaving}
                className="btn-secondary !py-2 !text-xs text-red-400 hover:text-red-300 disabled:opacity-60"
              >
                {ghSaving ? "Disconnecting…" : "Disconnect GitHub"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="ghToken" className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                  Personal Access Token
                </label>
                <input
                  id="ghToken"
                  type="password"
                  value={ghToken}
                  onChange={(e) => setGhToken(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/30 transition-all text-sm font-mono"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Generate a token at{" "}
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo&description=Trust+Systems+Platform"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-yellow-500 hover:text-yellow-400 underline"
                  >
                    github.com/settings/tokens
                  </a>{" "}
                  with <strong className="text-gray-400">repo</strong> scope.
                </p>
              </div>

              <div>
                <label htmlFor="ghRepoName" className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                  Repository Name
                </label>
                <input
                  id="ghRepoName"
                  type="text"
                  value={ghRepoName}
                  onChange={(e) => setGhRepoName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/30 transition-all text-sm"
                  placeholder={ghCreateNew ? "my-learning-progress" : "username/repo-name"}
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ghCreateNew}
                  onChange={(e) => setGhCreateNew(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-yellow-500 focus:ring-yellow-500/30"
                />
                <span className="text-xs text-gray-400">Create a new repository</span>
              </label>

              <button
                type="button"
                onClick={handleGitHubConnect}
                disabled={ghSaving || !ghToken.trim()}
                className="btn-primary !py-2.5 disabled:opacity-60"
              >
                {ghSaving ? "Connecting…" : "Connect GitHub"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
