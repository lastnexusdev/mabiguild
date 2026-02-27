import { notFound, redirect } from "next/navigation";
import { SiteLayout } from "@/components/site-layout";
import { prisma } from "@/lib/prisma";
import { getSiteMenus, requireSiteMembership } from "@/lib/tenant";
import { updateSiteSchema } from "@/lib/validation";

export default async function AdminSettingsPage() {
  const ctx = await requireSiteMembership("ADMIN");
  if (!ctx) return notFound();
  const menus = await getSiteMenus(ctx.site.id);

  async function updateSettings(formData: FormData) {
    "use server";
    const secured = await requireSiteMembership("ADMIN");
    if (!secured) return;

    const parsed = updateSiteSchema.safeParse({
      name: formData.get("name"),
      description: formData.get("description"),
      bannerUrl: formData.get("bannerUrl"),
      homepageIntro: formData.get("homepageIntro")
    });
    if (!parsed.success) return;

    await prisma.site.update({
      where: { id: secured.site.id },
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
        bannerUrl: parsed.data.bannerUrl || null,
        homepageIntro: parsed.data.homepageIntro || null
      }
    });

    await prisma.auditLog.create({
      data: {
        siteId: secured.site.id,
        actorUserId: secured.user.id,
        action: "site.settings.updated"
      }
    });

    redirect("/admin/settings");
  }

  return (
    <SiteLayout site={ctx.site} menus={menus}>
      <h2 className="mb-4 text-2xl font-bold">Site Settings</h2>
      <form action={updateSettings} className="space-y-3 rounded border border-zinc-800 bg-zinc-900 p-4">
        <input name="name" defaultValue={ctx.site.name} className="w-full rounded border border-zinc-700 bg-zinc-950 p-2" />
        <input
          name="description"
          defaultValue={ctx.site.description || ""}
          placeholder="Description"
          className="w-full rounded border border-zinc-700 bg-zinc-950 p-2"
        />
        <input
          name="bannerUrl"
          defaultValue={ctx.site.bannerUrl || ""}
          placeholder="Banner image URL"
          className="w-full rounded border border-zinc-700 bg-zinc-950 p-2"
        />
        <textarea
          name="homepageIntro"
          defaultValue={ctx.site.homepageIntro || ""}
          placeholder="Homepage intro"
          className="h-32 w-full rounded border border-zinc-700 bg-zinc-950 p-2"
        />
        <button className="rounded bg-sky-600 px-4 py-2 text-white">Save</button>
      </form>
    </SiteLayout>
  );
}
