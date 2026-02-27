import Link from "next/link";
import { PlatformNav } from "@/components/platform-nav";
import { getSiteFromRequest, getSiteScopedMemberships } from "@/lib/tenant";

export default async function HomePage() {
  const site = await getSiteFromRequest();

  if (!site) {
    return (
      <>
        <PlatformNav />
        <main className="mx-auto max-w-5xl p-8">
          <h1 className="mb-4 text-4xl font-bold">Create your own community site</h1>
          <p className="mb-6 text-zinc-300">
            Sign up, claim a subdomain, and run your own isolated community.
          </p>
          <Link href="/register" className="rounded bg-sky-600 px-4 py-2 text-white">Get Started</Link>
        </main>
      </>
    );
  }

  const members = await getSiteScopedMemberships(site.id);

  return (
    <main className="mx-auto max-w-5xl p-8">
      <div className="mb-6 rounded border border-zinc-800 bg-zinc-900 p-5">
        <h1 className="text-3xl font-bold">{site.name}</h1>
        <p className="text-sm text-zinc-400">{site.subdomain}.{process.env.ROOT_DOMAIN}</p>
      </div>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Members</h2>
        <div className="space-y-2">
          {members.map((membership) => (
            <article key={membership.id} className="rounded border border-zinc-800 bg-zinc-900 p-3">
              <p className="font-medium">{membership.user.username}</p>
              <p className="text-sm text-zinc-400">{membership.role}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
