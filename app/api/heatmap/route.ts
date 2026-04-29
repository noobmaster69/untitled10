import { prisma } from "@/lib/db";
import { getDefaultUser } from "@/lib/getUser";
import { getDatesInYear } from "@/lib/time";
import { bucketize } from "@/lib/bucketize";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const user = await getDefaultUser();
    const searchParams = request.nextUrl.searchParams;
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
    const habitId = searchParams.get("habitId");

    const habits = await prisma.habit.findMany({
      where: {
        userId: user.id,
        archivedAt: null,
        ...(habitId ? { id: habitId } : {}),
      },
      select: { id: true, targetPerDay: true, type: true },
    });

    const habitIds = habits.map((h) => h.id);

    if (habitIds.length === 0) {
      const dates = getDatesInYear(year);
      return Response.json({
        year,
        timezone: user.timezone,
        cells: dates.map((date) => ({ date, value: 0, level: 0 as const })),
        max: 0,
      });
    }

    const startDate = new Date(`${year}-01-01T00:00:00Z`);
    const endDate = new Date(`${year}-12-31T00:00:00Z`);

    const entries = await prisma.habitEntry.findMany({
      where: {
        habitId: { in: habitIds },
        entryDate: { gte: startDate, lte: endDate },
      },
      select: { habitId: true, entryDate: true, count: true },
    });

    const dateMap = new Map<string, number>();
    for (const entry of entries) {
      const dateStr = entry.entryDate.toISOString().split("T")[0];
      if (habitId) {
        dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + entry.count);
      } else {
        dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
      }
    }

    const max = habitId ? habits[0]?.targetPerDay || 1 : habitIds.length;

    const dates = getDatesInYear(year);
    const cells = dates.map((date) => {
      const value = dateMap.get(date) || 0;
      return { date, value, level: bucketize(value, max) };
    });

    return Response.json({ year, timezone: user.timezone, cells, max });
  } catch (e) {
    console.error("GET /api/heatmap error:", e);
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
