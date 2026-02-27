"use client";

import { useActionState } from "react";
import { createThreadAction } from "./actions";
import RichEditor from "@/components/RichEditor";
import { useState } from "react";

const initialState = { error: "" };

export default function NewThreadForm({
  siteId,
  forumId,
}: {
  siteId: string;
  forumId: string;
}) {
  const [content, setContent] = useState("");
  const [state, formAction, pending] = useActionState(
    createThreadAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="siteId" value={siteId} />
      <input type="hidden" name="forumId" value={forumId} />
      <input type="hidden" name="content" value={content} />

      {state.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded px-4 py-3 text-sm">
          {state.error}
        </div>
      )}

      <div>
        <label className="label">Thread Title</label>
        <input
          name="title"
          type="text"
          required
          minLength={3}
          maxLength={200}
          className="input"
          placeholder="Give your thread a descriptive title"
        />
      </div>

      <div>
        <label className="label">Content</label>
        <RichEditor content={content} onChange={setContent} />
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn-primary btn">
          {pending ? "Posting..." : "Post Thread"}
        </button>
        <button type="button" onClick={() => history.back()} className="btn-secondary btn">
          Cancel
        </button>
      </div>
    </form>
  );
}
