import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { requireSiteMembership } from "@/lib/tenant";

export default async function AdminSettings() {
  const ctx = await requireSiteMembership("manage_site");
  if (!ctx) return notFound();
  return (
    <SiteShell site={ctx.site}>
      <h2 className="text-xl font-bold mb-3">Settings</h2>
      <p>Name: {ctx.site.name}</p>
      <p>Description: {ctx.site.description}</p>
      <p>Theme: {ctx.site.theme}</p>
    </SiteShell>
  );
}
