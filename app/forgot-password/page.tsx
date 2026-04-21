"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { AuthBrandingSection } from "@/app/components/common/AuthBrandingSection";
import { requestPasswordResetAction } from "@/app/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="relative w-full cursor-pointer rounded-xl bg-(--primary-color) px-4 py-3 text-sm font-semibold text-(--on-primary) shadow-glow transition-colors duration-200 hover:bg-(--primary-hover-color) disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className={pending ? "opacity-0" : "opacity-100"}>
        Send Password Reset Link
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

export default function ForgotPasswordPage() {
  const toastKeyRef = useRef("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [state, formAction] = useActionState(
    async (
      _prevState: {
        message?: string;
        success?: boolean;
        resetLink?: string;
      } | null,
      formData: FormData,
    ) => {
      const email = String(formData.get("email") || "");
      setSubmittedEmail(email);
      return requestPasswordResetAction(formData);
    },
    null,
  );

  useEffect(() => {
    if (!state?.message || state.success) return;

    const toastKey = `error:${state.message}`;
    if (toastKeyRef.current === toastKey) return;
    toastKeyRef.current = toastKey;

    toast.error(state.message);
  }, [state]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-(--page-background)">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-size-[44px_44px] opacity-30" />
      <div className="pointer-events-none absolute -left-28 top-0 h-136 w-136 rounded-full bg-(--primary-color)/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 right-0 h-136 w-136 rounded-full bg-(--accent-color)/18 blur-3xl" />

      <div className="relative grid min-h-screen lg:grid-cols-2">
        <AuthBrandingSection />

        <section className="relative flex items-center justify-center px-4 py-8 sm:px-8">
          <div className="w-full max-w-md rounded-3xl border border-(--border-color) bg-(--surface-elevated)/95 p-7 shadow-dialog backdrop-blur-md sm:p-8">
            {!state?.success ? (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-(--muted-color)">
                    Reset Password
                  </p>
                </div>

                <h1 className="text-3xl font-semibold tracking-tight text-(--heading-color)">
                  Forgot password
                </h1>
                <p className="mt-3 text-sm text-(--muted-color)">
                  Enter your email and we will generate a reset link.
                </p>

                <form action={formAction} className="mt-7 space-y-5">
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

                  {state?.resetLink && (
                    <div className="rounded-xl border border-[rgba(30,136,229,0.22)] bg-[rgba(30,136,229,0.08)] p-3 text-sm text-(--info-color)">
                      SMTP not configured. Use this reset link directly:{" "}
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
              </>
            ) : (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-(--muted-color)">
                    Confirmation
                  </p>
                </div>

                <h1 className="text-3xl font-semibold tracking-tight text-(--heading-color)">
                  Check your email
                </h1>
                <p className="mt-3 text-sm text-(--muted-color)">
                  We have sent an email to <strong>{submittedEmail}</strong>. If
                  you don't receive the email, make sure to check your spam
                  folder.
                </p>

                {state?.resetLink && (
                  <div className="mt-7 rounded-xl border border-[rgba(30,136,229,0.22)] bg-[rgba(30,136,229,0.08)] p-3 text-sm text-(--info-color)">
                    SMTP not configured. Use this reset link directly:
                    <a
                      href={state.resetLink}
                      className="mt-2 break-all text-xs font-medium text-(--info-color) underline hover:opacity-80"
                    >
                      {state.resetLink}
                    </a>
                  </div>
                )}

                <Link
                  href="/login"
                  className="mt-7 block w-full rounded-xl bg-(--primary-color) px-4 py-3 text-center text-sm font-semibold text-(--on-primary) shadow-glow transition-colors hover:bg-(--primary-hover-color)"
                >
                  Back to Login
                </Link>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
