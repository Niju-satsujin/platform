import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

const ADMIN_USERS = ["obajali", "admin"];

async function requireAdmin(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user || !ADMIN_USERS.includes(user.username)) return null;
  return user;
}

// GET — get a single lesson with full content
export async function GET(req: NextRequest, { params }: { params: Promise<{ partId: string; lessonId: string }> }) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { lessonId } = await params;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { part: { select: { id: true, slug: true, title: true } } },
  });

  if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

  return NextResponse.json({ lesson });
}

// PUT — update a lesson
export async function PUT(req: NextRequest, { params }: { params: Promise<{ partId: string; lessonId: string }> }) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { partId, lessonId } = await params;
  const body = await req.json();

  const {
    slug, title, order, durationMinutes, markdownContent,
    proofRules, xpReward, starterCode, testCode, solutionCode,
  } = body;

  // If slug changed, check uniqueness
  if (slug) {
    const conflict = await prisma.lesson.findFirst({
      where: { partId, slug, id: { not: lessonId } },
    });
    if (conflict) {
      return NextResponse.json({ error: `Slug "${slug}" already taken in this part` }, { status: 409 });
    }
  }

  const lesson = await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      ...(slug && { slug }),
      ...(title && { title }),
      ...(order !== undefined && { order: Number(order) }),
      ...(durationMinutes !== undefined && { durationMinutes: Number(durationMinutes) }),
      ...(markdownContent !== undefined && { markdownContent }),
      ...(proofRules !== undefined && { proofRules, proofRulesJson: proofRules }),
      ...(xpReward !== undefined && { xpReward: Number(xpReward) }),
      ...(starterCode !== undefined && { starterCode }),
      ...(testCode !== undefined && { testCode }),
      ...(solutionCode !== undefined && { solutionCode }),
    },
  });

  return NextResponse.json({ lesson });
}

// DELETE — delete a lesson
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ partId: string; lessonId: string }> }) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { lessonId } = await params;

  await prisma.lesson.delete({ where: { id: lessonId } });

  return NextResponse.json({ ok: true });
}
