import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import TopHeader from "@/app/components/top-header";
import { SessionGuard } from "@/app/components/session-guard";
import { AIMonitorWrapper } from "@/app/components/ai-monitor-wrapper";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Trust Systems Platform",
  description: "Master systems programming through guided lessons, quests, and spaced-repetition reviews.",
  other: {
    "darkreader-lock": "",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const isLoggedIn = !!user;
  const level = user?.level ?? 1;
  const xp = user?.xp ?? 0;
  const displayName = user?.displayName || user?.username || "Learner";
  const profileImage = user?.profileImage || "/img/new_boots_profile.webp";

  let unreadNotifications = 0;
  let communityCount = 0;
  let unreadDMs = 0;

  if (user) {
    try {
      // Get all conversation IDs for this user
      const userConvs = await prisma.conversation.findMany({
        where: { OR: [{ userAId: user.id }, { userBId: user.id }] },
        select: { id: true },
      });
      const convIds = userConvs.map((c) => c.id);

      [unreadNotifications, communityCount, unreadDMs] = await Promise.all([
        prisma.notification.count({
          where: {
            userId: user.id,
            readAt: null,
          },
        }),
        prisma.user.count({
          where: {
            passwordHash: { not: "" },
            xp: { gt: 0 },
          },
        }),
        convIds.length > 0
          ? prisma.directMessage.count({
              where: {
                conversationId: { in: convIds },
                senderId: { not: user.id },
                readAt: null,
                deletedAt: null,
              },
            })
          : Promise.resolve(0),
      ]);
    } catch (e) {
      console.error("Layout DB query failed (DB may be unreachable):", e);
    }
  }

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-gray-800 text-gray-200" suppressHydrationWarning>
        <Suspense>
          <SessionGuard />
        </Suspense>
        <TopHeader
          isLoggedIn={isLoggedIn}
          username={user?.username || ""}
          displayName={displayName}
          profileImage={profileImage}
          level={level}
          xp={xp}
          unreadNotifications={unreadNotifications}
          communityCount={communityCount}
          unreadDMs={unreadDMs}
        />

        {/* ===== Main content below nav ===== */}
        <main
          className="min-h-[calc(100vh-var(--top-nav-bar-height))]"
          style={{ paddingTop: "var(--top-nav-bar-height)" }}
        >
          {children}
        </main>

        {/* AI Monitor — floating chat for logged-in users */}
        {isLoggedIn && <AIMonitorWrapper />}
      </body>
    </html>
  );
}
