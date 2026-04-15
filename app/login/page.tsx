"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  requestLoginCodeAction,
  verifyLoginCodeAction,
} from "@/app/actions/auth";

type RequestCodeState = {
  success?: boolean;
  message?: string;
  challengeId?: string;
  email?: string;
  code?: string;
};

type VerifyCodeState = {
  success?: boolean;
  message?: string;
};

const fieldClassName =
  "w-full rounded-xl border border-(--border-color) bg-(--surface-soft) px-3 py-2.5 text-(--text-color) shadow-sm transition-colors duration-200 placeholder:text-[#9CA3AF] focus:border-(--primary-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color)/20";

function RequestCodeSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="relative w-full cursor-pointer rounded-xl bg-(--primary-color) px-4 py-3 text-sm font-semibold text-(--on-primary) shadow-glow transition-colors duration-200 hover:bg-(--primary-hover-color) disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className={pending ? "opacity-0" : "opacity-100"}>Log in</span>
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

function VerifyCodeSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="relative w-full cursor-pointer rounded-xl bg-(--primary-color) px-4 py-3 text-sm font-semibold text-(--on-primary) shadow-glow transition-colors duration-200 hover:bg-(--primary-hover-color) disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className={pending ? "opacity-0" : "opacity-100"}>
        Verify and sign in
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

export default function LoginPage() {
  const [challengeId, setChallengeId] = useState("");
  const [email, setEmail] = useState("");
  const [devCode, setDevCode] = useState("");

  const [requestState, requestCodeFormAction] = useActionState<
    RequestCodeState | null,
    FormData
  >(async (_prevState, formData) => {
    const result = await requestLoginCodeAction(formData);

    if (result.success && result.challengeId) {
      setChallengeId(result.challengeId);
      setEmail(result.email || "");
      setDevCode(result.code || "");
    }

    return result;
  }, null);

  const [verifyState, verifyCodeFormAction] = useActionState<
    VerifyCodeState | null,
    FormData
  >(async (_prevState, formData) => verifyLoginCodeAction(formData), null);

  const inVerificationStep = !!challengeId;

  return (
    <div className="min-h-screen bg-(--page-background) px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center justify-center">
        <div className="w-full overflow-hidden rounded-4xl border border-(--border-color) bg-(--surface-elevated) shadow-dialog">
          <div className="h-1 bg-(--primary-color)" />
          <div className="px-8 py-7">
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-(--heading-color)">
              Welcome back
            </h1>
            <p className="mt-2 text-sm leading-6 text-(--muted-color)">
              {inVerificationStep
                ? `Enter the 6-digit code sent to ${email}.`
                : "Enter your email and password to receive a sign-in code."}
            </p>

            {!inVerificationStep ? (
              <form action={requestCodeFormAction} className="mt-6 space-y-4">
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

                {requestState?.message && !requestState.success && (
                  <div className="rounded-xl border border-[rgba(229,57,53,0.18)] bg-[rgba(229,57,53,0.08)] p-3 text-sm text-(--danger-color)">
                    {requestState.message}
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

                <RequestCodeSubmitButton />
              </form>
            ) : (
              <form action={verifyCodeFormAction} className="mt-6 space-y-4">
                <input type="hidden" name="challengeId" value={challengeId} />

                <div>
                  <label className="mb-2 block text-sm font-medium text-(--heading-color)">
                    Verification code
                  </label>
                  <input
                    name="code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    minLength={6}
                    required
                    className={fieldClassName}
                    placeholder="Enter 6-digit code"
                  />
                </div>

                {verifyState?.message && !verifyState.success && (
                  <div className="rounded-xl border border-[rgba(229,57,53,0.18)] bg-[rgba(229,57,53,0.08)] p-3 text-sm text-(--danger-color)">
                    {verifyState.message}
                  </div>
                )}

                {devCode && (
                  <div className="rounded-xl border border-[rgba(30,136,229,0.22)] bg-[rgba(30,136,229,0.08)] p-3 text-sm text-(--info-color)">
                    SMTP not configured. Development code:{" "}
                    <strong>{devCode}</strong>
                  </div>
                )}

                <VerifyCodeSubmitButton />
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
