import type { XYPosition } from "reactflow";
import type {
  WorkflowGraphNode,
  WorkflowNodeKind,
  WorkflowNodeShape,
  WorkflowNodeTemplate,
} from "../types/workflow.type";

type WorkflowNodeAppearance = {
  badgeClassName: string;
  sidebarClassName: string;
  sidebarButtonClassName: string;
  cardClassName: string;
  minimapColor: string;
};

type WorkflowNodeShapeAppearance = {
  frameClassName: string;
  shellClassName: string;
  contentClassName: string;
};

const defaultShapeByKind: Record<WorkflowNodeKind, WorkflowNodeShape> = {
  start: "terminator",
  action: "rectangle",
  condition: "diamond",
  end: "circle",
};

const allowedShapesByKind: Record<WorkflowNodeKind, WorkflowNodeShape[]> = {
  start: ["terminator", "circle"],
  action: ["rectangle", "square", "parallelogram", "hexagon", "document"],
  condition: ["diamond"],
  end: ["circle", "terminator", "document"],
};

export const workflowNodeCatalog: WorkflowNodeTemplate[] = [
  {
    key: "start-terminator",
    kind: "start",
    shape: "terminator",
    label: "Terminator Start",
    defaultSubtitle: "Begin the workflow path",
    keywords: ["start", "entry", "oval", "terminator", "begin"],
  },
  {
    key: "start-circle",
    kind: "start",
    shape: "circle",
    label: "Circle Start",
    defaultSubtitle: "Compact workflow entry point",
    keywords: ["start", "circle", "entry", "connector"],
  },
  {
    key: "action-rectangle",
    kind: "action",
    shape: "rectangle",
    label: "Rectangle Action",
    defaultSubtitle: "Standard process step",
    keywords: ["action", "process", "rectangle", "task"],
  },
  {
    key: "action-square",
    kind: "action",
    shape: "square",
    label: "Square Action",
    defaultSubtitle: "Balanced processing block",
    keywords: ["action", "square", "process", "task"],
  },
  {
    key: "action-parallelogram",
    kind: "action",
    shape: "parallelogram",
    label: "Parallelogram Action",
    defaultSubtitle: "Input or data step",
    keywords: ["action", "data", "input", "parallelogram"],
  },
  {
    key: "action-hexagon",
    kind: "action",
    shape: "hexagon",
    label: "Hexagon Action",
    defaultSubtitle: "Preparation or setup step",
    keywords: ["action", "hexagon", "preparation", "setup"],
  },
  {
    key: "action-document",
    kind: "action",
    shape: "document",
    label: "Document Action",
    defaultSubtitle: "Document or form task",
    keywords: ["action", "document", "form", "record"],
  },
  {
    key: "condition-diamond",
    kind: "condition",
    shape: "diamond",
    label: "Diamond Condition",
    defaultSubtitle: "Branch on a yes or no decision",
    keywords: ["condition", "decision", "diamond", "branch"],
  },
  {
    key: "end-circle",
    kind: "end",
    shape: "circle",
    label: "Circle End",
    defaultSubtitle: "Close the workflow branch",
    keywords: ["end", "circle", "finish", "connector"],
  },
  {
    key: "end-terminator",
    kind: "end",
    shape: "terminator",
    label: "Terminator End",
    defaultSubtitle: "Finish with a terminal shape",
    keywords: ["end", "terminator", "finish", "oval"],
  },
  {
    key: "end-document",
    kind: "end",
    shape: "document",
    label: "Document End",
    defaultSubtitle: "Finish with a generated document",
    keywords: ["end", "document", "report", "finish"],
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
    cardClassName: "border-emerald-200/90 bg-emerald-50",
    minimapColor: "#10b981",
  },
  action: {
    badgeClassName: "border-sky-200 bg-sky-50 text-sky-700",
    sidebarClassName:
      "border-sky-200/80 bg-sky-50/70 hover:border-sky-300 hover:bg-sky-50",
    sidebarButtonClassName:
      "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-white hover:text-sky-700",
    cardClassName: "border-sky-200/90 bg-sky-50",
    minimapColor: "#0ea5e9",
  },
  condition: {
    badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
    sidebarClassName:
      "border-amber-200/80 bg-amber-50/70 hover:border-amber-300 hover:bg-amber-50",
    sidebarButtonClassName:
      "border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-white hover:text-amber-700",
    cardClassName: "border-amber-200/90 bg-amber-50",
    minimapColor: "#f59e0b",
  },
  end: {
    badgeClassName: "border-slate-200 bg-slate-100 text-slate-700",
    sidebarClassName:
      "border-slate-200/80 bg-slate-100/70 hover:border-slate-300 hover:bg-slate-100",
    sidebarButtonClassName:
      "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-white hover:text-slate-800",
    cardClassName: "border-slate-200/90 bg-slate-50",
    minimapColor: "#64748b",
  },
};

