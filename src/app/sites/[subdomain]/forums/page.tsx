import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { timeAgo } from "@/lib/utils";

export default async function ForumsPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;

  const site = await prisma.site.findUnique({ where: { subdomain } });
  if (!site) notFound();

  const categories = await prisma.forumCategory.findMany({
    where: { siteId: site.id },
    orderBy: { sortOrder: "asc" },
    include: {
      forums: {
        where: { siteId: site.id },
        orderBy: { sortOrder: "asc" },
        include: {
          threads: {
            where: { siteId: site.id },
            orderBy: { lastPostAt: "desc" },
            take: 1,
            include: { author: true },
          },
          _count: { select: { threads: true, posts: true } },
        },
      },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Forums</h1>
      <div className="space-y-6">
        {categories.map((cat) => (
          <div key={cat.id} className="card">
            <div className="card-header bg-slate-700 dark:bg-slate-700 rounded-t-lg">
              <h2 className="font-bold text-white">{cat.name}</h2>
              {cat.description && (
                <p className="text-slate-300 text-sm mt-0.5">{cat.description}</p>
              )}
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {cat.forums.map((forum) => {
                const lastThread = forum.threads[0];
                return (
                  <div key={forum.id} className="px-6 py-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/forums/${forum.id}`}
                        className="font-medium hover:text-blue-600"
                      >
                        {forum.name}
                      </Link>
                      {forum.description && (
                        <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">
                          {forum.description}
                        </p>
                      )}
                    </div>
                    <div className="hidden sm:flex gap-6 text-sm text-slate-500 text-right">
                      <div>
                        <div className="font-medium text-slate-700 dark:text-slate-300">
                          {forum._count.threads}
                        </div>
                        <div className="text-xs">Threads</div>
                      </div>
                      <div>
                        <div className="font-medium text-slate-700 dark:text-slate-300">
                          {forum._count.posts}
                        </div>
                        <div className="text-xs">Posts</div>
                      </div>
                      {lastThread && (
                        <div className="min-w-[120px]">
                          <div className="text-xs font-medium line-clamp-1">
                            <Link
                              href={`/thread/${lastThread.id}`}
                              className="hover:text-blue-600"
                            >
                              {lastThread.title}
                            </Link>
                          </div>
                          <div className="text-xs">
                            by {lastThread.author.username} · {timeAgo(lastThread.lastPostAt)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {cat.forums.length === 0 && (
                <p className="px-6 py-4 text-sm text-slate-500">
                  No forums in this category yet.
                </p>
              )}
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="card p-12 text-center text-slate-500">
            No forums yet. Admins can create them in the admin panel.
          </div>
        )}
      </div>
    </div>
  );
}
