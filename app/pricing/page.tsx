import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="px-6 py-6 max-w-4xl mx-auto flex flex-col gap-8 animate-float-up">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-100 mb-2">Pricing</h1>
        <p className="text-gray-400">
          Trust Systems Platform is currently{" "}
          <span className="text-yellow-500 font-semibold">100% free</span> during
          early access.
        </p>
      </div>

      <div className="max-w-sm mx-auto">
        <div className="game-card p-6 text-center">
          <div className="text-yellow-500 text-5xl font-bold mb-2">$0</div>
          <div className="text-gray-400 text-sm mb-6">forever, during early access</div>

          <ul className="text-left text-sm text-gray-300 space-y-3 mb-6">
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span> All learning parts
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span> Interactive lessons
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span> Boss quests
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span> Spaced repetition reviews
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span> XP, levels &amp; streak tracking
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span> Built-in C++ code editor
            </li>
          </ul>

          <Link
            href="/parts"
            className="btn-primary w-full inline-block text-center !py-2.5"
          >
            Start Learning — Free
          </Link>
        </div>
      </div>
    </div>
  );
}
