import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

const ADMIN_USERS = ["obajali", "admin"];

async function requireAdmin(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user || !ADMIN_USERS.includes(user.username)) return null;
  return user;
}

// GET — get a single part with all lessons
export async function GET(req: NextRequest, { params }: { params: Promise<{ partId: string }> }) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { partId } = await params;

  const part = await prisma.part.findUnique({
    where: { id: partId },
    include: {
      lessons: {
        orderBy: { order: "asc" },
        select: {
          id: true, slug: true, title: true, order: true,
          durationMinutes: true, markdownContent: true,
          proofRules: true, proofRulesJson: true,
          xpReward: true, starterCode: true, testCode: true, solutionCode: true,
          contentId: true,
        },
      },
      quest: {
        select: {
          id: true, slug: true, title: true, markdownContent: true,
          proofRules: true, proofRulesJson: true, xpReward: true,
          starterCode: true, testCode: true, contentId: true,
        },
      },
    },
  });

  if (!part) return NextResponse.json({ error: "Part not found" }, { status: 404 });

  return NextResponse.json({ part });
}

// PUT — update a part
export async function PUT(req: NextRequest, { params }: { params: Promise<{ partId: string }> }) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { partId } = await params;
  const body = await req.json();
  const { slug, title, description, order } = body;

  // Check slug uniqueness if slug changed
  if (slug) {
    const conflict = await prisma.part.findFirst({
      where: { slug, id: { not: partId } },
    });
    if (conflict) {
      return NextResponse.json({ error: `Slug "${slug}" is already taken` }, { status: 409 });
    }
  }

  const part = await prisma.part.update({
    where: { id: partId },
    data: {
      ...(slug && { slug }),
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(order !== undefined && { order: Number(order) }),
    },
  });

  return NextResponse.json({ part });
}

// DELETE — delete a part and all its lessons/quest
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ partId: string }> }) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { partId } = await params;

  await prisma.part.delete({ where: { id: partId } });

  return NextResponse.json({ ok: true });
}
