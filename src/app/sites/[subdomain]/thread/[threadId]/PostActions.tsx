"use client";

import { useState } from "react";

interface Props {
  post: {
    id: string;
    authorId: string;
    siteId: string;
    threadId: string;
  };
  currentUserId?: string;
  isMod: boolean;
  isLocked: boolean;
}

export default function PostActions({
  post,
  currentUserId,
  isMod,
  isLocked,
}: Props) {
  const [deleting, setDeleting] = useState(false);

  const isAuthor = currentUserId === post.authorId;
  const canDelete = isMod || isAuthor;
  const canEdit = isAuthor && !isLocked;

  if (!canDelete && !canEdit) return null;

  const handleDelete = async () => {
    if (!confirm("Delete this post?")) return;
    setDeleting(true);
    try {
      await fetch(`/api/sites/${post.siteId}/posts/${post.id}`, {
        method: "DELETE",
      });
      window.location.reload();
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div className="flex gap-1">
      {canEdit && (
        <a
          href={`/thread/${post.threadId}/post/${post.id}/edit`}
          className="text-xs text-slate-400 hover:text-blue-600"
        >
          Edit
        </a>
      )}
      {canDelete && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs text-slate-400 hover:text-red-600"
        >
          {deleting ? "..." : "Delete"}
        </button>
      )}
    </div>
  );
}
