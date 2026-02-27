import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createThreadSchema } from "@/lib/validation";
import { getSiteFromRequest, requireSiteMembership } from "@/lib/tenant";

export async function POST(request: Request) {
  const [site, member] = await Promise.all([getSiteFromRequest(), requireSiteMembership()]);
  if (!site || !member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = Object.fromEntries((await request.formData()).entries());
  const parsed = createThreadSchema.safeParse(form);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const forum = await prisma.forum.findFirst({ where: { id: parsed.data.forumId, siteId: site.id } });
  if (!forum) return NextResponse.json({ error: "Forum not found" }, { status: 404 });

  const thread = await prisma.thread.create({
    data: {
      siteId: site.id,
      forumId: forum.id,
      authorId: member.user.id,
      title: parsed.data.title,
      posts: { create: { siteId: site.id, authorId: member.user.id, body: parsed.data.body } }
    }
  });

  return NextResponse.redirect(new URL(`/thread/${thread.id}`, request.url));
}
