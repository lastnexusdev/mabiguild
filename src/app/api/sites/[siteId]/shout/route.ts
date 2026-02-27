import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rateLimit";
import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;

  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const messages = await prisma.shoutMessage.findMany({
    where: { siteId, isDeleted: false },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      user: { select: { username: true, displayName: true, avatarUrl: true } },
    },
  });

  return NextResponse.json(messages.reverse());
}

const postSchema = z.object({
  message: z.string().min(1).max(280),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;
  const { user } = await validateRequest();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 10 messages per minute
  const rl = checkRateLimit(`shout:${user.id}:${siteId}`, 10, 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "You're sending messages too quickly." },
      { status: 429 }
    );
  }

  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Verify membership
  const membership = await prisma.siteMembership.findUnique({
    where: { userId_siteId: { userId: user.id, siteId } },
  });
  if (!membership || membership.isBanned) {
    return NextResponse.json({ error: "Not a member." }, { status: 403 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message },
      { status: 400 }
    );
  }

  const cleanMessage = DOMPurify.sanitize(parsed.data.message, {
    ALLOWED_TAGS: [],
  });

  const msg = await prisma.shoutMessage.create({
    data: { siteId, userId: user.id, message: cleanMessage },
    include: {
      user: {
        select: { username: true, displayName: true, avatarUrl: true },
      },
    },
  });

  return NextResponse.json(msg, { status: 201 });
}
