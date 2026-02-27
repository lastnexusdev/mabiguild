import { PlatformNav } from "@/components/platform-nav";
import { signIn } from "@/lib/auth";

export default function LoginPage() {
  return (
    <>
      <PlatformNav />
      <main className="mx-auto mt-10 max-w-md p-4">
        <h1 className="mb-4 text-2xl font-bold">Login</h1>
        <form
          className="space-y-3"
          action={async (formData) => {
            "use server";
            await signIn("credentials", {
              email: formData.get("email"),
              password: formData.get("password"),
              redirectTo: "/dashboard"
            });
          }}
        >
          <input className="w-full rounded border border-zinc-700 bg-zinc-900 p-2" name="email" placeholder="Email" />
          <input className="w-full rounded border border-zinc-700 bg-zinc-900 p-2" name="password" type="password" placeholder="Password" />
          <button className="rounded bg-sky-600 px-4 py-2 text-white">Login</button>
        </form>
      </main>
    </>
  );
}
