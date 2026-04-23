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

function AuthBrandMark(): ReactNode {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-100 bg-white shadow-[0_14px_32px_rgba(37,99,235,0.12)]">
        <svg
          aria-hidden="true"
          viewBox="0 0 40 40"
          className="h-9 w-9"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M35 3H25C23.8954 3 23 3.89543 23 5V15C23 16.1046 23.8954 17 25 17H35C36.1046 17 37 16.1046 37 15V5C37 3.89543 36.1046 3 35 3Z" stroke="#2563EB" strokeWidth="2" />
          <path d="M35 23H25C23.8954 23 23 23.8954 23 25V35C23 36.1046 23.8954 37 25 37H35C36.1046 37 37 36.1046 37 35V25C37 23.8954 36.1046 23 35 23Z" stroke="#1A192B" strokeWidth="2" />
          <path d="M15 23H5C3.89543 23 3 23.8954 3 25V35C3 36.1046 3.89543 37 5 37H15C16.1046 37 17 36.1046 17 35V25C17 23.8954 16.1046 23 15 23Z" stroke="#1A192B" strokeWidth="2" />
          <path d="M15 3H5C3.89543 3 3 3.89543 3 5V15C3 16.1046 3.89543 17 5 17H15C16.1046 17 17 16.1046 17 15V5C17 3.89543 16.1046 3 15 3Z" stroke="#1A192B" strokeWidth="2" />
          <path d="M17 13C18.6569 13 20 11.6569 20 10C20 8.34315 18.6569 7 17 7C15.3431 7 14 8.34315 14 10C14 11.6569 15.3431 13 17 13Z" fill="white" />
          <path d="M23 13C24.6569 13 26 11.6569 26 10C26 8.34315 24.6569 7 23 7C21.3431 7 20 8.34315 20 10C20 11.6569 21.3431 13 23 13Z" fill="white" />
          <path d="M30 20C31.6569 20 33 18.6569 33 17C33 15.3431 31.6569 14 30 14C28.3431 14 27 15.3431 27 17C27 18.6569 28.3431 20 30 20Z" fill="white" />
          <path d="M30 26C31.6569 26 33 24.6569 33 23C33 21.3431 31.6569 20 30 20C28.3431 20 27 21.3431 27 23C27 24.6569 28.3431 26 30 26Z" fill="white" />
          <path d="M17 33C18.6569 33 20 31.6569 20 30C20 28.3431 18.6569 27 17 27C15.3431 27 14 28.3431 14 30C14 31.6569 15.3431 33 17 33Z" fill="white" />
          <path d="M23 33C24.6569 33 26 31.6569 26 30C26 28.3431 24.6569 27 23 27C21.3431 27 20 28.3431 20 30C20 31.6569 21.3431 33 23 33Z" fill="white" />
          <path d="M30 25C31.1046 25 32 24.1046 32 23C32 21.8954 31.1046 21 30 21C28.8954 21 28 21.8954 28 23C28 24.1046 28.8954 25 30 25Z" fill="#1A192B" />
          <path d="M17 32C18.1046 32 19 31.1046 19 30C19 28.8954 18.1046 28 17 28C15.8954 28 15 28.8954 15 30C15 31.1046 15.8954 32 17 32Z" fill="#1A192B" />
          <path d="M23 32C24.1046 32 25 31.1046 25 30C25 28.8954 24.1046 28 23 28C21.8954 28 21 28.8954 21 30C21 31.1046 21.8954 32 23 32Z" fill="#1A192B" />
          <path d="M22 9.5H18V10.5H22V9.5Z" fill="#1A192B" opacity="0.35" />
          <path d="M29.5 17.5V21.5H30.5V17.5H29.5Z" fill="#1A192B" opacity="0.35" />
          <path d="M22 29.5H18V30.5H22V29.5Z" fill="#1A192B" opacity="0.35" />
          <path d="M17 12C18.1046 12 19 11.1046 19 10C19 8.89543 18.1046 8 17 8C15.8954 8 15 8.89543 15 10C15 11.1046 15.8954 12 17 12Z" fill="#1A192B" />
          <path d="M23 12C24.1046 12 25 11.1046 25 10C25 8.89543 24.1046 8 23 8C21.8954 8 21 8.89543 21 10C21 11.1046 21.8954 12 23 12Z" fill="#2563EB" />
          <path d="M30 19C31.1046 19 32 18.1046 32 17C32 15.8954 31.1046 15 30 15C28.8954 15 28 15.8954 28 17C28 18.1046 28.8954 19 30 19Z" fill="#2563EB" />
        </svg>
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700">
          Interactive
        </p>
        <p className="text-sm font-semibold text-slate-950 sm:text-base">
          Workflow Builder
        </p>
      </div>
    </div>
  );
}

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
    <div className="relative min-h-dvh overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.22),transparent_36%),linear-gradient(135deg,#f8fbff_0%,#eef6ff_45%,#fef7ed_100%)]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.07)_1px,transparent_1px)] bg-size-[44px_44px]" />
      <div
        className={cn(
          "relative mx-auto flex min-h-dvh max-w-6xl justify-center px-4 sm:px-6 lg:px-8",
          compact ? "items-start py-3 sm:items-center sm:py-4" : "items-center py-10"
        )}
      >
        <Card
          className={cn(
            "w-full max-w-xl rounded-4xl border-white/70 bg-white/82 shadow-[0_24px_80px_rgba(15,23,42,0.14)] backdrop-blur",
            compact && "max-w-lg"
          )}
        >
          <CardContent className={cn(compact ? "p-4 sm:p-5" : "p-6 sm:p-8")}>
            <div className={cn(compact ? "mb-4" : "mb-8")}>
              <div className="flex items-start justify-between gap-3">
                <AuthBrandMark />
                <span className="inline-flex shrink-0 rounded-full bg-slate-950 px-3 py-1 text-xs font-medium text-white">
                  {badge}
                </span>
              </div>
              <div className={cn(compact ? "mt-3" : "mt-5")} />
              <h2
                className={cn(
                  "font-semibold tracking-tight text-slate-950",
                  compact ? "text-[1.65rem] leading-tight" : "mt-4 text-3xl"
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
