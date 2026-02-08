"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";

interface SplitLayoutProps {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
}

/** Subscribe to matchMedia for mobile detection (SSR-safe) */
function useIsMobile(breakpoint = 768) {
  const subscribe = (callback: () => void) => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    mq.addEventListener("change", callback);
    return () => mq.removeEventListener("change", callback);
  };

  const getSnapshot = () =>
    window.matchMedia(`(max-width: ${breakpoint}px)`).matches;

  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Desktop: resizable side-by-side panels (lesson | code).
 * Mobile (<768px): tabs that swap between lesson and code views.
 */
export function SplitLayout({ leftPanel, rightPanel }: SplitLayoutProps) {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<"lesson" | "code">("lesson");

  /* ---- Mobile: tab switcher ---- */
  if (isMobile) {
    return (
      <div className="flex flex-col h-full">
        {/* Tab bar */}
        <div className="flex border-b border-gray-700 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("lesson")}
            className={`
              flex-1 py-3 text-sm font-semibold transition-colors
              ${activeTab === "lesson"
                ? "text-yellow-400 border-b-2 border-yellow-500 bg-gray-850"
                : "text-gray-400 hover:text-gray-200"
              }
            `}
          >
            📖 Lesson
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("code")}
            className={`
              flex-1 py-3 text-sm font-semibold transition-colors
              ${activeTab === "code"
                ? "text-yellow-400 border-b-2 border-yellow-500 bg-gray-850"
                : "text-gray-400 hover:text-gray-200"
              }
            `}
          >
            💻 Code
          </button>
        </div>

        {/* Active panel */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "lesson" ? (
            <div className="h-full overflow-y-auto split-pane-content">{leftPanel}</div>
          ) : (
            <div className="h-full">{rightPanel}</div>
          )}
        </div>
      </div>
    );
  }

  /* ---- Desktop: resizable split view ---- */
  return (
    <Group
      orientation="horizontal"
      className="h-full overflow-hidden"
      id="tsp-lesson-split"
    >
      <Panel defaultSize={50} minSize={30} className="overflow-hidden">
        <div className="h-full overflow-y-auto split-pane-content">
          {leftPanel}
        </div>
      </Panel>

      <Separator className="split-resize-handle" />

      <Panel defaultSize={50} minSize={25} className="overflow-hidden">
        <div className="h-full flex flex-col">{rightPanel}</div>
      </Panel>
    </Group>
  );
}
