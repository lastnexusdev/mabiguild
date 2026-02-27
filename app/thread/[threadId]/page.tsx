import { notFound } from "next/navigation";
import { SiteLayout } from "@/components/site-layout";
import { prisma } from "@/lib/prisma";
import { getSiteFromRequest, getSiteMenus, requireSiteMembership } from "@/lib/tenant";

export default async function ThreadView({ params }: { params: { threadId: string } }) {
  const site = await getSiteFromRequest();
  if (!site) return notFound();

  const [menus, member] = await Promise.all([getSiteMenus(site.id), requireSiteMembership()]);

  const thread = await prisma.thread.findFirst({
    where: { id: params.threadId, siteId: site.id },
    include: { forum: true, posts: { orderBy: { createdAt: "asc" }, include: { author: true, edits: { orderBy: { createdAt: "desc" } } } } }
  });
  if (!thread) return notFound();

  if (member) {
    await prisma.threadReadState.upsert({
      where: { siteId_threadId_userId: { siteId: site.id, threadId: thread.id, userId: member.user.id } },
      update: { lastReadAt: new Date() },
      create: { siteId: site.id, threadId: thread.id, userId: member.user.id, lastReadAt: new Date() }
    });
  }

  const canModerate = member && ["OWNER", "ADMIN"].includes(member.membership.role);

  return (
    <SiteLayout site={site} menus={menus}>
      <h2 className="text-2xl font-bold">{thread.title}</h2>
      <p className="mb-4 text-sm text-zinc-400">in {thread.forum.name}</p>

      {canModerate ? (
        <form action="/api/forums/moderate" method="post" className="mb-4 flex flex-wrap gap-2 rounded border border-zinc-800 bg-zinc-900 p-3 text-sm">
          <input type="hidden" name="threadId" value={thread.id} />
          <button name="action" value={thread.locked ? "unlock" : "lock"} className="rounded bg-zinc-800 px-3 py-1">
            {thread.locked ? "Unlock" : "Lock"}
          </button>
          <button name="action" value={thread.pinned ? "unpin" : "pin"} className="rounded bg-zinc-800 px-3 py-1">
            {thread.pinned ? "Unpin" : "Pin"}
          </button>
          <input name="targetForumId" placeholder="targetForumId for move" className="rounded border border-zinc-700 bg-zinc-950 px-2" />
          <button name="action" value="move" className="rounded bg-zinc-800 px-3 py-1">Move</button>
          <button name="action" value="delete" className="rounded bg-red-700 px-3 py-1">Delete Thread</button>
        </form>
      ) : null}

      <div className="space-y-3">
        {thread.posts.map((post) => (
          <article key={post.id} className="rounded border border-zinc-800 bg-zinc-900 p-3">
            <p className="text-sm font-semibold">{post.author.username}</p>
            <p className="whitespace-pre-wrap text-sm">{post.body}</p>
            <p className="mt-2 text-xs text-zinc-400">{post.edits.length ? `Edited ${post.edits.length}x` : ""}</p>
            {member && member.user.id === post.authorId ? (
              <form action="/api/forums/post/edit" method="post" className="mt-2 space-y-2">
                <input type="hidden" name="postId" value={post.id} />
                <textarea name="body" defaultValue={post.body} className="h-20 w-full rounded border border-zinc-700 bg-zinc-950 p-2 text-sm" />
                <button className="rounded bg-zinc-800 px-3 py-1 text-xs">Save Edit</button>
              </form>
            ) : null}
          </article>
        ))}
      </div>

      {member && !thread.locked ? (
        <form action="/api/forums/reply" method="post" className="mt-6 space-y-2 rounded border border-zinc-800 bg-zinc-900 p-4">
          <input type="hidden" name="threadId" value={thread.id} />
          <textarea name="body" className="h-24 w-full rounded border border-zinc-700 bg-zinc-950 p-2" placeholder="Reply" />
          <button className="rounded bg-sky-600 px-4 py-2">Reply</button>
        </form>
      ) : null}
    </SiteLayout>
  );
}
