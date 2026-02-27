import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({ ban: z.boolean() });

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

  const target = await prisma.siteMembership.findFirst({
    where: { id: membershipId, siteId },
  });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (target.role === "OWNER") return NextResponse.json({ error: "Cannot ban owner." }, { status: 400 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await prisma.siteMembership.update({
    where: { id: membershipId },
    data: { isBanned: parsed.data.ban },
  });

  await createAuditLog({
    siteId,
    actorId: user.id,
    action: parsed.data.ban ? "ban_member" : "unban_member",
    targetType: "membership",
    targetId: membershipId,
  });

  return NextResponse.json({ ok: true });
}
