"use client";

import { useActionState, useState } from "react";
import { createSiteAction } from "./actions";

const initialState = { error: "" };
const ROOT_DOMAIN =
  process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

export default function CreateSiteForm() {
  const [state, formAction, pending] = useActionState(
    createSiteAction,
    initialState
  );
  const [subdomain, setSubdomain] = useState("");

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-md px-4 py-3 text-sm">
          {state.error}
        </div>
      )}

      <div>
        <label className="label" htmlFor="name">
          Site Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={64}
          className="input"
          placeholder="My Awesome Guild"
        />
      </div>

      <div>
        <label className="label" htmlFor="subdomain">
          Subdomain <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center">
          <input
            id="subdomain"
            name="subdomain"
            type="text"
            required
            minLength={2}
            maxLength={32}
            pattern="[a-z0-9][a-z0-9-]*[a-z0-9]"
            value={subdomain}
            onChange={(e) =>
              setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
            }
            className="input rounded-r-none"
            placeholder="myguild"
          />
          <span className="inline-flex items-center px-3 py-2 rounded-r-md border border-l-0 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-sm whitespace-nowrap">
            .{ROOT_DOMAIN}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          2–32 lowercase letters, numbers, and hyphens. Cannot start/end with a
          hyphen.
        </p>
        {subdomain && (
          <p className="text-xs text-blue-600 mt-1">
            Your site will be at:{" "}
            <strong>
              {subdomain}.{ROOT_DOMAIN}
            </strong>
          </p>
        )}
      </div>

      <div>
        <label className="label" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={500}
          className="input resize-none"
          placeholder="A short description of your community..."
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="btn-primary btn flex-1"
        >
          {pending ? "Creating..." : "Create Site"}
        </button>
        <a href="/dashboard" className="btn-secondary btn">
          Cancel
        </a>
      </div>
    </form>
  );
}
