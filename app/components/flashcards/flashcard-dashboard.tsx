"use client";

import { useState } from "react";
import { ReviewSession } from "./review-session";
import { FlashcardAnalytics } from "./flashcard-analytics";
import { CardBrowser } from "./card-browser";
import { CardCreator } from "./card-creator";

interface FlashcardDashboardProps {
  isLoggedIn: boolean;
  initialDueCount: number;
  initialTotalCards: number;
  initialTodayReviews: number;
}

type Tab = "review" | "browse" | "analytics" | "create";

export function FlashcardDashboard({
  isLoggedIn,
  initialDueCount,
  initialTotalCards,
  initialTodayReviews,
}: FlashcardDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("review");
  const [dueCount, setDueCount] = useState(initialDueCount);
  const [todayReviews, setTodayReviews] = useState(initialTodayReviews);

  if (!isLoggedIn) {
    return (
      <div className="game-card p-8 text-center">
        <p className="text-gray-400 mb-4">Log in to start reviewing flashcards.</p>
        <a href="/login" className="btn-primary">Log In</a>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "review", label: "Review", badge: dueCount > 0 ? dueCount : undefined },
    { id: "browse", label: "Browse" },
    { id: "analytics", label: "Analytics" },
    { id: "create", label: "+ Create" },
  ];

  return (
    <div>
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="game-card p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{dueCount}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Due Now</div>
        </div>
        <div className="game-card p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{todayReviews}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Reviewed Today</div>
        </div>
        <div className="game-card p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{initialTotalCards}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Total Cards</div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-gray-700 pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors relative ${
              activeTab === tab.id
                ? "bg-gray-800 text-gray-100 border border-gray-700 border-b-transparent -mb-px"
                : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/50"
            }`}
          >
            {tab.label}
            {tab.badge && (
              <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-yellow-900 bg-yellow-400 rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "review" && (
        <ReviewSession
          onReviewComplete={() => {
            setDueCount((c) => Math.max(0, c - 1));
            setTodayReviews((c) => c + 1);
          }}
        />
      )}
      {activeTab === "browse" && <CardBrowser />}
      {activeTab === "analytics" && <FlashcardAnalytics />}
      {activeTab === "create" && <CardCreator onCreated={() => setActiveTab("browse")} />}
    </div>
  );
}
