import { NextResponse } from "next/server";
import { getSiteFromRequest, requireSiteMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z.object({ message: z.string().min(1).max(200) });

export async function GET() {
  const site = await getSiteFromRequest();
  if (!site) return NextResponse.json({ error: "No site" }, { status: 404 });
  const messages = await prisma.shoutMessage.findMany({ where: { siteId: site.id }, include: { user: true }, orderBy: { createdAt: "desc" }, take: 25 });
  return NextResponse.json(messages);
}

export async function POST(request: Request) {
  const ctx = await requireSiteMembership();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!rateLimit(`shout:${ctx.site.id}:${ctx.user.id}`, 5, 15_000)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const created = await prisma.shoutMessage.create({ data: { siteId: ctx.site.id, userId: ctx.user.id, message: parsed.data.message } });
  return NextResponse.json(created);
}

export async function DELETE(request: Request) {
  const ctx = await requireSiteMembership("manage_shoutbox");
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.shoutMessage.deleteMany({ where: { id, siteId: ctx.site.id } });
  return NextResponse.json({ ok: true });
}
