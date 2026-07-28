"use client";

interface HabitRowProps {
  habit: {
    id: string;
    name: string;
    color: string;
    type: string;
  };
  streak: number;
  isDoneToday: boolean;
  onToggle: () => void;
  onNavigate: () => void;
  isToggling?: boolean;
}

export function HabitRow({
  habit,
  streak,
  isDoneToday,
  onToggle,
  onNavigate,
  isToggling,
}: HabitRowProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-shadow">
      {/* Color dot */}
      <div
        className="w-3 h-3 rounded-full shrink-0"
        style={{ backgroundColor: habit.color }}
      />

      {/* Name and streak */}
      <div className="flex-1 min-w-0">
        <button
          onClick={onNavigate}
          className="text-left font-medium text-gray-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 transition-colors truncate block w-full"
        >
          {habit.name}
        </button>
        {streak > 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {streak}d streak
          </p>
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        disabled={isToggling}
        className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold transition-all ${
          isDoneToday
            ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
            : "bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-500 dark:hover:bg-gray-600"
        } ${isToggling ? "opacity-50" : ""}`}
        aria-label={isDoneToday ? `${habit.name} done today` : `Mark ${habit.name} done`}
      >
        {isDoneToday ? "✓" : "○"}
      </button>

      {/* Navigate arrow */}
      <button
        onClick={onNavigate}
        className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        aria-label={`View ${habit.name} details`}
      >
        ›
      </button>
    </div>
  );
}
