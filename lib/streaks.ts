/**
 * Compute current and longest streaks from a set of entry dates.
 * Dates should be in YYYY-MM-DD format, sorted descending.
 */

export function computeStreaks(
  entryDates: string[],
  today: string
): { current: number; longest: number } {
  if (entryDates.length === 0) {
    return { current: 0, longest: 0 };
  }

  // Sort ascending for processing
  const sorted = [...entryDates].sort();

  // Compute longest streak
  let longest = 1;
  let currentRun = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (isConsecutive(sorted[i - 1], sorted[i])) {
      currentRun++;
      longest = Math.max(longest, currentRun);
    } else {
      currentRun = 1;
    }
  }

  // Compute current streak (must include today or yesterday)
  const yesterday = addDays(today, -1);
  const lastEntry = sorted[sorted.length - 1];

  if (lastEntry !== today && lastEntry !== yesterday) {
    return { current: 0, longest };
  }

  let current = 1;
  for (let i = sorted.length - 2; i >= 0; i--) {
    if (isConsecutive(sorted[i], sorted[i + 1])) {
      current++;
    } else {
      break;
    }
  }

  longest = Math.max(longest, current);
  return { current, longest };
}

function isConsecutive(dateA: string, dateB: string): boolean {
  const a = new Date(dateA + "T00:00:00Z");
  const b = new Date(dateB + "T00:00:00Z");
  const diff = b.getTime() - a.getTime();
  return diff === 86400000; // exactly one day
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + "T00:00:00Z");
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split("T")[0];
}
