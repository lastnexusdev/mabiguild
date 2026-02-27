"use server";

import { validateRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  displayName: z.string().max(64).optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  bio: z.string().max(300).optional(),
});

export async function updateAccountAction(
  _prev: { error: string; success: boolean },
  formData: FormData
) {
  const { user } = await validateRequest();
  if (!user) return { error: "Not authenticated.", success: false };

  const parsed = schema.safeParse({
    displayName: formData.get("displayName") || undefined,
    avatarUrl: formData.get("avatarUrl") || undefined,
    bio: formData.get("bio") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid.", success: false };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      displayName: parsed.data.displayName || null,
      avatarUrl: parsed.data.avatarUrl || null,
      bio: parsed.data.bio || null,
    },
  });

  return { error: "", success: true };
}
