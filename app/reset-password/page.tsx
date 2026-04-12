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
      className="w-full cursor-pointer rounded-xl bg-(--primary-color) px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(76,175,80,0.16)] transition-colors duration-200 hover:bg-(--primary-hover-color) disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Resetting..." : "Reset Password"}
    </button>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [state, formAction] = useActionState(
    async (
      _prevState: { message?: string; success?: boolean } | null,
      formData: FormData,
    ) => {
      return resetPasswordWithTokenAction(formData);
    },
    null,
  );

  return (
    <div className="min-h-screen bg-(--page-background) px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center justify-center">
        <div className="w-full overflow-hidden rounded-4xl border border-(--border-color) bg-[rgba(255,255,255,0.96)] shadow-[0_22px_60px_rgba(27,94,32,0.08)]">
          <div className="h-1 bg-(--primary-color)" />
          <div className="px-8 py-7">
            <h1 className="text-3xl font-semibold tracking-tight text-(--heading-color)">
              Reset password
            </h1>
            <p className="mt-2 text-sm leading-6 text-(--muted-color)">
              Set a new password for your account.
            </p>

            {!token ? (
              <div className="mt-6 rounded-xl border border-[rgba(229,57,53,0.18)] bg-[rgba(229,57,53,0.08)] p-3 text-sm text-(--danger-color)">
                Invalid reset link. Please request a new one.
              </div>
            ) : (
              <form action={formAction} className="mt-6 space-y-4">
                <input type="hidden" name="token" value={token} />

                <div>
                  <label className="mb-2 block text-sm font-medium text-(--heading-color)">
                    New password
                  </label>
                  <input
                    name="password"
                    type="password"
                    minLength={8}
                    required
                    className="w-full rounded-xl border border-(--border-color) bg-(--surface-soft) px-3 py-2.5 text-(--text-color) shadow-sm transition-colors duration-200 focus:border-(--primary-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color)/20"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-(--heading-color)">
                    Confirm password
                  </label>
                  <input
                    name="confirmPassword"
                    type="password"
                    minLength={8}
                    required
                    className="w-full rounded-xl border border-(--border-color) bg-(--surface-soft) px-3 py-2.5 text-(--text-color) shadow-sm transition-colors duration-200 focus:border-(--primary-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color)/20"
                  />
                </div>

                {state?.message && (
                  <div
                    className={`rounded-xl border p-3 text-sm ${state.success ? "border-[rgba(76,175,80,0.18)] bg-[rgba(76,175,80,0.08)] text-(--heading-color)" : "border-[rgba(229,57,53,0.18)] bg-[rgba(229,57,53,0.08)] text-(--danger-color)"}`}
                  >
                    {state.message}
                  </div>
                )}

                {state?.success && (
                  <Link
                    href="/login"
                    className="block text-center text-sm font-medium text-(--heading-color) underline decoration-(--primary-color)/40 underline-offset-4 transition-colors hover:text-(--primary-color)"
                  >
                    Go to sign in
                  </Link>
                )}

                <SubmitButton />
              </form>
            )}

            <div className="mt-5 text-center">
              <Link
                href="/login"
                className="text-sm font-medium text-(--heading-color) transition-colors hover:text-(--primary-color)"
              >
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-(--page-background) p-6">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-200 border-t-(--primary-color)"></div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
