/**
 * GitHub Sync — push learning progress to a linked GitHub repository.
 *
 * Uses the GitHub REST API (Contents endpoint) to create/update a
 * `progress.json` file in the user's repo whenever a lesson or quest
 * is completed.
 */

const GITHUB_API = "https://api.github.com";

interface GitHubProgressEntry {
  type: "lesson" | "quest";
  title: string;
  partSlug: string;
  completedAt: string;
  xpAwarded: number;
}

interface GitHubProgressFile {
  updatedAt: string;
  totalCompleted: number;
  entries: GitHubProgressEntry[];
}

// ── Validate a GitHub Personal Access Token ──────────────────────
export async function validateGitHubToken(token: string): Promise<{ valid: boolean; username?: string; error?: string }> {
  try {
    const res = await fetch(`${GITHUB_API}/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!res.ok) {
      return { valid: false, error: "Invalid token or token expired" };
    }

    const data = await res.json();
    return { valid: true, username: data.login };
  } catch {
    return { valid: false, error: "Could not reach GitHub API" };
  }
}

// ── Check if a repository exists ────────────────────────────────
export async function repoExists(token: string, owner: string, repo: string): Promise<boolean> {
  try {
    const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Create a new repository ─────────────────────────────────────
export async function createRepo(token: string, name: string): Promise<{ ok: boolean; fullName?: string; error?: string }> {
  try {
    const res = await fetch(`${GITHUB_API}/user/repos`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        description: "My learning progress on Trust Systems Platform",
        private: false,
        auto_init: true,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data.message || "Failed to create repository" };
    }

    const data = await res.json();
    return { ok: true, fullName: data.full_name };
  } catch {
    return { ok: false, error: "Could not reach GitHub API" };
  }
}

// ── Get the current progress file from the repo ─────────────────
async function getProgressFile(
  token: string,
  owner: string,
  repo: string
): Promise<{ content: GitHubProgressFile | null; sha: string | null }> {
  try {
    const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/progress.json`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!res.ok) return { content: null, sha: null };

    const data = await res.json();
    const decoded = Buffer.from(data.content, "base64").toString("utf-8");
    return { content: JSON.parse(decoded) as GitHubProgressFile, sha: data.sha };
  } catch {
    return { content: null, sha: null };
  }
}

// ── Push a progress update to the repo ──────────────────────────
export async function pushProgressUpdate(params: {
  token: string;
  owner: string;
  repo: string;
  entry: GitHubProgressEntry;
}): Promise<{ ok: boolean; error?: string }> {
  const { token, owner, repo, entry } = params;

  try {
    const { content: existing, sha } = await getProgressFile(token, owner, repo);

    const progress: GitHubProgressFile = existing ?? {
      updatedAt: new Date().toISOString(),
      totalCompleted: 0,
      entries: [],
    };

    progress.entries.push(entry);
    progress.totalCompleted = progress.entries.length;
    progress.updatedAt = new Date().toISOString();

    const encoded = Buffer.from(JSON.stringify(progress, null, 2)).toString("base64");

    const body: Record<string, string> = {
      message: `✅ Completed: ${entry.title}`,
      content: encoded,
    };
    if (sha) body.sha = sha;

    const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/progress.json`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data.message || "Failed to update progress" };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Could not reach GitHub API" };
  }
}

// ── Helper: sync progress after lesson/quest completion ─────────
export async function syncProgressToGitHub(params: {
  userId: string;
  type: "lesson" | "quest";
  title: string;
  partSlug: string;
  xpAwarded: number;
}): Promise<void> {
  // Import prisma lazily to avoid circular deps at module level
  const { prisma } = await import("@/lib/db");

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { githubToken: true, githubRepo: true },
  });

  if (!user?.githubToken || !user?.githubRepo) return;

  const [owner, repo] = user.githubRepo.split("/");
  if (!owner || !repo) return;

  await pushProgressUpdate({
    token: user.githubToken,
    owner,
    repo,
    entry: {
      type: params.type,
      title: params.title,
      partSlug: params.partSlug,
      completedAt: new Date().toISOString(),
      xpAwarded: params.xpAwarded,
    },
  });
}
