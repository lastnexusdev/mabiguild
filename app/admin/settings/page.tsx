import { notFound, redirect } from "next/navigation";
import { SiteLayout } from "@/components/site-layout";
import { prisma } from "@/lib/prisma";
import { getSiteMenus, requireSiteMembership } from "@/lib/tenant";
import { updateSiteSchema } from "@/lib/validation";

export default async function AdminSettingsPage() {
  const ctx = await requireSiteMembership("ADMIN");
  if (!ctx) return notFound();
  const menus = await getSiteMenus(ctx.site.id);

  const thresholds = (ctx.site.rankThresholds as Record<string, number> | null) || {
    member: 0,
    moderator: 50,
    admin: 200,
    owner: 500
  };

  async function updateSettings(formData: FormData) {
    "use server";
    const secured = await requireSiteMembership("ADMIN");
    if (!secured) return;

    const parsed = updateSiteSchema.safeParse({
      name: formData.get("name"),
      description: formData.get("description"),
      bannerUrl: formData.get("bannerUrl"),
      homepageIntro: formData.get("homepageIntro"),
      autoRankEnabled: formData.get("autoRankEnabled") === "on",
      rankMember: Number(formData.get("rankMember") || 0),
      rankModerator: Number(formData.get("rankModerator") || 50),
      rankAdmin: Number(formData.get("rankAdmin") || 200),
      rankOwner: Number(formData.get("rankOwner") || 500)
    });
    if (!parsed.success) return;

    await prisma.site.update({
      where: { id: secured.site.id },
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
        bannerUrl: parsed.data.bannerUrl || null,
        homepageIntro: parsed.data.homepageIntro || null,
        autoRankEnabled: parsed.data.autoRankEnabled,
        rankThresholds: {
          member: parsed.data.rankMember,
          moderator: parsed.data.rankModerator,
          admin: parsed.data.rankAdmin,
          owner: parsed.data.rankOwner
        }
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

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="autoRankEnabled" defaultChecked={ctx.site.autoRankEnabled} /> Enable auto-rank by post count
        </label>

        <div className="grid gap-2 md:grid-cols-4">
          <input name="rankMember" type="number" defaultValue={thresholds.member ?? 0} className="rounded border border-zinc-700 bg-zinc-950 p-2" placeholder="MEMBER" />
          <input name="rankModerator" type="number" defaultValue={thresholds.moderator ?? 50} className="rounded border border-zinc-700 bg-zinc-950 p-2" placeholder="MODERATOR" />
          <input name="rankAdmin" type="number" defaultValue={thresholds.admin ?? 200} className="rounded border border-zinc-700 bg-zinc-950 p-2" placeholder="ADMIN" />
          <input name="rankOwner" type="number" defaultValue={thresholds.owner ?? 500} className="rounded border border-zinc-700 bg-zinc-950 p-2" placeholder="OWNER" />
        </div>

        <button className="rounded bg-sky-600 px-4 py-2 text-white">Save</button>
      </form>
    </SiteLayout>
  );
}
