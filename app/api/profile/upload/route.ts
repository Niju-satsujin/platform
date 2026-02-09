import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { saveUploadedFile } from "@/lib/uploads";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("profileImage");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, WebP, and GIF images are allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File must be smaller than 5 MB" },
        { status: 400 }
      );
    }

    const uploadPath = await saveUploadedFile(file);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { profileImage: uploadPath },
      select: {
        username: true,
        displayName: true,
        bio: true,
        profileImage: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Profile image upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
