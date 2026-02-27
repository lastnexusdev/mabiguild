"use client";

import { useActionState } from "react";
import { updateSettingsAction } from "./actions";
import type { Site } from "@prisma/client";

const initialState = { error: "", success: false };

export default function SettingsForm({ site }: { site: Site }) {
  const [state, formAction, pending] = useActionState(
    updateSettingsAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="siteId" value={site.id} />

      {state.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded px-4 py-3 text-sm">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded px-4 py-3 text-sm">
          Settings saved!
        </div>
      )}

      <div>
        <label className="label">Site Name</label>
        <input
          name="name"
          type="text"
          defaultValue={site.name}
          required
          minLength={2}
          maxLength={64}
          className="input"
        />
      </div>

      <div>
        <label className="label">Description</label>
        <textarea
          name="description"
          rows={3}
          defaultValue={site.description ?? ""}
          maxLength={500}
          className="input resize-none"
        />
      </div>

      <div>
        <label className="label">Banner Image URL</label>
        <input
          name="bannerUrl"
          type="url"
          defaultValue={site.bannerUrl ?? ""}
          className="input"
          placeholder="https://example.com/banner.jpg"
        />
      </div>

      <div>
        <label className="label">Logo URL</label>
        <input
          name="logoUrl"
          type="url"
          defaultValue={site.logoUrl ?? ""}
          className="input"
          placeholder="https://example.com/logo.png"
        />
      </div>

      <div>
        <label className="label">Theme</label>
        <select name="theme" defaultValue={site.theme} className="input">
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </div>

      <button type="submit" disabled={pending} className="btn-primary btn">
        {pending ? "Saving..." : "Save Settings"}
      </button>
    </form>
  );
}
