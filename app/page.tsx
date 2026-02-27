import Link from "next/link";
import { PlatformNav } from "@/components/platform-nav";
import { SiteLayout } from "@/components/site-layout";
import { getSiteFromRequest, getSiteMenus, getSiteScopedMemberships } from "@/lib/tenant";

export default async function HomePage() {
  const site = await getSiteFromRequest();

  if (!site) {
    return (
      <>
        <PlatformNav />
        <main className="mx-auto max-w-5xl p-8">
          <h1 className="mb-4 text-4xl font-bold">Create your own community site</h1>
          <p className="mb-6 text-zinc-300">Sign up, claim a subdomain, and run your own isolated community.</p>
          <Link href="/register" className="rounded bg-sky-600 px-4 py-2 text-white">
            Get Started
          </Link>
        </main>
      </>
    );
  }

  const [menus, members] = await Promise.all([getSiteMenus(site.id), getSiteScopedMemberships(site.id)]);

  return (
    <SiteLayout site={site} menus={menus}>
      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="mb-2 text-lg font-semibold">Welcome</h2>
          <p className="text-sm text-zinc-300">{site.homepageIntro || "Configure your homepage intro in admin settings."}</p>
        </article>

        <article className="rounded border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="mb-2 text-lg font-semibold">Latest Members</h2>
          <ul className="space-y-1 text-sm text-zinc-300">
            {members.slice(0, 8).map((membership) => (
              <li key={membership.id}>
                {membership.user.username} — {membership.role}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="mb-2 text-lg font-semibold">Quick Links</h2>
          <ul className="space-y-1 text-sm">
            <li>
              <Link href="/admin">Admin Panel</Link>
            </li>
            <li>
              <Link href="/p/about">About Page</Link>
            </li>
          </ul>
        </article>
      </section>
    </SiteLayout>
  );
}
