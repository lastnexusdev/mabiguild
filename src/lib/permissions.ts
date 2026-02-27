import { MembershipRole, PermissionKey } from "@prisma/client";
import { prisma } from "./db";

/** Check if a membership role has implicit permission */
export function roleHasImplicitPermission(
  role: MembershipRole,
  permission: PermissionKey
): boolean {
  if (role === MembershipRole.OWNER) return true;
  if (role === MembershipRole.ADMIN) {
    // Admins can do everything except transfer ownership
    return true;
  }
  if (role === MembershipRole.MODERATOR) {
    const modPerms: PermissionKey[] = [
      PermissionKey.moderate_posts,
      PermissionKey.manage_shoutbox,
    ];
    return modPerms.includes(permission);
  }
  return false;
}

export async function getMembership(userId: string, siteId: string) {
  return prisma.siteMembership.findUnique({
    where: { userId_siteId: { userId, siteId } },
    include: {
      userRoles: {
        include: {
          role: {
            include: { permissions: true },
          },
        },
      },
    },
  });
}

export async function getUserPermissions(
  userId: string,
  siteId: string
): Promise<Set<PermissionKey>> {
  const membership = await getMembership(userId, siteId);
  if (!membership) return new Set();

  const perms = new Set<PermissionKey>();

  // Implicit from membership role
  for (const perm of Object.values(PermissionKey)) {
    if (roleHasImplicitPermission(membership.role, perm)) {
      perms.add(perm);
    }
  }

  // Explicit from custom roles
  for (const userRole of membership.userRoles) {
    for (const rp of userRole.role.permissions) {
      perms.add(rp.permission);
    }
  }

  return perms;
}

export async function requirePermission(
  userId: string,
  siteId: string,
  permission: PermissionKey
): Promise<void> {
  const perms = await getUserPermissions(userId, siteId);
  if (!perms.has(permission)) {
    throw new Error("FORBIDDEN");
  }
}

export async function isMember(userId: string, siteId: string): Promise<boolean> {
  const membership = await prisma.siteMembership.findUnique({
    where: { userId_siteId: { userId, siteId } },
  });
  return !!membership && !membership.isBanned;
}
