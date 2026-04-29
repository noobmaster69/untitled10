import { prisma } from "@/lib/db";
import { getDefaultUser } from "@/lib/getUser";
import { computeStreaks } from "@/lib/streaks";
import { getTodayInTimezone } from "@/lib/time";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const user = await getDefaultUser();
  const searchParams = request.nextUrl.searchParams;
  const habitId = searchParams.get("habitId");

  if (!habitId) {
    return Response.json({ error: "habitId required" }, { status: 400 });
  }

  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId: user.id },
  });

  if (!habit) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const entries = await prisma.habitEntry.findMany({
    where: { habitId },
    orderBy: { entryDate: "desc" },
    select: { entryDate: true, count: true },
  });

  const today = getTodayInTimezone(user.timezone);
  const entryDates = entries.map((e) => e.entryDate.toISOString().split("T")[0]);

  const { current, longest } = computeStreaks(entryDates, today);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentEntries = entries.filter((e) => e.entryDate >= thirtyDaysAgo).length;

  return Response.json({
    current,
    longest,
    totalCompletions: entries.length,
    last30Days: recentEntries,
    completionRate: Math.round((recentEntries / 30) * 100),
  });
}
