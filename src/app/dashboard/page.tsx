import { ProtectedLayout } from "@/features/auth/layouts/protected.layout";
import { WorkflowDashboard } from "@/features/workflows/components/workflow-dashboard.component";

export default function DashboardRoute() {
  return (
    <ProtectedLayout>
      <WorkflowDashboard />
    </ProtectedLayout>
  );
}
