"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const username = (form.elements.namedItem("username") as HTMLInputElement).value.trim();
    const displayName = (form.elements.namedItem("displayName") as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const confirmPassword = (form.elements.namedItem("confirmPassword") as HTMLInputElement).value;

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, displayName, password, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      const token = typeof data?.token === "string" ? data.token : "";

      if (!token) {
        setError("Registration succeeded but no token received");
        setLoading(false);
        return;
      }

      // Save token to localStorage for persistence across reloads.
      try { localStorage.setItem("tsp_session_token", token); } catch { /* ignore */ }

      // Navigate with token in URL — middleware injects into request cookies
      window.location.replace(`/?t=${encodeURIComponent(token)}`);
    } catch {
      setError("Network error — please try again");
      setLoading(false);
    }
  }

  return (
    <div className="px-6 py-6 max-w-6xl mx-auto flex items-center justify-center min-h-[calc(100vh-var(--top-nav-bar-height)-4px)]">
      <div className="w-full max-w-md animate-float-up">
        {/* Logo header */}
        <div className="text-center mb-8">
          <Image
            src="/img/bootdev-logo-full-small.webp"
            alt="Boot.dev"
            width={160}
            height={37}
            className="mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-100">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">Begin your systems programming quest</p>
        </div>

        <form onSubmit={handleSubmit} className="game-card p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-950/50 border border-red-800/30 text-red-400 text-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {error}
            </div>
          )}

          <div>
            <label htmlFor="username" className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/30 transition-all text-sm"
              placeholder="e.g. trust_sage"
              required
              minLength={3}
              maxLength={20}
              pattern="^[a-zA-Z0-9_-]+$"
              autoComplete="username"
              autoFocus
            />
            <p className="text-xs text-gray-600 mt-1">Letters, numbers, underscores, hyphens only</p>
          </div>

          <div>
            <label htmlFor="displayName" className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
              Display Name <span className="text-gray-600 font-normal">(optional)</span>
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/30 transition-all text-sm"
              placeholder="Your display name"
              autoComplete="name"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/30 transition-all text-sm"
              placeholder="Min 6 characters"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/30 transition-all text-sm"
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary !py-2.5 disabled:opacity-60"
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>

          <div className="text-center pt-3 border-t border-gray-700">
            <p className="text-gray-500 text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-yellow-500 hover:text-yellow-400 font-medium transition-colors">
                Log in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
