import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { getSiteFromRequest } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

export default async function ForumsPage() {
  const site = await getSiteFromRequest();
  if (!site) return notFound();

  const categories = await prisma.forumCategory.findMany({
    where: { siteId: site.id },
    orderBy: { order: "asc" },
    include: { forums: { orderBy: { order: "asc" } } }
  });

  return (
    <SiteShell site={site}>
      <h2 className="text-2xl font-bold mb-4">Forums</h2>
      <div className="space-y-4">
        {categories.map((cat) => (
          <section key={cat.id} className="border border-zinc-800 rounded">
            <header className="p-3 bg-zinc-900 font-semibold">{cat.name}</header>
            {cat.forums.map((forum) => (
              <Link key={forum.id} href={`/forums/${forum.id}`} className="block p-3 border-t border-zinc-800">
                <div>{forum.name}</div>
                <div className="text-zinc-400 text-sm">{forum.description}</div>
              </Link>
            ))}
          </section>
        ))}
      </div>
    </SiteShell>
  );
}
