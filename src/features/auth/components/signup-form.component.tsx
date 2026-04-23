"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthInput } from "@/features/auth/components/auth-input.component";
import { AuthShell } from "@/features/auth/components/auth-shell.component";
import { signUpUser } from "@/features/auth/services/auth.service";
import type {
  FormErrors,
  SignUpFormValues,
} from "@/features/auth/types/auth.type";
import { validateSignUpForm } from "@/features/auth/utils/auth-validation";

const initialValues: SignUpFormValues = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<SignUpFormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors<keyof SignUpFormValues>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field: keyof SignUpFormValues, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "", submit: "" }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validateSignUpForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);

    const result = await signUpUser(
      formData.email,
      formData.password,
      formData.fullName
    );

    if (!result.success) {
      setErrors({ submit: result.message });
      setIsLoading(false);
      return;
    }

    router.replace("/");
  };

  return (
    <AuthShell
      badge="Sign up"
      title="Create your account"
      description="Create an account to save and manage your workflows."
      compact
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <AuthInput
          id="signup-fullName"
          autoComplete="name"
          label="Full name"
          placeholder="Harshit Bhalani"
          value={formData.fullName}
          error={errors.fullName}
          onChange={(event) => handleChange("fullName", event.target.value)}
        />

        <AuthInput
          id="signup-email"
          type="email"
          autoComplete="email"
          label="Email address"
          placeholder="you@example.com"
          value={formData.email}
          error={errors.email}
          onChange={(event) => handleChange("email", event.target.value)}
        />

        <AuthInput
          id="signup-password"
          type="password"
          autoComplete="new-password"
          label="Password"
          placeholder="At least 6 chars, 1 uppercase, 1 number"
          hint="Use at least 6 characters, including 1 uppercase letter and 1 number."
          value={formData.password}
          error={errors.password}
          onChange={(event) => handleChange("password", event.target.value)}
        />

        <AuthInput
          id="signup-confirmPassword"
          type="password"
          autoComplete="new-password"
          label="Confirm password"
          placeholder="Re-enter your password"
          value={formData.confirmPassword}
          error={errors.confirmPassword}
          onChange={(event) =>
            handleChange("confirmPassword", event.target.value)
          }
        />

        {errors.submit ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errors.submit}
          </div>
        ) : null}

        <Button className="h-12 w-full rounded-2xl text-sm font-semibold" disabled={isLoading} type="submit">
          <ShieldCheck className="h-4 w-4" />
          {isLoading ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <span>Already have an account?</span>
        <Link
          href="/login"
          className="inline-flex items-center gap-1 font-semibold text-slate-900"
        >
          Go to login
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </AuthShell>
  );
}
