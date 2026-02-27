import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { prisma } from "@/lib/prisma";
import { requireSiteMembership } from "@/lib/tenant";

export default async function AdminRoles() {
  const ctx = await requireSiteMembership("manage_roles");
  if (!ctx) return notFound();
  const roles = await prisma.role.findMany({ where: { siteId: ctx.site.id }, include: { permissions: { include: { permission: true } } } });
  return <SiteShell site={ctx.site}><h2 className="text-xl font-bold mb-3">Roles</h2><div className="space-y-2">{roles.map((r)=><div key={r.id} className="border p-2 border-zinc-700 rounded">{r.name} — {r.permissions.map((p)=>p.permission.key).join(", ")}</div>)}</div></SiteShell>;
}
