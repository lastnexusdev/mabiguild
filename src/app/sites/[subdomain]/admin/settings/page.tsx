import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import SettingsForm from "./SettingsForm";

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const site = await prisma.site.findUnique({ where: { subdomain } });
  if (!site) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Site Settings</h1>
      <div className="card p-6 max-w-2xl">
        <SettingsForm site={site} />
      </div>
    </div>
  );
}
