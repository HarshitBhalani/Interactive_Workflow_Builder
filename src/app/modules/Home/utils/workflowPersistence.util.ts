import type {
  WorkflowNodeConfig,
  WorkflowGraphEdge,
  WorkflowGraphNode,
  WorkflowNodeKind,
  WorkflowSnapshot,
} from "../types/workflow.type";

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

export function normalizeWorkflowNode(node: WorkflowGraphNode): WorkflowGraphNode {
  return {
    ...node,
    selected: node.selected ?? false,
    data: {
      title: node.data.title,
      subtitle: node.data.subtitle,
      kind: node.data.kind,
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
