import React from "react";

export interface VisualHeroData {
  title: string;
  sourceUrl: string;
  licenseName: string;
  licenseUrl: string;
  author?: string | null;
  attributionText: string;
  altText: string;
  localPath?: string | null;
}

export function VisualHero({ visual }: { visual: VisualHeroData | null }) {
  const visualUrl = visual?.localPath || visual?.sourceUrl || "";
  const author = visual?.author || "Unknown";

  return (
    <section className="game-card p-5 mb-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-500">Visual Model</p>
          <h2 className="text-lg font-bold text-gray-100">Hero Visual Model</h2>
        </div>
      </div>

      {visualUrl ? (
        <div className="w-full overflow-hidden rounded-xl border border-gray-700 bg-gray-900">
          <img
            src={visualUrl}
            alt={visual?.altText || "Lesson visual model"}
            className="w-full h-auto"
          />
        </div>
      ) : (
        <div className="w-full h-60 rounded-xl border border-gray-700 bg-gray-900 flex items-center justify-center text-gray-500 text-sm">
          <PlaceholderVisual />
        </div>
      )}

      <div className="mt-3 text-xs text-gray-400">
        {visual ? (
          <span>
            {visual.title} - {author} - {visual.sourceUrl ? (
              <a href={visual.sourceUrl} target="_blank" rel="noreferrer" className="text-yellow-400 hover:text-yellow-300">
                Source
              </a>
            ) : (
              "Source"
            )} - {visual.licenseUrl ? (
              <a href={visual.licenseUrl} target="_blank" rel="noreferrer" className="text-yellow-400 hover:text-yellow-300">
                {visual.licenseName}
              </a>
            ) : (
              visual.licenseName
            )}
          </span>
        ) : (
          <span>Placeholder visual (no mapping found)</span>
        )}
      </div>

      <details className="mt-3 text-xs text-gray-400">
        <summary className="cursor-pointer hover:text-gray-200">Open source / license</summary>
        <div className="mt-2 space-y-1">
          <div>
            License: {visual?.licenseUrl ? (
              <a href={visual.licenseUrl} target="_blank" rel="noreferrer" className="text-yellow-400 hover:text-yellow-300">
                {visual.licenseName}
              </a>
            ) : (
              visual?.licenseName || "Unknown"
            )}
          </div>
          <div>
            Source: {visual?.sourceUrl ? (
              <a href={visual.sourceUrl} target="_blank" rel="noreferrer" className="text-yellow-400 hover:text-yellow-300">
                {visual.sourceUrl}
              </a>
            ) : (
              "Unknown"
            )}
          </div>
        </div>
      </details>
    </section>
  );
}

function PlaceholderVisual() {
  return (
    <svg width="240" height="120" viewBox="0 0 240 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="220" height="100" rx="12" stroke="#374151" strokeWidth="2" />
      <path d="M30 80 L70 50 L110 70 L150 40 L190 60" stroke="#f59e0b" strokeWidth="3" fill="none" />
      <circle cx="70" cy="50" r="4" fill="#fbbf24" />
      <circle cx="110" cy="70" r="4" fill="#fbbf24" />
      <circle cx="150" cy="40" r="4" fill="#fbbf24" />
      <text x="30" y="35" fill="#9ca3af" fontSize="10">No visual mapped</text>
    </svg>
  );
}
