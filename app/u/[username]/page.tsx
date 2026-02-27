import { notFound } from "next/navigation";
import { SiteLayout } from "@/components/site-layout";
import { MembershipRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAutoRank, isOnline, roleColor, roleLabel } from "@/lib/ranks";
import { getSiteFromRequest, getSiteMenus, requireSiteMembership } from "@/lib/tenant";

export default async function SiteProfilePage({ params }: { params: { username: string } }) {
  const site = await getSiteFromRequest();
  if (!site) return notFound();

  const [menus, viewer, membership] = await Promise.all([
    getSiteMenus(site.id),
    requireSiteMembership(),
    prisma.siteMembership.findFirst({ where: { siteId: site.id, user: { username: params.username } }, include: { user: true } })
  ]);

  if (!membership) return notFound();

  const postCount = await prisma.post.count({ where: { siteId: site.id, authorId: membership.userId } });
  const autoRank = getAutoRank(site, postCount);
  const rankToShow = (autoRank || membership.role) as MembershipRole;
  const canEdit = viewer?.user.id === membership.userId;

  return (
    <SiteLayout site={site} menus={menus}>
      <div className="rounded border border-zinc-800 bg-zinc-900 p-5">
        <div className="mb-4 flex items-center gap-4">
          <img src={membership.avatarUrl || "/uploads/default-avatar.svg"} alt="avatar" className="h-16 w-16 rounded-full object-cover" />
          <div>
            <h2 className="text-2xl font-bold">{membership.user.username}</h2>
            <p className={`text-sm ${roleColor(rankToShow)}`}>{roleLabel(rankToShow)}</p>
            <p className={`text-xs ${isOnline(membership.user.lastSeenAt) ? "text-green-300" : "text-zinc-500"}`}>
              {isOnline(membership.user.lastSeenAt) ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        <div className="grid gap-2 text-sm text-zinc-300">
          <p>Joined: {new Date(membership.createdAt).toLocaleDateString()}</p>
          <p>Posts: {postCount}</p>
          <p>Last seen: {membership.user.lastSeenAt ? new Date(membership.user.lastSeenAt).toLocaleString() : "Never"}</p>
          <p>Bio: {membership.bio || "No bio set."}</p>
        </div>
      </div>

      {canEdit ? (
        <div className="mt-4 space-y-4">
          <form action="/api/profile" method="post" className="rounded border border-zinc-800 bg-zinc-900 p-4">
            <h3 className="mb-2 font-semibold">Update Bio</h3>
            <textarea name="bio" defaultValue={membership.bio || ""} className="h-28 w-full rounded border border-zinc-700 bg-zinc-950 p-2" />
            <button className="mt-2 rounded bg-sky-600 px-4 py-2">Save Bio</button>
          </form>

          <form action="/api/profile/avatar" method="post" encType="multipart/form-data" className="rounded border border-zinc-800 bg-zinc-900 p-4">
            <h3 className="mb-2 font-semibold">Upload Avatar</h3>
            <input type="file" name="avatar" accept="image/*" className="text-sm" />
            <button className="mt-2 rounded bg-sky-600 px-4 py-2">Upload</button>
          </form>
        </div>
      ) : null}
    </SiteLayout>
  );
}
