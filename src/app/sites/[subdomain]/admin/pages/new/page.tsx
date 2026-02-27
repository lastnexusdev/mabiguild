import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import PageEditorForm from "../PageEditorForm";

export default async function NewPagePage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const site = await prisma.site.findUnique({ where: { subdomain } });
  if (!site) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">New Page</h1>
      <PageEditorForm siteId={site.id} />
    </div>
  );
}
