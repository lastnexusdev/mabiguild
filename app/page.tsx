import Link from "next/link";
import { PlatformNav } from "@/components/platform-nav";
import { SiteShell } from "@/components/site-shell";
import { getSiteFromRequest } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { Shoutbox } from "@/components/shoutbox";

export default async function HomePage() {
  const site = await getSiteFromRequest();

  if (!site) {
    return (
      <>
        <PlatformNav />
        <section className="max-w-4xl mx-auto p-12">
          <h1 className="text-5xl font-bold mb-4">Build your own guild community.</h1>
          <p className="text-zinc-300 mb-8">Create a tenant-isolated Enjin-style site with forums, pages, widgets, and member roles.</p>
          <Link href="/register" className="bg-sky-600 text-white px-4 py-2 rounded">Create your site</Link>
        </section>
      </>
    );
  }

  const widgets = await prisma.widgetPlacement.findMany({ where: { siteId: site.id }, orderBy: [{ column: "asc" }, { position: "asc" }] });
  return (
    <SiteShell site={site}>
      <h2 className="text-2xl font-semibold mb-4">Homepage Widgets</h2>
      <div className="grid md:grid-cols-3 gap-4">
        {[0,1,2].map((col) => (
          <div key={col} className="space-y-3">
            {widgets.filter((w) => w.column === col).map((widget) => (
              <article key={widget.id} className="border border-zinc-800 rounded p-3 bg-zinc-900">
                <h3 className="font-semibold">{widget.title}</h3>
                <p className="text-zinc-300 text-sm">{widget.content}</p>
              </article>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-6"><Shoutbox /></div>
    </SiteShell>
  );
}
