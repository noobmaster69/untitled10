import { prisma } from "@/lib/db";
import { getDefaultUser } from "@/lib/getUser";
import { getTodayInTimezone, isValidDate, isFutureDate } from "@/lib/time";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getDefaultUser();
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const habit = await prisma.habit.findFirst({
    where: { id, userId: user.id },
  });

  if (!habit) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const where: Record<string, unknown> = { habitId: id };
  if (from || to) {
    where.entryDate = {};
    if (from) (where.entryDate as Record<string, unknown>).gte = new Date(from);
    if (to) (where.entryDate as Record<string, unknown>).lte = new Date(to);
  }

  const entries = await prisma.habitEntry.findMany({
    where,
    orderBy: { entryDate: "desc" },
  });

  return Response.json(entries);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getDefaultUser();
  const { id } = await params;
  const body = await request.json();

  const habit = await prisma.habit.findFirst({
    where: { id, userId: user.id },
  });

  if (!habit) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const date = body.date || getTodayInTimezone(user.timezone);

  if (!isValidDate(date)) {
    return Response.json({ error: "Invalid date format" }, { status: 400 });
  }

  if (isFutureDate(date, user.timezone)) {
    return Response.json({ error: "Cannot log future dates" }, { status: 400 });
  }

  const entryDate = new Date(date + "T00:00:00Z");

  const existing = await prisma.habitEntry.findUnique({
    where: { habitId_entryDate: { habitId: id, entryDate } },
  });

  if (existing) {
    if (habit.type === "counted") {
      const updated = await prisma.habitEntry.update({
        where: { id: existing.id },
        data: { count: existing.count + 1 },
      });
      return Response.json(updated);
    }
    return Response.json(existing);
  }

  const entry = await prisma.habitEntry.create({
    data: {
      habitId: id,
      entryDate,
      count: body.count || 1,
      note: body.note || null,
    },
  });

  return Response.json(entry, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getDefaultUser();
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get("date");

  if (!date || !isValidDate(date)) {
    return Response.json({ error: "Valid date parameter required" }, { status: 400 });
  }

  const habit = await prisma.habit.findFirst({
    where: { id, userId: user.id },
  });

  if (!habit) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const entryDate = new Date(date + "T00:00:00Z");

  await prisma.habitEntry.deleteMany({
    where: { habitId: id, entryDate },
  });

  return Response.json({ ok: true });
}
