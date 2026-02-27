import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ siteId: string; roleId: string }> }
) {
  const { siteId, roleId } = await params;
  const { user } = await validateRequest();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.siteMembership.findUnique({
    where: { userId_siteId: { userId: user.id, siteId } },
  });
  if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const role = await prisma.siteRole.findFirst({ where: { id: roleId, siteId } });
  if (!role) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (role.isDefault) return NextResponse.json({ error: "Cannot delete default role." }, { status: 400 });

  await prisma.siteRole.delete({ where: { id: roleId } });
  return NextResponse.json({ ok: true });
}
