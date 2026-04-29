import { prisma } from "@/lib/db";
import { getDefaultUser } from "@/lib/getUser";
import { NextRequest } from "next/server";

export async function GET() {
  const user = await getDefaultUser();

  const habits = await prisma.habit.findMany({
    where: { userId: user.id, archivedAt: null },
    orderBy: { createdAt: "asc" },
  });

  return Response.json(habits);
}

export async function POST(request: NextRequest) {
  const user = await getDefaultUser();
  const body = await request.json();
  const { name, description, color, type, targetPerDay } = body;

  if (!name || name.trim().length === 0) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  const habit = await prisma.habit.create({
    data: {
      userId: user.id,
      name: name.trim(),
      description: description || null,
      color: color || "#22c55e",
      type: type || "binary",
      targetPerDay: targetPerDay || 1,
    },
  });

  return Response.json(habit, { status: 201 });
}
