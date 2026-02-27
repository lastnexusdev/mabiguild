import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MembershipRole } from "@prisma/client";

export async function POST(req: NextRequest) {
  const { user } = await validateRequest();
  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const formData = await req.formData();
  const siteId = formData.get("siteId") as string;

  if (!siteId) {
    return NextResponse.json({ error: "Missing siteId" }, { status: 400 });
  }

  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  // Check if already a member
  const existing = await prisma.siteMembership.findUnique({
    where: { userId_siteId: { userId: user.id, siteId } },
  });

  if (!existing) {
    await prisma.siteMembership.create({
      data: {
        userId: user.id,
        siteId,
        role: MembershipRole.MEMBER,
      },
    });
  }

  return NextResponse.redirect(
    new URL(`/`, new URL(`https://${site.subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`))
  );
}
