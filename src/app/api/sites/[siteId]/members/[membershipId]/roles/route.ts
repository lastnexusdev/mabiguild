import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({ roleId: z.string() });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string; membershipId: string }> }
) {
  const { siteId, membershipId } = await params;
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

  // Toggle role
  const existing = await prisma.userSiteRole.findFirst({
    where: { membershipId, roleId: parsed.data.roleId },
  });

  if (existing) {
    await prisma.userSiteRole.delete({ where: { id: existing.id } });
  } else {
    await prisma.userSiteRole.create({
      data: { membershipId, roleId: parsed.data.roleId },
    });
  }

  return NextResponse.json({ ok: true });
}
