"use client";

interface GoalCardProps {
  goal: string;
  deliverable: string;
  durationMinutes: number;
  passed: boolean;
  onStart: () => void;
}

export function GoalCard({
  goal,
  deliverable,
  durationMinutes,
  passed,
  onStart,
}: GoalCardProps) {
  return (
    <section className="game-card game-card-active p-5 mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-3">
          {/* Goal */}
          <div>
            <p className="text-xs uppercase tracking-widest text-yellow-500 font-semibold mb-1">
              🎯 Goal
            </p>
            <p className="text-gray-100 font-medium leading-snug">{goal}</p>
          </div>

          {/* Deliverable */}
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-450 font-semibold mb-1">
              📦 Deliverable
            </p>
            <p className="text-gray-300 text-sm leading-snug font-mono">
              {deliverable}
            </p>
          </div>
        </div>

        {/* Right: time + action */}
        <div className="flex flex-col items-end gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-300 font-semibold tabular-nums">
              {durationMinutes} min
            </span>
            {passed && <span className="badge badge-success">Passed</span>}
          </div>

          {!passed && (
            <button type="button" onClick={onStart} className="btn-primary">
              Start →
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
