"use server";

import { validateRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";

const schema = z.object({
  siteId: z.string(),
  forumId: z.string(),
  title: z.string().min(3).max(200),
  content: z.string().min(1).max(50000),
});

export async function createThreadAction(
  _prev: { error: string },
  formData: FormData
) {
  const { user } = await validateRequest();
  if (!user) return { error: "Not authenticated." };

  const parsed = schema.safeParse({
    siteId: formData.get("siteId"),
    forumId: formData.get("forumId"),
    title: formData.get("title"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { siteId, forumId, title, content } = parsed.data;

  // Verify site + forum
  const forum = await prisma.forum.findFirst({
    where: { id: forumId, siteId },
  });
  if (!forum || forum.isLocked) return { error: "Forum not found or locked." };

  // Verify membership
  const membership = await prisma.siteMembership.findUnique({
    where: { userId_siteId: { userId: user.id, siteId } },
  });
  if (!membership || membership.isBanned) {
    return { error: "You must be a site member to post." };
  }

  const cleanContent = DOMPurify.sanitize(content);

  const thread = await prisma.$transaction(async (tx) => {
    const t = await tx.thread.create({
      data: {
        siteId,
        forumId,
        authorId: user.id,
        title,
        lastPostAt: new Date(),
      },
    });

    await tx.post.create({
      data: {
        siteId,
        threadId: t.id,
        authorId: user.id,
        content: cleanContent,
      },
    });

    // Update forum counts
    await tx.forum.update({
      where: { id: forumId },
      data: {
        threadCount: { increment: 1 },
        postCount: { increment: 1 },
      },
    });

    return t;
  });

  redirect(`/thread/${thread.id}`);
}
