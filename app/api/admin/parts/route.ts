import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

const ADMIN_USERS = ["obajali", "admin"]; // usernames allowed to manage content

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !ADMIN_USERS.includes(user.username)) {
    return null;
  }
  return user;
}

// GET — list all parts with lesson counts
export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const parts = await prisma.part.findMany({
    orderBy: { order: "asc" },
    include: {
      lessons: {
        orderBy: { order: "asc" },
        select: { id: true, slug: true, title: true, order: true, durationMinutes: true },
      },
      quest: { select: { id: true, slug: true, title: true } },
    },
  });

  return NextResponse.json({ parts });
}

// POST — create a new part (path/course)
export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json();
  const { slug, title, description, order } = body;

  if (!slug || !title || !order) {
    return NextResponse.json({ error: "slug, title, order are required" }, { status: 400 });
  }

  // Check for slug conflict
  const existing = await prisma.part.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: `Part with slug "${slug}" already exists` }, { status: 409 });
  }

  const part = await prisma.part.create({
    data: {
      slug,
      title,
      description: description || "",
      order: Number(order),
    },
  });

  return NextResponse.json({ part }, { status: 201 });
}
