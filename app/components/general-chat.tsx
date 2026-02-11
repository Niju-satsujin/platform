"use client";

import { useState, useEffect, useRef } from "react";
import Avatar from "@/app/components/avatar";
import { getSessionToken } from "@/app/components/session-guard";

interface ChatUser {
  id: string;
  username: string;
  displayName: string;
  profileImage: string;
  level: number;
}

interface ChatMsg {
  id: string;
  message: string;
  createdAt: string;
  user: ChatUser;
}

/**
 * General chat panel — Discord-style real-time chat.
 */
export default function GeneralChat() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch messages
  useEffect(() => {
    let cancelled = false;

    async function fetchMessages() {
      try {
        const token = getSessionToken();
        const url = token
          ? `/api/chat?t=${encodeURIComponent(token)}`
          : "/api/chat";
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) {
          setMessages(json.messages);
        }
      } catch {
        /* ignore */
      }
    }

    // Get current user id
    async function fetchMe() {
      const token = getSessionToken();
      if (!token) return;
      try {
        const res = await fetch(`/api/auth/me?t=${encodeURIComponent(token)}`, { credentials: "include" });
        if (res.ok) {
          const json = await res.json();
          if (!cancelled) setCurrentUserId(json.user?.id ?? null);
        }
      } catch { /* ignore */ }
    }

    fetchMessages();
    fetchMe();

    // Poll every 5 seconds for new messages
    const interval = setInterval(fetchMessages, 5_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    try {
      const token = getSessionToken();
      const url = token
        ? `/api/chat?t=${encodeURIComponent(token)}`
        : "/api/chat";
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (res.ok) {
        const json = await res.json();
        setMessages((prev) => [...prev, json.message]);
        setInput("");
        inputRef.current?.focus();
      }
    } catch {
      /* ignore */
    } finally {
      setSending(false);
    }
  }

  function formatTime(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60_000);

    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;

    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <div className="game-card flex flex-col" style={{ height: "340px" }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between shrink-0">
        <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <span>💬</span> General Chat
        </h2>
        <span className="text-[10px] text-gray-600">{messages.length} messages</span>
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-2xl mb-2">💬</p>
            <p className="text-xs text-gray-600">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user.id === currentUserId;
            return (
              <div key={msg.id} className="flex items-start gap-2.5 group">
                <div className="w-7 h-7 rounded-full overflow-hidden border border-gray-700 shrink-0 mt-0.5">
                  <Avatar
                    src={msg.user.profileImage || "/img/new_boots_profile.webp"}
                    alt={msg.user.displayName}
                    size={28}
                    className="w-full h-full"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-xs font-semibold ${
                        isMe ? "text-yellow-400" : "text-gray-300"
                      }`}
                    >
                      {msg.user.displayName || msg.user.username}
                    </span>
                    <span className="text-[10px] text-gray-600">
                      Lv {msg.user.level}
                    </span>
                    <span className="text-[10px] text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed break-words">
                    {msg.message}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input area */}
      <form onSubmit={handleSend} className="px-4 py-3 border-t border-gray-700 shrink-0">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            maxLength={500}
            className="flex-1 bg-gray-900/70 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-yellow-500/50 focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="px-3 py-2 rounded-lg bg-yellow-500/20 text-yellow-400 text-sm font-medium hover:bg-yellow-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? (
              <span className="w-4 h-4 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin inline-block" />
            ) : (
              "Send"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
