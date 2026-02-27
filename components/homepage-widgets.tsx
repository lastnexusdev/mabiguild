import Link from "next/link";
import { MembershipRole, Site, WidgetPlacement } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ShoutboxWidget } from "@/components/shoutbox-widget";

export async function HomepageWidgets({
  site,
  placements,
  viewerRole
}: {
  site: Site;
  placements: WidgetPlacement[];
  viewerRole: MembershipRole | null;
}) {
  const recentThreads = await prisma.thread.findMany({
    where: { siteId: site.id },
    orderBy: { updatedAt: "desc" },
    take: 8
  });

  const onlineMembers = await prisma.siteMembership.findMany({
    where: { siteId: site.id },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 8
  });

  const stats = await Promise.all([
    prisma.siteMembership.count({ where: { siteId: site.id } }),
    prisma.thread.count({ where: { siteId: site.id } }),
    prisma.post.count({ where: { siteId: site.id } })
  ]);

  const enabled = placements.filter((p) => p.enabled).sort((a, b) => a.column - b.column || a.position - b.position);
  const cols = [0, 1, 2];

  const canDeleteShouts = viewerRole ? ["MODERATOR", "ADMIN", "OWNER"].includes(viewerRole) : false;

  return (
    <section className="grid gap-4 md:grid-cols-3">
      {cols.map((col) => (
        <div key={col} className="space-y-4">
          {enabled
            .filter((p) => p.column === col)
            .map((p) => {
              if (p.widget === "RECENT_THREADS") {
                return (
                  <article key={p.id} className="rounded border border-zinc-800 bg-zinc-900 p-4">
                    <h3 className="mb-2 text-lg font-semibold">Recent Threads</h3>
                    <ul className="space-y-1 text-sm">
                      {recentThreads.map((t) => (
                        <li key={t.id}>
                          <Link href={`/thread/${t.id}`}>{t.title}</Link>
                        </li>
                      ))}
                    </ul>
                  </article>
                );
              }

              if (p.widget === "ONLINE_MEMBERS") {
                return (
                  <article key={p.id} className="rounded border border-zinc-800 bg-zinc-900 p-4">
                    <h3 className="mb-2 text-lg font-semibold">Online Members</h3>
                    <ul className="space-y-1 text-sm text-zinc-300">
                      {onlineMembers.map((m) => (
                        <li key={m.id}>{m.user.username}</li>
                      ))}
                    </ul>
                  </article>
                );
              }

              if (p.widget === "SITE_STATS") {
                return (
                  <article key={p.id} className="rounded border border-zinc-800 bg-zinc-900 p-4">
                    <h3 className="mb-2 text-lg font-semibold">Site Stats</h3>
                    <ul className="space-y-1 text-sm text-zinc-300">
                      <li>Members: {stats[0]}</li>
                      <li>Threads: {stats[1]}</li>
                      <li>Posts: {stats[2]}</li>
                    </ul>
                  </article>
                );
              }

              return <ShoutboxWidget key={p.id} canDelete={canDeleteShouts} />;
            })}
        </div>
      ))}
    </section>
  );
}
