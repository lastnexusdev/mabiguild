"use client";

import { useActionState, useState } from "react";
import { savePageAction } from "./actions";
import RichEditor from "@/components/RichEditor";
import type { Page } from "@prisma/client";

const initialState = { error: "" };

export default function PageEditorForm({
  siteId,
  page,
}: {
  siteId: string;
  page?: Page;
}) {
  const [content, setContent] = useState(page?.content ?? "");
  const [state, formAction, pending] = useActionState(
    savePageAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4 max-w-3xl">
      <input type="hidden" name="siteId" value={siteId} />
      {page && <input type="hidden" name="pageId" value={page.id} />}
      <input type="hidden" name="content" value={content} />

      {state.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded px-4 py-3 text-sm">
          {state.error}
        </div>
      )}

      <div>
        <label className="label">Title</label>
        <input
          name="title"
          type="text"
          required
          minLength={2}
          maxLength={200}
          defaultValue={page?.title}
          className="input"
          placeholder="Page Title"
        />
      </div>

      <div>
        <label className="label">Slug</label>
        <input
          name="slug"
          type="text"
          required
          defaultValue={page?.slug}
          pattern="[a-z0-9-]+"
          className="input"
          placeholder="my-page-slug"
        />
        <p className="text-xs text-slate-500 mt-1">
          Lowercase letters, numbers, hyphens. URL: /p/your-slug
        </p>
      </div>

      <div>
        <label className="label">Content</label>
        <RichEditor content={content} onChange={setContent} />
      </div>

      <div>
        <label className="label">Status</label>
        <select name="status" defaultValue={page?.status ?? "DRAFT"} className="input">
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
        </select>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn-primary btn">
          {pending ? "Saving..." : page ? "Update Page" : "Create Page"}
        </button>
        <a href="/admin/pages" className="btn-secondary btn">
          Cancel
        </a>
      </div>
    </form>
  );
}
