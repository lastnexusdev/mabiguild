import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { prisma } from "@/lib/prisma";
import { requireSiteMembership } from "@/lib/tenant";

export default async function AdminPages() {
  const ctx = await requireSiteMembership("manage_pages");
  if (!ctx) return notFound();

  const pages = await prisma.page.findMany({ where: { siteId: ctx.site.id }, orderBy: { updatedAt: "desc" } });
  return <SiteShell site={ctx.site}><h2 className="text-xl font-bold mb-3">Pages</h2><div className="space-y-2">{pages.map((p)=><div key={p.id} className="border p-2 border-zinc-700 rounded">{p.title} ({p.slug}) {p.published?"Published":"Draft"}</div>)}</div></SiteShell>;
}
