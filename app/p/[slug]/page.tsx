import { notFound } from "next/navigation";
import { SiteLayout } from "@/components/site-layout";
import { markdownToHtml } from "@/lib/markdown";
import { prisma } from "@/lib/prisma";
import { getSiteFromRequest, getSiteMenus, requireSiteMembership } from "@/lib/tenant";

export default async function SitePageBySlug({ params }: { params: { slug: string } }) {
  const site = await getSiteFromRequest();
  if (!site) return notFound();

  const adminCtx = await requireSiteMembership("ADMIN");
  const page = await prisma.page.findFirst({
    where: {
      siteId: site.id,
      slug: params.slug,
      ...(adminCtx ? {} : { isPublished: true })
    }
  });

  if (!page) return notFound();

  const menus = await getSiteMenus(site.id);

  return (
    <SiteLayout site={site} menus={menus}>
      <article className="prose prose-invert max-w-none rounded border border-zinc-800 bg-zinc-900 p-5">
        <h1>{page.title}</h1>
        {!page.isPublished ? <p className="text-yellow-400">Draft preview (admin only)</p> : null}
        <div dangerouslySetInnerHTML={{ __html: markdownToHtml(page.content) }} />
      </article>
    </SiteLayout>
  );
}
