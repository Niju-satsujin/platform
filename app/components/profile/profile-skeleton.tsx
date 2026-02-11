"use client";

/** Full-page skeleton for the profile dashboard while data loads. */
export default function ProfileSkeleton() {
  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Left sidebar skeleton */}
        <div className="flex flex-col gap-4">
          <div className="game-card p-5 flex flex-col items-center gap-4 animate-pulse">
            <div className="w-24 h-24 rounded-full bg-gray-700" />
            <div className="w-32 h-5 bg-gray-700 rounded" />
            <div className="w-20 h-3 bg-gray-800 rounded" />
            <div className="w-full h-2 bg-gray-800 rounded-full mt-2" />
            <div className="grid grid-cols-3 gap-3 w-full pt-2 border-t border-gray-700/50">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="w-8 h-4 bg-gray-700 rounded" />
                  <div className="w-10 h-2 bg-gray-800 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right content skeleton */}
        <div className="flex flex-col gap-4">
          {/* Top row: donut + badges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="game-card p-5 animate-pulse">
              <div className="w-20 h-3 bg-gray-700 rounded mb-4" />
              <div className="flex items-center justify-center">
                <div className="w-[156px] h-[156px] rounded-full border-[16px] border-gray-700" />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-700/50">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className="w-8 h-4 bg-gray-700 rounded" />
                    <div className="w-12 h-2 bg-gray-800 rounded" />
                  </div>
                ))}
              </div>
            </div>

            <div className="game-card p-5 animate-pulse">
              <div className="w-16 h-3 bg-gray-700 rounded mb-4" />
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="flex flex-col items-center gap-1 p-2">
                    <div className="w-8 h-8 bg-gray-700 rounded-lg" />
                    <div className="w-10 h-2 bg-gray-800 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Heatmap skeleton */}
          <div className="game-card p-5 animate-pulse">
            <div className="w-20 h-3 bg-gray-700 rounded mb-4" />
            <div className="h-[130px] bg-gray-800/50 rounded" />
          </div>

          {/* Recent activity skeleton */}
          <div className="game-card overflow-hidden animate-pulse">
            <div className="flex border-b border-gray-700/50 px-4 py-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-20 h-3 bg-gray-700 rounded" />
              ))}
            </div>
            <div className="divide-y divide-gray-800/60">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="w-7 h-7 bg-gray-700 rounded-lg" />
                  <div className="flex-1">
                    <div className="w-16 h-2 bg-gray-700 rounded mb-1.5" />
                    <div className="w-40 h-3 bg-gray-800 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
