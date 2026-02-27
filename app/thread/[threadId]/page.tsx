import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { getSiteFromRequest, requireSiteMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

export default async function ThreadPage({ params }: { params: { threadId: string } }) {
  const site = await getSiteFromRequest();
  if (!site) return notFound();

  const thread = await prisma.thread.findFirst({ where: { id: params.threadId, siteId: site.id } });
  if (!thread) return notFound();

  const posts = await prisma.post.findMany({ where: { threadId: thread.id, siteId: site.id }, include: { author: true }, orderBy: { createdAt: "asc" } });
  const membership = await requireSiteMembership();

  if (membership) {
    await prisma.threadReadState.upsert({
      where: { siteId_userId_threadId: { siteId: site.id, userId: membership.user.id, threadId: thread.id } },
      update: { lastReadAt: new Date() },
      create: { siteId: site.id, userId: membership.user.id, threadId: thread.id, lastReadAt: new Date() }
    });
  }

  return (
    <SiteShell site={site}>
      <h2 className="text-2xl font-bold mb-4">{thread.title}</h2>
      <div className="space-y-3 mb-6">
        {posts.map((p) => (
          <article key={p.id} className="border border-zinc-800 rounded p-3">
            <p className="text-zinc-400 text-sm">{p.author.username}</p>
            <p>{p.body}</p>
          </article>
        ))}
      </div>
      {membership && !thread.locked && (
        <form action="/api/forums/posts" method="post" className="space-y-2">
          <input type="hidden" name="threadId" value={thread.id} />
          <textarea name="body" placeholder="Reply" className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded" />
          <button className="bg-sky-600 px-3 py-2 rounded">Reply</button>
        </form>
      )}
    </SiteShell>
  );
}
