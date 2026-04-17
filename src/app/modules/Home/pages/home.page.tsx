import { WorkflowShell } from "../components/workflowShell.component";
import type { JSX } from "react";

type HomePageProps = {
  workflowId?: string;
};

export function HomePage({ workflowId }: HomePageProps): JSX.Element {
  return <WorkflowShell workflowId={workflowId} />;
}
