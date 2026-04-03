import type { ReactNode } from "react";

type RootLayoutProps = {
  children: ReactNode;
};

export function RootLayoutView({ children }: RootLayoutProps) {
  return (
    <body suppressHydrationWarning className="min-h-full flex flex-col">
      {children}
    </body>
  );
}
