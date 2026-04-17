import { HomePage } from "@/app/modules/Home/pages/home.page";
import { ProtectedLayout } from "@/features/auth/layouts/protected.layout";

export default function NewWorkflowRoute() {
  return (
    <ProtectedLayout>
      <HomePage />
    </ProtectedLayout>
  );
}
