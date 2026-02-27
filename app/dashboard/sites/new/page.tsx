import { PlatformNav } from "@/components/platform-nav";
import { requireUser } from "@/lib/auth";

export default async function NewSitePage() {
  await requireUser();

  return (
    <>
      <PlatformNav />
      <main className="mx-auto mt-10 max-w-lg p-4">
        <h1 className="mb-4 text-2xl font-bold">Create Site</h1>
        <form action="/api/sites" method="post" className="space-y-3">
          <input className="w-full rounded border border-zinc-700 bg-zinc-900 p-2" name="name" placeholder="Site name" />
          <input className="w-full rounded border border-zinc-700 bg-zinc-900 p-2" name="subdomain" placeholder="subdomain" />
          <button className="rounded bg-sky-600 px-4 py-2 text-white">Create</button>
        </form>
      </main>
    </>
  );
}
