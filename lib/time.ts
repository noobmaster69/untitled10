/**
 * Timezone-aware date helpers.
 * All habit entries use calendar dates (YYYY-MM-DD) in the user's timezone.
 */

export function getTodayInTimezone(timezone: string): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(now); // returns YYYY-MM-DD
}

export function isValidDate(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const date = new Date(dateStr + "T00:00:00Z");
  return !isNaN(date.getTime());
}

export function isFutureDate(dateStr: string, timezone: string): boolean {
  const today = getTodayInTimezone(timezone);
  return dateStr > today;
}

/**
 * Generate all dates in a year as YYYY-MM-DD strings.
 */
export function getDatesInYear(year: number): string[] {
  const dates: string[] = [];
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));

  const current = new Date(start);
  while (current < end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

/**
 * Get the ISO day of week (1=Monday, 7=Sunday).
 */
export function getISODayOfWeek(dateStr: string): number {
  const date = new Date(dateStr + "T00:00:00Z");
  const day = date.getUTCDay();
  return day === 0 ? 7 : day;
}
