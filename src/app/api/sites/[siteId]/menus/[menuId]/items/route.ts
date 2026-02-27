import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  label: z.string().min(1).max(100),
  url: z.string().min(1).max(500),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string; menuId: string }> }
) {
  const { siteId, menuId } = await params;
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
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const count = await prisma.menuItem.count({ where: { menuId, siteId } });
  const item = await prisma.menuItem.create({
    data: {
      siteId,
      menuId,
      label: parsed.data.label,
      url: parsed.data.url,
      sortOrder: count,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
