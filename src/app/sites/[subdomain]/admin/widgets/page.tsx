import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import AdminWidgetsClient from "./AdminWidgetsClient";

export default async function AdminWidgetsPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const site = await prisma.site.findUnique({ where: { subdomain } });
  if (!site) notFound();

  const widgets = await prisma.widgetPlacement.findMany({
    where: { siteId: site.id },
    orderBy: [{ column: "asc" }, { sortOrder: "asc" }],
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Manage Widgets</h1>
      <p className="text-slate-500 mb-6">
        Configure which widgets appear in each column on your homepage.
      </p>
      <AdminWidgetsClient siteId={site.id} widgets={widgets} />
    </div>
  );
}
