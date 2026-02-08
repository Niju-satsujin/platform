import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ContentDebugPage() {
  const parts = await prisma.part.findMany({
    orderBy: { order: "asc" },
    include: {
      lessons: { orderBy: { order: "asc" }, select: { id: true, slug: true, order: true } },
      quest: { select: { id: true, slug: true } },
    },
  });

  const totalParts = parts.length;
  const totalLessons = parts.reduce((sum, p) => sum + p.lessons.length, 0);
  const totalQuests = parts.filter((p) => p.quest).length;

  // Detect duplicates
  const slugDups: string[] = [];
  const orderDups: string[] = [];
  const seenSlugs = new Set<string>();
  const seenOrders = new Set<number>();

  for (const p of parts) {
    if (seenSlugs.has(p.slug)) slugDups.push(p.slug);
    seenSlugs.add(p.slug);
    if (seenOrders.has(p.order)) orderDups.push(`order=${p.order} (${p.slug})`);
    seenOrders.add(p.order);
  }

  // Lesson-level duplicates
  const lessonDups: string[] = [];
  for (const p of parts) {
    const lessonSlugs = new Set<string>();
    const lessonOrders = new Set<number>();
    for (const l of p.lessons) {
      if (lessonSlugs.has(l.slug)) lessonDups.push(`${p.slug}/${l.slug}`);
      lessonSlugs.add(l.slug);
      if (lessonOrders.has(l.order)) lessonDups.push(`${p.slug} order=${l.order}`);
      lessonOrders.add(l.order);
    }
  }

  const hasDups = slugDups.length > 0 || orderDups.length > 0 || lessonDups.length > 0;

  return (
    <div className="px-6 py-6 max-w-4xl mx-auto font-mono text-sm">
      <h1 className="text-xl font-bold text-gray-100 mb-6">Content Debug</h1>

      {/* Summary */}
      <div className="game-card p-4 mb-6">
        <h2 className="font-bold text-gray-200 mb-2">Counts</h2>
        <table className="w-full">
          <tbody>
            <Row label="Parts" value={totalParts} />
            <Row label="Lessons" value={totalLessons} />
            <Row label="Quests" value={totalQuests} />
          </tbody>
        </table>
      </div>

      {/* Duplicate detection */}
      <div className={`game-card p-4 mb-6 ${hasDups ? "border-red-800/50" : "border-green-800/50"}`}>
        <h2 className="font-bold text-gray-200 mb-2">
          Duplicates {hasDups ? "⚠️ DETECTED" : "✅ None"}
        </h2>
        {slugDups.length > 0 && (
          <div className="text-red-400 mb-1">
            Duplicate slugs: {slugDups.join(", ")}
          </div>
        )}
        {orderDups.length > 0 && (
          <div className="text-red-400 mb-1">
            Duplicate orders: {orderDups.join(", ")}
          </div>
        )}
        {lessonDups.length > 0 && (
          <div className="text-red-400 mb-1">
            Lesson duplicates: {lessonDups.join(", ")}
          </div>
        )}
        {!hasDups && (
          <div className="text-green-400">No duplicate slugs, orders, or lessons detected.</div>
        )}
      </div>

      {/* Part listing */}
      <div className="game-card p-4">
        <h2 className="font-bold text-gray-200 mb-3">All Parts</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-500 text-xs uppercase border-b border-gray-700">
              <th className="py-1 pr-3">Order</th>
              <th className="py-1 pr-3">Slug</th>
              <th className="py-1 pr-3">Title</th>
              <th className="py-1 pr-3">Lessons</th>
              <th className="py-1">Quest</th>
            </tr>
          </thead>
          <tbody>
            {parts.map((p) => (
              <tr key={p.id} className="border-b border-gray-800 text-gray-300">
                <td className="py-1.5 pr-3 text-yellow-400">{p.order}</td>
                <td className="py-1.5 pr-3">{p.slug}</td>
                <td className="py-1.5 pr-3 text-gray-100">{p.title}</td>
                <td className="py-1.5 pr-3">{p.lessons.length}</td>
                <td className="py-1.5">{p.quest ? "✓" : "✗"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number | string }) {
  return (
    <tr>
      <td className="text-gray-500 pr-4 py-0.5">{label}</td>
      <td className="text-gray-100 font-bold">{String(value)}</td>
    </tr>
  );
}
