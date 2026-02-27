import { PlatformNav } from "@/components/platform-nav";
import { signIn } from "@/lib/auth";

export default function LoginPage() {
  return (
    <>
      <PlatformNav />
      <form action={async (formData) => {
        "use server";
        await signIn("credentials", {
          email: formData.get("email"),
          password: formData.get("password"),
          redirectTo: "/dashboard"
        });
      }} className="max-w-md mx-auto mt-10 space-y-3">
        <h1 className="text-2xl font-bold">Login</h1>
        <input name="email" placeholder="Email" className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded" />
        <input name="password" type="password" placeholder="Password" className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded" />
        <button className="bg-sky-600 px-4 py-2 rounded">Login</button>
      </form>
    </>
  );
}
