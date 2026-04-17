"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthInput } from "@/features/auth/components/auth-input.component";
import { AuthShell } from "@/features/auth/components/auth-shell.component";
import { loginUser } from "@/features/auth/services/auth.service";
import type {
  FormErrors,
  LoginFormValues,
} from "@/features/auth/types/auth.type";
import { validateLoginForm } from "@/features/auth/utils/auth-validation";

const initialValues: LoginFormValues = {
  email: "",
  password: "",
};

export function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginFormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors<keyof LoginFormValues>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field: keyof LoginFormValues, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "", submit: "" }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validateLoginForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);

    const result = await loginUser(formData.email, formData.password);

    if (!result.success) {
      setErrors({ submit: result.message });
      setIsLoading(false);
      return;
    }

    router.replace("/");
  };

  return (
    <AuthShell
      badge="Login"
      title="Welcome back"
      description="Sign in to continue working on your workflows."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <AuthInput
          id="login-email"
          type="email"
          autoComplete="email"
          label="Email address"
          placeholder="you@example.com"
          value={formData.email}
          error={errors.email}
          onChange={(event) => handleChange("email", event.target.value)}
        />

        <AuthInput
          id="login-password"
          type="password"
          autoComplete="current-password"
          label="Password"
          placeholder="Enter your password"
          value={formData.password}
          error={errors.password}
          onChange={(event) => handleChange("password", event.target.value)}
        />

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="inline-flex rounded-full px-1 text-sm font-semibold text-sky-700 transition hover:text-sky-900"
          >
            Forgot password?
          </Link>
        </div>

        {errors.submit ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errors.submit}
          </div>
        ) : null}

        <Button className="h-12 w-full rounded-2xl text-sm font-semibold" disabled={isLoading} type="submit">
          <LogIn className="h-4 w-4" />
          {isLoading ? "Logging in..." : "Login to dashboard"}
        </Button>
      </form>

      <div className="mt-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <span>New here? Create your account.</span>
        <Link
          href="/signup"
          className="inline-flex items-center gap-1 font-semibold text-slate-900"
        >
          Create account
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </AuthShell>
  );
}
