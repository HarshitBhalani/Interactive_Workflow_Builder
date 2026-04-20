"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/context/auth.context";

export function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/signup");
    }
  }, [loading, router, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.2),transparent_35%),linear-gradient(180deg,#f8fbff_0%,#eef6ff_100%)] px-4 py-10">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
          <div className="w-full max-w-5xl rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.14)] backdrop-blur sm:p-8">
            <div className="space-y-6">
              <div className="space-y-3">
                <Skeleton className="h-8 w-32 rounded-full" />
                <Skeleton className="h-12 w-72 max-w-full" />
                <Skeleton className="h-5 w-full max-w-xl" />
              </div>
              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <Skeleton className="h-72 rounded-[28px]" />
                <div className="space-y-4">
                  <Skeleton className="h-20 rounded-[24px]" />
                  <Skeleton className="h-20 rounded-[24px]" />
                  <Skeleton className="h-20 rounded-[24px]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
