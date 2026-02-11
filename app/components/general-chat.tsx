"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Avatar from "@/app/components/avatar";
import { getSessionToken } from "@/app/components/session-guard";

/* ── Types ── */
interface ChatUser {
  id: string;
  username: string;
  displayName: string;
  profileImage: string;
  level: number;
}

interface ReplyTo {
  id: string;
  message: string;
  imageUrl: string | null;
  deletedAt: string | null;
  user: { id: string; displayName: string; username: string };
}

interface ChatMsg {
  id: string;
  message: string;
  imageUrl: string | null;
  replyToId: string | null;
  replyTo: ReplyTo | null;
  deleted: boolean;
  createdAt: string;
  user: ChatUser;
}

/* ── Helpers ── */
function apiUrl(path: string) {
  const token = getSessionToken();
  return token ? `${path}?t=${encodeURIComponent(token)}` : path;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function dateSeparator(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = (today.getTime() - msgDay.getTime()) / 86_400_000;

  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function isSameDay(a: string, b: string) {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function isImageUrl(url: string) {
  return /\.(jpe?g|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url);
}

/**
 * General chat — WhatsApp-style with reply, images, dates, delete.
 */
export default function GeneralChat() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<ChatMsg | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /* ── Fetch messages ── */
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("/api/chat"), { credentials: "include" });
      if (!res.ok) return;
      const json = await res.json();
      setMessages(json.messages);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const cancelled = { current: false };

    fetchMessages();

    async function fetchMe() {
      const token = getSessionToken();
      if (!token) return;
      try {
        const res = await fetch(`/api/auth/me?t=${encodeURIComponent(token)}`, { credentials: "include" });
        if (res.ok) {
          const json = await res.json();
          if (!cancelled.current) setCurrentUserId(json.user?.id ?? null);
        }
      } catch { /* ignore */ }
    }
    fetchMe();

    const interval = setInterval(fetchMessages, 5_000);
    return () => { cancelled.current = true; clearInterval(interval); };
  }, [fetchMessages]);

  /* Auto-scroll to bottom */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  /* ── Send message ── */
  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text && !uploading) return;
    if (sending) return;

    setSending(true);
    try {
      const res = await fetch(apiUrl("/api/chat"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          replyToId: replyTo?.id || null,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setMessages((prev) => [...prev, json.message]);
        setInput("");
        setReplyTo(null);
        inputRef.current?.focus();
      }
    } catch { /* ignore */ }
    finally { setSending(false); }
  }

  /* ── Upload image ── */
  async function handleImageUpload(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(apiUrl("/api/chat/upload"), {
        method: "POST",
        credentials: "include",
        body: form,
      });
      if (!res.ok) return;
      const { url } = await res.json();

      // Send message with image
      const sendRes = await fetch(apiUrl("/api/chat"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input.trim(),
          imageUrl: url,
          replyToId: replyTo?.id || null,
        }),
      });

      if (sendRes.ok) {
        const json = await sendRes.json();
        setMessages((prev) => [...prev, json.message]);
        setInput("");
        setReplyTo(null);
        inputRef.current?.focus();
      }
    } catch { /* ignore */ }
    finally { setUploading(false); }
  }

  /* ── Delete message ── */
  async function handleDelete(msgId: string) {
    if (!confirm("Delete this message?")) return;
    try {
      const res = await fetch(apiUrl(`/api/chat/${msgId}`), {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId ? { ...m, message: "", imageUrl: null, deleted: true } : m
          )
        );
      }
    } catch { /* ignore */ }
  }

  /* ── Detect GIF / image URLs in message text ── */
  function renderMessageContent(msg: ChatMsg) {
    if (msg.deleted) {
      return (
        <p className="text-xs text-gray-600 italic flex items-center gap-1">
          <span>🚫</span> This message was deleted
        </p>
      );
    }

    const parts: React.ReactNode[] = [];

    // Reply preview
    if (msg.replyTo) {
      const rt = msg.replyTo;
      const rtDeleted = !!rt.deletedAt;
      parts.push(
        <div
          key="reply"
          className="border-l-2 border-yellow-500/50 bg-gray-800/60 rounded-r-md px-2.5 py-1.5 mb-1.5 cursor-pointer hover:bg-gray-800/80 transition-colors"
          onClick={() => {
            const el = document.getElementById(`msg-${rt.id}`);
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
              el.classList.add("ring-1", "ring-yellow-500/40");
              setTimeout(() => el.classList.remove("ring-1", "ring-yellow-500/40"), 1500);
            }
          }}
        >
          <span className="text-[10px] text-yellow-400 font-semibold">
            {rt.user.displayName || rt.user.username}
          </span>
          <p className="text-[11px] text-gray-500 truncate max-w-[200px]">
            {rtDeleted ? "🚫 Deleted" : rt.imageUrl ? "📷 Photo" : rt.message}
          </p>
        </div>
      );
    }

    // Image
    if (msg.imageUrl) {
      parts.push(
        <div
          key="img"
          className="rounded-lg overflow-hidden cursor-pointer max-w-[220px] mb-1"
          onClick={() => setLightbox(msg.imageUrl)}
        >
          <Image
            src={msg.imageUrl}
            alt="chat image"
            width={220}
            height={160}
            className="object-cover rounded-lg hover:opacity-90 transition-opacity"
            unoptimized
          />
        </div>
      );
    }

    // Text — detect inline image/gif URLs
    if (msg.message) {
      const words = msg.message.split(" ");
      const textParts: React.ReactNode[] = [];
      let buf = "";

      words.forEach((word, i) => {
        if (isImageUrl(word)) {
          if (buf) { textParts.push(buf); buf = ""; }
          textParts.push(
            <Image
              key={`inline-${i}`}
              src={word}
              alt="inline image"
              width={200}
              height={140}
              className="rounded-lg mt-1 cursor-pointer hover:opacity-90"
              onClick={() => setLightbox(word)}
              unoptimized
            />
          );
        } else {
          buf += (buf ? " " : "") + word;
        }
      });
      if (buf) textParts.push(buf);

      // Check if it's only text (no inline images)
      const hasInlineImages = textParts.some((p) => typeof p !== "string");

      if (hasInlineImages) {
        parts.push(
          <div key="text" className="text-sm text-gray-300 leading-relaxed break-words">
            {textParts.map((p, i) =>
              typeof p === "string" ? <span key={i}>{p} </span> : p
            )}
          </div>
        );
      } else {
        parts.push(
          <p key="text" className="text-sm text-gray-300 leading-relaxed break-words">
            {msg.message}
          </p>
        );
      }
    }

    return <>{parts}</>;
  }

  return (
    <div className="game-card flex flex-col" style={{ height: "400px" }}>
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
        className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 scrollbar-thin"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-2xl mb-2">💬</p>
            <p className="text-xs text-gray-600">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.user.id === currentUserId;
            const showDate = idx === 0 || !isSameDay(messages[idx - 1].createdAt, msg.createdAt);

            return (
              <div key={msg.id}>
                {/* Date separator */}
                {showDate && (
                  <div className="flex items-center justify-center my-3">
                    <span className="text-[10px] text-gray-500 bg-gray-800/80 px-3 py-1 rounded-full">
                      {dateSeparator(msg.createdAt)}
                    </span>
                  </div>
                )}

                {/* Message bubble */}
                <div
                  id={`msg-${msg.id}`}
                  className={`flex mb-1.5 group transition-all duration-300 ${
                    isMe ? "justify-end" : "justify-start"
                  }`}
                >
                  {/* Avatar (others only) */}
                  {!isMe && (
                    <div className="w-7 h-7 rounded-full overflow-hidden border border-gray-700 shrink-0 mt-1 mr-1.5">
                      <Avatar
                        src={msg.user.profileImage || "/img/new_boots_profile.webp"}
                        alt={msg.user.displayName}
                        size={28}
                        className="w-full h-full"
                      />
                    </div>
                  )}

                  <div
                    className={`relative max-w-[75%] rounded-xl px-3 py-2 ${
                      isMe
                        ? "bg-yellow-500/15 border border-yellow-500/20 rounded-tr-sm"
                        : "bg-gray-800/80 border border-gray-700/50 rounded-tl-sm"
                    }`}
                  >
                    {/* Username + level (others) */}
                    {!isMe && (
                      <div className="flex items-baseline gap-1.5 mb-0.5">
                        <span className="text-[11px] font-semibold text-green-400">
                          {msg.user.displayName || msg.user.username}
                        </span>
                        <span className="text-[9px] text-gray-600">Lv{msg.user.level}</span>
                      </div>
                    )}

                    {/* Content */}
                    {renderMessageContent(msg)}

                    {/* Time + actions row */}
                    <div className={`flex items-center gap-1.5 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                      <span className="text-[9px] text-gray-600" title={new Date(msg.createdAt).toLocaleString()}>
                        {formatTime(msg.createdAt)}
                      </span>

                      {/* Reply button */}
                      {!msg.deleted && (
                        <button
                          onClick={() => { setReplyTo(msg); inputRef.current?.focus(); }}
                          className="text-[10px] text-gray-600 hover:text-yellow-400 opacity-0 group-hover:opacity-100 transition-all"
                          title="Reply"
                        >
                          ↩
                        </button>
                      )}

                      {/* Delete button (own messages only) */}
                      {isMe && !msg.deleted && (
                        <button
                          onClick={() => handleDelete(msg.id)}
                          className="text-[10px] text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                          title="Delete"
                        >
                          🗑
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reply preview bar */}
      {replyTo && (
        <div className="px-4 py-2 border-t border-gray-700 bg-gray-800/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-0.5 h-8 bg-yellow-500 rounded-full shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-yellow-400 font-semibold">
                {replyTo.user.displayName || replyTo.user.username}
              </span>
              <p className="text-[11px] text-gray-500 truncate max-w-[250px]">
                {replyTo.imageUrl ? "📷 Photo" : replyTo.message}
              </p>
            </div>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            className="text-gray-500 hover:text-gray-300 text-sm ml-2 shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* Input area */}
      <form onSubmit={handleSend} className="px-3 py-2.5 border-t border-gray-700 shrink-0">
        <div className="flex items-center gap-2">
          {/* Image upload button */}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="text-gray-500 hover:text-yellow-400 text-lg transition-colors disabled:opacity-30"
            title="Send image"
          >
            📷
          </button>

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={replyTo ? `Reply to ${replyTo.user.displayName || replyTo.user.username}…` : "Type a message…"}
            maxLength={1000}
            className="flex-1 bg-gray-900/70 border border-gray-700 rounded-full px-4 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-yellow-500/50 focus:outline-none transition-colors"
          />

          <button
            type="submit"
            disabled={(!input.trim() && !uploading) || sending}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            {sending || uploading ? (
              <span className="w-4 h-4 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin inline-block" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </div>
      </form>

      {/* Lightbox overlay */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center cursor-pointer"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <Image
              src={lightbox}
              alt="fullscreen"
              width={800}
              height={600}
              className="object-contain max-h-[85vh] rounded-lg"
              unoptimized
            />
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 text-lg"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
