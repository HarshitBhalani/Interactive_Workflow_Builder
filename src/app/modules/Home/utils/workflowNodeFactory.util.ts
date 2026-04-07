import type { XYPosition } from "reactflow";
import type { WorkflowGraphNode, WorkflowNodeKind } from "../types/workflow.type";

type WorkflowNodeCatalogItem = {
  kind: WorkflowNodeKind;
  badge: string;
  defaultSubtitle: string;
  // helperText: string;
};

export const workflowNodeCatalog: WorkflowNodeCatalogItem[] = [
  {
    kind: "start",
    badge: "Start",
    defaultSubtitle: "New entry point",
    // helperText: "Use this when a workflow begins.",
  },
  {
    kind: "action",
    badge: "Action",
    defaultSubtitle: "Add the next task",
    // helperText: "Use this for a task or handoff.",
  },
  {
    kind: "condition",
    badge: "Condition",
    defaultSubtitle: "Check a decision rule",
    // helperText: "Use this when the flow can branch.",
  },
  {
    kind: "end",
    badge: "End",
    defaultSubtitle: "Finish this path",
    // helperText: "Use this to close a branch.",
  },
];

const nodeContentByKind = workflowNodeCatalog.reduce<
  Record<WorkflowNodeKind, Omit<WorkflowNodeCatalogItem, "kind">>
>((catalog, item) => {
  catalog[item.kind] = {
    badge: item.badge,
    defaultSubtitle: item.defaultSubtitle,
    // helperText: item.helperText,
  };

  return catalog;
}, {} as Record<WorkflowNodeKind, Omit<WorkflowNodeCatalogItem, "kind">>);

function getNextNodeNumber(kind: WorkflowNodeKind, nodes: WorkflowGraphNode[]) {
  return nodes.filter((node) => node.data.kind === kind).length + 1;
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
      title: nodeContent.badge,
      subtitle: nodeContent.defaultSubtitle,
      kind,
    },
  };
}
