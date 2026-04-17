import type { ReactNode } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/common/utils/cn.util";

type AuthShellProps = {
  badge: string;
  title: string;
  description: string;
  footerText?: string;
  footerLinkHref?: string;
  footerLinkLabel?: string;
  compact?: boolean;
  children: ReactNode;
};

export function AuthShell({
  badge,
  title,
  description,
  footerText,
  footerLinkHref,
  footerLinkLabel,
  compact = false,
  children,
}: AuthShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.22),_transparent_36%),linear-gradient(135deg,_#f8fbff_0%,_#eef6ff_45%,_#fef7ed_100%)]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.07)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div
        className={cn(
          "relative mx-auto flex min-h-screen max-w-6xl items-center px-4 sm:px-6 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-8",
          compact ? "py-4 sm:py-5" : "py-10"
        )}
      >
        <div className="hidden lg:block">
          <div className="max-w-xl">
            <span className="inline-flex rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-700 shadow-sm">
              {badge}
            </span>
            <h1
              className={cn(
                "font-semibold leading-tight text-slate-950",
                compact ? "mt-4 text-4xl" : "mt-6 text-5xl"
              )}
            >
              Build and manage your workflows with confidence.
            </h1>
            <p
              className={cn(
                "max-w-lg text-slate-600",
                compact ? "mt-4 text-sm leading-6" : "mt-5 text-base leading-7"
              )}
            >
              Secure account access, clear validation, and a smooth sign-in
              experience designed for everyday use.
            </p>
            <div className={cn("grid gap-4 sm:grid-cols-2", compact ? "mt-6" : "mt-10")}>
              <div className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
                <p className="text-sm font-semibold text-slate-900">
                  Secure access
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Your account is protected with reliable email and password
                  authentication.
                </p>
              </div>
              <div className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
                <p className="text-sm font-semibold text-slate-900">
                  Easy to use
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Simple forms and helpful messages make sign up and login fast
                  and clear.
                </p>
              </div>
            </div>
          </div>
        </div>

        <Card
          className={cn(
            "w-full rounded-[32px] border-white/70 bg-white/82 shadow-[0_24px_80px_rgba(15,23,42,0.14)] backdrop-blur",
            compact && "max-h-[calc(100vh-2rem)]"
          )}
        >
          <CardContent className={cn(compact ? "p-5 sm:p-6" : "p-6 sm:p-8")}>
            <div className={cn(compact ? "mb-5" : "mb-8")}>
              <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-medium text-white">
                {badge}
              </span>
              <h2
                className={cn(
                  "font-semibold tracking-tight text-slate-950",
                  compact ? "mt-3 text-2xl" : "mt-4 text-3xl"
                )}
              >
                {title}
              </h2>
              <p className={cn("text-sm text-slate-600", compact ? "mt-1 leading-5" : "mt-2 leading-6")}>
                {description}
              </p>
            </div>

            {children}

            {footerText && footerLinkHref && footerLinkLabel ? (
              <p
                className={cn(
                  "text-center text-sm text-slate-600",
                  compact ? "mt-5" : "mt-8"
                )}
              >
                {footerText}{" "}
                <Link
                  href={footerLinkHref}
                  className="font-semibold text-sky-700 transition hover:text-sky-800"
                >
                  {footerLinkLabel}
                </Link>
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
