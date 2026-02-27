import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { editPostSchema } from "@/lib/validation";
import { getSiteFromRequest, requireSiteMembership } from "@/lib/tenant";

export async function POST(request: Request) {
  const [site, member] = await Promise.all([getSiteFromRequest(), requireSiteMembership()]);
  if (!site || !member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = editPostSchema.safeParse(Object.fromEntries((await request.formData()).entries()));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const post = await prisma.post.findFirst({ where: { id: parsed.data.postId, siteId: site.id } });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  if (post.authorId !== member.user.id && !["OWNER", "ADMIN"].includes(member.membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.postEditHistory.create({
    data: {
      siteId: site.id,
      postId: post.id,
      editorUserId: member.user.id,
      oldBody: post.body
    }
  });

  await prisma.post.update({ where: { id: post.id }, data: { body: parsed.data.body } });
  return NextResponse.redirect(new URL(`/thread/${post.threadId}`, request.url));
}
