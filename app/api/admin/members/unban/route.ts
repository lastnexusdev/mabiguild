import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSiteMembership } from "@/lib/tenant";
import { unbanMemberSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const admin = await requireSiteMembership("ADMIN");
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = unbanMemberSchema.safeParse(Object.fromEntries((await request.formData()).entries()));
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  await prisma.ban.deleteMany({ where: { siteId: admin.site.id, userId: parsed.data.userId } });
  await prisma.auditLog.create({ data: { siteId: admin.site.id, actorUserId: admin.user.id, action: "member.unbanned", metadata: { userId: parsed.data.userId } } });
  return NextResponse.redirect(new URL("/admin/members", request.url));
}
