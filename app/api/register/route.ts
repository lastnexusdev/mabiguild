import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = Object.fromEntries((await request.formData()).entries());
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email: parsed.data.email }, { username: parsed.data.username }]
    }
  });
  if (existing) {
    return NextResponse.json({ error: "Email or username already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await prisma.user.create({
    data: {
      email: parsed.data.email,
      username: parsed.data.username,
      passwordHash
    }
  });

  return NextResponse.redirect(new URL("/login", request.url));
}
