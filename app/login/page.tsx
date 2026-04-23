"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { toast } from "sonner";
import { AuthBrandingSection } from "@/app/components/common/AuthBrandingSection";
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
  const router = useRouter();
  const [challengeId, setChallengeId] = useState("");
  const [email, setEmail] = useState("");
  const [devCode, setDevCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const requestToastKeyRef = useRef("");
  const verifyToastKeyRef = useRef("");
  const verifyRedirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const [requestState, requestCodeFormAction] = useActionState<
    RequestCodeState | null,
    FormData
  >(async (_prevState, formData) => {
    const result = await requestLoginCodeAction(formData);

    if (result.success && "challengeId" in result && result.challengeId) {
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

  useEffect(() => {
    if (!requestState?.message) return;

    const toastKey = `${requestState.success ? "success" : "error"}:${requestState.message}`;
    if (requestToastKeyRef.current === toastKey) return;
    requestToastKeyRef.current = toastKey;

    if (requestState.success) {
      toast.success(requestState.message);
    } else {
      toast.error(requestState.message);
    }
  }, [requestState]);

  useEffect(() => {
    if (!verifyState?.message) return;

    const toastKey = `${verifyState.success ? "success" : "error"}:${verifyState.message}`;
    if (verifyToastKeyRef.current === toastKey) return;
    verifyToastKeyRef.current = toastKey;

    if (verifyState.success) {
      toast.success(verifyState.message);
      verifyRedirectTimerRef.current = setTimeout(() => {
        router.replace("/");
      }, 1200);
    } else {
      toast.error(verifyState.message);
    }

    return () => {
      if (verifyRedirectTimerRef.current) {
        clearTimeout(verifyRedirectTimerRef.current);
        verifyRedirectTimerRef.current = null;
      }
    };
  }, [router, verifyState]);

  const inVerificationStep = !!challengeId;

  return (
    <div className="relative min-h-screen overflow-hidden bg-(--page-background)">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-size-[44px_44px] opacity-30" />
      <div className="pointer-events-none absolute -left-28 top-0 h-136 w-136 rounded-full bg-(--primary-color)/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 right-0 h-136 w-136 rounded-full bg-(--accent-color)/18 blur-3xl" />

      <div className="relative grid min-h-screen lg:grid-cols-2">
        <AuthBrandingSection />

        <section className="relative flex items-center justify-center px-4 py-8 sm:px-8">
          <div className="w-full max-w-md rounded-3xl border border-(--border-color) bg-(--surface-elevated)/95 p-7 shadow-dialog backdrop-blur-md sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              {inVerificationStep && (
                <button
                  type="button"
                  onClick={() => {
                    setChallengeId("");
                    setDevCode("");
                  }}
                  className="text-xs font-medium text-(--muted-color) transition-colors hover:text-(--heading-color)"
                >
                  Change email
                </button>
              )}
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-(--heading-color)">
              {inVerificationStep ? "Verify code" : "Sign in"}
            </h1>
            <p className="mt-2 text-sm text-(--muted-color)">
              {inVerificationStep
                ? `Code sent to ${email}`
                : "Secure login with one-time verification"}
            </p>

            {!inVerificationStep ? (
              <form action={requestCodeFormAction} className="mt-7 space-y-5">
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
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      className={`${fieldClassName} pr-12`}
                      placeholder="********"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2 -bottom-2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-(--muted-color) transition-colors hover:bg-(--surface-elevated) hover:text-(--heading-color) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary-color)/35"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <FaEyeSlash className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <FaEye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

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
              <form action={verifyCodeFormAction} className="mt-7 space-y-5">
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
        </section>
      </div>
    </div>
  );
}
