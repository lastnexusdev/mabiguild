import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { validateRequest } from "@/lib/auth";
import Link from "next/link";
import { formatDate, timeAgo } from "@/lib/utils";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ subdomain: string; username: string }>;
}) {
  const { subdomain, username } = await params;

  const site = await prisma.site.findUnique({ where: { subdomain } });
  if (!site) notFound();

  const profileUser = await prisma.user.findUnique({
    where: { username },
  });
  if (!profileUser) notFound();

  const membership = await prisma.siteMembership.findUnique({
    where: {
      userId_siteId: { userId: profileUser.id, siteId: site.id },
    },
    include: {
      userRoles: {
        include: { role: true },
      },
    },
  });

  if (!membership) notFound();

  const { user: currentUser } = await validateRequest();

  const postCount = await prisma.post.count({
    where: {
      authorId: profileUser.id,
      siteId: site.id,
      isDeleted: false,
    },
  });

  const recentPosts = await prisma.post.findMany({
    where: { authorId: profileUser.id, siteId: site.id, isDeleted: false },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { thread: true },
  });

  const isOnline =
    profileUser.lastSeen >= new Date(Date.now() - 5 * 60 * 1000);

  const isSelf = currentUser?.id === profileUser.id;
  const currentMembership = currentUser
    ? await prisma.siteMembership.findUnique({
        where: {
          userId_siteId: { userId: currentUser.id, siteId: site.id },
        },
      })
    : null;
  const isMod =
    currentMembership?.role === "OWNER" ||
    currentMembership?.role === "ADMIN" ||
    currentMembership?.role === "MODERATOR";

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card mb-6">
        <div className="card-body">
          <div className="flex items-start gap-6">
            <div className="relative flex-shrink-0">
              {profileUser.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profileUser.avatarUrl}
                  alt={profileUser.username}
                  className="w-20 h-20 rounded-full border-2 border-slate-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                  {(profileUser.displayName ?? profileUser.username)[0]?.toUpperCase()}
                </div>
              )}
              {isOnline && (
                <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold">
                    {profileUser.displayName ?? profileUser.username}
                  </h1>
                  <p className="text-slate-500">@{profileUser.username}</p>
                </div>
                {(isSelf || isMod) && (
                  <div className="flex gap-2">
                    {isSelf && (
                      <Link
                        href="/account"
                        className="btn-secondary btn-sm btn"
                      >
                        Edit Profile
                      </Link>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                <span
                  className={`badge text-xs ${
                    membership.role === "OWNER"
                      ? "bg-yellow-100 text-yellow-800"
                      : membership.role === "ADMIN"
                      ? "bg-purple-100 text-purple-800"
                      : membership.role === "MODERATOR"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {membership.role}
                </span>
                {membership.userRoles.map(({ role }) => (
                  <span
                    key={role.id}
                    className="badge text-xs"
                    style={{
                      backgroundColor: role.color + "20",
                      color: role.color,
                    }}
                  >
                    {role.name}
                  </span>
                ))}
              </div>

              {profileUser.bio && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">
                  {profileUser.bio}
                </p>
              )}

              <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                <div>
                  <div className="text-lg font-bold">{postCount}</div>
                  <div className="text-xs text-slate-500">Posts</div>
                </div>
                <div>
                  <div className="text-sm font-medium">
                    {formatDate(membership.joinedAt)}
                  </div>
                  <div className="text-xs text-slate-500">Joined</div>
                </div>
                <div>
                  <div className="text-sm font-medium">
                    {isOnline ? "🟢 Now" : timeAgo(profileUser.lastSeen)}
                  </div>
                  <div className="text-xs text-slate-500">Last Seen</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Posts */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold">Recent Posts</h2>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {recentPosts.length === 0 ? (
            <p className="px-6 py-4 text-sm text-slate-500">No posts yet.</p>
          ) : (
            recentPosts.map((post) => (
              <div key={post.id} className="px-6 py-3">
                <Link
                  href={`/thread/${post.threadId}`}
                  className="text-sm font-medium hover:text-blue-600 line-clamp-1"
                >
                  {post.thread.title}
                </Link>
                <div
                  className="text-xs text-slate-500 mt-1 line-clamp-2"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
                <p className="text-xs text-slate-400 mt-1">
                  {timeAgo(post.createdAt)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
