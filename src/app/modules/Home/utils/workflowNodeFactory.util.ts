import type { XYPosition } from "reactflow";
import type { WorkflowGraphNode, WorkflowNodeKind } from "../types/workflow.type";

const nodeContentByKind = {
  start: {
    title: "Start",
    subtitle: "New entry point",
  },
  action: {
    title: "Action",
    subtitle: "Add the next task",
  },
  condition: {
    title: "Condition",
    subtitle: "Check a decision rule",
  },
  end: {
    title: "End",
    subtitle: "Finish this path",
  },
} satisfies Record<WorkflowNodeKind, { title: string; subtitle: string }>;

export const workflowSidebarNodeKinds: WorkflowNodeKind[] = [
  "start",
  "action",
  "condition",
  "end",
];

function getNextNodeNumber(
  kind: WorkflowNodeKind,
  nodes: WorkflowGraphNode[]
) {
  return (
    nodes.filter((node) => node.data.kind === kind).length + 1
  );
}

function getNextNodePosition(nodes: WorkflowGraphNode[]) {
  const nextIndex = nodes.length;

  return {
    x: 120 + (nextIndex % 3) * 250,
    y: 60 + Math.floor(nextIndex / 3) * 150,
  };
}

export function createWorkflowNode(
  kind: WorkflowNodeKind,
  nodes: WorkflowGraphNode[],
  position?: XYPosition
): WorkflowGraphNode {
  const nodeNumber = getNextNodeNumber(kind, nodes);
  const nodeContent = nodeContentByKind[kind];

  return {
    id: `${kind}-${nodeNumber}`,
    type: "workflowNode",
    position: position ?? getNextNodePosition(nodes),
    selected: true,
    data: {
      title: nodeContent.title,
      subtitle: nodeContent.subtitle,
      kind,
    },
  };
}
