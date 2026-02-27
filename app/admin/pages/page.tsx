import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteLayout } from "@/components/site-layout";
import { prisma } from "@/lib/prisma";
import { getSiteMenus, requireSiteMembership } from "@/lib/tenant";
import { createPageSchema } from "@/lib/validation";

export default async function AdminPagesPage() {
  const ctx = await requireSiteMembership("ADMIN");
  if (!ctx) return notFound();

  const [menus, pages] = await Promise.all([
    getSiteMenus(ctx.site.id),
    prisma.page.findMany({ where: { siteId: ctx.site.id }, orderBy: { updatedAt: "desc" } })
  ]);

  async function createPage(formData: FormData) {
    "use server";
    const secured = await requireSiteMembership("ADMIN");
    if (!secured) return;

    const parsed = createPageSchema.safeParse({
      title: formData.get("title"),
      slug: formData.get("slug"),
      content: formData.get("content"),
      isPublished: formData.get("isPublished") === "on"
    });
    if (!parsed.success) return;

    await prisma.page.create({
      data: {
        siteId: secured.site.id,
        title: parsed.data.title,
        slug: parsed.data.slug,
        content: parsed.data.content,
        isPublished: parsed.data.isPublished
      }
    });

    await prisma.auditLog.create({
      data: {
        siteId: secured.site.id,
        actorUserId: secured.user.id,
        action: "page.created",
        metadata: { slug: parsed.data.slug, isPublished: parsed.data.isPublished }
      }
    });

    redirect("/admin/pages");
  }

  return (
    <SiteLayout site={ctx.site} menus={menus}>
      <h2 className="mb-4 text-2xl font-bold">CMS Pages</h2>

      <form action={createPage} className="mb-8 space-y-3 rounded border border-zinc-800 bg-zinc-900 p-4">
        <input name="title" placeholder="Title" className="w-full rounded border border-zinc-700 bg-zinc-950 p-2" />
        <input name="slug" placeholder="slug" className="w-full rounded border border-zinc-700 bg-zinc-950 p-2" />
        <textarea
          name="content"
          placeholder="Markdown content"
          className="h-48 w-full rounded border border-zinc-700 bg-zinc-950 p-2"
        />
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input type="checkbox" name="isPublished" /> Published
        </label>
        <button className="rounded bg-sky-600 px-4 py-2 text-white">Save Page</button>
      </form>

      <div className="space-y-2">
        {pages.map((page) => (
          <article key={page.id} className="rounded border border-zinc-800 bg-zinc-900 p-3">
            <p className="font-semibold">{page.title}</p>
            <p className="text-sm text-zinc-400">/{page.slug} — {page.isPublished ? "Published" : "Draft"}</p>
            <Link href={`/p/${page.slug}`} className="text-sm">
              Open
            </Link>
          </article>
        ))}
      </div>
    </SiteLayout>
  );
}
