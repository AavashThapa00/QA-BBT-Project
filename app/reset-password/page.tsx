"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { resetPasswordWithTokenAction } from "@/app/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="relative w-full cursor-pointer rounded-xl bg-(--primary-color) px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(76,175,80,0.16)] transition-colors duration-200 hover:bg-(--primary-hover-color) disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className={pending ? "opacity-0" : "opacity-100"}>
        Reset Password
      </span>
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

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const lastToastKeyRef = useRef<string>("");

  const [state, formAction] = useActionState(
    async (
      _prevState: { message?: string; success?: boolean } | null,
      formData: FormData,
    ) => {
      return resetPasswordWithTokenAction(formData);
    },
    null,
  );

  useEffect(() => {
    if (!state?.message) return;

    const toastKey = `${state.success ? "success" : "error"}:${state.message}`;
    if (lastToastKeyRef.current === toastKey) return;
    lastToastKeyRef.current = toastKey;

    if (state.success) {
      toast.success(state.message);
    } else {
      toast.error(state.message);
    }
  }, [state]);

  useEffect(() => {
    if (!state?.success) return;

    const timer = setTimeout(() => {
      router.push("/login");
    }, 1800);

    return () => clearTimeout(timer);
  }, [router, state?.success]);

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

                {!state?.success && (
                  <>
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

                    <SubmitButton />
                  </>
                )}

                {state?.success && (
                  <div className="rounded-xl border border-[rgba(76,175,80,0.24)] bg-[rgba(76,175,80,0.1)] p-4 text-center">
                    <p className="text-sm font-semibold text-(--heading-color)">
                      Password reset successful
                    </p>
                    <p className="mt-1 text-xs text-(--muted-color)">
                      Redirecting you to sign in...
                    </p>
                  </div>
                )}
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
