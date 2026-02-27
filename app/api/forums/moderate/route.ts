import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { moderateThreadSchema } from "@/lib/validation";
import { getSiteFromRequest, requireSiteMembership } from "@/lib/tenant";

export async function POST(request: Request) {
  const [site, moderator] = await Promise.all([getSiteFromRequest(), requireSiteMembership("ADMIN")]);
  if (!site || !moderator) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = moderateThreadSchema.safeParse(Object.fromEntries((await request.formData()).entries()));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const thread = await prisma.thread.findFirst({ where: { id: parsed.data.threadId, siteId: site.id } });
  if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });

  if (parsed.data.action === "delete") {
    await prisma.thread.delete({ where: { id: thread.id } });
    return NextResponse.redirect(new URL(`/forums/${thread.forumId}`, request.url));
  }

  if (parsed.data.action === "move") {
    if (!parsed.data.targetForumId) return NextResponse.json({ error: "targetForumId required" }, { status: 400 });
    const target = await prisma.forum.findFirst({ where: { id: parsed.data.targetForumId, siteId: site.id } });
    if (!target) return NextResponse.json({ error: "Target forum not found" }, { status: 404 });
    await prisma.thread.update({ where: { id: thread.id }, data: { forumId: target.id } });
    return NextResponse.redirect(new URL(`/thread/${thread.id}`, request.url));
  }

  const updates: Record<string, boolean> = {};
  if (parsed.data.action === "lock") updates.locked = true;
  if (parsed.data.action === "unlock") updates.locked = false;
  if (parsed.data.action === "pin") updates.pinned = true;
  if (parsed.data.action === "unpin") updates.pinned = false;

  await prisma.thread.update({ where: { id: thread.id }, data: updates });
  return NextResponse.redirect(new URL(`/thread/${thread.id}`, request.url));
}
