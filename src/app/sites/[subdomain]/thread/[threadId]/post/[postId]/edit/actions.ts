"use server";

import { validateRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";

const schema = z.object({
  postId: z.string(),
  siteId: z.string(),
  threadId: z.string(),
  content: z.string().min(1).max(50000),
});

export async function editPostAction(
  _prev: { error: string },
  formData: FormData
) {
  const { user } = await validateRequest();
  if (!user) return { error: "Not authenticated." };

  const parsed = schema.safeParse({
    postId: formData.get("postId"),
    siteId: formData.get("siteId"),
    threadId: formData.get("threadId"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { postId, siteId, threadId, content } = parsed.data;

  const post = await prisma.post.findFirst({
    where: { id: postId, siteId, threadId, isDeleted: false },
    include: { thread: true },
  });

  if (!post) return { error: "Post not found." };
  if (post.authorId !== user.id) return { error: "Not authorized." };
  if (post.thread.isLocked) return { error: "Thread is locked." };

  const cleanContent = DOMPurify.sanitize(content);

  // Save current content to edit history before updating
  await prisma.postEditHistory.create({
    data: {
      siteId,
      postId,
      editorId: user.id,
      content: post.content, // save the old content
    },
  });

  await prisma.post.update({
    where: { id: postId },
    data: { content: cleanContent },
  });

  redirect(`/thread/${threadId}`);
}
