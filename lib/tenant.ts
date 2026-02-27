import { headers } from "next/headers";
import { MembershipRole, PermissionKey } from "@prisma/client";
import { prisma } from "./prisma";
import { getCurrentSession } from "./auth";

const ROOT_DOMAIN = process.env.ROOT_DOMAIN || "platform.localhost";

export function extractSubdomain(host?: string | null) {
  if (!host) return null;
  const base = host.split(":")[0];
  if (base === ROOT_DOMAIN || base === "localhost") return null;
  if (base.endsWith(`.${ROOT_DOMAIN}`)) return base.replace(`.${ROOT_DOMAIN}`, "");
  const parts = base.split(".");
  return parts.length > 2 ? parts[0] : null;
}

export async function getSiteFromRequest() {
  const h = headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const subdomain = h.get("x-tenant-subdomain") || extractSubdomain(host);
  if (!subdomain) return null;
  return prisma.site.findUnique({ where: { subdomain } });
}

const rolePermissions: Record<MembershipRole, PermissionKey[]> = {
  OWNER: Object.values(PermissionKey),
  ADMIN: Object.values(PermissionKey),
  MODERATOR: ["moderate_posts", "manage_shoutbox"],
  MEMBER: []
};

export async function requireSiteMembership(required?: MembershipRole | PermissionKey) {
  const { user } = await getCurrentSession();
  if (!user) return null;
  const site = await getSiteFromRequest();
  if (!site) return null;

  const membership = await prisma.siteMembership.findUnique({
    where: { userId_siteId: { userId: user.id, siteId: site.id } },
    include: { userRoles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } }
  });
  if (!membership) return null;

  if (required) {
    if (["OWNER", "ADMIN", "MODERATOR", "MEMBER"].includes(required)) {
      const hierarchy = ["MEMBER", "MODERATOR", "ADMIN", "OWNER"];
      if (hierarchy.indexOf(membership.role) < hierarchy.indexOf(required as MembershipRole)) return null;
    } else {
      const fromRole = rolePermissions[membership.role].includes(required as PermissionKey);
      const custom = membership.userRoles.some((ur) => ur.role.permissions.some((p) => p.permission.key === required));
      if (!fromRole && !custom) return null;
    }
  }

  return { site, membership, user };
}

export const RESERVED_SUBDOMAINS = new Set(["www", "admin", "api", "platform", "app", "mail"]);
