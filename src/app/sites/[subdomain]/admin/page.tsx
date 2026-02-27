import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { timeAgo } from "@/lib/utils";

export default async function AdminOverviewPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;

  const site = await prisma.site.findUnique({ where: { subdomain } });
  if (!site) notFound();

  const [memberCount, threadCount, postCount, recentAudit] = await Promise.all([
    prisma.siteMembership.count({ where: { siteId: site.id } }),
    prisma.thread.count({ where: { siteId: site.id } }),
    prisma.post.count({ where: { siteId: site.id, isDeleted: false } }),
    prisma.auditLog.findMany({
      where: { siteId: site.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { actor: true },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Overview</h1>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-blue-600">{memberCount}</div>
          <div className="text-sm text-slate-500 mt-1">Members</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-green-600">{threadCount}</div>
          <div className="text-sm text-slate-500 mt-1">Threads</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-purple-600">{postCount}</div>
          <div className="text-sm text-slate-500 mt-1">Posts</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold">Recent Activity</h2>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {recentAudit.map((log) => (
            <div key={log.id} className="px-6 py-3 flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">
                  {log.actor.username}
                </span>
                <span className="text-sm text-slate-500 ml-2">
                  {log.action.replace(/_/g, " ")}
                </span>
                {log.targetId && (
                  <span className="text-xs text-slate-400 ml-1">
                    ({log.targetType} #{log.targetId.slice(0, 8)})
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400">
                {timeAgo(log.createdAt)}
              </span>
            </div>
          ))}
          {recentAudit.length === 0 && (
            <p className="px-6 py-4 text-sm text-slate-500">No activity yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
