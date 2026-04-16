"use client";

import { HomePage } from "@/app/modules/Home/pages/home.page";
import { ProtectedLayout } from "@/features/auth/layouts/protected.layout";

export default function Page() {
  return (
    <ProtectedLayout>
      <HomePage />
    </ProtectedLayout>
  );
}
