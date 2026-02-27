import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PermissionKey } from "@prisma/client";
import { z } from "zod";

const schema = z.object({
  permission: z.nativeEnum(PermissionKey),
  grant: z.boolean(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string; roleId: string }> }
) {
  const { siteId, roleId } = await params;
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

  const { permission, grant } = parsed.data;

  if (grant) {
    await prisma.rolePermission.upsert({
      where: { roleId_permission: { roleId, permission } },
      update: {},
      create: { roleId, permission },
    });
  } else {
    await prisma.rolePermission.deleteMany({
      where: { roleId, permission },
    });
  }

  return NextResponse.json({ ok: true });
}
