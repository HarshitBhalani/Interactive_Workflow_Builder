import type { Edge, Node } from "reactflow";

export type WorkflowNodeKind = "start" | "action" | "condition" | "end";

export type WorkflowNodeData = {
  title: string;
  subtitle: string;
  kind: WorkflowNodeKind;
};

export type WorkflowGraphNode = Node<WorkflowNodeData>;
export type WorkflowGraphEdge = Edge;
