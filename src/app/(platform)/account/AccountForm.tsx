"use client";

import { useActionState } from "react";
import { updateAccountAction } from "./actions";

const initialState = { error: "", success: false };

interface User {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio?: string | null;
}

// Extend User to include bio from database attributes
interface UserWithBio extends User {
  bio?: string | null;
}

export default function AccountForm({ user }: { user: UserWithBio }) {
  const [state, formAction, pending] = useActionState(
    updateAccountAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded px-4 py-3 text-sm">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded px-4 py-3 text-sm">
          Account updated!
        </div>
      )}

      <div>
        <label className="label">Username</label>
        <input
          type="text"
          value={user.username}
          disabled
          className="input opacity-60 cursor-not-allowed"
        />
        <p className="text-xs text-slate-500 mt-1">Username cannot be changed.</p>
      </div>

      <div>
        <label className="label" htmlFor="displayName">
          Display Name
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          defaultValue={user.displayName ?? ""}
          maxLength={64}
          className="input"
          placeholder="Your Name"
        />
      </div>

      <div>
        <label className="label" htmlFor="avatarUrl">
          Avatar URL
        </label>
        <input
          id="avatarUrl"
          name="avatarUrl"
          type="url"
          defaultValue={user.avatarUrl ?? ""}
          className="input"
          placeholder="https://example.com/avatar.jpg"
        />
      </div>

      <div>
        <label className="label" htmlFor="bio">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          defaultValue={(user as UserWithBio).bio ?? ""}
          maxLength={300}
          className="input resize-none"
          placeholder="A short bio about yourself..."
        />
      </div>

      <button type="submit" disabled={pending} className="btn-primary btn">
        {pending ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
