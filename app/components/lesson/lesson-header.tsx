"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface NavLesson {
  slug: string;
  title: string;
  order: number;
}

interface LessonHeaderProps {
  partSlug: string;
  partTitle: string;
  lessonTitle: string;
  lessonOrder: number;
  durationMinutes: number;
  passed: boolean;
  prevLesson: NavLesson | null;
  nextLesson: NavLesson | null;
  allLessons: NavLesson[];
  isQuest?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Strip trailing duration like "2h" from a title */
function cleanTitle(t: string) {
  return t.replace(/\s+\d+h\s*$/i, "").trim();
}

/** Truncate a string to `max` characters */
function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function LessonHeader({
  partSlug,
  partTitle,
  lessonTitle,
  lessonOrder,
  durationMinutes,
  passed,
  prevLesson,
  nextLesson,
  allLessons,
  isQuest = false,
}: LessonHeaderProps) {
  const router = useRouter();

  /* ---- Status pill variant ---- */
  const pillClass = isQuest
    ? "topbar-pill topbar-pill-quest"
    : passed
      ? "topbar-pill topbar-pill-passed"
      : "topbar-pill topbar-pill-active";

  const pillLabel = isQuest
    ? "Boss Quest"
    : passed
      ? "Lesson passed"
      : "In progress";

  /* ---- Lesson dropdown handler ---- */
  function handleLessonChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const slug = e.target.value;
    if (slug) {
      router.push(`/parts/${partSlug}/lessons/${slug}`);
    }
  }

  return (
    <header className="topbar">
      {/* ============ LEFT CLUSTER ============ */}
      <div className="topbar-left">
        {/* Back to parts */}
        <Link
          href={`/parts/${partSlug}`}
          className="topbar-icon-btn"
          aria-label="Back to chapter"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" suppressHydrationWarning>
            <path
              d="M10 3L5 8l5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              suppressHydrationWarning
            />
          </svg>
        </Link>

        {/* Duration badge */}
        {durationMinutes > 0 && (
          <span className="topbar-meta">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" suppressHydrationWarning>
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1" suppressHydrationWarning />
              <path d="M8 5v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" suppressHydrationWarning />
            </svg>
            {durationMinutes}m
          </span>
        )}

        {/* Status dots / check */}
        <span className="topbar-meta">
          {passed ? (
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" suppressHydrationWarning>
              <path
                d="M3 8.5l3.5 3.5L13 4"
                stroke="#4ade80"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                suppressHydrationWarning
              />
            </svg>
          ) : (
            <>
              <span
                suppressHydrationWarning
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--amber-400, #fbbf24)",
                }}
              />
              <span
                suppressHydrationWarning
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.15)",
                }}
              />
            </>
          )}
        </span>
      </div>

      {/* ============ CENTER CLUSTER ============ */}
      <div className="topbar-center">
        <span className={pillClass}>{pillLabel}</span>
      </div>

      {/* ============ RIGHT CLUSTER ============ */}
      <div className="topbar-right">
        {/* Chapter pill (static label) */}
        <span className="topbar-select-pill">
          {truncate(cleanTitle(partTitle), 24)}
        </span>

        {/* Lesson selector dropdown */}
        {allLessons.length > 0 && (
          <select
            className="topbar-select"
            value=""
            onChange={handleLessonChange}
            aria-label="Jump to lesson"
          >
            <option value="" disabled>
              L{lessonOrder} · {truncate(cleanTitle(lessonTitle), 22)}
            </option>
            {allLessons.map((l) => (
              <option key={l.slug} value={l.slug}>
                {l.order}. {truncate(cleanTitle(l.title), 30)}
              </option>
            ))}
          </select>
        )}

        {/* Prev button */}
        {prevLesson ? (
          <Link
            href={`/parts/${partSlug}/lessons/${prevLesson.slug}`}
            className="topbar-nav-btn"
            aria-label="Previous lesson"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" suppressHydrationWarning>
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning />
            </svg>
          </Link>
        ) : (
          <span className="topbar-nav-btn topbar-nav-btn-disabled" aria-disabled="true">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" suppressHydrationWarning>
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning />
            </svg>
          </span>
        )}

        {/* Next button */}
        {nextLesson ? (
          <Link
            href={`/parts/${partSlug}/lessons/${nextLesson.slug}`}
            className="topbar-nav-btn"
            aria-label="Next lesson"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" suppressHydrationWarning>
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning />
            </svg>
          </Link>
        ) : (
          <span className="topbar-nav-btn topbar-nav-btn-disabled" aria-disabled="true">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" suppressHydrationWarning>
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning />
            </svg>
          </span>
        )}
      </div>
    </header>
  );
}
