import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { hash, compare } from "bcryptjs";
import { randomBytes } from "crypto";

const SESSION_COOKIE = "tsp_session";
const SESSION_COOKIE_EMBED = "tsp_session_embed";
const SESSION_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

// Exported for use in Route Handlers (NextResponse.cookies)
export const SESSION_COOKIE_NAME = SESSION_COOKIE;
export const SESSION_EMBED_COOKIE_NAME = SESSION_COOKIE_EMBED;
export const SESSION_MAX_AGE_SECONDS = SESSION_MAX_AGE / 1000;

// ── Password helpers ──────────────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashed: string
): Promise<boolean> {
  return compare(password, hashed);
}

// ── Session helpers ───────────────────────────────────────────────
function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createSession(userId: string): Promise<string> {
  // Clean up old sessions for this user (keep max 5)
  const sessions = await prisma.session.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  if (sessions.length >= 5) {
    const toDelete = sessions.slice(4).map((s) => s.id);
    await prisma.session.deleteMany({ where: { id: { in: toDelete } } });
  }

  const token = generateToken();
  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt: new Date(Date.now() + SESSION_MAX_AGE),
    },
  });
  return token;
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE / 1000,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(SESSION_COOKIE_EMBED);
}

export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const fromCookie =
    cookieStore.get(SESSION_COOKIE)?.value ??
    cookieStore.get(SESSION_COOKIE_EMBED)?.value;
  if (fromCookie) return fromCookie;

  // Fallback: read custom header set by middleware.
  // In Next.js 15, modifying the Cookie header in middleware may not
  // reliably propagate to cookies(). A custom header always works.
  const { headers: headersFn } = await import("next/headers");
  const hdrs = await headersFn();
  return hdrs.get("x-session-token") || undefined;
}

export async function getUserBySessionToken(token: string) {
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return session.user;
}

// ── Get current user from session cookie ──────────────────────────
export async function getCurrentUser() {
  const token = await getSessionToken();
  if (!token) return null;
  return getUserBySessionToken(token);
}

// ── Get user ID (for server actions / API routes) ─────────────────
export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id ?? null;
}

// ── Register ──────────────────────────────────────────────────────
export async function registerUser(
  username: string,
  password: string,
  displayName?: string
) {
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return { error: "Username already taken" };
  }

  if (username.length < 3 || username.length > 20) {
    return { error: "Username must be 3-20 characters" };
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { error: "Username can only contain letters, numbers, _ and -" };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  const passwordHashed = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      username,
      displayName: displayName || username,
      passwordHash: passwordHashed,
    },
  });

  const token = await createSession(user.id);

  return { user, token };
}

// ── Login ─────────────────────────────────────────────────────────
export async function loginUser(username: string, password: string) {
  const user = await prisma.user.findUnique({ where: { username } });

  if (!user || !user.passwordHash) {
    return { error: "Invalid username or password" };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "Invalid username or password" };
  }

  const token = await createSession(user.id);

  return { user, token };
}

// ── Logout ────────────────────────────────────────────────────────
export async function logoutUser() {
  const token = await getSessionToken();
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  await clearSessionCookie();
}

// ── Role / rank name based on level (like Boot.dev) ───────────────
export function getRankName(level: number): string {
  if (level >= 100) return "Archmage";
  if (level >= 80) return "Mage";
  if (level >= 60) return "Archsage";
  if (level >= 50) return "Scholar";
  if (level >= 40) return "Sage";
  if (level >= 30) return "Disciple";
  if (level >= 20) return "Pupil";
  if (level >= 10) return "Acolyte";
  if (level >= 5) return "Apprentice";
  return "Novice";
}
