export type WorkflowNodeKind = "start" | "action" | "condition" | "end";

export type WorkflowNodeData = {
  title: string;
  subtitle: string;
  kind: WorkflowNodeKind;
};
