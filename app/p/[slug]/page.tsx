import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { getSiteFromRequest, requireSiteMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

export default async function CmsPage({ params }: { params: { slug: string } }) {
  const site = await getSiteFromRequest();
  if (!site) return notFound();

  const admin = await requireSiteMembership("manage_pages");
  const page = await prisma.page.findFirst({ where: { siteId: site.id, slug: params.slug, ...(admin ? {} : { published: true }) } });
  if (!page) return notFound();

  return (
    <SiteShell site={site}>
      <article className="prose prose-invert max-w-none">
        <h1>{page.title}</h1>
        <pre className="whitespace-pre-wrap">{page.content}</pre>
      </article>
    </SiteShell>
  );
}
