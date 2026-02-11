"use client";

import Image from "next/image";
import Link from "next/link";
import Avatar from "@/app/components/avatar";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import LogoutButton from "@/app/components/logout-button";

interface TopHeaderProps {
  isLoggedIn: boolean;
  displayName: string;
  profileImage: string;
  level: number;
  xp: number;
  dueReviews: number;
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
  dueReviews,
  communityCount,
  unreadDMs,
}: TopHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
              <Link
                href="/reviews"
                className="relative h-10 w-10 sm:h-8 sm:w-8 rounded-full bg-gray-900 border border-gray-700 hover:border-yellow-500/70 transition-colors flex items-center justify-center"
                title="Reviews"
                suppressHydrationWarning
              >
                <Image src="/img/notification-silver.png" alt="Reviews" width={16} height={16} className="h-4 w-4" suppressHydrationWarning />
                {dueReviews > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-red-500 text-[10px] leading-4 text-white px-1 text-center font-bold">
                    {Math.min(dueReviews, 99)}
                  </span>
                )}
              </Link>

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
