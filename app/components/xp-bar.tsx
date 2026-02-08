"use client";

import { useEffect, useState } from "react";

interface XpBarProps {
  current: number;
  max: number;
  className?: string;
  showLabel?: boolean;
}

export function XpBar({ current, max, className = "", showLabel = true }: XpBarProps) {
  const [width, setWidth] = useState(0);
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;

  useEffect(() => {
    const timer = setTimeout(() => setWidth(pct), 100);
    return () => clearTimeout(timer);
  }, [pct]);

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-400 font-medium">{current} / {max} XP</span>
          <span className="text-xs font-bold text-gradient-gold">{pct}%</span>
        </div>
      )}
      <div className="h-2.5 bg-gray-900 rounded-full overflow-hidden">
        <div
          className="xp-bar h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
