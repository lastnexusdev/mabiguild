import { prisma } from "@/lib/db";
import { timeAgo } from "@/lib/utils";
import type { WidgetPlacement } from "@prisma/client";
import Link from "next/link";
import ShoutboxWidget from "./ShoutboxWidget";

export default async function WidgetColumn({
  widget,
  siteId,
  userId,
}: {
  widget: WidgetPlacement;
  siteId: string;
  userId?: string;
}) {
  if (widget.widgetType === "shoutbox") {
    return <ShoutboxWidget siteId={siteId} userId={userId} />;
  }

  if (widget.widgetType === "recent_threads") {
    const threads = await prisma.thread.findMany({
      where: { siteId },
      orderBy: { lastPostAt: "desc" },
      take: 8,
      include: { author: true, forum: true },
    });

    return (
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-sm">Recent Threads</h3>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {threads.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">No threads yet.</p>
          ) : (
            threads.map((t) => (
              <div key={t.id} className="px-4 py-2.5">
                <Link
                  href={`/thread/${t.id}`}
                  className="text-sm font-medium hover:text-blue-600 line-clamp-1"
                >
                  {t.title}
                </Link>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t.forum.name} · {timeAgo(t.lastPostAt)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (widget.widgetType === "members_online") {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const online = await prisma.siteMembership.count({
      where: {
        siteId,
        user: { lastSeen: { gte: fiveMinAgo } },
      },
    });
    const totalMembers = await prisma.siteMembership.count({ where: { siteId } });

    return (
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-sm">Members Online</h3>
        </div>
        <div className="card-body">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm">
              <strong>{online}</strong> online · {totalMembers} total members
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (widget.widgetType === "text") {
    let config: { title?: string; content?: string } = {};
    try {
      config = JSON.parse(widget.config);
    } catch {
      // ignore
    }
    return (
      <div className="card">
        {config.title && (
          <div className="card-header">
            <h3 className="font-semibold text-sm">{config.title}</h3>
          </div>
        )}
        <div className="card-body prose-content text-sm">
          <div dangerouslySetInnerHTML={{ __html: config.content ?? "" }} />
        </div>
      </div>
    );
  }

  return null;
}
