import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { getSiteFromRequest } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

export default async function UserProfilePage({ params }: { params: { username: string } }) {
  const site = await getSiteFromRequest();
  if (!site) return notFound();

  const membership = await prisma.siteMembership.findFirst({
    where: { siteId: site.id, user: { username: params.username } },
    include: { user: true }
  });
  if (!membership) return notFound();

  const postCount = await prisma.post.count({ where: { siteId: site.id, authorId: membership.userId } });

  return (
    <SiteShell site={site}>
      <h2 className="text-2xl font-bold">{membership.user.username}</h2>
      <p>Role: {membership.role}</p>
      <p>Joined: {membership.createdAt.toDateString()}</p>
      <p>Post count: {postCount}</p>
      <p>Bio: {membership.bio ?? "No bio"}</p>
    </SiteShell>
  );
}
