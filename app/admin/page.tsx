import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteLayout } from "@/components/site-layout";
import { getSiteMenus, requireSiteMembership } from "@/lib/tenant";

export default async function AdminHomePage() {
  const ctx = await requireSiteMembership("ADMIN");
  if (!ctx) return notFound();

  const menus = await getSiteMenus(ctx.site.id);

  return (
    <SiteLayout site={ctx.site} menus={menus}>
      <h2 className="mb-4 text-2xl font-bold">Admin</h2>
      <div className="grid gap-3 md:grid-cols-3">
        <Link href="/admin/settings" className="rounded border border-zinc-800 bg-zinc-900 p-4">
          Site Settings
        </Link>
        <Link href="/admin/pages" className="rounded border border-zinc-800 bg-zinc-900 p-4">
          CMS Pages
        </Link>
        <Link href="/admin/menus" className="rounded border border-zinc-800 bg-zinc-900 p-4">
          Nav Menus
        </Link>
      </div>
    </SiteLayout>
  );
}
