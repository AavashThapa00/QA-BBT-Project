"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction } from "@/app/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-60"
    >
      {pending ? "Signing in..." : "Sign In"}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useActionState(
    async (_prevState: { message?: string } | null, formData: FormData) => {
      return loginAction(formData);
    },
    null
  );

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-8">
        <h1 className="text-2xl font-semibold text-white">Sign In</h1>
        <p className="text-slate-400 mt-2">Use your email and password to continue.</p>

        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Password</label>
            <input
              name="password"
              type="password"
              required
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="••••••••"
            />
          </div>

          {state?.message && (
            <div className="text-sm text-red-400">{state.message}</div>
          )}

          <SubmitButton />
        </form>
      </div>
    </div>
  );
}
