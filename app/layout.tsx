import type { Metadata } from "next";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import TopHeader from "@/app/components/top-header";
import { SessionGuard } from "@/app/components/session-guard";
import { AIMonitorWrapper } from "@/app/components/ai-monitor-wrapper";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trust Systems Platform",
  description: "Master systems programming through guided lessons, quests, and spaced-repetition reviews.",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    viewportFit: "cover",
  },
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

  let dueReviews = 0;
  let communityCount = 0;
  let unreadDMs = 0;

  if (user) {
    // Get all conversation IDs for this user
    const userConvs = await prisma.conversation.findMany({
      where: { OR: [{ userAId: user.id }, { userBId: user.id }] },
      select: { id: true },
    });
    const convIds = userConvs.map((c) => c.id);

    [dueReviews, communityCount, unreadDMs] = await Promise.all([
      prisma.reviewItem.count({
        where: {
          userId: user.id,
          completedAt: null,
          dueAt: { lte: new Date() },
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
  }

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-gray-800 text-gray-200" suppressHydrationWarning>
        <Suspense>
          <SessionGuard />
        </Suspense>
        <TopHeader
          isLoggedIn={isLoggedIn}
          displayName={displayName}
          profileImage={profileImage}
          level={level}
          xp={xp}
          dueReviews={dueReviews}
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
