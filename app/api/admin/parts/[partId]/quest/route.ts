import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

const ADMIN_USERS = ["obajali", "admin"];

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !ADMIN_USERS.includes(user.username)) return null;
  return user;
}

// PUT — create or update the quest for a part
export async function PUT(req: NextRequest, { params }: { params: Promise<{ partId: string }> }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { partId } = await params;

  const part = await prisma.part.findUnique({ where: { id: partId } });
  if (!part) return NextResponse.json({ error: "Part not found" }, { status: 404 });

  const body = await req.json();
  const { title, markdownContent, proofRules, xpReward, starterCode, testCode } = body;

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const contentId = `${part.slug}-quest`;

  const quest = await prisma.quest.upsert({
    where: { partId },
    update: {
      ...(title && { title }),
      ...(markdownContent !== undefined && { markdownContent }),
      ...(proofRules !== undefined && { proofRules, proofRulesJson: proofRules }),
      ...(xpReward !== undefined && { xpReward: Number(xpReward) }),
      ...(starterCode !== undefined && { starterCode }),
      ...(testCode !== undefined && { testCode }),
    },
    create: {
      contentId,
      partId,
      slug: "quest",
      title,
      markdownContent: markdownContent || "",
      proofRules: proofRules || "{}",
      proofRulesJson: proofRules || "{}",
      xpReward: Number(xpReward) || 250,
      starterCode: starterCode || "",
      testCode: testCode || "",
    },
  });

  return NextResponse.json({ quest });
}

// DELETE — remove the quest from a part
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ partId: string }> }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { partId } = await params;

  await prisma.quest.deleteMany({ where: { partId } });

  return NextResponse.json({ ok: true });
}
