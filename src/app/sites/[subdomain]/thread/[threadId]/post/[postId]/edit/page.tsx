import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { validateRequest } from "@/lib/auth";
import EditPostForm from "./EditPostForm";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{
    subdomain: string;
    threadId: string;
    postId: string;
  }>;
}) {
  const { subdomain, threadId, postId } = await params;
  const { user } = await validateRequest();
  if (!user) redirect("/login");

  const site = await prisma.site.findUnique({ where: { subdomain } });
  if (!site) notFound();

  const post = await prisma.post.findFirst({
    where: { id: postId, siteId: site.id, threadId, isDeleted: false },
    include: { thread: true },
  });
  if (!post) notFound();

  // Only the author can edit their own posts
  if (post.authorId !== user.id) {
    redirect(`/thread/${threadId}`);
  }

  // Can't edit posts in locked threads
  if (post.thread.isLocked) {
    redirect(`/thread/${threadId}`);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-2">Edit Post</h1>
      <p className="text-sm text-slate-500 mb-6">
        In thread:{" "}
        <a href={`/thread/${threadId}`} className="text-blue-600 hover:underline">
          {post.thread.title}
        </a>
      </p>
      <EditPostForm
        postId={post.id}
        siteId={site.id}
        threadId={threadId}
        initialContent={post.content}
      />
    </div>
  );
}
