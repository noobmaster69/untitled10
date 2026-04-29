import type { Level } from "./bucketize";

/**
 * Generate a 5-level color scale from a base hex color.
 * Level 0 is the empty/background color.
 * Levels 1-4 are increasingly saturated versions of the base color.
 */
export function generateColorScale(baseHex: string, isDark = false): string[] {
  const emptyColor = isDark ? "#1f2937" : "#ebedf0";
  const rgb = hexToRgb(baseHex);
  if (!rgb) return [emptyColor, emptyColor, emptyColor, emptyColor, emptyColor];

  const bgRgb = isDark ? { r: 31, g: 41, b: 55 } : { r: 255, g: 255, b: 255 };

  return [
    emptyColor,
    rgbToHex(mixColors(rgb, bgRgb, 0.25)),
    rgbToHex(mixColors(rgb, bgRgb, 0.5)),
    rgbToHex(mixColors(rgb, bgRgb, 0.75)),
    baseHex,
  ];
}

export function getColorForLevel(
  level: Level,
  baseHex: string,
  isDark = false
): string {
  const scale = generateColorScale(baseHex, isDark);
  return scale[level];
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function rgbToHex(rgb: { r: number; g: number; b: number }): string {
  return (
    "#" +
    [rgb.r, rgb.g, rgb.b]
      .map((x) => Math.round(x).toString(16).padStart(2, "0"))
      .join("")
  );
}

function mixColors(
  color: { r: number; g: number; b: number },
  bg: { r: number; g: number; b: number },
  amount: number
): { r: number; g: number; b: number } {
  return {
    r: bg.r + (color.r - bg.r) * amount,
    g: bg.g + (color.g - bg.g) * amount,
    b: bg.b + (color.b - bg.b) * amount,
  };
}
