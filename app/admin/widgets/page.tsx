import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { prisma } from "@/lib/prisma";
import { requireSiteMembership } from "@/lib/tenant";

export default async function AdminWidgets() {
  const ctx = await requireSiteMembership("manage_widgets");
  if (!ctx) return notFound();
  const widgets = await prisma.widgetPlacement.findMany({ where: { siteId: ctx.site.id }, orderBy: [{ column: "asc" }, { position: "asc" }] });
  return <SiteShell site={ctx.site}><h2 className="text-xl font-bold mb-3">Widgets</h2><div className="space-y-2">{widgets.map((w)=><div key={w.id} className="border p-2 border-zinc-700 rounded">col {w.column} / pos {w.position} — {w.title}</div>)}</div></SiteShell>;
}
