import { WorkflowShell } from "../components/workflowShell.component";
import type { JSX } from "react";

type HomePageProps = {
  workflowId?: string;
  template?: "blank" | "approval";
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
