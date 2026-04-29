import { prisma } from "./db";

const DEFAULT_USER_EMAIL = "me@habit-tracker.local";

export async function getDefaultUser() {
  let user = await prisma.user.findUnique({
    where: { email: DEFAULT_USER_EMAIL },
  });

  if (!user) {
    try {
      user = await prisma.user.create({
        data: {
          email: DEFAULT_USER_EMAIL,
          password: "",
          name: "Me",
          timezone: "UTC",
        },
      });
    } catch {
      // Race condition: another request created it first
      user = await prisma.user.findUnique({
        where: { email: DEFAULT_USER_EMAIL },
      });
    }
  }

  return user!;
}
