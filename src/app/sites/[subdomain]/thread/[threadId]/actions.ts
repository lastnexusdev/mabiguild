"use server";

import { validateRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";

const replySchema = z.object({
  siteId: z.string(),
  threadId: z.string(),
  forumId: z.string(),
  content: z.string().min(1).max(50000),
});

export async function replyAction(
  _prev: { error: string },
  formData: FormData
) {
  const { user } = await validateRequest();
  if (!user) return { error: "Not authenticated." };

  const parsed = replySchema.safeParse({
    siteId: formData.get("siteId"),
    threadId: formData.get("threadId"),
    forumId: formData.get("forumId"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { siteId, threadId, forumId, content } = parsed.data;

  const thread = await prisma.thread.findFirst({
    where: { id: threadId, siteId },
  });
  if (!thread || thread.isLocked)
    return { error: "Thread not found or locked." };

  const membership = await prisma.siteMembership.findUnique({
    where: { userId_siteId: { userId: user.id, siteId } },
  });
  if (!membership || membership.isBanned) {
    return { error: "You must be a site member to post." };
  }

  const cleanContent = DOMPurify.sanitize(content);

  // Run inside transaction
  await prisma.$transaction([
    prisma.post.create({
      data: {
        siteId,
        threadId,
        authorId: user.id,
        content: cleanContent,
      },
    }),
    prisma.thread.update({
      where: { id: threadId },
      data: {
        replyCount: { increment: 1 },
        lastPostAt: new Date(),
      },
    }),
    prisma.forum.update({
      where: { id: forumId },
      data: { postCount: { increment: 1 } },
    }),
  ]);

  // Calculate the last page (15 posts per page) so we scroll to the new post
  const totalPosts = await prisma.post.count({
    where: { threadId, siteId, isDeleted: false },
  });
  const lastPage = Math.ceil(totalPosts / 15);
  redirect(`/thread/${threadId}${lastPage > 1 ? `?page=${lastPage}` : ""}`);
}
