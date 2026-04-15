import type { Edge, Node } from "reactflow";

export type WorkflowNodeKind = "start" | "action" | "condition" | "end";
export type WorkflowExecutionStatus = "idle" | "running" | "success" | "error";
export type WorkflowConditionBranch = "yes" | "no";

export type WorkflowNodeConfig = {
  delayMs?: number;
  preferredBranch?: WorkflowConditionBranch;
};

export type WorkflowNodeOutput = Record<string, unknown> | null;

export type WorkflowNodeData = {
  title: string;
  subtitle: string;
  kind: WorkflowNodeKind;
  config: WorkflowNodeConfig;
  status: WorkflowExecutionStatus;
  output: WorkflowNodeOutput;
  lastError: string | null;
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

export type WorkflowExecutionLog = {
  id: string;
  nodeId: string | null;
  message: string;
  status: Exclude<WorkflowExecutionStatus, "idle"> | "info";
  timestamp: string;
};

export type WorkflowExecutionResult = {
  output: WorkflowNodeOutput;
  nextBranch?: WorkflowConditionBranch;
};
