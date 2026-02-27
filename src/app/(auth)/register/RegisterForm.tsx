"use client";

import { useActionState } from "react";
import { registerAction } from "./actions";

const initialState = { error: "" };

export default function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="bg-red-900/30 border border-red-700 text-red-400 rounded-md px-4 py-3 text-sm">
          {state.error}
        </div>
      )}

      <div>
        <label className="label text-slate-300" htmlFor="username">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          minLength={3}
          maxLength={24}
          pattern="[a-zA-Z0-9_]+"
          autoComplete="username"
          className="input bg-slate-700 border-slate-600 text-white placeholder-slate-500"
          placeholder="cooluser123"
        />
        <p className="text-xs text-slate-500 mt-1">
          3–24 chars, letters/numbers/underscores
        </p>
      </div>

      <div>
        <label className="label text-slate-300" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="input bg-slate-700 border-slate-600 text-white placeholder-slate-500"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label className="label text-slate-300" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="input bg-slate-700 border-slate-600 text-white placeholder-slate-500"
          placeholder="At least 8 characters"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="btn-primary w-full py-2.5"
      >
        {pending ? "Creating account..." : "Create Account"}
      </button>
    </form>
  );
}
