import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { validateRequest } from "@/lib/auth";
import Link from "next/link";
import { timeAgo } from "@/lib/utils";

export default async function ForumPage({
  params,
  searchParams,
}: {
  params: Promise<{ subdomain: string; forumId: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { subdomain, forumId } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const perPage = 20;

  const site = await prisma.site.findUnique({ where: { subdomain } });
  if (!site) notFound();

  const forum = await prisma.forum.findFirst({
    where: { id: forumId, siteId: site.id },
    include: { category: true },
  });
  if (!forum) notFound();

  const { user } = await validateRequest();

  const [threads, total] = await Promise.all([
    prisma.thread.findMany({
      where: { forumId, siteId: site.id },
      orderBy: [{ isPinned: "desc" }, { lastPostAt: "desc" }],
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        author: true,
        _count: { select: { posts: true } },
      },
    }),
    prisma.thread.count({ where: { forumId, siteId: site.id } }),
  ]);

  const totalPages = Math.ceil(total / perPage);

  const membership = user
    ? await prisma.siteMembership.findUnique({
        where: { userId_siteId: { userId: user.id, siteId: site.id } },
      })
    : null;

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
        <Link href="/forums" className="hover:text-blue-600">
          Forums
        </Link>
        <span>/</span>
        <span>{forum.category.name}</span>
        <span>/</span>
        <span className="text-slate-700 dark:text-slate-300 font-medium">
          {forum.name}
        </span>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{forum.name}</h1>
        {membership && !membership.isBanned && (
          <Link
            href={`/forums/${forum.id}/new`}
            className="btn-primary btn"
          >
            + New Thread
          </Link>
        )}
      </div>

      {forum.description && (
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          {forum.description}
        </p>
      )}

      <div className="card">
        <div className="grid grid-cols-[1fr_auto_auto] bg-slate-100 dark:bg-slate-800 px-4 py-2 text-xs font-medium text-slate-500 rounded-t-lg gap-4">
          <span>Thread</span>
          <span className="text-right w-16">Replies</span>
          <span className="text-right w-32">Last Post</span>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {threads.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-500">
              No threads yet.{" "}
              {membership ? (
                <Link href={`/forums/${forum.id}/new`} className="text-blue-600 hover:underline">
                  Start the first one!
                </Link>
              ) : (
                "Join the site to post."
              )}
            </div>
          ) : (
            threads.map((thread) => (
              <div
                key={thread.id}
                className="grid grid-cols-[1fr_auto_auto] px-4 py-3 items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {thread.isPinned && (
                      <span className="badge bg-blue-100 text-blue-700 text-xs">
                        📌 Pinned
                      </span>
                    )}
                    {thread.isLocked && (
                      <span className="badge bg-slate-100 text-slate-600 text-xs">
                        🔒 Locked
                      </span>
                    )}
                    <Link
                      href={`/thread/${thread.id}`}
                      className="font-medium hover:text-blue-600 line-clamp-1"
                    >
                      {thread.title}
                    </Link>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    by {thread.author.username} · {timeAgo(thread.createdAt)}
                  </p>
                </div>
                <span className="text-sm text-slate-500 text-right w-16">
                  {thread._count.posts - 1}
                </span>
                <span className="text-xs text-slate-500 text-right w-32">
                  {timeAgo(thread.lastPostAt)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`?page=${p}`}
              className={`px-3 py-1.5 rounded text-sm ${
                p === page
                  ? "bg-blue-600 text-white"
                  : "bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
