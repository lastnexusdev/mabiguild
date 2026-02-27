import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSiteMembership } from "@/lib/tenant";
import { banMemberSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const admin = await requireSiteMembership("ADMIN");
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = banMemberSchema.safeParse(Object.fromEntries((await request.formData()).entries()));
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const membership = await prisma.siteMembership.findFirst({ where: { id: parsed.data.membershipId, siteId: admin.site.id } });
  if (!membership) return NextResponse.json({ error: "Membership not found" }, { status: 404 });

  await prisma.ban.upsert({
    where: { siteId_userId: { siteId: admin.site.id, userId: membership.userId } },
    update: { reason: parsed.data.reason || null },
    create: { siteId: admin.site.id, userId: membership.userId, reason: parsed.data.reason || null }
  });

  await prisma.auditLog.create({ data: { siteId: admin.site.id, actorUserId: admin.user.id, action: "member.banned", metadata: { userId: membership.userId, reason: parsed.data.reason || null } } });

  return NextResponse.redirect(new URL("/admin/members", request.url));
}
