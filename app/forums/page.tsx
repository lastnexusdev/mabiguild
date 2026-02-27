import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteLayout } from "@/components/site-layout";
import { prisma } from "@/lib/prisma";
import { getSiteFromRequest, getSiteMenus } from "@/lib/tenant";

export default async function ForumsPage({ searchParams }: { searchParams: { q?: string } }) {
  const site = await getSiteFromRequest();
  if (!site) return notFound();

  const menus = await getSiteMenus(site.id);
  const q = searchParams.q?.trim();

  const categories = await prisma.forumCategory.findMany({
    where: { siteId: site.id },
    orderBy: { position: "asc" },
    include: {
      forums: {
        orderBy: { position: "asc" },
        include: {
          threads: q
            ? {
                where: {
                  OR: [{ title: { contains: q, mode: "insensitive" } }, { posts: { some: { body: { contains: q, mode: "insensitive" } } } }]
                },
                orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
                take: 10
              }
            : { orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }], take: 5 }
        }
      }
    }
  });

  return (
    <SiteLayout site={site} menus={menus}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Forums</h2>
        <form className="flex gap-2" method="get">
          <input name="q" defaultValue={q || ""} className="rounded border border-zinc-700 bg-zinc-900 p-2 text-sm" placeholder="Search threads/posts" />
          <button className="rounded bg-zinc-800 px-3 text-sm">Search</button>
        </form>
      </div>

      <div className="space-y-4">
        {categories.map((category) => (
          <section key={category.id} className="rounded border border-zinc-800 bg-zinc-900">
            <header className="border-b border-zinc-800 p-3 font-semibold">{category.name}</header>
            <div className="divide-y divide-zinc-800">
              {category.forums.map((forum) => (
                <div key={forum.id} className="p-3">
                  <Link href={`/forums/${forum.id}`} className="font-semibold">
                    {forum.name}
                  </Link>
                  <p className="text-sm text-zinc-400">{forum.description}</p>
                  {forum.threads.length ? (
                    <ul className="mt-2 space-y-1 text-sm">
                      {forum.threads.map((thread) => (
                        <li key={thread.id}>
                          <Link href={`/thread/${thread.id}`}>{thread.pinned ? "📌 " : ""}{thread.title}</Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </SiteLayout>
  );
}
