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
      className="w-full cursor-pointer rounded-xl bg-(--primary-color) px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(76,175,80,0.16)] transition-colors duration-200 hover:bg-(--primary-hover-color) disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Generating..." : "Generate reset link"}
    </button>
  );
}

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState(
    async (
      _prevState: {
        message?: string;
        success?: boolean;
        resetLink?: string;
      } | null,
      formData: FormData,
    ) => {
      return requestPasswordResetAction(formData);
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
              Forgot password
            </h1>
            <p className="mt-2 text-sm leading-6 text-(--muted-color)">
              Enter your email and we will generate a reset link.
            </p>

            <form action={formAction} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-(--heading-color)">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  className="w-full rounded-xl border border-(--border-color) bg-(--surface-soft) px-3 py-2.5 text-(--text-color) shadow-sm transition-colors duration-200 placeholder:text-[#9CA3AF] focus:border-(--primary-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color)/20"
                />
              </div>

              {state?.message && (
                <div
                  className={`rounded-xl border p-3 text-sm ${state.success ? "border-[rgba(76,175,80,0.18)] bg-[rgba(76,175,80,0.08)] text-(--heading-color)" : "border-[rgba(229,57,53,0.18)] bg-[rgba(229,57,53,0.08)] text-(--danger-color)"}`}
                >
                  {state.message}
                </div>
              )}

              {state?.resetLink && (
                <div className="rounded-xl border border-[rgba(30,136,229,0.22)] bg-[rgba(30,136,229,0.08)] p-3">
                  <p className="mb-2 text-xs text-(--info-color)">
                    SMTP not configured. Use this reset link directly:
                  </p>
                  <a
                    href={state.resetLink}
                    className="break-all text-xs font-medium text-(--info-color) underline hover:opacity-80"
                  >
                    {state.resetLink}
                  </a>
                </div>
              )}

              <SubmitButton />

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm font-medium text-(--heading-color) transition-colors hover:text-(--primary-color)"
                >
                  Back to sign in
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
