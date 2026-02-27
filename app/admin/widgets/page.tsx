import { notFound } from "next/navigation";
import { WidgetType } from "@prisma/client";
import { SiteLayout } from "@/components/site-layout";
import { prisma } from "@/lib/prisma";
import { getSiteMenus, requireSiteMembership } from "@/lib/tenant";

const widgetTypes: WidgetType[] = ["RECENT_THREADS", "ONLINE_MEMBERS", "SHOUTBOX", "SITE_STATS"];

export default async function AdminWidgetsPage() {
  const ctx = await requireSiteMembership("ADMIN");
  if (!ctx) return notFound();

  const [menus, rows] = await Promise.all([
    getSiteMenus(ctx.site.id),
    prisma.widgetPlacement.findMany({ where: { siteId: ctx.site.id }, orderBy: [{ column: "asc" }, { position: "asc" }] })
  ]);

  const map = new Map(rows.map((r) => [r.widget, r]));
  const initial = widgetTypes.map((type, idx) => {
    const row = map.get(type);
    return {
      widget: type,
      enabled: row?.enabled ?? true,
      column: row?.column ?? (idx % 3),
      position: row?.position ?? 0
    };
  });

  return (
    <SiteLayout site={ctx.site} menus={menus}>
      <h2 className="mb-4 text-2xl font-bold">Homepage Widgets</h2>
      <p className="mb-4 text-sm text-zinc-400">Enable/disable widgets and set column/position.</p>
      <WidgetEditor initial={initial} />
    </SiteLayout>
  );
}

function WidgetEditor({ initial }: { initial: { widget: WidgetType; enabled: boolean; column: number; position: number }[] }) {
  return (
    <form
      className="space-y-3"
      action={async (formData) => {
        "use server";
        const ctx = await requireSiteMembership("ADMIN");
        if (!ctx) return;

        const payload = initial.map((row) => ({
          widget: row.widget,
          enabled: formData.get(`enabled_${row.widget}`) === "on",
          column: Number(formData.get(`column_${row.widget}`) || 0),
          position: Number(formData.get(`position_${row.widget}`) || 0)
        }));

        for (const item of payload) {
          await prisma.widgetPlacement.upsert({
            where: { siteId_widget: { siteId: ctx.site.id, widget: item.widget } },
            update: { enabled: item.enabled, column: item.column, position: item.position },
            create: { siteId: ctx.site.id, widget: item.widget, enabled: item.enabled, column: item.column, position: item.position }
          });
        }
      }}
    >
      {initial.map((row) => (
        <div key={row.widget} className="grid gap-2 rounded border border-zinc-800 bg-zinc-900 p-3 md:grid-cols-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" name={`enabled_${row.widget}`} defaultChecked={row.enabled} />
            <span>{row.widget}</span>
          </label>
          <label className="text-sm">
            Column
            <input type="number" min={0} max={2} defaultValue={row.column} name={`column_${row.widget}`} className="w-full rounded border border-zinc-700 bg-zinc-950 p-2" />
          </label>
          <label className="text-sm">
            Position
            <input type="number" min={0} max={20} defaultValue={row.position} name={`position_${row.widget}`} className="w-full rounded border border-zinc-700 bg-zinc-950 p-2" />
          </label>
        </div>
      ))}
      <button className="rounded bg-sky-600 px-4 py-2">Save Layout</button>
    </form>
  );
}
