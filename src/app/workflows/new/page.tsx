import { HomePage } from "@/app/modules/Home/pages/home.page";
import { ProtectedLayout } from "@/features/auth/layouts/protected.layout";

type NewWorkflowRouteProps = {
  searchParams?: Promise<{
    template?: string;
  }>;
};

export default async function NewWorkflowRoute({ searchParams }: NewWorkflowRouteProps) {
  const resolvedSearchParams = await searchParams;
  const template = resolvedSearchParams?.template === "blank" ? "blank" : "approval";

  return (
    <ProtectedLayout>
      <HomePage template={template} />
    </ProtectedLayout>
  );
}
