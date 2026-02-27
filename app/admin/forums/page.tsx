import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { prisma } from "@/lib/prisma";
import { requireSiteMembership } from "@/lib/tenant";

export default async function AdminForums() {
  const ctx = await requireSiteMembership("manage_forums");
  if (!ctx) return notFound();
  const forums = await prisma.forum.findMany({ where: { siteId: ctx.site.id }, include: { category: true } });
  return <SiteShell site={ctx.site}><h2 className="text-xl font-bold mb-3">Forums</h2><div className="space-y-2">{forums.map((f)=><div key={f.id} className="border p-2 border-zinc-700 rounded">{f.category.name} / {f.name}</div>)}</div></SiteShell>;
}
