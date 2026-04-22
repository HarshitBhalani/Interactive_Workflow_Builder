import { WorkflowShell } from "../components/workflowShell.component";
import type { JSX } from "react";
import type { WorkflowTemplateId } from "@/features/workflows/configs/workflow-template.config";

type HomePageProps = {
  workflowId?: string;
  template?: WorkflowTemplateId;
};

export function HomePage({ workflowId, template }: HomePageProps): JSX.Element {
  return (
    <WorkflowShell
      key={`${workflowId ?? "new"}-${template ?? "approval"}`}
      workflowId={workflowId}
      template={template}
    />
  );
}
