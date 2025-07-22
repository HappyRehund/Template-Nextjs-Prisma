"use server";

import { getCurrentUser } from "@/lib/auth";
import { updateUserSessionData } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function toggleRole() {
  const user = await getCurrentUser({ redirectIfNotFound: true });

  const updatedUser = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      role: user.role === "admin" ? "user" : "admin",
    },
    select: {
      id: true,
      role: true,
    },
  });

  await updateUserSessionData(updatedUser, await cookies());
}
