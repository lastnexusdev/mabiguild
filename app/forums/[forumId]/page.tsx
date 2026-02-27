import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteLayout } from "@/components/site-layout";
import { prisma } from "@/lib/prisma";
import { getSiteFromRequest, getSiteMenus, requireSiteMembership } from "@/lib/tenant";

export default async function ForumView({ params }: { params: { forumId: string } }) {
  const site = await getSiteFromRequest();
  if (!site) return notFound();

  const [menus, member] = await Promise.all([getSiteMenus(site.id), requireSiteMembership()]);
  const ban = member ? await prisma.ban.findUnique({ where: { siteId_userId: { siteId: site.id, userId: member.user.id } } }) : null;

  const forum = await prisma.forum.findFirst({ where: { id: params.forumId, siteId: site.id } });
  if (!forum) return notFound();

  const threads = await prisma.thread.findMany({
    where: { forumId: forum.id, siteId: site.id },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    include: member
      ? { readStates: { where: { siteId: site.id, userId: member.user.id }, select: { lastReadAt: true } } }
      : undefined
  });

  return (
    <SiteLayout site={site} menus={menus}>
      <h2 className="text-2xl font-bold">{forum.name}</h2>
      <p className="mb-4 text-sm text-zinc-400">{forum.description}</p>

      {member && !ban ? (
        <form action="/api/forums/thread" method="post" className="mb-6 space-y-2 rounded border border-zinc-800 bg-zinc-900 p-4">
          <input type="hidden" name="forumId" value={forum.id} />
          <input name="title" className="w-full rounded border border-zinc-700 bg-zinc-950 p-2" placeholder="Thread title" />
          <textarea name="body" className="h-28 w-full rounded border border-zinc-700 bg-zinc-950 p-2" placeholder="Thread body" />
          <button className="rounded bg-sky-600 px-4 py-2">Create Thread</button>
        </form>
      ) : null}

      <div className="space-y-2">
        {threads.map((thread) => {
          const readAt = member ? thread.readStates[0]?.lastReadAt : null;
          const unread = member ? !readAt || readAt < thread.updatedAt : false;
          return (
            <article key={thread.id} className="rounded border border-zinc-800 bg-zinc-900 p-3">
              <Link href={`/thread/${thread.id}`} className="font-semibold">
                {thread.pinned ? "📌 " : ""}
                {thread.title}
              </Link>
              <p className="text-xs text-zinc-400">
                {thread.locked ? "Locked" : "Open"}
                {unread ? " • Unread" : ""}
              </p>
            </article>
          );
        })}
      </div>
    </SiteLayout>
  );
}
