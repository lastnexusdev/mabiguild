"use server";

import { validateRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isValidSubdomain } from "@/lib/tenant";
import { createAuditLog } from "@/lib/audit";
import { getSiteUrl } from "@/lib/utils";
import { MembershipRole, PermissionKey } from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";

const createSiteSchema = z.object({
  name: z.string().min(2).max(64),
  subdomain: z
    .string()
    .min(2)
    .max(32)
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, "Invalid subdomain format"),
  description: z.string().max(500).optional(),
});

export async function createSiteAction(
  _prev: { error: string },
  formData: FormData
) {
  const { user } = await validateRequest();
  if (!user) return { error: "Not authenticated." };

  const parsed = createSiteSchema.safeParse({
    name: formData.get("name"),
    subdomain: formData.get("subdomain"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { name, subdomain, description } = parsed.data;

  if (!isValidSubdomain(subdomain)) {
    return {
      error: "That subdomain is reserved or invalid. Please choose another.",
    };
  }

  // Check uniqueness
  const existing = await prisma.site.findUnique({ where: { subdomain } });
  if (existing) {
    return { error: "That subdomain is already taken." };
  }

  // Create the site and owner membership in a transaction
  const site = await prisma.$transaction(async (tx) => {
    const newSite = await tx.site.create({
      data: {
        subdomain,
        name,
        description,
        ownerId: user.id,
      },
    });

    // Create owner membership
    await tx.siteMembership.create({
      data: {
        userId: user.id,
        siteId: newSite.id,
        role: MembershipRole.OWNER,
      },
    });

    // Create default roles
    const memberRole = await tx.siteRole.create({
      data: {
        siteId: newSite.id,
        name: "Member",
        color: "#888888",
        isDefault: true,
        sortOrder: 0,
      },
    });

    const modRole = await tx.siteRole.create({
      data: {
        siteId: newSite.id,
        name: "Moderator",
        color: "#22c55e",
        sortOrder: 1,
      },
    });

    const adminRole = await tx.siteRole.create({
      data: {
        siteId: newSite.id,
        name: "Admin",
        color: "#f59e0b",
        sortOrder: 2,
      },
    });

    // Assign permissions to roles
    const modPerms = [PermissionKey.moderate_posts, PermissionKey.manage_shoutbox];
    const adminPerms = Object.values(PermissionKey);

    await tx.rolePermission.createMany({
      data: modPerms.map((p) => ({ roleId: modRole.id, permission: p })),
    });
    await tx.rolePermission.createMany({
      data: adminPerms.map((p) => ({ roleId: adminRole.id, permission: p })),
    });

    // Create default forum category + forum
    const category = await tx.forumCategory.create({
      data: { siteId: newSite.id, name: "General", sortOrder: 0 },
    });
    await tx.forum.create({
      data: {
        siteId: newSite.id,
        categoryId: category.id,
        name: "General Discussion",
        description: "Chat about anything and everything.",
        sortOrder: 0,
      },
    });

    // Create default primary menu
    const menu = await tx.menu.create({
      data: { siteId: newSite.id, name: "Primary", location: "primary" },
    });
    await tx.menuItem.createMany({
      data: [
        { siteId: newSite.id, menuId: menu.id, label: "Home", url: "/", sortOrder: 0 },
        { siteId: newSite.id, menuId: menu.id, label: "Forums", url: "/forums", sortOrder: 1 },
        { siteId: newSite.id, menuId: menu.id, label: "Members", url: "/members", sortOrder: 2 },
      ],
    });

    // Create default widgets
    await tx.widgetPlacement.createMany({
      data: [
        { siteId: newSite.id, widgetType: "shoutbox", column: 1, sortOrder: 0, config: "{}" },
        { siteId: newSite.id, widgetType: "recent_threads", column: 2, sortOrder: 0, config: "{}" },
        { siteId: newSite.id, widgetType: "members_online", column: 3, sortOrder: 0, config: "{}" },
      ],
    });

    return newSite;
  });

  await createAuditLog({
    actorId: user.id,
    action: "create_site",
    targetType: "site",
    targetId: site.id,
    metadata: { subdomain, name },
  });

  redirect(getSiteUrl(subdomain) + "/admin");
}
