"use client";

interface StreakBadgeProps {
  current: number;
  longest: number;
}

export function StreakBadge({ current, longest }: StreakBadgeProps) {
  return (
    <div className="flex gap-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {current}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Current streak
        </div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {longest}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Longest streak
        </div>
      </div>
    </div>
  );
}
