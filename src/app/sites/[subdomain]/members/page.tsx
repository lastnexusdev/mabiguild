import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { formatDate, timeAgo } from "@/lib/utils";

export default async function MembersPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;

  const site = await prisma.site.findUnique({ where: { subdomain } });
  if (!site) notFound();

  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);

  const memberships = await prisma.siteMembership.findMany({
    where: { siteId: site.id, isBanned: false },
    orderBy: { joinedAt: "asc" },
    include: {
      user: true,
      userRoles: {
        include: { role: true },
        orderBy: { role: { sortOrder: "asc" } },
      },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          Members ({memberships.length})
        </h1>
      </div>

      <div className="card">
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {memberships.map(({ user, role, userRoles, joinedAt }) => {
            const isOnline = user.lastSeen >= fiveMinAgo;
            return (
              <div
                key={user.id}
                className="flex items-center gap-4 px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                    {(user.displayName ?? user.username)[0]?.toUpperCase()}
                  </div>
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/u/${user.username}`}
                    className="font-medium hover:text-blue-600"
                  >
                    {user.displayName ?? user.username}
                  </Link>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`badge text-xs ${
                        role === "OWNER"
                          ? "bg-yellow-100 text-yellow-800"
                          : role === "ADMIN"
                          ? "bg-purple-100 text-purple-800"
                          : role === "MODERATOR"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {role}
                    </span>
                    {userRoles.map(({ role: r }) => (
                      <span
                        key={r.id}
                        className="badge text-xs"
                        style={{
                          backgroundColor: r.color + "20",
                          color: r.color,
                        }}
                      >
                        {r.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right text-sm text-slate-500">
                  <div>{isOnline ? "🟢 Online" : timeAgo(user.lastSeen)}</div>
                  <div className="text-xs">Joined {formatDate(joinedAt)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
