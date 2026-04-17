"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowLeft, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthInput } from "@/features/auth/components/auth-input.component";
import { AuthShell } from "@/features/auth/components/auth-shell.component";
import { sendForgotPasswordEmail } from "@/features/auth/services/auth.service";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setEmailError("Please enter your email address first.");
      setSubmitError("");
      setSuccessMessage("");
      return;
    }

    setIsSubmitting(true);
    setEmailError("");
    setSubmitError("");
    setSuccessMessage("");

    const result = await sendForgotPasswordEmail(trimmedEmail);

    if (!result.success) {
      setSubmitError(result.message);
      setIsSubmitting(false);
      return;
    }

    setSuccessMessage(result.message);
    setIsSubmitting(false);
  };

  return (
    <AuthShell
      badge="Reset password"
      title="Forgot your password?"
      description="Enter your email and we will send you a password reset link."
      compact
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <AuthInput
          id="forgot-password-email"
          type="email"
          autoComplete="email"
          label="Email address"
          placeholder="you@example.com"
          value={email}
          error={emailError}
          onChange={(event) => {
            setEmail(event.target.value);
            setEmailError("");
            setSubmitError("");
            setSuccessMessage("");
          }}
        />

        {submitError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        <Button
          className="h-12 w-full rounded-2xl text-sm font-semibold"
          disabled={isSubmitting}
          type="submit"
        >
          <MailCheck className="h-4 w-4" />
          {isSubmitting ? "Sending reset link..." : "Send reset link"}
        </Button>
      </form>

      <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <span>Remembered your password?</span>
        <Link
          href="/login"
          className="inline-flex items-center gap-1 font-semibold text-slate-900"
        >
          Back to login
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>
    </AuthShell>
  );
}
