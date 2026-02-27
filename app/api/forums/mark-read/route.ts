import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSiteFromRequest, requireSiteMembership } from "@/lib/tenant";

export async function POST(request: Request) {
  const [site, member] = await Promise.all([getSiteFromRequest(), requireSiteMembership()]);
  if (!site || !member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const threadId = String(body.threadId || "");
  if (!threadId) return NextResponse.json({ error: "threadId required" }, { status: 400 });

  const thread = await prisma.thread.findFirst({ where: { id: threadId, siteId: site.id } });
  if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });

  await prisma.threadReadState.upsert({
    where: { siteId_threadId_userId: { siteId: site.id, threadId, userId: member.user.id } },
    update: { lastReadAt: new Date() },
    create: { siteId: site.id, threadId, userId: member.user.id, lastReadAt: new Date() }
  });

  return NextResponse.json({ ok: true });
}
