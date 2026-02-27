import { notFound, redirect } from "next/navigation";
import { SiteLayout } from "@/components/site-layout";
import { prisma } from "@/lib/prisma";
import { getSiteMenus, requireSiteMembership } from "@/lib/tenant";
import { createMenuSchema } from "@/lib/validation";

export default async function AdminMenusPage() {
  const ctx = await requireSiteMembership("ADMIN");
  if (!ctx) return notFound();

  const menus = await getSiteMenus(ctx.site.id);

  async function createMenu(formData: FormData) {
    "use server";
    const secured = await requireSiteMembership("ADMIN");
    if (!secured) return;

    const parsed = createMenuSchema.safeParse({
      label: formData.get("label"),
      url: formData.get("url")
    });
    if (!parsed.success) return;

    const position = await prisma.menu.count({ where: { siteId: secured.site.id } });
    await prisma.menu.create({
      data: {
        siteId: secured.site.id,
        label: parsed.data.label,
        url: parsed.data.url,
        position
      }
    });

    await prisma.auditLog.create({
      data: {
        siteId: secured.site.id,
        actorUserId: secured.user.id,
        action: "menu.created",
        metadata: parsed.data
      }
    });

    redirect("/admin/menus");
  }

  return (
    <SiteLayout site={ctx.site} menus={menus}>
      <h2 className="mb-4 text-2xl font-bold">Manage Menus</h2>
      <form action={createMenu} className="mb-6 grid gap-2 rounded border border-zinc-800 bg-zinc-900 p-4 md:grid-cols-3">
        <input name="label" placeholder="Label" className="rounded border border-zinc-700 bg-zinc-950 p-2" />
        <input name="url" placeholder="URL (e.g. /p/about)" className="rounded border border-zinc-700 bg-zinc-950 p-2" />
        <button className="rounded bg-sky-600 px-4 py-2 text-white">Add Menu Item</button>
      </form>

      <ul className="space-y-2">
        {menus.map((item) => (
          <li key={item.id} className="rounded border border-zinc-800 bg-zinc-900 p-3 text-sm">
            #{item.position} — {item.label} → {item.url}
          </li>
        ))}
      </ul>
    </SiteLayout>
  );
}
