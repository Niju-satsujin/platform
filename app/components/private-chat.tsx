"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Avatar from "@/app/components/avatar";
import { getSessionToken } from "@/app/components/session-guard";

/* ── Types ── */
interface DMUser {
  id: string;
  username: string;
  displayName: string;
  profileImage: string;
  level: number;
  lastActiveAt: string;
}

interface ConvLastMessage {
  id: string;
  message: string;
  imageUrl: string | null;
  senderId: string;
  deleted: boolean;
  createdAt: string;
}

interface Conversation {
  id: string;
  otherUser: DMUser;
  updatedAt: string;
  unreadCount: number;
  lastMessage: ConvLastMessage | null;
}

interface DMReplyTo {
  id: string;
  message: string;
  imageUrl: string | null;
  deletedAt: string | null;
  sender: { id: string; displayName: string; username: string };
}

interface DM {
  id: string;
  message: string;
  imageUrl: string | null;
  replyToId: string | null;
  replyTo: DMReplyTo | null;
  readAt: string | null;
  deleted: boolean;
  createdAt: string;
  senderId: string;
  sender: DMUser;
}

/* ── Helpers ── */
function apiUrl(path: string) {
  const token = getSessionToken();
  return token ? `${path}?t=${encodeURIComponent(token)}` : path;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatRelative(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

function isOnline(lastActive: string) {
  return Date.now() - new Date(lastActive).getTime() < 5 * 60_000;
}

function isImageUrl(url: string) {
  return /\.(jpe?g|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url);
}

/* ================================================================ */
export default function PrivateChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DM[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<DM | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DMUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConvId) ?? null;

  /* ── Fetch current user ── */
  useEffect(() => {
    const token = getSessionToken();
    if (!token) return;
    fetch(`/api/auth/me?t=${encodeURIComponent(token)}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d?.user?.id) setCurrentUserId(d.user.id); })
      .catch(() => {});
  }, []);

  /* ── Fetch conversations ── */
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("/api/dm/conversations"), { credentials: "include" });
      if (!res.ok) return;
      const json = await res.json();
      setConversations(json.conversations);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 8_000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  /* ── Fetch messages for active conversation ── */
  const fetchMessages = useCallback(async () => {
    if (!activeConvId) return;
    try {
      const res = await fetch(apiUrl(`/api/dm/conversations/${activeConvId}`), { credentials: "include" });
      if (!res.ok) return;
      const json = await res.json();
      setMessages(json.messages);
    } catch { /* ignore */ }
  }, [activeConvId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 4_000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  /* ── Auto-scroll ── */
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  /* ── Switch conversation ── */
  function openConversation(convId: string) {
    setActiveConvId(convId);
    setMessages([]);
    setReplyTo(null);
    setInput("");
    setShowSidebar(false); // hide sidebar on mobile
    setShowNewChat(false);
  }

  /* ── Start new conversation with user ── */
  async function startDMWith(targetUser: DMUser) {
    try {
      const res = await fetch(apiUrl("/api/dm/conversations"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetUser.id }),
      });
      if (!res.ok) return;
      const json = await res.json();
      const conv = json.conversation;

      // Add to list if not already there
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === conv.id);
        if (exists) return prev;
        return [conv, ...prev];
      });

      openConversation(conv.id);
      setSearchQuery("");
      setSearchResults([]);
    } catch { /* ignore */ }
  }

  /* ── Search users ── */
  useEffect(() => {
    if (!showNewChat) return;
    const q = searchQuery.trim();
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const base = apiUrl("/api/dm/users");
        const sep = base.includes("?") ? "&" : "?";
        const url = q ? `${base}${sep}q=${encodeURIComponent(q)}` : base;
        const res = await fetch(url, { credentials: "include" });
        if (res.ok) {
          const json = await res.json();
          setSearchResults(json.users);
        }
      } catch { /* ignore */ }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, showNewChat]);

  /* ── Send message ── */
  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!activeConvId) return;
    const text = input.trim();
    if (!text && !uploading) return;
    if (sending) return;

    setSending(true);
    try {
      const res = await fetch(apiUrl(`/api/dm/conversations/${activeConvId}`), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, replyToId: replyTo?.id || null }),
      });
      if (res.ok) {
        const json = await res.json();
        setMessages((prev) => [...prev, json.message]);
        setInput("");
        setReplyTo(null);
        inputRef.current?.focus();
        fetchConversations(); // refresh sidebar
      }
    } catch { /* ignore */ }
    finally { setSending(false); }
  }

  /* ── Upload image ── */
  async function handleImageUpload(file: File) {
    if (!activeConvId) return;
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

      const sendRes = await fetch(apiUrl(`/api/dm/conversations/${activeConvId}`), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input.trim(), imageUrl: url, replyToId: replyTo?.id || null }),
      });
      if (sendRes.ok) {
        const json = await sendRes.json();
        setMessages((prev) => [...prev, json.message]);
        setInput("");
        setReplyTo(null);
        inputRef.current?.focus();
        fetchConversations();
      }
    } catch { /* ignore */ }
    finally { setUploading(false); }
  }

  /* ── Delete message ── */
  async function handleDelete(msgId: string) {
    if (!activeConvId || !confirm("Delete this message?")) return;
    try {
      const res = await fetch(apiUrl(`/api/dm/conversations/${activeConvId}`), {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: msgId }),
      });
      if (res.ok) {
        setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, message: "", imageUrl: null, deleted: true } : m));
      }
    } catch { /* ignore */ }
  }

  /* ── Render message content ── */
  function renderContent(msg: DM) {
    if (msg.deleted) {
      return <p className="text-xs text-gray-600 italic flex items-center gap-1"><span>🚫</span> This message was deleted</p>;
    }

    const parts: React.ReactNode[] = [];

    if (msg.replyTo) {
      const rt = msg.replyTo;
      const rtDeleted = !!rt.deletedAt;
      parts.push(
        <div key="reply" className="border-l-2 border-blue-400/50 bg-gray-800/60 rounded-r-md px-2.5 py-1.5 mb-1.5 cursor-pointer hover:bg-gray-800/80 transition-colors"
          onClick={() => { const el = document.getElementById(`dm-${rt.id}`); if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.classList.add("ring-1", "ring-blue-400/40"); setTimeout(() => el.classList.remove("ring-1", "ring-blue-400/40"), 1500); } }}>
          <span className="text-[10px] text-blue-400 font-semibold">{rt.sender.displayName || rt.sender.username}</span>
          <p className="text-[11px] text-gray-500 truncate max-w-[200px]">{rtDeleted ? "🚫 Deleted" : rt.imageUrl ? "📷 Photo" : rt.message}</p>
        </div>
      );
    }

    if (msg.imageUrl) {
      parts.push(
        <div key="img" className="rounded-lg overflow-hidden cursor-pointer max-w-[220px] mb-1" onClick={() => setLightbox(msg.imageUrl)}>
          <Image src={msg.imageUrl} alt="dm image" width={220} height={160} className="object-cover rounded-lg hover:opacity-90 transition-opacity" unoptimized />
        </div>
      );
    }

    if (msg.message) {
      const words = msg.message.split(" ");
      const textParts: React.ReactNode[] = [];
      let buf = "";
      words.forEach((word, i) => {
        if (isImageUrl(word)) {
          if (buf) { textParts.push(buf); buf = ""; }
          textParts.push(<Image key={`inline-${i}`} src={word} alt="inline" width={200} height={140} className="rounded-lg mt-1 cursor-pointer hover:opacity-90" onClick={() => setLightbox(word)} unoptimized />);
        } else { buf += (buf ? " " : "") + word; }
      });
      if (buf) textParts.push(buf);
      const hasInline = textParts.some((p) => typeof p !== "string");
      if (hasInline) {
        parts.push(<div key="text" className="text-sm text-gray-300 leading-relaxed break-words">{textParts.map((p, i) => typeof p === "string" ? <span key={i}>{p} </span> : p)}</div>);
      } else {
        parts.push(<p key="text" className="text-sm text-gray-300 leading-relaxed break-words">{msg.message}</p>);
      }
    }

    return <>{parts}</>;
  }

  /* ================================================================ */
  return (
    <div className="flex h-[calc(100dvh-50px)] overflow-hidden">
      {/* ── Sidebar ── */}
      <div className={`${showSidebar ? "flex" : "hidden"} md:flex flex-col w-full md:w-80 lg:w-96 border-r border-gray-700 bg-[#0e1321] shrink-0`}>
        {/* Sidebar header */}
        <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between shrink-0">
          <h2 className="text-sm font-bold text-gray-200 flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            Messages
          </h2>
          <button
            onClick={() => { setShowNewChat(!showNewChat); setSearchQuery(""); setSearchResults([]); }}
            className="h-8 w-8 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 flex items-center justify-center transition-colors"
            title="New message"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>

        {/* New chat search */}
        {showNewChat && (
          <div className="px-3 py-2 border-b border-gray-700 bg-gray-900/60">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-base sm:text-sm text-gray-200 placeholder:text-gray-500 outline-none focus:border-blue-500/50"
              autoFocus
            />
            <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
              {searching && <p className="text-xs text-gray-600 text-center py-2">Searching...</p>}
              {!searching && searchResults.length === 0 && searchQuery && (
                <p className="text-xs text-gray-600 text-center py-2">No users found</p>
              )}
              {searchResults.map((u) => (
                <button
                  key={u.id}
                  onClick={() => startDMWith(u)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors text-left"
                >
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-700">
                      <Avatar src={u.profileImage} alt={u.displayName || u.username} size={36} className="w-full h-full" />
                    </div>
                    {isOnline(u.lastActiveAt) && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0e1321]" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-200 font-medium truncate">{u.displayName || u.username}</p>
                    <p className="text-[11px] text-gray-500">@{u.username} · Lv{u.level}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <p className="text-3xl mb-2">💬</p>
              <p className="text-sm text-gray-500">No conversations yet</p>
              <p className="text-xs text-gray-600 mt-1">Tap + to start messaging someone</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === activeConvId;
              const u = conv.otherUser;
              const lm = conv.lastMessage;
              return (
                <button
                  key={conv.id}
                  onClick={() => openConversation(conv.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-800 transition-colors text-left ${
                    isActive ? "bg-blue-500/10 border-l-2 border-l-blue-500" : "hover:bg-gray-800/50"
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-full overflow-hidden border border-gray-700">
                      <Avatar src={u.profileImage} alt={u.displayName || u.username} size={44} className="w-full h-full" />
                    </div>
                    {isOnline(u.lastActiveAt) && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0e1321]" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-200 font-medium truncate">{u.displayName || u.username}</p>
                      {lm && <span className="text-[10px] text-gray-600 shrink-0 ml-1">{formatRelative(lm.createdAt)}</span>}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-gray-500 truncate max-w-[180px]">
                        {lm
                          ? lm.deleted ? "🚫 Deleted" : lm.imageUrl ? "📷 Photo" : lm.message || "..."
                          : "No messages yet"}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="min-w-[18px] h-[18px] rounded-full bg-blue-500 text-[10px] leading-[18px] text-white px-1 text-center font-bold shrink-0">
                          {Math.min(conv.unreadCount, 99)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Chat panel ── */}
      <div className={`${!showSidebar ? "flex" : "hidden"} md:flex flex-col flex-1 min-w-0`}>
        {activeConv ? (
          <>
            {/* Chat header */}
            <div className="px-4 py-2.5 border-b border-gray-700 flex items-center gap-3 bg-[#0e1321] shrink-0">
              {/* Back button (mobile) */}
              <button
                onClick={() => { setShowSidebar(true); setActiveConvId(null); }}
                className="md:hidden h-9 w-9 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors shrink-0"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>

              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-700">
                  <Avatar src={activeConv.otherUser.profileImage} alt={activeConv.otherUser.displayName} size={36} className="w-full h-full" />
                </div>
                {isOnline(activeConv.otherUser.lastActiveAt) && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0e1321]" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-200 truncate">{activeConv.otherUser.displayName || activeConv.otherUser.username}</p>
                <p className="text-[11px] text-gray-500">
                  {isOnline(activeConv.otherUser.lastActiveAt) ? (
                    <span className="text-green-400">Online</span>
                  ) : (
                    `Last seen ${formatRelative(activeConv.otherUser.lastActiveAt)}`
                  )}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 scrollbar-thin">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-2xl mb-2">👋</p>
                  <p className="text-xs text-gray-600">Say hello to {activeConv.otherUser.displayName || activeConv.otherUser.username}!</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.senderId === currentUserId;
                  const showDate = idx === 0 || !isSameDay(messages[idx - 1].createdAt, msg.createdAt);
                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div className="flex items-center justify-center my-3">
                          <span className="text-[10px] text-gray-500 bg-gray-800/80 px-3 py-1 rounded-full">{dateSeparator(msg.createdAt)}</span>
                        </div>
                      )}
                      <div id={`dm-${msg.id}`} className={`flex mb-1.5 group transition-all duration-300 ${isMe ? "justify-end" : "justify-start"}`}>
                        {!isMe && (
                          <div className="w-7 h-7 rounded-full overflow-hidden border border-gray-700 shrink-0 mt-1 mr-1.5">
                            <Avatar src={msg.sender.profileImage || "/img/new_boots_profile.webp"} alt={msg.sender.displayName} size={28} className="w-full h-full" />
                          </div>
                        )}
                        <div className={`relative max-w-[75%] rounded-xl px-3 py-2 ${
                          isMe ? "bg-blue-500/15 border border-blue-500/20 rounded-tr-sm" : "bg-gray-800/80 border border-gray-700/50 rounded-tl-sm"
                        }`}>
                          {renderContent(msg)}
                          <div className={`flex items-center gap-1.5 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                            <span className="text-[9px] text-gray-600" title={new Date(msg.createdAt).toLocaleString()}>{formatTime(msg.createdAt)}</span>
                            {/* Read tick for own messages */}
                            {isMe && !msg.deleted && (
                              <span className={`text-[10px] ${msg.readAt ? "text-blue-400" : "text-gray-600"}`} title={msg.readAt ? "Read" : "Sent"}>
                                {msg.readAt ? "✓✓" : "✓"}
                              </span>
                            )}
                            {!msg.deleted && (
                              <button onClick={() => { setReplyTo(msg); inputRef.current?.focus(); }} className="text-[10px] text-gray-600 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all" title="Reply">↩</button>
                            )}
                            {isMe && !msg.deleted && (
                              <button onClick={() => handleDelete(msg.id)} className="text-[10px] text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all" title="Delete">🗑</button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Reply preview */}
            {replyTo && (
              <div className="px-4 py-2 border-t border-gray-700 bg-gray-800/60 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-0.5 h-8 bg-blue-400 rounded-full shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-blue-400 font-semibold">{replyTo.sender.displayName || replyTo.sender.username}</span>
                    <p className="text-[11px] text-gray-500 truncate max-w-[250px]">{replyTo.imageUrl ? "📷 Photo" : replyTo.message}</p>
                  </div>
                </div>
                <button onClick={() => setReplyTo(null)} className="text-gray-500 hover:text-gray-300 text-sm ml-2 shrink-0">✕</button>
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSend} className="px-3 py-2.5 border-t border-gray-700 shrink-0 bg-[#0e1321]">
              <div className="flex items-center gap-2">
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(file); e.target.value = ""; }} />
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="text-gray-500 hover:text-blue-400 text-lg transition-colors disabled:opacity-30" title="Send image">📷</button>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={replyTo ? `Reply to ${replyTo.sender.displayName || replyTo.sender.username}…` : "Type a message…"}
                  maxLength={2000}
                  className="flex-1 bg-gray-900/70 border border-gray-700 rounded-full px-4 py-2 text-base sm:text-sm text-gray-200 placeholder-gray-600 focus:border-blue-500/50 focus:outline-none transition-colors"
                />
                <button type="submit" disabled={(!input.trim() && !uploading) || sending} className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0">
                  {sending || uploading ? (
                    <span className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin inline-block" />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
          /* No conversation selected */
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-300 mb-1">Your Messages</h3>
            <p className="text-sm text-gray-500 max-w-xs">Send private messages to other learners. Select a conversation or start a new one.</p>
            <button
              onClick={() => { setShowNewChat(true); setShowSidebar(true); }}
              className="mt-4 px-5 py-2 rounded-full bg-blue-500/20 text-blue-400 text-sm font-medium hover:bg-blue-500/30 transition-colors"
            >
              New Message
            </button>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center cursor-pointer" onClick={() => setLightbox(null)}>
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <Image src={lightbox} alt="fullscreen" width={800} height={600} className="object-contain max-h-[85vh] rounded-lg" unoptimized />
            <button onClick={() => setLightbox(null)} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 text-lg">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
