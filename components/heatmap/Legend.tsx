"use client";

import { generateColorScale } from "@/lib/colorScale";

interface HeatmapLegendProps {
  baseColor: string;
}

export function HeatmapLegend({ baseColor }: HeatmapLegendProps) {
  const scale = generateColorScale(baseColor);

  return (
    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
      <span>Less</span>
      {scale.map((color, i) => (
        <div
          key={i}
          className="w-3 h-3 rounded-sm"
          style={{ backgroundColor: color }}
        />
      ))}
      <span>More</span>
    </div>
  );
}
