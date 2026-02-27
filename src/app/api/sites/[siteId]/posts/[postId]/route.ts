import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ siteId: string; postId: string }> }
) {
  const { siteId, postId } = await params;
  const { user } = await validateRequest();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const post = await prisma.post.findFirst({
    where: { id: postId, siteId },
  });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const membership = await prisma.siteMembership.findUnique({
    where: { userId_siteId: { userId: user.id, siteId } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const isMod =
    membership.role === "OWNER" ||
    membership.role === "ADMIN" ||
    membership.role === "MODERATOR";
  const isAuthor = post.authorId === user.id;

  if (!isMod && !isAuthor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.post.update({
    where: { id: postId },
    data: { isDeleted: true },
  });

  await createAuditLog({
    siteId,
    actorId: user.id,
    action: "delete_post",
    targetType: "post",
    targetId: postId,
  });

  return NextResponse.json({ ok: true });
}
