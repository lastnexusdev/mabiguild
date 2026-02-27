"use client";

import { useActionState, useState } from "react";
import { replyAction } from "./actions";
import RichEditor from "@/components/RichEditor";

const initialState = { error: "" };

export default function ReplyForm({
  siteId,
  threadId,
  forumId,
}: {
  siteId: string;
  threadId: string;
  forumId: string;
}) {
  const [content, setContent] = useState("");
  const [state, formAction, pending] = useActionState(replyAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="siteId" value={siteId} />
      <input type="hidden" name="threadId" value={threadId} />
      <input type="hidden" name="forumId" value={forumId} />
      <input type="hidden" name="content" value={content} />

      {state.error && (
        <div className="text-red-600 text-sm">{state.error}</div>
      )}

      <RichEditor content={content} onChange={setContent} />

      <button type="submit" disabled={pending || !content.trim()} className="btn-primary btn">
        {pending ? "Posting..." : "Post Reply"}
      </button>
    </form>
  );
}
