"use client";

import { useState, useCallback } from "react";

export interface VisualData {
  title: string;
  sourceUrl: string;
  licenseName: string;
  licenseUrl: string;
  author?: string | null;
  attributionText: string;
  altText: string;
  localPath?: string | null;
}

interface VisualModelCardProps {
  visual: VisualData | null;
  /** Key callouts to annotate on/beside the visual */
  callouts?: { label: string; text: string }[];
}

export function VisualModelCard({ visual, callouts }: VisualModelCardProps) {
  const [zoomed, setZoomed] = useState(false);
  const imageUrl = visual?.localPath || visual?.sourceUrl || "";

  const openZoom = useCallback(() => setZoomed(true), []);
  const closeZoom = useCallback(() => setZoomed(false), []);

  return (
    <>
      <section className="game-card p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-450 font-semibold">
              Visual Model
            </p>
            <h2 className="text-lg font-bold text-gray-100">
              {visual?.title || "Concept Diagram"}
            </h2>
          </div>
          {imageUrl && (
            <button
              type="button"
              onClick={openZoom}
              className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors flex items-center gap-1"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="11" y1="8" x2="11" y2="14" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
              Open full
            </button>
          )}
        </div>

        {/* Thumbnail visual — constrained height */}
        {imageUrl ? (
          <button
            type="button"
            onClick={openZoom}
            className="w-full cursor-zoom-in group"
          >
            <div className="w-full max-h-64 overflow-hidden rounded-xl border border-gray-700 bg-gray-900 relative">
              <img
                src={imageUrl}
                alt={visual?.altText || "Lesson visual model"}
                className="w-full h-auto object-contain max-h-64 transition-transform duration-200 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        ) : (
          <div className="w-full h-40 rounded-xl border border-gray-700 bg-gray-900 flex items-center justify-center text-gray-500 text-sm">
            <PlaceholderVisual />
          </div>
        )}

        {/* Callouts / annotations */}
        {callouts && callouts.length > 0 && (
          <div className="mt-4 grid gap-2">
            {callouts.map((c, i) => (
              <div
                key={i}
                className="flex items-start gap-3 text-sm"
              >
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500/15 text-yellow-400 text-xs font-bold shrink-0 mt-0.5">
                  {c.label}
                </span>
                <span className="text-gray-300 leading-relaxed">{c.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Attribution */}
        {visual && (
          <details className="mt-4 text-xs text-gray-450">
            <summary className="cursor-pointer hover:text-gray-200 transition-colors">
              Source &amp; license
            </summary>
            <div className="mt-2 space-y-1 text-gray-400">
              <div>
                {visual.title} — {visual.author || "Unknown"}
              </div>
              <div>
                License:{" "}
                {visual.licenseUrl ? (
                  <a
                    href={visual.licenseUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-yellow-400 hover:text-yellow-300"
                  >
                    {visual.licenseName}
                  </a>
                ) : (
                  visual.licenseName
                )}
              </div>
              {visual.sourceUrl && (
                <div>
                  Source:{" "}
                  <a
                    href={visual.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-yellow-400 hover:text-yellow-300 break-all"
                  >
                    {visual.sourceUrl}
                  </a>
                </div>
              )}
            </div>
          </details>
        )}
      </section>

      {/* ===== Zoom modal ===== */}
      {zoomed && (
        <div
          className="fixed inset-0 z-50 bg-gray-950/90 flex items-center justify-center p-4 animate-fade-in"
          onClick={closeZoom}
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-w-5xl w-full max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={closeZoom}
              className="absolute -top-10 right-0 text-gray-400 hover:text-white text-sm flex items-center gap-1 transition-colors"
            >
              Close ✕
            </button>
            <img
              src={imageUrl}
              alt={visual?.altText || "Lesson visual model (full size)"}
              className="w-full h-auto max-h-[85vh] object-contain rounded-xl border border-gray-700"
            />
            {visual && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                {visual.title} — {visual.licenseName}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function PlaceholderVisual() {
  return (
    <svg
      width="240"
      height="120"
      viewBox="0 0 240 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="10" y="10" width="220" height="100" rx="12" stroke="#4e5564" strokeWidth="2" />
      <path d="M30 80 L70 50 L110 70 L150 40 L190 60" stroke="#efbb03" strokeWidth="3" fill="none" />
      <circle cx="70" cy="50" r="4" fill="#f6bd45" />
      <circle cx="110" cy="70" r="4" fill="#f6bd45" />
      <circle cx="150" cy="40" r="4" fill="#f6bd45" />
      <text x="30" y="35" fill="#919dab" fontSize="10">
        No visual mapped
      </text>
    </svg>
  );
}
