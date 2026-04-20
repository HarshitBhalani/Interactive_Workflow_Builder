import type { ReactNode } from "react";
import { AuthProvider } from "@/features/auth/context/auth.context";
import { ToastProvider } from "@/components/ui/toast";

type RootLayoutProps = {
  children: ReactNode;
};

export function RootLayoutView({ children }: RootLayoutProps) {
  return (
    <body suppressHydrationWarning className="min-h-full flex flex-col">
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    </body>
  );
}
