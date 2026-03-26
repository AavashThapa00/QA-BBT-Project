"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { requestPasswordResetAction } from "@/app/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? "Generating..." : "Generate Reset Link"}
    </button>
  );
}

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState(
    async (
      _prevState: { message?: string; success?: boolean; resetLink?: string } | null,
      formData: FormData
    ) => {
      return requestPasswordResetAction(formData);
    },
    null
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6 overflow-hidden relative">
      <div className="w-full max-w-md backdrop-blur-xl bg-slate-900/50 border border-slate-800/50 rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-500">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Forgot Password</h1>
        <p className="text-slate-300 mt-2 text-sm">Enter your account email to receive a password reset link.</p>

        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {state?.message && (
            <div className={`text-sm rounded-lg p-3 border ${state.success ? "text-emerald-300 bg-emerald-900/20 border-emerald-700/50" : "text-red-300 bg-red-900/20 border-red-700/50"}`}>
              {state.message}
            </div>
          )}

          {state?.resetLink && (
            <div className="rounded-lg p-3 border border-blue-700/50 bg-blue-900/20">
              <p className="text-xs text-blue-200 mb-2">SMTP not configured. Use this reset link directly:</p>
              <a href={state.resetLink} className="text-xs text-blue-300 break-all hover:text-blue-200 underline">
                {state.resetLink}
              </a>
            </div>
          )}

          <SubmitButton />

          <div className="text-center">
            <Link href="/login" className="text-xs text-slate-300 hover:text-white transition-colors">
              Back to Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
