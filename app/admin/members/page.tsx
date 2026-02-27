import { notFound } from "next/navigation";
import { SiteLayout } from "@/components/site-layout";
import { prisma } from "@/lib/prisma";
import { roleColor } from "@/lib/ranks";
import { getSiteMenus, requireSiteMembership } from "@/lib/tenant";

export default async function AdminMembersPage() {
  const ctx = await requireSiteMembership("ADMIN");
  if (!ctx) return notFound();

  const [menus, memberships, bans] = await Promise.all([
    getSiteMenus(ctx.site.id),
    prisma.siteMembership.findMany({ where: { siteId: ctx.site.id }, include: { user: true }, orderBy: { createdAt: "asc" } }),
    prisma.ban.findMany({ where: { siteId: ctx.site.id } })
  ]);

  const bannedIds = new Set(bans.map((b) => b.userId));

  return (
    <SiteLayout site={ctx.site} menus={menus}>
      <h2 className="mb-4 text-2xl font-bold">Manage Members</h2>
      <div className="space-y-3">
        {memberships.map((m) => (
          <article key={m.id} className="rounded border border-zinc-800 bg-zinc-900 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-semibold">{m.user.username}</p>
              <span className={`text-xs ${roleColor(m.role)}`}>{m.role}</span>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <form action="/api/admin/members/role" method="post" className="flex items-center gap-2">
                <input type="hidden" name="membershipId" value={m.id} />
                <select name="role" defaultValue={m.role} className="rounded border border-zinc-700 bg-zinc-950 p-2 text-sm">
                  <option value="MEMBER">MEMBER</option>
                  <option value="MODERATOR">MODERATOR</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="OWNER">OWNER</option>
                </select>
                <button className="rounded bg-sky-600 px-3 py-1 text-sm">Set Role</button>
              </form>

              {bannedIds.has(m.userId) ? (
                <form action="/api/admin/members/unban" method="post" className="flex items-center gap-2">
                  <input type="hidden" name="userId" value={m.userId} />
                  <button className="rounded bg-emerald-700 px-3 py-1 text-sm">Unban</button>
                </form>
              ) : (
                <form action="/api/admin/members/ban" method="post" className="flex items-center gap-2">
                  <input type="hidden" name="membershipId" value={m.id} />
                  <input name="reason" placeholder="Reason" className="rounded border border-zinc-700 bg-zinc-950 p-2 text-sm" />
                  <button className="rounded bg-red-700 px-3 py-1 text-sm">Ban</button>
                </form>
              )}
            </div>
          </article>
        ))}
      </div>
    </SiteLayout>
  );
}
