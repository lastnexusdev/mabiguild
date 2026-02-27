import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ siteId: string; messageId: string }> }
) {
  const { siteId, messageId } = await params;
  const { user } = await validateRequest();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.siteMembership.findUnique({
    where: { userId_siteId: { userId: user.id, siteId } },
  });

  const msg = await prisma.shoutMessage.findFirst({
    where: { id: messageId, siteId },
  });
  if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isMod =
    membership?.role === "OWNER" ||
    membership?.role === "ADMIN" ||
    membership?.role === "MODERATOR";
  const isAuthor = msg.userId === user.id;

  if (!isMod && !isAuthor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.shoutMessage.update({
    where: { id: messageId },
    data: { isDeleted: true },
  });

  await createAuditLog({
    siteId,
    actorId: user.id,
    action: "delete_shout_message",
    targetType: "shout_message",
    targetId: messageId,
  });

  return NextResponse.json({ ok: true });
}
