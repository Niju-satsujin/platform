import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { validateGitHubToken, repoExists, createRepo } from "@/lib/github-sync";

// GET — return the current GitHub settings (token is masked)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    return NextResponse.json({
      connected: !!user.githubToken,
      githubUsername: user.githubUsername,
      githubRepo: user.githubRepo,
    });
  } catch (error) {
    console.error("GitHub settings GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH — connect or update GitHub settings
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { token, repoName, createNew } = body;

    if (typeof token !== "string" || !token.trim()) {
      return NextResponse.json(
        { error: "GitHub Personal Access Token is required" },
        { status: 400 }
      );
    }

    // Validate the token
    const validation = await validateGitHubToken(token.trim());
    if (!validation.valid || !validation.username) {
      return NextResponse.json(
        { error: validation.error || "Invalid GitHub token" },
        { status: 400 }
      );
    }

    let fullRepoName = "";

    if (createNew && typeof repoName === "string" && repoName.trim()) {
      // Create a new repository
      const result = await createRepo(token.trim(), repoName.trim());
      if (!result.ok) {
        return NextResponse.json(
          { error: result.error || "Failed to create repository" },
          { status: 400 }
        );
      }
      fullRepoName = result.fullName || `${validation.username}/${repoName.trim()}`;
    } else if (typeof repoName === "string" && repoName.trim()) {
      // Use an existing repository
      const parts = repoName.trim().split("/");
      const owner = parts.length === 2 ? parts[0] : validation.username;
      const repo = parts.length === 2 ? parts[1] : parts[0];
      fullRepoName = `${owner}/${repo}`;

      const exists = await repoExists(token.trim(), owner, repo);
      if (!exists) {
        return NextResponse.json(
          { error: `Repository ${fullRepoName} not found. Check the name or create a new one.` },
          { status: 400 }
        );
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        githubToken: token.trim(),
        githubUsername: validation.username,
        githubRepo: fullRepoName,
      },
    });

    return NextResponse.json({
      connected: true,
      githubUsername: validation.username,
      githubRepo: fullRepoName,
    });
  } catch (error) {
    console.error("GitHub settings PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE — disconnect GitHub
export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        githubToken: "",
        githubUsername: "",
        githubRepo: "",
      },
    });

    return NextResponse.json({ connected: false, githubUsername: "", githubRepo: "" });
  } catch (error) {
    console.error("GitHub settings DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
