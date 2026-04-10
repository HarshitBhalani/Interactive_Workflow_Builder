import type { Edge, Node } from "reactflow";

export type WorkflowNodeKind = "start" | "action" | "condition" | "end";

export type WorkflowNodeData = {
  title: string;
  subtitle: string;
  kind: WorkflowNodeKind;
  onEdit?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
};

export type WorkflowGraphNode = Node<WorkflowNodeData>;
export type WorkflowEditorNodeData = WorkflowNodeData & {
  onEdit: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
};
export type WorkflowCanvasNode = Node<WorkflowEditorNodeData>;
export type WorkflowGraphEdge = Edge;

export type WorkflowSnapshot = {
  nodes: WorkflowGraphNode[];
  edges: WorkflowGraphEdge[];
};
