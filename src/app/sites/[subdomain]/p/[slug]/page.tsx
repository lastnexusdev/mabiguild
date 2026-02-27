import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { validateRequest } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

export default async function CmsPage({
  params,
}: {
  params: Promise<{ subdomain: string; slug: string }>;
}) {
  const { subdomain, slug } = await params;

  const site = await prisma.site.findUnique({ where: { subdomain } });
  if (!site) notFound();

  const { user } = await validateRequest();

  const membership = user
    ? await prisma.siteMembership.findUnique({
        where: { userId_siteId: { userId: user.id, siteId: site.id } },
      })
    : null;

  const isMod =
    membership?.role === "OWNER" ||
    membership?.role === "ADMIN" ||
    membership?.role === "MODERATOR";

  const page = await prisma.page.findFirst({
    where: {
      siteId: site.id,
      slug,
      ...(isMod ? {} : { status: "PUBLISHED" }),
    },
    include: { author: true },
  });

  if (!page) notFound();

  return (
    <article className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{page.title}</h1>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span>By {page.author.displayName ?? page.author.username}</span>
          <span>·</span>
          <span>{formatDate(page.updatedAt)}</span>
          {page.status === "DRAFT" && (
            <span className="badge bg-yellow-100 text-yellow-700">Draft</span>
          )}
        </div>
      </div>
      <div
        className="prose-content"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </article>
  );
}
