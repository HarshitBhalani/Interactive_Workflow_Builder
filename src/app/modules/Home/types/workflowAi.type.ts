import type { WorkflowNodeKind, WorkflowNodeShape, WorkflowSnapshot } from "./workflow.type";

export type GeneratedWorkflowNode = {
  id: string;
  kind: WorkflowNodeKind;
  title: string;
  subtitle: string;
  shape?: WorkflowNodeShape;
  color?: string | null;
};

export type GeneratedWorkflowEdge = {
  source: string;
  target: string;
  label?: string;
};

export type GeneratedWorkflowDefinition = {
  title: string;
  description: string;
  nodes: GeneratedWorkflowNode[];
  edges: GeneratedWorkflowEdge[];
};

export type GeneratedWorkflowResult = {
  description: string;
  snapshot: WorkflowSnapshot;
  title: string;
};
