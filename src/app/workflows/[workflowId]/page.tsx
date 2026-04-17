import { HomePage } from "@/app/modules/Home/pages/home.page";
import { ProtectedLayout } from "@/features/auth/layouts/protected.layout";

type WorkflowEditorRouteProps = {
  params: Promise<{
    workflowId: string;
  }>;
};

export default async function WorkflowEditorRoute({
  params,
}: WorkflowEditorRouteProps) {
  const { workflowId } = await params;

  return (
    <ProtectedLayout>
      <HomePage workflowId={workflowId} />
    </ProtectedLayout>
  );
}
