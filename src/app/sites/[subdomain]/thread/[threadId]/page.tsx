import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { validateRequest } from "@/lib/auth";
import Link from "next/link";
import { timeAgo, formatDateTime } from "@/lib/utils";
import ReplyForm from "./ReplyForm";
import PostActions from "./PostActions";

export default async function ThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ subdomain: string; threadId: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { subdomain, threadId } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const perPage = 15;

  const site = await prisma.site.findUnique({ where: { subdomain } });
  if (!site) notFound();

  const thread = await prisma.thread.findFirst({
    where: { id: threadId, siteId: site.id },
    include: {
      author: true,
      forum: { include: { category: true } },
    },
  });
  if (!thread) notFound();

  const { user } = await validateRequest();

  // Track read state
  if (user) {
    await prisma.threadReadState.upsert({
      where: { userId_threadId: { userId: user.id, threadId } },
      update: { lastReadAt: new Date(), siteId: site.id },
      create: { siteId: site.id, userId: user.id, threadId, lastReadAt: new Date() },
    });
    // Update lastSeen
    await prisma.user.update({
      where: { id: user.id },
      data: { lastSeen: new Date() },
    });
    // Increment view count
    await prisma.thread.update({
      where: { id: threadId },
      data: { viewCount: { increment: 1 } },
    });
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { threadId, siteId: site.id, isDeleted: false },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        author: true,
        editHistory: { orderBy: { editedAt: "desc" }, take: 1 },
      },
    }),
    prisma.post.count({
      where: { threadId, siteId: site.id, isDeleted: false },
    }),
  ]);

  const totalPages = Math.ceil(total / perPage);

  const membership = user
    ? await prisma.siteMembership.findUnique({
        where: { userId_siteId: { userId: user.id, siteId: site.id } },
      })
    : null;

  const isMod =
    membership?.role === "OWNER" ||
    membership?.role === "ADMIN" ||
    membership?.role === "MODERATOR";

  // Get post counts for members
  const postCounts: Record<string, number> = {};
  for (const p of posts) {
    if (!postCounts[p.authorId]) {
      postCounts[p.authorId] = await prisma.post.count({
        where: { authorId: p.authorId, siteId: site.id, isDeleted: false },
      });
    }
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
        <Link href="/forums" className="hover:text-blue-600">Forums</Link>
        <span>/</span>
        <Link href={`/forums/${thread.forum.id}`} className="hover:text-blue-600">{thread.forum.name}</Link>
        <span>/</span>
        <span className="text-slate-700 dark:text-slate-300 line-clamp-1">{thread.title}</span>
      </div>

      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            {thread.isPinned && <span className="badge bg-blue-100 text-blue-700">📌 Pinned</span>}
            {thread.isLocked && <span className="badge bg-slate-100 text-slate-600">🔒 Locked</span>}
          </div>
          <h1 className="text-2xl font-bold">{thread.title}</h1>
          <p className="text-sm text-slate-500">
            by {thread.author.username} · {total} posts · {thread.viewCount} views
          </p>
        </div>
        {isMod && (
          <div className="flex gap-2">
            <form action={`/api/sites/${site.id}/threads/${thread.id}/pin`} method="POST">
              <button className="btn-secondary btn-sm btn">
                {thread.isPinned ? "Unpin" : "Pin"}
              </button>
            </form>
            <form action={`/api/sites/${site.id}/threads/${thread.id}/lock`} method="POST">
              <button className="btn-secondary btn-sm btn">
                {thread.isLocked ? "Unlock" : "Lock"}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {posts.map((post, idx) => (
          <div key={post.id} className="card">
            <div className="flex gap-0">
              {/* Author sidebar */}
              <div className="w-36 flex-shrink-0 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-l-lg border-r border-slate-200 dark:border-slate-700 text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg mb-2">
                  {(post.author.displayName ?? post.author.username)[0]?.toUpperCase()}
                </div>
                <Link
                  href={`/u/${post.author.username}`}
                  className="text-sm font-medium hover:text-blue-600 block"
                >
                  {post.author.displayName ?? post.author.username}
                </Link>
                <div className="text-xs text-slate-500 mt-1">
                  {postCounts[post.authorId] ?? 0} posts
                </div>
              </div>

              {/* Post content */}
              <div className="flex-1 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-slate-500">
                    #{(page - 1) * perPage + idx + 1} ·{" "}
                    {formatDateTime(post.createdAt)}
                    {post.editHistory.length > 0 && (
                      <span className="ml-2 italic">
                        (edited {timeAgo(post.editHistory[0].editedAt)})
                      </span>
                    )}
                  </span>
                  <PostActions
                    post={{
                      id: post.id,
                      authorId: post.authorId,
                      siteId: site.id,
                      threadId: thread.id,
                    }}
                    currentUserId={user?.id}
                    isMod={isMod}
                    isLocked={thread.isLocked}
                  />
                </div>
                <div
                  className="prose-content text-sm"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
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

      {/* Reply form */}
      {membership && !membership.isBanned && !thread.isLocked && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Reply</h3>
          <ReplyForm
            siteId={site.id}
            threadId={thread.id}
            forumId={thread.forumId}
          />
        </div>
      )}
      {thread.isLocked && (
        <div className="mt-6 card p-4 text-center text-slate-500 text-sm">
          🔒 This thread is locked. No new replies.
        </div>
      )}
      {!user && (
        <div className="mt-6 card p-4 text-center text-sm">
          <Link href="/login" className="text-blue-600 hover:underline">
            Login
          </Link>{" "}
          to reply.
        </div>
      )}
    </div>
  );
}
