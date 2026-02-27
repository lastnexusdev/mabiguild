import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { getSiteFromRequest } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

export default async function ForumDetailPage({ params }: { params: { forumId: string } }) {
  const site = await getSiteFromRequest();
  if (!site) return notFound();

  const forum = await prisma.forum.findFirst({ where: { id: params.forumId, siteId: site.id } });
  if (!forum) return notFound();

  const threads = await prisma.thread.findMany({ where: { forumId: forum.id, siteId: site.id }, orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }] });

  return (
    <SiteShell site={site}>
      <h2 className="text-2xl font-bold mb-4">{forum.name}</h2>
      <form action="/api/forums/threads" method="post" className="space-y-2 mb-6">
        <input type="hidden" name="forumId" value={forum.id} />
        <input type="text" name="title" placeholder="Thread title" className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded" />
        <textarea name="body" placeholder="Thread body" className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded" />
        <button className="bg-sky-600 px-3 py-2 rounded">Create Thread</button>
      </form>
      <div className="space-y-2">
        {threads.map((thread) => (
          <Link key={thread.id} href={`/thread/${thread.id}`} className="block border border-zinc-800 rounded p-3">
            <span className="font-semibold">{thread.title}</span>
            {thread.pinned && <span className="ml-2 text-yellow-400">PINNED</span>}
          </Link>
        ))}
      </div>
    </SiteShell>
  );
}
