"use client";

import { useActionState, useState } from "react";
import { editPostAction } from "./actions";
import RichEditor from "@/components/RichEditor";

const initialState = { error: "" };

export default function EditPostForm({
  postId,
  siteId,
  threadId,
  initialContent,
}: {
  postId: string;
  siteId: string;
  threadId: string;
  initialContent: string;
}) {
  const [content, setContent] = useState(initialContent);
  const [state, formAction, pending] = useActionState(
    editPostAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="siteId" value={siteId} />
      <input type="hidden" name="threadId" value={threadId} />
      <input type="hidden" name="content" value={content} />

      {state.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded px-4 py-3 text-sm">
          {state.error}
        </div>
      )}

      <RichEditor content={content} onChange={setContent} />

      <div className="flex gap-3">
        <button type="submit" disabled={pending || !content.trim()} className="btn-primary btn">
          {pending ? "Saving..." : "Save Changes"}
        </button>
        <a href={`/thread/${threadId}`} className="btn-secondary btn">
          Cancel
        </a>
      </div>
    </form>
  );
}
