"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  requestLoginCodeAction,
  verifyLoginCodeAction,
} from "@/app/actions/auth";

function CredentialsSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/50 transform hover:scale-105 active:scale-95"
    >
      {pending ? "Sending code..." : "Send verification code"}
    </button>
  );
}

function VerifySubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/50 transform hover:scale-105 active:scale-95"
    >
      {pending ? "Verifying..." : "Verify and sign in"}
    </button>
  );
}

export default function LoginPage() {
  const [step, setStep] = useState<"credentials" | "code">("credentials");
  const [challengeId, setChallengeId] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);

  const [requestState, requestAction] = useActionState(
    async (
      _prevState: { success?: boolean; message?: string; challengeId?: string; email?: string; code?: string } | null,
      formData: FormData
    ) => {
      return requestLoginCodeAction(formData);
    },
    null
  );

  const [verifyState, verifyAction] = useActionState(
    async (_prevState: { success?: boolean; message?: string } | null, formData: FormData) => {
      return verifyLoginCodeAction(formData);
    },
    null
  );

  useEffect(() => {
    if (requestState?.success && requestState.challengeId && requestState.email) {
      setChallengeId(requestState.challengeId);
      setLoginEmail(requestState.email);
      setDevCode(requestState.code || null);
      setStep("code");
    }
  }, [requestState]);

  const maskedEmail = useMemo(() => {
    if (!loginEmail.includes("@")) return loginEmail;
    const [name, domain] = loginEmail.split("@");
    if (name.length <= 2) return `${name[0] || "*"}*@${domain}`;
    return `${name.slice(0, 2)}${"*".repeat(Math.max(1, name.length - 2))}@${domain}`;
  }, [loginEmail]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6 overflow-hidden relative">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-30 -z-10">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-md backdrop-blur-xl bg-slate-900/50 border border-slate-800/50 rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-500">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Sign In</h1>
        <p className="text-slate-400 mt-3 text-sm">
          {step === "credentials"
            ? "Enter your email and password to receive a verification code"
            : "Enter the verification code sent to your email"}
        </p>

        {step === "credentials" ? (
          <form action={requestAction} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-2">Email</label>
              <input
                name="email"
                type="email"
                required
                className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">Password</label>
              <input
                name="password"
                type="password"
                required
                className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm transition-all duration-200"
                placeholder="••••••••"
              />
            </div>

            {requestState?.message && !requestState.success && (
              <div className="text-sm text-red-400 bg-red-900/20 border border-red-700/50 rounded-lg p-3 animate-in fade-in">{requestState.message}</div>
            )}

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-xs text-blue-300 hover:text-blue-200 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <CredentialsSubmitButton />
          </form>
        ) : (
          <form action={verifyAction} className="mt-6 space-y-4">
            <input type="hidden" name="challengeId" value={challengeId} />

            <div className="text-xs text-slate-400 bg-slate-800/40 border border-slate-700/60 rounded-lg p-3">
              Code sent to <span className="text-slate-200">{maskedEmail}</span>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">Verification code</label>
              <input
                name="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                minLength={6}
                maxLength={6}
                required
                className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm transition-all duration-200 tracking-[0.3em] text-center"
                placeholder="123456"
              />
            </div>

            {verifyState?.message && (
              <div className="text-sm text-red-400 bg-red-900/20 border border-red-700/50 rounded-lg p-3 animate-in fade-in">{verifyState.message}</div>
            )}

            {requestState?.success && requestState.message && (
              <div className="text-sm text-emerald-300 bg-emerald-900/20 border border-emerald-700/50 rounded-lg p-3 animate-in fade-in">{requestState.message}</div>
            )}

            {devCode && (
              <div className="text-xs text-amber-200 bg-amber-900/20 border border-amber-700/50 rounded-lg p-3">
                Development code: <span className="font-semibold">{devCode}</span>
              </div>
            )}

            <VerifySubmitButton />

            <button
              type="button"
              onClick={() => {
                setStep("credentials");
                setChallengeId("");
                setDevCode(null);
              }}
              className="w-full text-sm text-slate-300 hover:text-white border border-slate-700/70 hover:border-slate-600 rounded-lg py-2.5 transition-colors"
            >
              Use different credentials
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
