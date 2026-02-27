import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { getSiteFromRequest } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

export default async function MembersPage() {
  const site = await getSiteFromRequest();
  if (!site) return notFound();
  const members = await prisma.siteMembership.findMany({ where: { siteId: site.id }, include: { user: true } });

  return (
    <SiteShell site={site}>
      <h2 className="text-2xl font-bold mb-3">Members</h2>
      <div className="space-y-2">
        {members.map((m) => (
          <Link href={`/u/${m.user.username}`} key={m.id} className="block border border-zinc-800 p-3 rounded">
            {m.user.username} — {m.role}
          </Link>
        ))}
      </div>
    </SiteShell>
  );
}
