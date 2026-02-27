import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import DeletePageButton from "./DeletePageButton";

export default async function AdminPagesPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const site = await prisma.site.findUnique({ where: { subdomain } });
  if (!site) notFound();

  const pages = await prisma.page.findMany({
    where: { siteId: site.id },
    orderBy: { sortOrder: "asc" },
    include: { author: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">CMS Pages</h1>
        <Link href="/admin/pages/new" className="btn-primary btn">
          + New Page
        </Link>
      </div>

      <div className="card">
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {pages.length === 0 ? (
            <p className="px-6 py-8 text-center text-slate-500">
              No pages yet.
            </p>
          ) : (
            pages.map((p) => (
              <div key={p.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{p.title}</span>
                    <span
                      className={`badge text-xs ${
                        p.status === "PUBLISHED"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">
                    /{p.slug} · by {p.author.username} · {formatDate(p.updatedAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/p/${p.slug}`}
                    className="btn-secondary btn-sm btn"
                    target="_blank"
                  >
                    View
                  </Link>
                  <Link
                    href={`/admin/pages/${p.id}/edit`}
                    className="btn-secondary btn-sm btn"
                  >
                    Edit
                  </Link>
                  <DeletePageButton pageId={p.id} siteId={site.id} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
