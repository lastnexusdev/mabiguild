import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { requireSiteMembership } from "@/lib/tenant";

export default async function AdminPage() {
  const ctx = await requireSiteMembership("manage_site");
  if (!ctx) return notFound();

  return (
    <SiteShell site={ctx.site}>
      <h2 className="text-2xl font-bold mb-4">Admin Panel</h2>
      <div className="grid md:grid-cols-2 gap-3">
        {[
          ["Settings", "/admin/settings"],
          ["Pages", "/admin/pages"],
          ["Forums", "/admin/forums"],
          ["Members", "/admin/members"],
          ["Roles", "/admin/roles"],
          ["Widgets", "/admin/widgets"],
          ["Menus", "/admin/menus"]
        ].map(([label, href]) => (
          <Link key={href} href={href} className="border border-zinc-800 rounded p-3 bg-zinc-900">{label}</Link>
        ))}
      </div>
    </SiteShell>
  );
}
