import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { timeAgo } from "@/lib/utils";

export default async function AdminAuditPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const site = await prisma.site.findUnique({ where: { subdomain } });
  if (!site) notFound();

  const logs = await prisma.auditLog.findMany({
    where: { siteId: site.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { actor: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Audit Log</h1>
      <div className="card">
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {logs.map((log) => (
            <div key={log.id} className="px-6 py-3 flex items-start justify-between gap-4">
              <div>
                <span className="font-medium text-sm">
                  {log.actor.username}
                </span>
                <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">
                  {log.action.replace(/_/g, " ")}
                </span>
                {log.targetType && log.targetId && (
                  <span className="text-xs text-slate-400 ml-1">
                    · {log.targetType} {log.targetId.slice(0, 8)}
                  </span>
                )}
                {log.metadata && (
                  <pre className="text-xs text-slate-500 mt-1 font-mono">
                    {log.metadata}
                  </pre>
                )}
              </div>
              <span className="text-xs text-slate-400 whitespace-nowrap">
                {timeAgo(log.createdAt)}
              </span>
            </div>
          ))}
          {logs.length === 0 && (
            <p className="px-6 py-8 text-center text-slate-500">
              No audit entries yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
