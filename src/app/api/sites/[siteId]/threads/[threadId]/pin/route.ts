import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ siteId: string; threadId: string }> }
) {
  const { siteId, threadId } = await params;
  const { user } = await validateRequest();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.siteMembership.findUnique({
    where: { userId_siteId: { userId: user.id, siteId } },
  });
  if (
    !membership ||
    !["OWNER", "ADMIN", "MODERATOR"].includes(membership.role)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const thread = await prisma.thread.findFirst({ where: { id: threadId, siteId } });
  if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.thread.update({
    where: { id: threadId },
    data: { isPinned: !thread.isPinned },
  });

  await createAuditLog({
    siteId,
    actorId: user.id,
    action: updated.isPinned ? "pin_thread" : "unpin_thread",
    targetType: "thread",
    targetId: threadId,
  });

  return NextResponse.json({ isPinned: updated.isPinned });
}
