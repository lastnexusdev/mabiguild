import { NextResponse } from "next/server";
import { createSiteSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { RESERVED_SUBDOMAINS } from "@/lib/tenant";

export async function POST(request: Request) {
  const { user } = await getCurrentSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = Object.fromEntries((await request.formData()).entries());
  const parsed = createSiteSchema.safeParse(form);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const sub = parsed.data.subdomain.toLowerCase();
  if (RESERVED_SUBDOMAINS.has(sub)) return NextResponse.json({ error: "Reserved subdomain" }, { status: 400 });

  const site = await prisma.site.create({
    data: {
      name: parsed.data.name,
      subdomain: sub,
      memberships: {
        create: { userId: user.id, role: "OWNER" }
      }
    }
  });

  await prisma.auditLog.create({ data: { siteId: site.id, actorUserId: user.id, action: "site.create", metadata: { subdomain: site.subdomain } } });

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
