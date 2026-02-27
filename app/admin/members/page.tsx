import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { prisma } from "@/lib/prisma";
import { requireSiteMembership } from "@/lib/tenant";

export default async function AdminMembers() {
  const ctx = await requireSiteMembership("manage_members");
  if (!ctx) return notFound();
  const members = await prisma.siteMembership.findMany({ where: { siteId: ctx.site.id }, include: { user: true } });
  return <SiteShell site={ctx.site}><h2 className="text-xl font-bold mb-3">Members</h2><div className="space-y-2">{members.map((m)=><div key={m.id} className="border p-2 border-zinc-700 rounded">{m.user.username} — {m.role}</div>)}</div></SiteShell>;
}
