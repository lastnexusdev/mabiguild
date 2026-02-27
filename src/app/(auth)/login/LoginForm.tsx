"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

const initialState = { error: "" };

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="bg-red-900/30 border border-red-700 text-red-400 rounded-md px-4 py-3 text-sm">
          {state.error}
        </div>
      )}

      <div>
        <label className="label text-slate-300" htmlFor="email">
          Email or Username
        </label>
        <input
          id="email"
          name="identifier"
          type="text"
          required
          autoComplete="username"
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
          autoComplete="current-password"
          className="input bg-slate-700 border-slate-600 text-white placeholder-slate-500"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="btn-primary w-full py-2.5"
      >
        {pending ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
