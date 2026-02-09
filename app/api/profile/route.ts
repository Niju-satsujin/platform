import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    return NextResponse.json({
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      profileImage: user.profileImage,
    });
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { displayName, bio, profileImage } = body;

    const data: Record<string, string> = {};

    if (typeof displayName === "string") {
      const trimmed = displayName.trim();
      if (trimmed.length < 1 || trimmed.length > 50) {
        return NextResponse.json(
          { error: "Display name must be 1-50 characters" },
          { status: 400 }
        );
      }
      data.displayName = trimmed;
    }

    if (typeof bio === "string") {
      if (bio.length > 200) {
        return NextResponse.json(
          { error: "Bio must be 200 characters or fewer" },
          { status: 400 }
        );
      }
      data.bio = bio;
    }

    if (typeof profileImage === "string") {
      const trimmedImage = profileImage.trim();
      if (trimmedImage && !trimmedImage.startsWith("/") && !trimmedImage.startsWith("https://")) {
        return NextResponse.json(
          { error: "Profile image must be a relative path or HTTPS URL" },
          { status: 400 }
        );
      }
      data.profileImage = trimmedImage || "/img/new_boots_profile.webp";
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
      select: {
        username: true,
        displayName: true,
        bio: true,
        profileImage: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Profile PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
