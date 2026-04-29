"use client";

import { useMemo, useState } from "react";
import { getISODayOfWeek } from "@/lib/time";
import { getColorForLevel } from "@/lib/colorScale";
import type { Level } from "@/lib/bucketize";
import { HeatmapLegend } from "./Legend";

export interface HeatmapCell {
  date: string;
  value: number;
  level: Level;
}

interface HeatmapProps {
  cells: HeatmapCell[];
  baseColor?: string;
  year: number;
  onCellClick?: (date: string, value: number) => void;
}

const CELL_SIZE = 12;
const CELL_GAP = 3;
const LABEL_WIDTH = 30;
const HEADER_HEIGHT = 20;
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];
const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function Heatmap({ cells, baseColor = "#22c55e", year, onCellClick }: HeatmapProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  const { grid, monthPositions, numWeeks } = useMemo(() => {
    // Build a grid: 7 rows x N columns
    const grid: (HeatmapCell | null)[][] = [];
    const monthPositions: { label: string; col: number }[] = [];

    if (cells.length === 0) return { grid: [], monthPositions: [], numWeeks: 0 };

    // Find the first day and its position
    const firstDate = cells[0].date;
    const firstDayOfWeek = getISODayOfWeek(firstDate); // 1=Mon, 7=Sun
    const row = firstDayOfWeek - 1; // 0-indexed

    // Build week columns
    let currentWeek: (HeatmapCell | null)[] = Array(7).fill(null);
    let col = 0;
    let lastMonth = -1;

    // Fill initial empty cells
    for (let i = 0; i < row; i++) {
      currentWeek[i] = null;
    }

    for (const cell of cells) {
      const dayOfWeek = getISODayOfWeek(cell.date) - 1; // 0=Mon, 6=Sun
      const month = parseInt(cell.date.split("-")[1]) - 1;

      if (dayOfWeek === 0 && currentWeek.some((c) => c !== null)) {
        grid.push(currentWeek);
        col++;
        currentWeek = Array(7).fill(null);
      }

      if (month !== lastMonth) {
        monthPositions.push({ label: MONTH_LABELS[month], col: grid.length });
        lastMonth = month;
      }

      currentWeek[dayOfWeek] = cell;
    }

    // Push the last week
    if (currentWeek.some((c) => c !== null)) {
      grid.push(currentWeek);
    }

    return { grid, monthPositions, numWeeks: grid.length };
  }, [cells]);

  const svgWidth = LABEL_WIDTH + numWeeks * (CELL_SIZE + CELL_GAP);
  const svgHeight = HEADER_HEIGHT + 7 * (CELL_SIZE + CELL_GAP);

  const formatTooltip = (cell: HeatmapCell) => {
    const date = new Date(cell.date + "T00:00:00Z");
    const formatted = date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
    const count = cell.value === 0 ? "No" : cell.value;
    const noun = cell.value === 1 ? "completion" : "completions";
    return `${count} ${noun} on ${formatted}`;
  };

  return (
    <div className="relative">
      <div className="overflow-x-auto pb-2">
        <svg
          width={svgWidth}
          height={svgHeight}
          role="grid"
          aria-label={`Habit heatmap for ${year}`}
          className="block"
        >
          {/* Month labels */}
          {monthPositions.map(({ label, col: mCol }) => (
            <text
              key={`month-${label}-${mCol}`}
              x={LABEL_WIDTH + mCol * (CELL_SIZE + CELL_GAP)}
              y={12}
              className="fill-gray-500 dark:fill-gray-400"
              fontSize={10}
            >
              {label}
            </text>
          ))}

          {/* Day labels */}
          {DAY_LABELS.map((label, i) =>
            label ? (
              <text
                key={`day-${i}`}
                x={0}
                y={HEADER_HEIGHT + i * (CELL_SIZE + CELL_GAP) + CELL_SIZE - 2}
                className="fill-gray-500 dark:fill-gray-400"
                fontSize={10}
              >
                {label}
              </text>
            ) : null
          )}

          {/* Cells */}
          {grid.map((week, weekIdx) =>
            week.map((cell, dayIdx) => {
              if (!cell) return null;
              const x = LABEL_WIDTH + weekIdx * (CELL_SIZE + CELL_GAP);
              const y = HEADER_HEIGHT + dayIdx * (CELL_SIZE + CELL_GAP);
              const color = getColorForLevel(cell.level, baseColor);

              return (
                <rect
                  key={cell.date}
                  x={x}
                  y={y}
                  width={CELL_SIZE}
                  height={CELL_SIZE}
                  rx={2}
                  fill={color}
                  role="gridcell"
                  aria-label={formatTooltip(cell)}
                  className="cursor-pointer hover:stroke-gray-600 hover:stroke-1 dark:hover:stroke-gray-300 transition-colors"
                  onClick={() => onCellClick?.(cell.date, cell.value)}
                  onMouseEnter={(e) => {
                    const rect = (e.target as SVGRectElement).getBoundingClientRect();
                    setTooltip({
                      x: rect.left + rect.width / 2,
                      y: rect.top - 8,
                      text: formatTooltip(cell),
                    });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            })
          )}
        </svg>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 px-2 py-1 text-xs bg-gray-900 text-white rounded shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full dark:bg-gray-700"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>
      )}

      <HeatmapLegend baseColor={baseColor} />
    </div>
  );
}
