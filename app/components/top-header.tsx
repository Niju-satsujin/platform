"use client";

import Image from "next/image";
import Link from "next/link";
import Avatar from "@/app/components/avatar";
import { getSessionToken } from "@/app/components/session-guard";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import LogoutButton from "@/app/components/logout-button";

interface TopHeaderProps {
  isLoggedIn: boolean;
  displayName: string;
  profileImage: string;
  level: number;
  xp: number;
  unreadNotifications: number;
  communityCount: number;
  unreadDMs: number;
}

interface NavItem {
  label: string;
  href: string;
  matchPrefix?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", matchPrefix: "/" },
  { label: "Courses", href: "/parts", matchPrefix: "/parts" },
  { label: "Skill Tree", href: "/skill-tree", matchPrefix: "/skill-tree" },
  { label: "Flashcards", href: "/flashcards", matchPrefix: "/flashcards" },
  { label: "Training", href: "/training", matchPrefix: "/training" },
  { label: "Reviews", href: "/reviews", matchPrefix: "/reviews" },
  { label: "Messages", href: "/messages", matchPrefix: "/messages" },
  { label: "Community", href: "/community", matchPrefix: "/community" },
  { label: "Leaderboard", href: "/leaderboard", matchPrefix: "/leaderboard" },
];

export default function TopHeader({
  isLoggedIn,
  displayName,
  profileImage,
  level,
  xp,
  unreadNotifications,
  communityCount,
  unreadDMs,
}: TopHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; type: string; title: string; body: string; link: string | null; readAt: string | null; createdAt: string }[]>([]);
  const [notifCount, setNotifCount] = useState(unreadNotifications);
  const [now, setNow] = useState(() => Date.now());
  const notifRef = useRef<HTMLDivElement>(null);

  function apiUrl(path: string) {
    const token = getSessionToken();
    return token ? `${path}?t=${encodeURIComponent(token)}` : path;
  }

  const fetchNotifsRef = useRef(async () => {
    try {
      const res = await fetch(apiUrl("/api/notifications"), { credentials: "include" });
      if (res.ok) {
        const json = await res.json();
        setNotifications(json.notifications || []);
        setNotifCount((json.notifications || []).filter((n: { readAt: string | null }) => !n.readAt).length);
      }
    } catch { /* ignore */ }
  });

  // Close panel on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    if (notifOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [notifOpen]);

  // Tick "now" every 60s for relative timestamps
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Fetch when panel opens
  useEffect(() => {
    if (notifOpen) { void fetchNotifsRef.current(); }
  }, [notifOpen]);

  // Poll unread count
  useEffect(() => {
    if (!isLoggedIn) return;
    const poll = setInterval(() => {
      void (async () => {
        try {
          const res = await fetch(apiUrl("/api/notifications/unread"), { credentials: "include" });
          if (res.ok) { const j = await res.json(); setNotifCount(j.count); }
        } catch { /* ignore */ }
      })();
    }, 15_000);
    return () => clearInterval(poll);
  }, [isLoggedIn]);

  async function markAllRead() {
    await fetch(apiUrl("/api/notifications"), { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: "{}" }).catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
    setNotifCount(0);
  }

  async function deleteNotif(id: string) {
    await fetch(apiUrl("/api/notifications"), { method: "DELETE", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }).catch(() => {});
    setNotifications(prev => { const next = prev.filter(n => n.id !== id); setNotifCount(next.filter(n => !n.readAt).length); return next; });
  }

  function typeIcon(type: string) {
    switch (type) {
      case "level_up": return "🎉";
      case "achievement": return "🏆";
      case "streak": return "🔥";
      case "lesson_complete": return "✅";
      case "quest_complete": return "⚔️";
      case "review_due": return "📝";
      case "new_message": return "💬";
      case "chat_reply": return "↩️";
      case "system": return "📢";
      default: return "🔔";
    }
  }

  function timeAgo(iso: string) {
    const diff = now - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  }

  const xpPerLevel = 500;
  const xpInLevel = xp % xpPerLevel;
  const levelPct = Math.max(0, Math.min(100, (xpInLevel / xpPerLevel) * 100));

  const activeHref = useMemo(() => {
    const item = NAV_ITEMS.find((entry) => {
      const prefix = entry.matchPrefix ?? entry.href;
      if (prefix === "/") return pathname === "/";
      return pathname.startsWith(prefix);
    });
    return item?.href ?? "";
  }, [pathname]);

  function onSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
  }

  function toggleSearch() {
    setSearchOpen((prev) => !prev);
  }

  useEffect(() => {
    if (!searchOpen) return;
    searchInputRef.current?.focus();
  }, [searchOpen]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-[20] h-[50px] border-b border-gray-700/90 bg-[linear-gradient(180deg,#131a28_0%,#121722_100%)] shadow-[0_6px_18px_rgba(0,0,0,0.35)]">
      <div className="h-full px-3 md:px-4 flex items-center gap-3">
        <Link href="/" className="shrink-0 flex items-center mr-1 md:mr-2" suppressHydrationWarning>
          <Image
            src="/img/platform-logo.svg"
            alt="Trust Systems"
            width={140}
            height={28}
            className="h-7 w-auto"
            priority
            suppressHydrationWarning
          />
        </Link>

        <details className="lg:hidden relative">
          <summary className="list-none h-10 w-10 rounded-md border border-gray-700 bg-gray-900/70 text-sm text-gray-200 flex items-center justify-center cursor-pointer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </summary>
          <div className="absolute top-12 left-0 w-52 p-2 rounded-xl border border-gray-700 bg-gray-900 shadow-xl z-50">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-2.5 rounded-md text-sm text-gray-250 hover:bg-gray-800 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
            {/* Mobile search */}
            <form
              onSubmit={onSearchSubmit}
              className="mt-2 pt-2 border-t border-gray-700"
            >
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 placeholder:text-gray-500 outline-none focus:border-yellow-500/50"
                aria-label="Search"
              />
            </form>
          </div>
        </details>

        <div className="hidden lg:flex items-center gap-1 min-w-0 flex-1">
          {NAV_ITEMS.map((item) => {
            const isActive = activeHref === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  isActive
                    ? "text-gray-100"
                    : "text-gray-350 hover:text-gray-100 hover:bg-gray-800/70"
                }`}
                style={{ fontFamily: "DMSans, sans-serif" }}
              >
                {item.label}
                {isActive && (
                  <span className="absolute left-1/2 -translate-x-1/2 -bottom-[7px] w-0 h-0 border-l-[5px] border-r-[5px] border-l-transparent border-r-transparent border-b-[6px] border-b-yellow-500" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center ml-auto gap-2">
          <div className="hidden sm:flex items-center gap-2">
            {searchOpen && (
              <form
                onSubmit={onSearchSubmit}
                className="items-center h-8 w-[170px] md:w-[190px] rounded-full border border-gray-700 bg-gray-900/75 px-3 flex"
              >
                <input
                  ref={searchInputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search"
                  className="bg-transparent w-full text-xs text-gray-200 placeholder:text-gray-500 outline-none"
                  aria-label="Search lessons, courses, or users"
                />
              </form>
            )}
            <button
              type="button"
              onClick={toggleSearch}
              className="h-8 w-8 rounded-full bg-gray-900 border border-gray-700 hover:border-yellow-500/70 transition-colors flex items-center justify-center text-gray-300"
              title={searchOpen ? "Close search" : "Open search"}
            >
              {searchOpen ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning>
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              )}
            </button>
          </div>

          {isLoggedIn ? (
            <>
              <div ref={notifRef} className="relative">
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative h-10 w-10 sm:h-8 sm:w-8 rounded-full bg-gray-900 border border-gray-700 hover:border-yellow-500/70 transition-colors flex items-center justify-center"
                  title="Notifications"
                  suppressHydrationWarning
                >
                  <Image src="/img/notification-silver.png" alt="Notifications" width={16} height={16} className="h-4 w-4" suppressHydrationWarning />
                  {notifCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-red-500 text-[10px] leading-4 text-white px-1 text-center font-bold">
                      {Math.min(notifCount, 99)}
                    </span>
                  )}
                </button>

                {/* Notification dropdown panel */}
                {notifOpen && (
                  <div className="absolute right-0 top-[calc(100%+6px)] w-[320px] sm:w-[360px] max-h-[420px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden animate-float-up">
                    {/* Panel header */}
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-700">
                      <span className="text-sm font-bold text-gray-100">Notifications</span>
                      {notifCount > 0 && (
                        <button onClick={markAllRead} className="text-[10px] text-yellow-500 hover:text-yellow-400 transition-colors">
                          Mark all read
                        </button>
                      )}
                    </div>

                    {/* Notification list */}
                    <div className="flex-1 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-10 text-center">
                          <p className="text-xl mb-1">🔔</p>
                          <p className="text-xs text-gray-500">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.slice(0, 30).map(n => (
                          <div
                            key={n.id}
                            className={`flex items-start gap-2.5 px-3 py-2.5 border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors cursor-pointer ${
                              !n.readAt ? "bg-yellow-500/5" : ""
                            }`}
                            onClick={() => {
                              if (n.link) { router.push(n.link); setNotifOpen(false); }
                            }}
                          >
                            <span className="text-base mt-0.5 shrink-0">{typeIcon(n.type)}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-1">
                                <p className={`text-xs font-semibold truncate ${!n.readAt ? "text-gray-100" : "text-gray-400"}`}>
                                  {n.title}
                                </p>
                                <span className="text-[9px] text-gray-600 shrink-0">{timeAgo(n.createdAt)}</span>
                              </div>
                              <p className="text-[11px] text-gray-500 truncate">{n.body}</p>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteNotif(n.id); }}
                              className="text-[10px] text-gray-600 hover:text-red-400 transition-colors mt-1 shrink-0"
                              title="Delete"
                            >
                              ✕
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Link
                href="/messages"
                className="relative h-10 w-10 sm:h-8 sm:w-8 rounded-full bg-gray-900 border border-gray-700 hover:border-blue-400/70 transition-colors flex items-center justify-center text-gray-300"
                title="Messages"
                suppressHydrationWarning
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                {unreadDMs > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-blue-500 text-[10px] leading-4 text-white px-1 text-center font-bold">
                    {Math.min(unreadDMs, 99)}
                  </span>
                )}
              </Link>

              <Link
                href="/community"
                className="relative h-10 w-10 sm:h-8 sm:w-8 rounded-full bg-gray-900 border border-gray-700 hover:border-blue-400/70 transition-colors flex items-center justify-center"
                title="Community"
                suppressHydrationWarning
              >
                <Image src="/img/discord_logo_blue.png" alt="Community" width={16} height={16} className="h-4 w-4" suppressHydrationWarning />
                {communityCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-blue-500 text-[10px] leading-4 text-white px-1 text-center font-bold">
                    {Math.min(communityCount, 99)}
                  </span>
                )}
              </Link>

              <div className="hidden md:flex flex-col w-[130px] leading-tight px-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-gray-400 font-semibold">Level {level}</span>
                  <span className="text-[10px] text-yellow-400 font-semibold">
                    {xpInLevel}/{xpPerLevel}
                  </span>
                </div>
                <div className="h-[6px] rounded-full bg-gray-900 border border-gray-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#efbb03_0%,#f6bd45_100%)]"
                    style={{ width: `${levelPct}%` }}
                  />
                </div>
              </div>

              <Link
                href="/profile"
                className="h-10 w-10 sm:h-8 sm:w-8 rounded-full bg-gray-900 border border-gray-700 hover:border-yellow-500/70 transition-colors flex items-center justify-center text-gray-300"
                title="Settings"
                suppressHydrationWarning
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning>
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
              </Link>

              <Link
                href="/profile/dashboard"
                className="h-10 w-10 sm:h-8 sm:w-8 rounded-full overflow-hidden border border-gray-700 hover:border-yellow-500 transition-colors"
                title={displayName}
                suppressHydrationWarning
              >
                <Avatar
                  src={profileImage}
                  alt={displayName}
                  size={32}
                  className="h-full w-full"
                />
              </Link>

              <LogoutButton compact />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-2 text-sm sm:text-xs sm:py-1 font-semibold text-gray-250 hover:text-white transition-colors"
              >
                Log In
              </Link>
              <Link href="/register" className="btn-primary !py-2 sm:!py-1 !text-sm sm:!text-xs">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
