"use client";

import { useState, useEffect } from "react";
import { CARD_TYPES, formatInterval, type CardType } from "@/lib/flashcard-scheduler";

interface BrowseCard {
  id: string;
  front: string;
  back: string;
  type: string;
  hint: string | null;
  tags: Record<string, string>;
  sourceRef: string | null;
  userState: {
    id: string;
    easeFactor: number;
    intervalDays: number;
    dueAt: string;
    suspended: boolean;
    lapseCount: number;
    repetitions: number;
  } | null;
}

export function CardBrowser() {
  const [cards, setCards] = useState<BrowseCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchCards = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (typeFilter) params.set("type", typeFilter);
    if (search) params.set("q", search);

    try {
      const res = await fetch(`/api/flashcards/cards?${params}`);
      const data = await res.json();
      setCards(data.cards ?? []);
      setTotalPages(data.totalPages ?? 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, typeFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCards();
  };

  const toggleSuspend = async (card: BrowseCard) => {
    if (!card.userState) return;
    try {
      await fetch("/api/flashcards/cards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userCardId: card.userState.id,
          suspended: !card.userState.suspended,
        }),
      });
      fetchCards();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cards…"
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-gray-500"
          />
          <button type="submit" className="px-4 py-2 bg-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-600 transition-colors">
            Search
          </button>
        </form>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none"
        >
          <option value="">All Types</option>
          {Object.entries(CARD_TYPES).map(([key, info]) => (
            <option key={key} value={key}>{info.icon} {info.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-8 animate-pulse">Loading…</div>
      ) : cards.length === 0 ? (
        <div className="game-card p-8 text-center text-gray-500">
          No cards found. Create some cards or wait for lessons to unlock them.
        </div>
      ) : (
        <div className="space-y-2">
          {cards.map((card) => {
            const typeInfo = CARD_TYPES[card.type as CardType] ?? CARD_TYPES.concept;
            const isExpanded = expandedId === card.id;

            return (
              <div
                key={card.id}
                className={`game-card overflow-hidden transition-all ${card.userState?.suspended ? "opacity-50" : ""}`}
              >
                <button
                  className="w-full px-4 py-3 text-left flex items-center gap-3"
                  onClick={() => setExpandedId(isExpanded ? null : card.id)}
                >
                  <span className="text-lg shrink-0">{typeInfo.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-200 truncate">{card.front}</div>
                    {card.userState && (
                      <div className="flex gap-3 mt-0.5">
                        <span className="text-[10px] text-gray-500">
                          interval: {formatInterval(card.userState.intervalDays)}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          ease: {card.userState.easeFactor.toFixed(2)}
                        </span>
                        {card.userState.lapseCount > 0 && (
                          <span className="text-[10px] text-red-400/70">
                            ⚡{card.userState.lapseCount} lapses
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <span className={`text-xs shrink-0 ${typeInfo.color}`}>{typeInfo.label}</span>
                  <span className="text-gray-500 text-xs">{isExpanded ? "▲" : "▼"}</span>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-700/50 space-y-3">
                    <div className="pt-3">
                      <div className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Answer</div>
                      <div className="text-sm text-gray-300 whitespace-pre-wrap">{card.back}</div>
                    </div>
                    {card.hint && (
                      <div className="p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
                        <div className="text-[10px] font-semibold text-yellow-500 uppercase mb-0.5">💡 Hint</div>
                        <div className="text-xs text-yellow-200/80">{card.hint}</div>
                      </div>
                    )}
                    {card.userState && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => toggleSuspend(card)}
                          className="text-xs px-3 py-1 rounded bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
                        >
                          {card.userState.suspended ? "⏯ Unsuspend" : "⏸ Suspend"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 rounded bg-gray-800 text-sm text-gray-400 disabled:opacity-30 hover:bg-gray-700"
          >
            ← Prev
          </button>
          <span className="text-sm text-gray-500 px-3 py-1">{page} / {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 rounded bg-gray-800 text-sm text-gray-400 disabled:opacity-30 hover:bg-gray-700"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
