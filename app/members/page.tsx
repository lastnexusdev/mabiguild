import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteLayout } from "@/components/site-layout";
import { prisma } from "@/lib/prisma";
import { isOnline, roleColor, roleLabel } from "@/lib/ranks";
import { getSiteFromRequest, getSiteMenus } from "@/lib/tenant";

export default async function MembersPage() {
  const site = await getSiteFromRequest();
  if (!site) return notFound();

  const [menus, members] = await Promise.all([
    getSiteMenus(site.id),
    prisma.siteMembership.findMany({ where: { siteId: site.id }, include: { user: true }, orderBy: { createdAt: "asc" } })
  ]);

  return (
    <SiteLayout site={site} menus={menus}>
      <h2 className="mb-4 text-2xl font-bold">Members</h2>
      <div className="space-y-2">
        {members.map((m) => (
          <article key={m.id} className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-900 p-3">
            <Link href={`/u/${m.user.username}`} className="flex items-center gap-3">
              <img src={m.avatarUrl || "/uploads/default-avatar.svg"} alt="avatar" className="h-10 w-10 rounded-full object-cover" />
              <div>
                <p className="font-semibold">{m.user.username}</p>
                <p className={`text-xs ${roleColor(m.role)}`}>{roleLabel(m.role)}</p>
              </div>
            </Link>
            <span className={`text-xs ${isOnline(m.user.lastSeenAt) ? "text-green-300" : "text-zinc-500"}`}>
              {isOnline(m.user.lastSeenAt) ? "Online" : "Offline"}
            </span>
          </article>
        ))}
      </div>
    </SiteLayout>
  );
}
