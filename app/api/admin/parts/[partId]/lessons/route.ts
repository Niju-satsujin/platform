import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

const ADMIN_USERS = ["obajali", "admin"];

async function requireAdmin(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user || !ADMIN_USERS.includes(user.username)) return null;
  return user;
}

// POST — create a new lesson inside a part
export async function POST(req: NextRequest, { params }: { params: Promise<{ partId: string }> }) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { partId } = await params;

  // Check part exists
  const part = await prisma.part.findUnique({ where: { id: partId } });
  if (!part) return NextResponse.json({ error: "Part not found" }, { status: 404 });

  const body = await req.json();
  const {
    slug, title, order, durationMinutes, markdownContent,
    proofRules, xpReward, starterCode, testCode, solutionCode,
  } = body;

  if (!slug || !title || order === undefined) {
    return NextResponse.json({ error: "slug, title, order are required" }, { status: 400 });
  }

  // Check lesson slug uniqueness within part
  const existing = await prisma.lesson.findFirst({
    where: { partId, slug },
  });
  if (existing) {
    return NextResponse.json({ error: `Lesson "${slug}" already exists in this part` }, { status: 409 });
  }

  const contentId = `${part.slug}-${slug}`;

  const lesson = await prisma.lesson.create({
    data: {
      contentId,
      partId,
      slug,
      title,
      order: Number(order),
      durationMinutes: Number(durationMinutes) || 30,
      markdownContent: markdownContent || "",
      proofRules: proofRules || "{}",
      proofRulesJson: proofRules || "{}",
      xpReward: Number(xpReward) || 100,
      starterCode: starterCode || "",
      testCode: testCode || "",
      solutionCode: solutionCode || "",
    },
  });

  return NextResponse.json({ lesson }, { status: 201 });
}
