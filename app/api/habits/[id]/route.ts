import { prisma } from "@/lib/db";
import { getDefaultUser } from "@/lib/getUser";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getDefaultUser();
  const { id } = await params;

  const habit = await prisma.habit.findFirst({
    where: { id, userId: user.id },
  });

  if (!habit) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(habit);
}

export async function PATCH(
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

  const updated = await prisma.habit.update({
    where: { id },
    data: {
      name: body.name !== undefined ? body.name.trim() : undefined,
      description: body.description !== undefined ? body.description : undefined,
      color: body.color !== undefined ? body.color : undefined,
      type: body.type !== undefined ? body.type : undefined,
      targetPerDay: body.targetPerDay !== undefined ? body.targetPerDay : undefined,
    },
  });

  return Response.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getDefaultUser();
  const { id } = await params;

  const habit = await prisma.habit.findFirst({
    where: { id, userId: user.id },
  });

  if (!habit) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.habit.update({
    where: { id },
    data: { archivedAt: new Date() },
  });

  return Response.json({ ok: true });
}
