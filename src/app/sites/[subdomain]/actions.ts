"use server";

import { validateRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MembershipRole } from "@prisma/client";
import { redirect } from "next/navigation";

/**
 * Join a site. Called from SiteShell navbar.
 * The siteId is bound via .bind(null, siteId) before passing to the form.
 */
export async function joinSiteAction(siteId: string) {
  const { user } = await validateRequest();
  if (!user) redirect("/login");

  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) return;

  // Idempotent: do nothing if already a member
  const existing = await prisma.siteMembership.findUnique({
    where: { userId_siteId: { userId: user.id, siteId } },
  });

  if (!existing) {
    await prisma.siteMembership.create({
      data: {
        userId: user.id,
        siteId,
        role: MembershipRole.MEMBER,
      },
    });
  }

  redirect("/");
}
