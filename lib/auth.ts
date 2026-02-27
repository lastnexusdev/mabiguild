import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { loginSchema } from "./validation";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: {},
        password: {}
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
        if (!user) return null;
        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;
        await prisma.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } });
        return { id: user.id, email: user.email, name: user.username };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id as string;
      return token;
    },
    async session({ session, token }) {
      if (token?.id) (session.user as { id?: string }).id = token.id as string;
      return session;
    }
  }
});

export async function getCurrentSession() {
  const session = await auth();
  return { session, user: session?.user ?? null };
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user as { id: string; email: string; name: string };
}
