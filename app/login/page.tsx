"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction } from "@/app/actions/auth";

type LoginState = {
  success?: boolean;
  message?: string;
};

const fieldClassName =
  "w-full rounded-xl border border-(--border-color) bg-(--surface-soft) px-3 py-2.5 text-(--text-color) shadow-sm transition-colors duration-200 placeholder:text-[#9CA3AF] focus:border-(--primary-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color)/20";

function SignInSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="relative w-full cursor-pointer rounded-xl bg-(--primary-color) px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(76,175,80,0.16)] transition-colors duration-200 hover:bg-(--primary-hover-color) disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className={pending ? "opacity-0" : "opacity-100"}>Sign in</span>
      {pending && (
        <span className="absolute inset-0 flex items-center justify-center gap-2">
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
            />
            <path
              className="opacity-90"
              fill="currentColor"
              d="M22 12a10 10 0 0 1-10 10v-3a7 7 0 0 0 7-7h3z"
            />
          </svg>
        </span>
      )}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="#4285F4"
        d="M21.35 11.1h-9.17v2.98h5.27c-.23 1.3-.97 2.4-2.08 3.13v2.6h3.37c1.97-1.82 3.1-4.5 3.1-7.72 0-.74-.07-1.45-.2-2.1z"
      />
      <path
        fill="#34A853"
        d="M12.18 22c2.8 0 5.15-.93 6.87-2.52l-3.37-2.6c-.93.62-2.12.99-3.5.99-2.69 0-4.97-1.82-5.78-4.27H2.91v2.68A10 10 0 0 0 12.18 22z"
      />
      <path
        fill="#FBBC05"
        d="M6.4 13.6c-.2-.62-.32-1.28-.32-1.96s.12-1.34.32-1.96V7H2.91A10 10 0 0 0 2 11.64c0 1.61.38 3.14.91 4.64l3.49-2.68z"
      />
      <path
        fill="#EA4335"
        d="M12.18 5.02c1.52 0 2.9.52 4 1.56l2.99-2.99C17.32 1.9 14.97 1 12.18 1A10 10 0 0 0 2.91 7l3.49 2.68C7.21 6.84 9.49 5.02 12.18 5.02z"
      />
    </svg>
  );
}

function GoogleContinueButton() {
  return (
    <a
      href="/api/auth/google/start"
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-[rgba(66,133,244,0.22)] bg-[rgba(255,255,255,0.96)] px-4 py-3 text-sm font-semibold text-(--text-color) shadow-[0_8px_20px_rgba(27,94,32,0.05)] transition-all duration-200 hover:border-[rgba(66,133,244,0.38)] hover:bg-white hover:shadow-[0_12px_28px_rgba(27,94,32,0.08)]"
    >
      <GoogleIcon />
      Continue with Google
    </a>
  );
}

export default function LoginPage() {
  const [state, formAction] = useActionState<LoginState | null, FormData>(
    async (_prevState, formData) => loginAction(formData),
    null,
  );

  return (
    <div className="min-h-screen bg-(--page-background) px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center justify-center">
        <div className="w-full overflow-hidden rounded-4xl border border-(--border-color) bg-[rgba(255,255,255,0.96)] shadow-[0_22px_60px_rgba(27,94,32,0.08)]">
          <div className="h-1 bg-(--primary-color)" />
          <div className="px-8 py-7">
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-(--heading-color)">
              Welcome back
            </h1>
            <p className="mt-2 text-sm leading-6 text-(--muted-color)">
              Sign in with email, password, or Google.
            </p>

            <div className="mt-6">
              <GoogleContinueButton />
            </div>

            <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-(--muted-color)">
              <span className="h-px flex-1 bg-(--border-color)" />
              <span>or</span>
              <span className="h-px flex-1 bg-(--border-color)" />
            </div>

            <form action={formAction} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-(--heading-color)">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  className={fieldClassName}
                  placeholder="name@company.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-(--heading-color)">
                  Password
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  className={fieldClassName}
                  placeholder="••••••••"
                />
              </div>

              {state?.message && !state.success && (
                <div className="rounded-xl border border-[rgba(229,57,53,0.18)] bg-[rgba(229,57,53,0.08)] p-3 text-sm text-(--danger-color)">
                  {state.message}
                </div>
              )}

              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-(--heading-color) transition-colors hover:text-(--primary-color)"
                >
                  Forgot password?
                </Link>
              </div>

              <SignInSubmitButton />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
