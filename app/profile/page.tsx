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
  }, []);

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
          <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-gray-700 flex-shrink-0">
            <Image
              src={profileImage || "/img/new_boots_profile.webp"}
              alt={displayName || profile.username}
              width={64}
              height={64}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-semibold text-gray-100 truncate">
              {displayName || profile.username}
            </p>
            <p className="text-sm text-gray-500">@{profile.username}</p>
            {bio && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{bio}</p>}
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
    </div>
  );
}
