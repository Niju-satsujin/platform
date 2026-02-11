"use client";

import { useState, useEffect } from "react";
import Avatar from "@/app/components/avatar";
import { getSessionToken } from "@/app/components/session-guard";

interface OnlineUser {
  id: string;
  username: string;
  displayName: string;
  profileImage: string;
  level: number;
  isOnline: boolean;
}

/**
 * Community bar showing online/offline users with profile pictures and status dots.
 */
export default function CommunityBar() {
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchUsers() {
      try {
        const token = getSessionToken();
        const url = token
          ? `/api/community/online?t=${encodeURIComponent(token)}`
          : "/api/community/online";
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) {
          setUsers(json.users);
          setCurrentUserId(json.currentUserId);
        }
      } catch {
        /* ignore */
      }
    }

    fetchUsers();
    // Poll every 30 seconds
    const interval = setInterval(fetchUsers, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Send heartbeat every 2 minutes
  useEffect(() => {
    const token = getSessionToken();
    if (!token) return;

    async function heartbeat() {
      try {
        await fetch(`/api/community/heartbeat?t=${encodeURIComponent(token!)}`, {
          method: "POST",
          credentials: "include",
        });
      } catch {
        /* ignore */
      }
    }

    heartbeat();
    const interval = setInterval(heartbeat, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const onlineUsers = users.filter((u) => u.isOnline);
  const offlineUsers = users.filter((u) => !u.isOnline);
  const onlineCount = onlineUsers.length;

  return (
    <div className="game-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <span>👥</span> Community
        </h2>
        <span className="text-xs text-green-400 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          {onlineCount} online
        </span>
      </div>

      {users.length === 0 ? (
        <p className="text-xs text-gray-600 text-center py-3">No users yet</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {/* Online users first */}
          {onlineUsers.map((u) => (
            <UserBubble key={u.id} user={u} isYou={u.id === currentUserId} />
          ))}
          {/* Offline users */}
          {offlineUsers.map((u) => (
            <UserBubble key={u.id} user={u} isYou={u.id === currentUserId} />
          ))}
        </div>
      )}
    </div>
  );
}

function UserBubble({ user, isYou }: { user: OnlineUser; isYou: boolean }) {
  return (
    <div className="group relative flex flex-col items-center" title={`${user.displayName}${isYou ? " (you)" : ""}`}>
      <div className="relative">
        <div
          className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all ${
            user.isOnline
              ? "border-green-500/60 shadow-[0_0_6px_rgba(34,197,94,0.3)]"
              : "border-gray-700 opacity-50"
          }`}
        >
          <Avatar
            src={user.profileImage}
            alt={user.displayName}
            size={36}
            className="w-full h-full"
          />
        </div>
        {/* Status dot */}
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#1a1b26] ${
            user.isOnline ? "bg-green-400" : "bg-gray-600"
          }`}
        />
      </div>
      {/* Name label on hover */}
      <span className="text-[10px] text-gray-500 mt-1 max-w-[48px] truncate text-center">
        {isYou ? "You" : user.displayName.split(" ")[0]}
      </span>
      {/* Tooltip */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
        <div className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-200 whitespace-nowrap shadow-lg">
          {user.displayName} · Lv {user.level}
          {isYou && <span className="text-yellow-500 ml-1">(you)</span>}
        </div>
      </div>
    </div>
  );
}
