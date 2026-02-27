import { headers } from "next/headers";
import { MembershipRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const ROOT_DOMAIN = process.env.ROOT_DOMAIN || "platform.localhost";

export function getSubdomainFromHost(host: string | null) {
  if (!host) return null;
  const hostname = host.split(":")[0];
  if (hostname === ROOT_DOMAIN || hostname === "localhost") return null;
  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) return hostname.replace(`.${ROOT_DOMAIN}`, "");
  return null;
}

export async function getSiteFromRequest() {
  const h = headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const subdomain = h.get("x-tenant-subdomain") || getSubdomainFromHost(host);
  if (!subdomain) return null;
  return prisma.site.findUnique({ where: { subdomain } });
}

export async function requireSiteMembership(minRole: MembershipRole = "MEMBER") {
  const site = await getSiteFromRequest();
  const session = await auth();
  if (!site || !session?.user?.id) return null;

  const membership = await prisma.siteMembership.findUnique({
    where: { userId_siteId: { userId: session.user.id, siteId: site.id } }
  });
  if (!membership) return null;

  const roleOrder: MembershipRole[] = ["MEMBER", "ADMIN", "OWNER"];
  if (roleOrder.indexOf(membership.role) < roleOrder.indexOf(minRole)) return null;

  return { site, membership, user: session.user };
}

export async function getSiteScopedMemberships(siteId: string) {
  return prisma.siteMembership.findMany({
    where: { siteId },
    include: { user: true },
    orderBy: { createdAt: "asc" }
  });
}

export async function getSiteMenus(siteId: string) {
  return prisma.menu.findMany({
    where: { siteId },
    orderBy: { position: "asc" }
  });
}
