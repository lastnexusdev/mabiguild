import { notFound, redirect } from "next/navigation";
import { SiteLayout } from "@/components/site-layout";
import { prisma } from "@/lib/prisma";
import { getSiteMenus, requireSiteMembership } from "@/lib/tenant";

export default async function AdminForumsPage() {
  const ctx = await requireSiteMembership("ADMIN");
  if (!ctx) return notFound();

  const [menus, categories] = await Promise.all([
    getSiteMenus(ctx.site.id),
    prisma.forumCategory.findMany({ where: { siteId: ctx.site.id }, include: { forums: { orderBy: { position: "asc" } } }, orderBy: { position: "asc" } })
  ]);

  async function createCategory(formData: FormData) {
    "use server";
    const secured = await requireSiteMembership("ADMIN");
    if (!secured) return;
    const name = String(formData.get("name") || "").trim();
    if (!name) return;
    const position = await prisma.forumCategory.count({ where: { siteId: secured.site.id } });
    await prisma.forumCategory.create({ data: { siteId: secured.site.id, name, position } });
    redirect("/admin/forums");
  }

  async function createForum(formData: FormData) {
    "use server";
    const secured = await requireSiteMembership("ADMIN");
    if (!secured) return;
    const categoryId = String(formData.get("categoryId") || "");
    const name = String(formData.get("name") || "").trim();
    const description = String(formData.get("description") || "").trim();
    if (!categoryId || !name) return;

    const category = await prisma.forumCategory.findFirst({ where: { id: categoryId, siteId: secured.site.id } });
    if (!category) return;

    const position = await prisma.forum.count({ where: { siteId: secured.site.id, categoryId } });
    await prisma.forum.create({ data: { siteId: secured.site.id, categoryId, name, description: description || null, position } });
    redirect("/admin/forums");
  }

  return (
    <SiteLayout site={ctx.site} menus={menus}>
      <h2 className="mb-4 text-2xl font-bold">Forum Management</h2>

      <form action={createCategory} className="mb-4 flex gap-2 rounded border border-zinc-800 bg-zinc-900 p-3">
        <input name="name" placeholder="New category" className="flex-1 rounded border border-zinc-700 bg-zinc-950 p-2" />
        <button className="rounded bg-sky-600 px-3">Create Category</button>
      </form>

      <form action={createForum} className="mb-6 grid gap-2 rounded border border-zinc-800 bg-zinc-900 p-3 md:grid-cols-4">
        <select name="categoryId" className="rounded border border-zinc-700 bg-zinc-950 p-2">
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        <input name="name" placeholder="Forum name" className="rounded border border-zinc-700 bg-zinc-950 p-2" />
        <input name="description" placeholder="Description" className="rounded border border-zinc-700 bg-zinc-950 p-2" />
        <button className="rounded bg-sky-600 px-3">Create Forum</button>
      </form>

      <div className="space-y-4">
        {categories.map((category) => (
          <section key={category.id} className="rounded border border-zinc-800 bg-zinc-900 p-3">
            <h3 className="font-semibold">{category.name}</h3>
            <ul className="mt-2 space-y-1 text-sm text-zinc-300">
              {category.forums.map((forum) => <li key={forum.id}>{forum.name} — {forum.description}</li>)}
            </ul>
          </section>
        ))}
      </div>
    </SiteLayout>
  );
}
