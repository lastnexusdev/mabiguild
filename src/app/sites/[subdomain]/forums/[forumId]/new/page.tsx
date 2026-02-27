import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { validateRequest } from "@/lib/auth";
import NewThreadForm from "./NewThreadForm";

export default async function NewThreadPage({
  params,
}: {
  params: Promise<{ subdomain: string; forumId: string }>;
}) {
  const { subdomain, forumId } = await params;
  const { user } = await validateRequest();
  if (!user) redirect("/login");

  const site = await prisma.site.findUnique({ where: { subdomain } });
  if (!site) notFound();

  const forum = await prisma.forum.findFirst({
    where: { id: forumId, siteId: site.id },
  });
  if (!forum || forum.isLocked) notFound();

  const membership = await prisma.siteMembership.findUnique({
    where: { userId_siteId: { userId: user.id, siteId: site.id } },
  });
  if (!membership || membership.isBanned) redirect("/forums");

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-6">New Thread in {forum.name}</h1>
      <NewThreadForm siteId={site.id} forumId={forum.id} />
    </div>
  );
}
