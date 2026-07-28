import { prisma } from "@/lib/db";
import { getDefaultUser } from "@/lib/getUser";
import { NextRequest } from "next/server";

export async function GET() {
  try {
    const user = await getDefaultUser();

    const habits = await prisma.habit.findMany({
      where: { userId: user.id, archivedAt: null },
      orderBy: { createdAt: "asc" },
    });

    return Response.json(habits);
  } catch (e) {
    console.error("GET /api/habits error:", e);
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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
        color: color || "#ef4444",
        type: type || "binary",
        targetPerDay: targetPerDay || 1,
      },
    });

    return Response.json(habit, { status: 201 });
  } catch (e) {
    console.error("POST /api/habits error:", e);
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
