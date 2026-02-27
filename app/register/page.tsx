import { PlatformNav } from "@/components/platform-nav";

export default function RegisterPage() {
  return (
    <>
      <PlatformNav />
      <main className="mx-auto mt-10 max-w-md p-4">
        <h1 className="mb-4 text-2xl font-bold">Register</h1>
        <form action="/api/register" method="post" className="space-y-3">
          <input className="w-full rounded border border-zinc-700 bg-zinc-900 p-2" name="email" placeholder="Email" />
          <input className="w-full rounded border border-zinc-700 bg-zinc-900 p-2" name="username" placeholder="Username" />
          <input className="w-full rounded border border-zinc-700 bg-zinc-900 p-2" name="password" type="password" placeholder="Password" />
          <button className="rounded bg-sky-600 px-4 py-2 text-white">Create Account</button>
        </form>
      </main>
    </>
  );
}
