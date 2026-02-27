import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSiteMembership } from "@/lib/tenant";

export async function POST(request: Request) {
  const ctx = await requireSiteMembership();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("avatar");
  if (!(file instanceof File)) return NextResponse.json({ error: "Avatar required" }, { status: 400 });

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length > 2 * 1024 * 1024) return NextResponse.json({ error: "Max size is 2MB" }, { status: 400 });

  const ext = file.type.includes("png") ? "png" : file.type.includes("jpeg") || file.type.includes("jpg") ? "jpg" : "webp";
  const fileName = `${ctx.site.id}-${ctx.user.id}-${randomUUID()}.${ext}`;

  const uploadsDir = join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(join(uploadsDir, fileName), bytes);

  const avatarUrl = `/uploads/${fileName}`;
  await prisma.siteMembership.update({
    where: { userId_siteId: { userId: ctx.user.id, siteId: ctx.site.id } },
    data: { avatarUrl }
  });

  const me = await prisma.user.findUnique({ where: { id: ctx.user.id }, select: { username: true } });
  return NextResponse.redirect(new URL(`/u/${me?.username || ""}`, request.url));
}
