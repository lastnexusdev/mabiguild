"use server";

import { validateRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  siteId: z.string(),
  name: z.string().min(2).max(64),
  description: z.string().max(500).optional(),
  bannerUrl: z.string().url().optional().or(z.literal("")),
  logoUrl: z.string().url().optional().or(z.literal("")),
  theme: z.enum(["dark", "light"]),
});

export async function updateSettingsAction(
  _prev: { error: string; success: boolean },
  formData: FormData
) {
  const { user } = await validateRequest();
  if (!user) return { error: "Not authenticated.", success: false };

  const parsed = schema.safeParse({
    siteId: formData.get("siteId"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    bannerUrl: formData.get("bannerUrl") || undefined,
    logoUrl: formData.get("logoUrl") || undefined,
    theme: formData.get("theme"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input.", success: false };
  }

  const { siteId, name, description, bannerUrl, logoUrl, theme } = parsed.data;

  // Verify admin
  const membership = await prisma.siteMembership.findUnique({
    where: { userId_siteId: { userId: user.id, siteId } },
  });
  if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
    return { error: "Not authorized.", success: false };
  }

  await prisma.site.update({
    where: { id: siteId },
    data: {
      name,
      description: description || null,
      bannerUrl: bannerUrl || null,
      logoUrl: logoUrl || null,
      theme,
    },
  });

  await createAuditLog({
    siteId,
    actorId: user.id,
    action: "update_site_settings",
  });

  return { error: "", success: true };
}
