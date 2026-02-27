"use server";

import { validateRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { redirect } from "next/navigation";
import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";
import { slugify } from "@/lib/utils";

const pageSchema = z.object({
  siteId: z.string(),
  pageId: z.string().optional(),
  title: z.string().min(2).max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/).min(1).max(200),
  content: z.string().max(500000),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

export async function savePageAction(
  _prev: { error: string },
  formData: FormData
) {
  const { user } = await validateRequest();
  if (!user) return { error: "Not authenticated." };

  const parsed = pageSchema.safeParse({
    siteId: formData.get("siteId"),
    pageId: formData.get("pageId") || undefined,
    title: formData.get("title"),
    slug: formData.get("slug") || slugify(formData.get("title") as string),
    content: formData.get("content"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { siteId, pageId, title, slug, content, status } = parsed.data;

  const membership = await prisma.siteMembership.findUnique({
    where: { userId_siteId: { userId: user.id, siteId } },
  });
  if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
    return { error: "Not authorized." };
  }

  const cleanContent = DOMPurify.sanitize(content);

  if (pageId) {
    // Update
    const existing = await prisma.page.findFirst({
      where: { id: pageId, siteId },
    });
    if (!existing) return { error: "Page not found." };

    await prisma.page.update({
      where: { id: pageId },
      data: { title, slug, content: cleanContent, status },
    });

    await createAuditLog({
      siteId,
      actorId: user.id,
      action: "update_page",
      targetType: "page",
      targetId: pageId,
    });
  } else {
    // Create
    await prisma.page.create({
      data: {
        siteId,
        authorId: user.id,
        title,
        slug,
        content: cleanContent,
        status,
      },
    });

    await createAuditLog({
      siteId,
      actorId: user.id,
      action: "create_page",
    });
  }

  redirect("/admin/pages");
}
