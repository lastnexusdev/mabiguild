import { PlatformNav } from "@/components/platform-nav";
import { registerSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signIn } from "@/lib/auth";

export default function RegisterPage() {
  return (
    <>
      <PlatformNav />
      <form action={async (formData) => {
        "use server";
        const parsed = registerSchema.safeParse({
          email: formData.get("email"),
          username: formData.get("username"),
          password: formData.get("password")
        });
        if (!parsed.success) return;
        const passwordHash = await bcrypt.hash(parsed.data.password, 12);
        await prisma.user.create({ data: { email: parsed.data.email, username: parsed.data.username, passwordHash } });
        await signIn("credentials", {
          email: parsed.data.email,
          password: parsed.data.password,
          redirectTo: "/dashboard"
        });
      }} className="max-w-md mx-auto mt-10 space-y-3">
        <h1 className="text-2xl font-bold">Register</h1>
        <input name="email" placeholder="Email" className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded" />
        <input name="username" placeholder="Username" className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded" />
        <input name="password" type="password" placeholder="Password" className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded" />
        <button className="bg-sky-600 px-4 py-2 rounded">Create account</button>
      </form>
    </>
  );
}
