import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createReplySchema } from "@/lib/validation";
import { getSiteFromRequest, requireSiteMembership } from "@/lib/tenant";

export async function POST(request: Request) {
  const [site, member] = await Promise.all([getSiteFromRequest(), requireSiteMembership()]);
  if (!site || !member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createReplySchema.safeParse(Object.fromEntries((await request.formData()).entries()));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const thread = await prisma.thread.findFirst({ where: { id: parsed.data.threadId, siteId: site.id } });
  if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  if (thread.locked) return NextResponse.json({ error: "Thread locked" }, { status: 400 });

  await prisma.post.create({ data: { siteId: site.id, threadId: thread.id, authorId: member.user.id, body: parsed.data.body } });
  return NextResponse.redirect(new URL(`/thread/${thread.id}`, request.url));
}
