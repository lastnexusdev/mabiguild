import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import PageEditorForm from "../../PageEditorForm";

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ subdomain: string; pageId: string }>;
}) {
  const { subdomain, pageId } = await params;
  const site = await prisma.site.findUnique({ where: { subdomain } });
  if (!site) notFound();

  const page = await prisma.page.findFirst({
    where: { id: pageId, siteId: site.id },
  });
  if (!page) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Edit Page</h1>
      <PageEditorForm siteId={site.id} page={page} />
    </div>
  );
}
