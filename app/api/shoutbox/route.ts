import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { getSiteFromRequest, requireSiteMembership } from "@/lib/tenant";
import { shoutMessageSchema } from "@/lib/validation";

export async function GET() {
  const site = await getSiteFromRequest();
  if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

  const rows = await prisma.shoutMessage.findMany({
    where: { siteId: site.id },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { username: true } } },
    take: 40
  });

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const ctx = await requireSiteMembership();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ban = await prisma.ban.findUnique({ where: { siteId_userId: { siteId: ctx.site.id, userId: ctx.user.id } } });
  if (ban) return NextResponse.json({ error: "You are banned on this site" }, { status: 403 });

  const key = `${ctx.site.id}:${ctx.user.id}:shout`;
  if (!checkRateLimit(key, 6, 30_000)) {
    return NextResponse.json({ error: "Rate limit exceeded. Please wait." }, { status: 429 });
  }

  const parsed = shoutMessageSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid message" }, { status: 400 });

  const created = await prisma.shoutMessage.create({
    data: { siteId: ctx.site.id, userId: ctx.user.id, body: parsed.data.body }
  });

  await prisma.auditLog.create({
    data: { siteId: ctx.site.id, actorUserId: ctx.user.id, action: "shoutbox.message.created", metadata: { messageId: created.id } }
  });

  return NextResponse.json(created);
}

export async function DELETE(request: Request) {
  const ctx = await requireSiteMembership("MODERATOR");
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.shoutMessage.deleteMany({ where: { id, siteId: ctx.site.id } });
  await prisma.auditLog.create({
    data: { siteId: ctx.site.id, actorUserId: ctx.user.id, action: "shoutbox.message.deleted", metadata: { messageId: id } }
  });
  return NextResponse.json({ ok: true });
}
