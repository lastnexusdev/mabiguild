import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSiteSchema, RESERVED_SUBDOMAINS } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = Object.fromEntries((await request.formData()).entries());
  const parsed = createSiteSchema.safeParse(form);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid site data" }, { status: 400 });
  }

  const subdomain = parsed.data.subdomain.toLowerCase();
  if (RESERVED_SUBDOMAINS.has(subdomain)) {
    return NextResponse.json({ error: "Reserved subdomain" }, { status: 400 });
  }

  const existing = await prisma.site.findUnique({ where: { subdomain } });
  if (existing) {
    return NextResponse.json({ error: "Subdomain already in use" }, { status: 409 });
  }

  const site = await prisma.site.create({
    data: {
      name: parsed.data.name,
      subdomain,
      memberships: {
        create: {
          userId: session.user.id,
          role: "OWNER"
        }
      }
    }
  });

  await prisma.auditLog.create({
    data: {
      siteId: site.id,
      actorUserId: session.user.id,
      action: "site.created",
      metadata: { siteId: site.id, subdomain: site.subdomain }
    }
  });

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
