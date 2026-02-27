import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  categoryId: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;
  const { user } = await validateRequest();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.siteMembership.findUnique({
    where: { userId_siteId: { userId: user.id, siteId } },
  });
  if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const count = await prisma.forum.count({ where: { siteId, categoryId: parsed.data.categoryId } });
  const forum = await prisma.forum.create({
    data: {
      siteId,
      categoryId: parsed.data.categoryId,
      name: parsed.data.name,
      description: parsed.data.description,
      sortOrder: count,
    },
  });

  return NextResponse.json(forum, { status: 201 });
}
