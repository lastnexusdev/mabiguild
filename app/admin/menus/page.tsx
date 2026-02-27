import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { prisma } from "@/lib/prisma";
import { requireSiteMembership } from "@/lib/tenant";

export default async function AdminMenus() {
  const ctx = await requireSiteMembership("manage_site");
  if (!ctx) return notFound();
  const menus = await prisma.menu.findMany({ where: { siteId: ctx.site.id }, include: { items: true } });
  return <SiteShell site={ctx.site}><h2 className="text-xl font-bold mb-3">Menus</h2><div className="space-y-2">{menus.map((m)=><div key={m.id} className="border p-2 border-zinc-700 rounded">{m.name} ({m.items.length} items)</div>)}</div></SiteShell>;
}
