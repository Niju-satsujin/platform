import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getRecentEvents, getEventsByType, countEventsByType } from "@/lib/progress-events";
import type { ProgressEventType } from "@/lib/progress-events";

/**
 * GET /api/progress-events
 *
 * Query params:
 *   type   — filter by event type (optional)
 *   limit  — max results (default 50, max 200)
 *   counts — if "true", return grouped counts instead of events
 */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type") as ProgressEventType | null;
  const limitParam = parseInt(searchParams.get("limit") || "50", 10);
  const limit = Math.min(Math.max(1, limitParam), 200);
  const wantCounts = searchParams.get("counts") === "true";

  if (wantCounts) {
    const counts = await countEventsByType(user.id);
    return NextResponse.json({ counts });
  }

  const events = type
    ? await getEventsByType(user.id, type, limit)
    : await getRecentEvents(user.id, limit);

  // Parse JSON payload for each event
  const parsed = events.map((e) => ({
    id: e.id,
    type: e.type,
    payload: JSON.parse(e.payload),
    createdAt: e.createdAt,
  }));

  return NextResponse.json({ events: parsed });
}
