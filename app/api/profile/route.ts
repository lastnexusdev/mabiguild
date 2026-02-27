import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSiteMembership } from "@/lib/tenant";
import { updateProfileSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const ctx = await requireSiteMembership();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = Object.fromEntries((await request.formData()).entries());
  const parsed = updateProfileSchema.safeParse(form);
  if (!parsed.success) return NextResponse.json({ error: "Invalid profile data" }, { status: 400 });

  await prisma.siteMembership.update({
    where: { userId_siteId: { userId: ctx.user.id, siteId: ctx.site.id } },
    data: { bio: parsed.data.bio || null }
  });

  const me = await prisma.user.findUnique({ where: { id: ctx.user.id }, select: { username: true } });
  return NextResponse.redirect(new URL(`/u/${me?.username || ""}`, request.url));
}
