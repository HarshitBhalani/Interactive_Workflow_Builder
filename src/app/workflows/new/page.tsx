import { HomePage } from "@/app/modules/Home/pages/home.page";
import { ProtectedLayout } from "@/features/auth/layouts/protected.layout";
import type { WorkflowTemplateId } from "@/features/workflows/configs/workflow-template.config";

type NewWorkflowRouteProps = {
  searchParams?: Promise<{
    template?: string;
  }>;
};

export default async function NewWorkflowRoute({ searchParams }: NewWorkflowRouteProps) {
  const resolvedSearchParams = await searchParams;
  const templateParam = resolvedSearchParams?.template;
  const supportedTemplates: WorkflowTemplateId[] = [
    "blank",
    "approval",
  ];
  const template = supportedTemplates.includes(templateParam as WorkflowTemplateId)
    ? (templateParam as WorkflowTemplateId)
    : "approval";

  return (
    <ProtectedLayout>
      <HomePage template={template} />
    </ProtectedLayout>
  );
}
