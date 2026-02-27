import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ siteId: string; widgetId: string }> }
) {
  const { siteId, widgetId } = await params;
  const { user } = await validateRequest();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.siteMembership.findUnique({
    where: { userId_siteId: { userId: user.id, siteId } },
  });
  if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.widgetPlacement.delete({ where: { id: widgetId } });
  return NextResponse.json({ ok: true });
}
