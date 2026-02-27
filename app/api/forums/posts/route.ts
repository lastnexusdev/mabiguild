import { NextResponse } from "next/server";
import { getSiteFromRequest, requireSiteMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({ threadId: z.string().cuid(), body: z.string().min(2) });

export async function POST(request: Request) {
  const ctx = await requireSiteMembership();
  const site = await getSiteFromRequest();
  if (!ctx || !site) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(Object.fromEntries((await request.formData()).entries()));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const thread = await prisma.thread.findFirst({ where: { id: parsed.data.threadId, siteId: site.id } });
  if (!thread || thread.locked) return NextResponse.json({ error: "Thread locked/not found" }, { status: 400 });

  await prisma.post.create({ data: { siteId: site.id, threadId: thread.id, authorId: ctx.user.id, body: parsed.data.body } });
  return NextResponse.redirect(new URL(`/thread/${thread.id}`, request.url));
}
