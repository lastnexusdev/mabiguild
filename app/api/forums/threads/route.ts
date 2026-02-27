import { NextResponse } from "next/server";
import { getSiteFromRequest, requireSiteMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({ forumId: z.string().cuid(), title: z.string().min(3), body: z.string().min(2) });

export async function POST(request: Request) {
  const ctx = await requireSiteMembership();
  const site = await getSiteFromRequest();
  if (!ctx || !site) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(Object.fromEntries((await request.formData()).entries()));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const forum = await prisma.forum.findFirst({ where: { id: parsed.data.forumId, siteId: site.id } });
  if (!forum) return NextResponse.json({ error: "Forum not found" }, { status: 404 });

  const thread = await prisma.thread.create({
    data: {
      siteId: site.id,
      forumId: forum.id,
      authorId: ctx.user.id,
      title: parsed.data.title,
      posts: { create: { siteId: site.id, authorId: ctx.user.id, body: parsed.data.body } }
    }
  });

  return NextResponse.redirect(new URL(`/thread/${thread.id}`, request.url));
}
