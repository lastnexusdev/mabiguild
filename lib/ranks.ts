import { MembershipRole, Prisma } from "@prisma/client";

export function roleColor(role: MembershipRole) {
  if (role === "OWNER") return "text-amber-300";
  if (role === "ADMIN") return "text-red-300";
  if (role === "MODERATOR") return "text-cyan-300";
  return "text-zinc-300";
}

export function roleLabel(role: MembershipRole) {
  if (role === "MODERATOR") return "MOD";
  return role;
}

export function isOnline(lastSeenAt: Date | null | undefined) {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < 5 * 60 * 1000;
}

export function getAutoRank(site: { autoRankEnabled: boolean; rankThresholds: Prisma.JsonValue | null }, postCount: number) {
  if (!site.autoRankEnabled || !site.rankThresholds || typeof site.rankThresholds !== "object") return null;

  const obj = site.rankThresholds as Record<string, unknown>;
  const member = Number(obj.member ?? 0);
  const moderator = Number(obj.moderator ?? 50);
  const admin = Number(obj.admin ?? 200);
  const owner = Number(obj.owner ?? 500);

  if (postCount >= owner) return "OWNER";
  if (postCount >= admin) return "ADMIN";
  if (postCount >= moderator) return "MODERATOR";
  if (postCount >= member) return "MEMBER";
  return "MEMBER";
}
