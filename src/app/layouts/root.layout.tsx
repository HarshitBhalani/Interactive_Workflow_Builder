import type { ReactNode } from "react";
import { AuthProvider } from "@/features/auth/context/auth.context";

type RootLayoutProps = {
  children: ReactNode;
};

export function RootLayoutView({ children }: RootLayoutProps) {
  return (
    <body suppressHydrationWarning className="min-h-full flex flex-col">
      <AuthProvider>{children}</AuthProvider>
    </body>
  );
}
