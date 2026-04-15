import type { XYPosition } from "reactflow";
import type { WorkflowGraphNode, WorkflowNodeKind } from "../types/workflow.type";

type WorkflowNodeCatalogItem = {
  kind: WorkflowNodeKind;
  badge: string;
  defaultSubtitle: string;
  // helperText: string;
};

type WorkflowNodeAppearance = {
  badgeClassName: string;
  sidebarClassName: string;
  sidebarButtonClassName: string;
  cardClassName: string;
  minimapColor: string;
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
    defaultSubtitle: "Add next task",
    // helperText: "Use this for a task or handoff.",
  },
  { 
    kind: "condition",
    badge: "Condition",
    defaultSubtitle: "Check decision rule",
    // helperText: "Use this when the flow can branch.",
  },
  {
    kind: "end",
    badge: "End",
    defaultSubtitle: "Finish this path",
    // helperText: "Use this to close a branch.",
  },
];

export const workflowNodeAppearanceByKind: Record<
  WorkflowNodeKind,
  WorkflowNodeAppearance
> = {
  start: {
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    sidebarClassName:
      "border-emerald-200/80 bg-emerald-50/70 hover:border-emerald-300 hover:bg-emerald-50",
    sidebarButtonClassName:
      "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-white hover:text-emerald-700",
    cardClassName:
      "border-emerald-200/90 bg-emerald-50",
    minimapColor: "#10b981",
  },
  action: {
    badgeClassName: "border-sky-200 bg-sky-50 text-sky-700",
    sidebarClassName:
      "border-sky-200/80 bg-sky-50/70 hover:border-sky-300 hover:bg-sky-50",
    sidebarButtonClassName:
      "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-white hover:text-sky-700",
    cardClassName:
      "border-sky-200/90 bg-sky-50",
    minimapColor: "#0ea5e9",
  },
  condition: {
    badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
    sidebarClassName:
      "border-amber-200/80 bg-amber-50/70 hover:border-amber-300 hover:bg-amber-50",
    sidebarButtonClassName:
      "border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-white hover:text-amber-700",
    cardClassName:
      "border-amber-200/90 bg-amber-50",
    minimapColor: "#f59e0b",
  },
  end: {
    badgeClassName: "border-slate-200 bg-slate-100 text-slate-700",
    sidebarClassName:
      "border-slate-200/80 bg-slate-100/70 hover:border-slate-300 hover:bg-slate-100",
    sidebarButtonClassName:
      "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-white hover:text-slate-800",
    cardClassName:
      "border-slate-200/90 bg-slate-50",
    minimapColor: "#64748b",
  },
};

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

function getNextNodeNumber(kind: WorkflowNodeKind, nodes: WorkflowGraphNode[]): number {
  const takenNumbers = new Set(
    nodes
      .filter((node) => node.data.kind === kind)
      .map((node) => {
        const match = node.id.match(new RegExp(`^${kind}-(\\d+)$`));

        return match ? Number(match[1]) : null;
      })
      .filter((value): value is number => value !== null),
  );

  let nextNumber = 1;

  while (takenNumbers.has(nextNumber)) {
    nextNumber += 1;
  }

  return nextNumber;
}

function getNextNodePosition(nodes: WorkflowGraphNode[]): XYPosition {
  const nextIndex = nodes.length;

  return {
    x: 120 + (nextIndex % 3) * 250,
    y: 60 + Math.floor(nextIndex / 3) * 150,
  };
}

function createDefaultNodeConfig(kind: WorkflowNodeKind){

  switch (kind) {
    case "start":
      return {};

    case "action":
      return {
        delayMs: 600,
      };

    case "condition":
      return {
        preferredBranch: "yes" as const,
      };

    case "end":
      return {};

    default:
      return {};
  }
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
      config: createDefaultNodeConfig(kind),
      status: "idle",
      output: null,
      lastError: null,
    },
  };
}

export function createWorkflowNodeCopy(
  nodeToCopy: WorkflowGraphNode,
  nodes: WorkflowGraphNode[],
  position?: XYPosition,
): WorkflowGraphNode {
  const nodeNumber = getNextNodeNumber(nodeToCopy.data.kind, nodes);

  return {
    ...nodeToCopy,
    id: `${nodeToCopy.data.kind}-${nodeNumber}`,
    position: position ?? nodeToCopy.position,
    selected: true,
    data: {
      ...nodeToCopy.data,

      config: {
        ...nodeToCopy.data.config,
      },
      
      status: "idle",
      output: null,
      lastError: null,
    },
  };
}