export const workflowNodeShapeAppearanceByShape: Record<
  WorkflowNodeShape,
  WorkflowNodeShapeAppearance
> = {
  terminator: {
    frameClassName: "w-56 min-h-[132px] sm:w-60",
    shellClassName: "rounded-[999px]",
    contentClassName: "justify-center px-6 py-5 text-center",
  },
  rectangle: {
    frameClassName: "w-56 min-h-[132px] sm:w-60",
    shellClassName: "rounded-2xl",
    contentClassName: "px-4 py-4",
  },
  square: {
    frameClassName: "w-48 min-h-48",
    shellClassName: "rounded-[30px]",
    contentClassName: "justify-center px-5 py-5 text-center",
  },
  diamond: {
    frameClassName: "w-56 min-h-[176px] sm:w-60",
    shellClassName: "[clip-path:polygon(50%_0%,100%_50%,50%_100%,0%_50%)]",
    contentClassName: "justify-center px-8 py-7 text-center",
  },
  parallelogram: {
    frameClassName: "w-56 min-h-[132px] sm:w-60",
    shellClassName: "[clip-path:polygon(12%_0%,100%_0%,88%_100%,0%_100%)]",
    contentClassName: "px-7 py-4",
  },
  hexagon: {
    frameClassName: "w-56 min-h-[136px] sm:w-60",
    shellClassName: "[clip-path:polygon(12%_0%,88%_0%,100%_50%,88%_100%,12%_100%,0%_50%)]",
    contentClassName: "px-7 py-4",
  },
  circle: {
    frameClassName: "w-48 min-h-48",
    shellClassName: "rounded-full",
    contentClassName: "justify-center px-5 py-5 text-center",
  },
  document: {
    frameClassName: "w-56 min-h-[140px] sm:w-60",
    shellClassName: "[clip-path:polygon(0%_0%,100%_0%,100%_78%,82%_90%,58%_84%,34%_94%,0%_84%)]",
    contentClassName: "px-4 py-4",
  },
};

const nodeLabelByKind: Record<WorkflowNodeKind, string> = {
  start: "Start",
  action: "Action",
  condition: "Condition",
  end: "End",
};

function getAllowedShape(kind: WorkflowNodeKind, shape?: WorkflowNodeShape): WorkflowNodeShape {
  const allowedShapes = allowedShapesByKind[kind];

  if (shape && allowedShapes.includes(shape)) {
    return shape;
  }

  return defaultShapeByKind[kind];
}

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

function createDefaultNodeConfig(kind: WorkflowNodeKind) {
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
    default:
      return {};
  }
}

function getNodeSubtitle(
  kind: WorkflowNodeKind,
  shape: WorkflowNodeShape,
): string {
  return (
    workflowNodeCatalog.find(
      (item) => item.kind === kind && item.shape === shape,
    )?.defaultSubtitle ?? "Add a short description"
  );
}

export function getDefaultWorkflowNodeShape(kind: WorkflowNodeKind): WorkflowNodeShape {
  return defaultShapeByKind[kind];
}

export function createWorkflowNode(
  kind: WorkflowNodeKind,
  nodes: WorkflowGraphNode[],
  position?: XYPosition,
  shape?: WorkflowNodeShape,
): WorkflowGraphNode {
  const nodeNumber = getNextNodeNumber(kind, nodes);
  const resolvedShape = getAllowedShape(kind, shape);
  const generatedTitle = `${nodeLabelByKind[kind]}-${nodeNumber}`;

  return {
    id: `${kind}-${nodeNumber}`,
    type: "workflowNode",
    position: position ?? getNextNodePosition(nodes),
    selected: true,
    data: {
      title: generatedTitle,
      subtitle: getNodeSubtitle(kind, resolvedShape),
      kind,
      shape: resolvedShape,
      isLocked: false,
      color: null,
      groupId: null,
      groupLabel: null,
      groupColor: null,
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
  const generatedTitle = `${nodeLabelByKind[nodeToCopy.data.kind]}-${nodeNumber}`;

  return {
    ...nodeToCopy,
    id: `${nodeToCopy.data.kind}-${nodeNumber}`,
    position: position ?? nodeToCopy.position,
    selected: true,
    data: {
      ...nodeToCopy.data,
      title: generatedTitle,
      shape: getAllowedShape(nodeToCopy.data.kind, nodeToCopy.data.shape),
      isLocked: nodeToCopy.data.isLocked ?? false,
      color: nodeToCopy.data.color ?? null,
      config: {
        ...nodeToCopy.data.config,
      },
      status: "idle",
      output: null,
      lastError: null,
    },
  };
}
