export type Level = 0 | 1 | 2 | 3 | 4;

export function bucketize(value: number, max: number): Level {
  if (value <= 0) return 0;
  const ratio = value / Math.max(max, 1);
  if (ratio < 0.25) return 1;
  if (ratio < 0.5) return 2;
  if (ratio < 0.99) return 3;
  return 4;
}
