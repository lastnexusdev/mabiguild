"use server";

import { lucia } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rateLimit";
import { verify } from "argon2";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

const loginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
});

export async function loginAction(
  _prev: { error: string },
  formData: FormData
) {
  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for") ?? "unknown";

  // Rate limit: 10 attempts per 15 minutes per IP
  const rl = checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
  if (!rl.allowed) {
    return { error: "Too many login attempts. Please try again later." };
  }

  const parsed = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Invalid input." };
  }

  const { identifier, password } = parsed.data;

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier.toLowerCase() },
        { username: identifier.toLowerCase() },
      ],
    },
  });

  if (!user) {
    // Constant-time response to prevent enumeration
    return { error: "Invalid credentials." };
  }

  let valid = false;
  try {
    valid = await verify(user.passwordHash, password);
  } catch {
    return { error: "Invalid credentials." };
  }

  if (!valid) {
    return { error: "Invalid credentials." };
  }

  // Update lastSeen
  await prisma.user.update({
    where: { id: user.id },
    data: { lastSeen: new Date() },
  });

  const session = await lucia.createSession(user.id, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  const cookieStore = await cookies();
  cookieStore.set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  );

  redirect("/dashboard");
}
