import Link from "next/link";
import { prisma } from "@/lib/db";

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const params = await searchParams;
  const q = firstParam(params.q).trim();

  const [parts, lessons, users] = q
    ? await Promise.all([
        prisma.part.findMany({
          where: {
            OR: [
              { title: { contains: q } },
              { description: { contains: q } },
              { slug: { contains: q } },
            ],
          },
          orderBy: { order: "asc" },
          take: 12,
        }),
        prisma.lesson.findMany({
          where: {
            OR: [{ title: { contains: q } }, { slug: { contains: q } }],
          },
          include: { part: true },
          orderBy: [{ part: { order: "asc" } }, { order: "asc" }],
          take: 16,
        }),
        prisma.user.findMany({
          where: {
            OR: [
              { username: { contains: q } },
              { displayName: { contains: q } },
            ],
            passwordHash: { not: "" },
          },
          select: {
            id: true,
            username: true,
            displayName: true,
            level: true,
            xp: true,
          },
          orderBy: { xp: "desc" },
          take: 10,
        }),
      ])
    : [[], [], []];

  return (
    <div className="px-6 py-6 max-w-6xl mx-auto animate-float-up">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Search</h1>
        <p className="text-sm text-gray-500 mt-1">
          {q ? `Results for "${q}"` : "Type in the header search bar to find lessons, courses, and users."}
        </p>
      </div>

      {!q && (
        <div className="game-card p-6 text-gray-400 text-sm">
          Try searching for topics like <span className="text-yellow-400">event loop</span>,{" "}
          <span className="text-yellow-400">tcp</span>, or a username.
        </div>
      )}

      {q && (
        <div className="grid gap-6 md:grid-cols-3">
          <section className="game-card p-4">
            <h2 className="text-sm font-semibold text-gray-300 mb-3">Courses</h2>
            <div className="space-y-2">
              {parts.length === 0 && <p className="text-xs text-gray-500">No course matches.</p>}
              {parts.map((part) => (
                <Link
                  key={part.id}
                  href={`/parts/${part.slug}`}
                  className="block text-sm text-gray-200 hover:text-yellow-400 transition-colors"
                >
                  {part.title}
                </Link>
              ))}
            </div>
          </section>

          <section className="game-card p-4">
            <h2 className="text-sm font-semibold text-gray-300 mb-3">Lessons</h2>
            <div className="space-y-2">
              {lessons.length === 0 && <p className="text-xs text-gray-500">No lesson matches.</p>}
              {lessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  href={`/parts/${lesson.part.slug}/lessons/${lesson.slug}`}
                  className="block text-sm text-gray-200 hover:text-yellow-400 transition-colors"
                >
                  {lesson.title}
                  <span className="text-gray-500 text-xs ml-1">({lesson.part.title})</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="game-card p-4">
            <h2 className="text-sm font-semibold text-gray-300 mb-3">Users</h2>
            <div className="space-y-2">
              {users.length === 0 && <p className="text-xs text-gray-500">No user matches.</p>}
              {users.map((u) => (
                <div key={u.id} className="text-sm text-gray-200">
                  {u.displayName || u.username}
                  <span className="text-gray-500 text-xs ml-1">@{u.username} · Lv {u.level}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
