import type {
  WorkflowNodeConfig,
  WorkflowGraphEdge,
  WorkflowGraphNode,
  WorkflowNodeKind,
  WorkflowNodeShape,
  WorkflowSnapshot,
} from "../types/workflow.type";
import { getDefaultWorkflowNodeShape } from "./workflowNodeFactory.util";

const workflowNodeKinds: WorkflowNodeKind[] = [
  "start",
  "action",
  "condition",
  "end",
];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isWorkflowNodeKind(value: unknown): value is WorkflowNodeKind {
  return typeof value === "string" && workflowNodeKinds.includes(value as WorkflowNodeKind);
}

function isWorkflowNode(node: unknown): node is WorkflowGraphNode {
  if (!isPlainObject(node)) {
    return false;
  }

  if (typeof node.id !== "string" || !isPlainObject(node.position)) {
    return false;
  }

  if (
    typeof node.position.x !== "number" ||
    typeof node.position.y !== "number" ||
    !isPlainObject(node.data)
  ) {
    return false;
  }

  return (
    typeof node.data.title === "string" &&
    typeof node.data.subtitle === "string" &&
    isWorkflowNodeKind(node.data.kind)
  );
}

function normalizeWorkflowNodeColor(color: unknown): string | null {
  return typeof color === "string" && color.trim().length > 0 ? color : null;
}

function normalizeWorkflowGroupMeta(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function isWorkflowNodeShape(value: unknown): value is WorkflowNodeShape {
  return (
    value === "terminator" ||
    value === "rectangle" ||
    value === "square" ||
    value === "diamond" ||
    value === "parallelogram" ||
    value === "hexagon" ||
    value === "circle" ||
    value === "document"
  );
}

function isWorkflowEdge(edge: unknown): edge is WorkflowGraphEdge {
  if (!isPlainObject(edge)) {
    return false;
  }

  return (
    typeof edge.id === "string" &&
    typeof edge.source === "string" &&
    typeof edge.target === "string"
  );
}

function createDefaultNodeConfig(kind: WorkflowNodeKind): WorkflowNodeConfig {
  switch (kind) {
    case "action":
      return {
        delayMs: 600,
      };
    case "condition":
      return {
        preferredBranch: "yes",
      };
    case "start":
    case "end":
    default:
      return {};
  }
}

function normalizeWorkflowNodeConfig(
  kind: WorkflowNodeKind,
  config: unknown,
): WorkflowNodeConfig {
  const defaultConfig = createDefaultNodeConfig(kind);

  if (!isPlainObject(config)) {
    return defaultConfig;
  }

  switch (kind) {
    case "action":
      return {
        ...defaultConfig,
        delayMs:
          typeof config.delayMs === "number" && config.delayMs > 0
            ? config.delayMs
            : defaultConfig.delayMs,
      };
    case "condition":
      return {
        ...defaultConfig,
        preferredBranch:
          config.preferredBranch === "no" || config.preferredBranch === "yes"
            ? config.preferredBranch
            : defaultConfig.preferredBranch,
      };
    case "start":
    case "end":
    default:
      return defaultConfig;
  }
}

function normalizeWorkflowNodeShape(
  kind: WorkflowNodeKind,
  shape: unknown,
): WorkflowNodeShape {
  const defaultShape = getDefaultWorkflowNodeShape(kind);

  if (!isWorkflowNodeShape(shape)) {
    return defaultShape;
  }

  switch (kind) {
    case "start":
      return shape === "terminator" || shape === "circle" ? shape : defaultShape;
    case "action":
      return (
        shape === "rectangle" ||
        shape === "square" ||
        shape === "parallelogram" ||
        shape === "hexagon" ||
        shape === "document"
      )
        ? shape
        : defaultShape;
    case "condition":
      return shape === "diamond" ? shape : defaultShape;
    case "end":
      return shape === "circle" || shape === "terminator" || shape === "document"
        ? shape
        : defaultShape;
    default:
      return defaultShape;
  }
}

function shouldUseLegacyPreviewEndShape(node: WorkflowGraphNode): boolean {
  return (
    node.data.kind === "end" &&
    (node.id === "endApproved" || node.id === "endRejected")
  );
}

export function normalizeWorkflowNode(node: WorkflowGraphNode): WorkflowGraphNode {
  const normalizedShape = shouldUseLegacyPreviewEndShape(node)
    ? "terminator"
    : normalizeWorkflowNodeShape(node.data.kind, node.data.shape);

  return {
    ...node,
    selected: node.selected ?? false,
    data: {
      title: node.data.title,
      subtitle: node.data.subtitle,
      kind: node.data.kind,
      shape: normalizedShape,
      isLocked: node.data.isLocked ?? false,
      color: normalizeWorkflowNodeColor(node.data.color),
      groupId: normalizeWorkflowGroupMeta(node.data.groupId),
      groupLabel: normalizeWorkflowGroupMeta(node.data.groupLabel),
      groupColor: normalizeWorkflowNodeColor(node.data.groupColor),
      config: normalizeWorkflowNodeConfig(node.data.kind, node.data.config),
      status: "idle",
      output: null,
      lastError: null,
    },
  };
}

export function normalizeWorkflowNodes(nodes: WorkflowGraphNode[]): WorkflowGraphNode[] {
  return nodes.map(normalizeWorkflowNode);
}

export function createWorkflowSnapshot(
  nodes: WorkflowGraphNode[],
  edges: WorkflowGraphEdge[]
): WorkflowSnapshot {
  return {
    nodes: normalizeWorkflowNodes(nodes).map((node) => ({
      ...node,
      selected: false,
    })),
    edges,
  };
}

export function parseWorkflowSnapshot(jsonText: string): WorkflowSnapshot {
  const parsedValue: unknown = JSON.parse(jsonText);

  if (!isPlainObject(parsedValue)) {
    throw new Error("The imported file is not a valid workflow object.");
  }

  if (
    !Array.isArray(parsedValue.nodes) ||
    !parsedValue.nodes.every(isWorkflowNode) ||
    !Array.isArray(parsedValue.edges) ||
    !parsedValue.edges.every(isWorkflowEdge)
  ) {
    throw new Error("The JSON must contain valid nodes and edges arrays.");
  }

  return {
    nodes: normalizeWorkflowNodes(parsedValue.nodes).map((node) => ({
      ...node,
      selected: false,
    })),
    edges: parsedValue.edges,
  };
}
