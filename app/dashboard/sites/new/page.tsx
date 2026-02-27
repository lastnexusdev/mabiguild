import { PlatformNav } from "@/components/platform-nav";
import { requireUser } from "@/lib/auth";

export default async function NewSitePage() {
  await requireUser();
  return (
    <>
      <PlatformNav />
      <form action="/api/sites" method="post" className="max-w-lg mx-auto mt-10 space-y-3">
        <h1 className="text-2xl font-bold">Create New Site</h1>
        <input name="name" placeholder="Site name" className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded" />
        <input name="subdomain" placeholder="subdomain" className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded" />
        <button className="bg-sky-600 px-4 py-2 rounded">Create Site</button>
      </form>
    </>
  );
}
