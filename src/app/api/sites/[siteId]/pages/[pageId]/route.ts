import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ siteId: string; pageId: string }> }
) {
  const { siteId, pageId } = await params;
  const { user } = await validateRequest();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.siteMembership.findUnique({
    where: { userId_siteId: { userId: user.id, siteId } },
  });
  if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const page = await prisma.page.findFirst({ where: { id: pageId, siteId } });
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.page.delete({ where: { id: pageId } });

  await createAuditLog({
    siteId,
    actorId: user.id,
    action: "delete_page",
    targetType: "page",
    targetId: pageId,
  });

  return NextResponse.json({ ok: true });
}
