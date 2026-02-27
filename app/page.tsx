import Link from "next/link";
import { WidgetType } from "@prisma/client";
import { PlatformNav } from "@/components/platform-nav";
import { SiteLayout } from "@/components/site-layout";
import { HomepageWidgets } from "@/components/homepage-widgets";
import { prisma } from "@/lib/prisma";
import { getSiteFromRequest, getSiteMenus, requireSiteMembership } from "@/lib/tenant";

const defaults: { widget: WidgetType; enabled: boolean; column: number; position: number }[] = [
  { widget: "RECENT_THREADS", enabled: true, column: 0, position: 0 },
  { widget: "SHOUTBOX", enabled: true, column: 1, position: 0 },
  { widget: "ONLINE_MEMBERS", enabled: true, column: 2, position: 0 },
  { widget: "SITE_STATS", enabled: true, column: 2, position: 1 }
];

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

  const [menus, placementRows, viewer] = await Promise.all([
    getSiteMenus(site.id),
    prisma.widgetPlacement.findMany({ where: { siteId: site.id }, orderBy: [{ column: "asc" }, { position: "asc" }] }),
    requireSiteMembership()
  ]);

  const placements = placementRows.length
    ? placementRows
    : defaults.map((d) => ({
        id: `default-${d.widget}`,
        siteId: site.id,
        widget: d.widget,
        enabled: d.enabled,
        column: d.column,
        position: d.position
      }));

  return (
    <SiteLayout site={site} menus={menus}>
      <div className="mb-4 rounded border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-300">
        {site.homepageIntro || "Configure your homepage intro in admin settings."}
      </div>
      <HomepageWidgets site={site} placements={placements} viewerRole={viewer?.membership.role ?? null} />
    </SiteLayout>
  );
}
