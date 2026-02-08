"use client";

import { Handle, Position } from "reactflow";
import { useState } from "react";

export interface SkillNodeData {
  label: string;
  category: string;
  state: "locked" | "unlocked" | "bronze" | "silver" | "gold" | "platinum";
  progress: number; // 0-1
  description: string;
}

import { NodeProps } from "reactflow";

export function SkillTreeNode({ data }: NodeProps<SkillNodeData>) {
  const [isHovered, setIsHovered] = useState(false);

  // Color scheme by state
  const stateColors: Record<string, { bg: string; border: string; badge: string }> = {
    locked: {
      bg: "bg-gray-800",
      border: "border-gray-700",
      badge: "bg-gray-600 text-gray-300",
    },
    unlocked: {
      bg: "bg-gray-700",
      border: "border-gray-600",
      badge: "bg-blue-600 text-blue-100",
    },
    bronze: {
      bg: "bg-amber-900",
      border: "border-amber-700",
      badge: "bg-amber-600 text-white",
    },
    silver: {
      bg: "bg-slate-700",
      border: "border-slate-600",
      badge: "bg-slate-500 text-white",
    },
    gold: {
      bg: "bg-yellow-700",
      border: "border-yellow-600",
      badge: "bg-yellow-500 text-yellow-950",
    },
    platinum: {
      bg: "bg-purple-700",
      border: "border-purple-600",
      badge: "bg-purple-500 text-white",
    },
  };

  const colors = stateColors[data.state] || stateColors.locked;

  return (
    <div
      className={`
        relative
        px-3 py-2
        rounded-lg
        border-2
        transition-all
        duration-200
        cursor-pointer
        ${colors.bg}
        ${colors.border}
        ${isHovered ? "shadow-lg scale-105" : "shadow"}
        opacity-100
        min-w-[180px]
        text-center
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Handle for edges */}
      <Handle type="target" position={Position.Top} />

      {/* Badge with state */}
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-bold px-2 py-0.5 rounded ${colors.badge}`}>
          {data.state.charAt(0).toUpperCase() + data.state.slice(1)}
        </span>
        <span className="text-[10px] text-gray-300">{Math.round(data.progress * 100)}%</span>
      </div>

      {/* Title */}
      <h4 className="text-sm font-bold text-white truncate mb-1">{data.label}</h4>

      {/* Category */}
      <p className="text-xs text-gray-300 mb-2 truncate">{data.category}</p>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden mb-1.5">
        <div
          className={`h-full transition-all duration-300 ${
            data.state === "locked"
              ? "bg-gray-600"
              : data.state === "unlocked"
                ? "bg-blue-500"
                : data.state === "bronze"
                  ? "bg-amber-500"
                  : data.state === "silver"
                    ? "bg-slate-400"
                    : data.state === "gold"
                      ? "bg-yellow-400"
                      : "bg-purple-400"
          }`}
          style={{ width: `${data.progress * 100}%` }}
        />
      </div>

      {/* Hover tooltip */}
      {isHovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 border border-gray-600 rounded-lg shadow-lg text-xs text-gray-100 z-50 pointer-events-none">
          {data.description}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
