"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { resetPasswordWithTokenAction } from "@/app/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? "Resetting..." : "Reset Password"}
    </button>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [state, formAction] = useActionState(
    async (_prevState: { message?: string; success?: boolean } | null, formData: FormData) => {
      return resetPasswordWithTokenAction(formData);
    },
    null
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6 overflow-hidden relative">
      <div className="w-full max-w-md backdrop-blur-xl bg-slate-900/50 border border-slate-800/50 rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-500">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Reset Password</h1>
        <p className="text-slate-300 mt-2 text-sm">Set a new password for your account.</p>

        {!token ? (
          <div className="mt-6 rounded-lg p-3 border border-red-700/50 bg-red-900/20 text-red-300 text-sm">
            Invalid reset link. Please request a new one.
          </div>
        ) : (
          <form action={formAction} className="mt-6 space-y-4">
            <input type="hidden" name="token" value={token} />

            <div>
              <label className="block text-sm text-slate-300 mb-2">New Password</label>
              <input
                name="password"
                type="password"
                minLength={8}
                required
                className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">Confirm Password</label>
              <input
                name="confirmPassword"
                type="password"
                minLength={8}
                required
                className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {state?.message && (
              <div className={`text-sm rounded-lg p-3 border ${state.success ? "text-emerald-300 bg-emerald-900/20 border-emerald-700/50" : "text-red-300 bg-red-900/20 border-red-700/50"}`}>
                {state.message}
              </div>
            )}

            {state?.success && (
              <Link href="/login" className="block text-center text-sm text-blue-300 hover:text-blue-200 underline">
                Go to Sign In
              </Link>
            )}

            <SubmitButton />
          </form>
        )}

        <div className="text-center mt-4">
          <Link href="/login" className="text-xs text-slate-300 hover:text-white transition-colors">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-700 border-t-blue-500"></div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
