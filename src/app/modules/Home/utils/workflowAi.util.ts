import { MarkerType } from "reactflow";
import type {
  WorkflowGraphEdge,
  WorkflowGraphNode,
  WorkflowNodeConfig,
  WorkflowNodeKind,
  WorkflowNodeShape,
} from "../types/workflow.type";
import type {
  GeneratedWorkflowDefinition,
  GeneratedWorkflowEdge,
  GeneratedWorkflowNode,
  GeneratedWorkflowResult,
} from "../types/workflowAi.type";
import { normalizeWorkflowNodes } from "./workflowPersistence.util";
import { getDefaultWorkflowNodeShape } from "./workflowNodeFactory.util";

const horizontalSpacingPx = 320;
const verticalSpacingPx = 220;
const initialCanvasX = 120;
const initialCanvasY = 80;
const maxGeneratedNodes = 12;

const allowedNodeKinds: WorkflowNodeKind[] = ["start", "action", "condition", "end"];
const yesLabels = new Set(["yes", "approved", "true", "pass"]);
const noLabels = new Set(["no", "rejected", "false", "fail"]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isWorkflowNodeKind(value: unknown): value is WorkflowNodeKind {
  return typeof value === "string" && allowedNodeKinds.includes(value as WorkflowNodeKind);
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

function sanitizeText(value: unknown, fallbackValue: string): string {
  if (typeof value !== "string") {
    return fallbackValue;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : fallbackValue;
}

function sanitizeColor(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function normalizeGeneratedShape(kind: WorkflowNodeKind, shape: unknown): WorkflowNodeShape {
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

function createDefaultNodeConfig(kind: WorkflowNodeKind): WorkflowNodeConfig {
  switch (kind) {
    case "action":
      return { delayMs: 600 };
    case "condition":
      return { preferredBranch: "yes" };
    default:
      return {};
  }
}

function normalizeBranchLabel(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return undefined;
  }

  const normalizedValue = trimmedValue.toLowerCase();

  if (yesLabels.has(normalizedValue)) {
    return "Yes";
  }

  if (noLabels.has(normalizedValue)) {
    return "No";
  }

  return trimmedValue.slice(0, 32);
}

function getSourceHandleFromLabel(label?: string): "yes" | "no" | undefined {
  if (!label) {
    return undefined;
  }

  return label === "Yes" ? "yes" : label === "No" ? "no" : undefined;
}

function buildGeneratedEdgeAppearance(label?: string): Partial<WorkflowGraphEdge> {
  const sourceHandle = getSourceHandleFromLabel(label);
  const strokeColor =
    sourceHandle === "yes"
      ? "#16a34a"
      : sourceHandle === "no"
        ? "#e11d48"
        : "#475569";

  return {
    label,
    labelStyle: label
      ? {
          fill: "#0f172a",
          fontWeight: 600,
        }
      : undefined,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: strokeColor,
    },
    sourceHandle,
    style: {
      stroke: strokeColor,
      strokeWidth: 1.5,
    },
    type: "workflowEdge",
  };
}

function getUniqueNodeId(preferredId: string, usedIds: Set<string>): string {
  const sanitizedBaseId = preferredId
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "node";

  if (!usedIds.has(sanitizedBaseId)) {
    usedIds.add(sanitizedBaseId);
    return sanitizedBaseId;
  }

  let suffix = 2;

  while (usedIds.has(`${sanitizedBaseId}-${suffix}`)) {
    suffix += 1;
  }

  const nextId = `${sanitizedBaseId}-${suffix}`;
  usedIds.add(nextId);
  return nextId;
}

function getUniqueEdgeId(
  preferredId: string,
  usedIds: Set<string>,
): string {
  if (!usedIds.has(preferredId)) {
    usedIds.add(preferredId);
    return preferredId;
  }

  let suffix = 2;

  while (usedIds.has(`${preferredId}-${suffix}`)) {
    suffix += 1;
  }

  const nextId = `${preferredId}-${suffix}`;
  usedIds.add(nextId);
  return nextId;
}

function normalizeGeneratedNodes(value: unknown): GeneratedWorkflowNode[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("The AI response did not include any workflow nodes.");
  }

  const usedNodeIds = new Set<string>();

  return value.slice(0, maxGeneratedNodes).map((nodeValue, index) => {
    if (!isPlainObject(nodeValue)) {
      throw new Error("The AI response contained an invalid workflow node.");
    }

    const kind = isWorkflowNodeKind(nodeValue.kind) ? nodeValue.kind : "action";
    const title = sanitizeText(nodeValue.title, `Step ${index + 1}`);

    return {
      id: getUniqueNodeId(
        typeof nodeValue.id === "string" ? nodeValue.id : `${kind}-${index + 1}`,
        usedNodeIds,
      ),
      kind,
      title,
      subtitle: sanitizeText(nodeValue.subtitle, "Add a short description"),
      shape: normalizeGeneratedShape(kind, nodeValue.shape),
      color: sanitizeColor(nodeValue.color),
    };
  });
}

function normalizeGeneratedEdges(
  value: unknown,
  nodes: GeneratedWorkflowNode[],
): GeneratedWorkflowEdge[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const nodeIds = new Set(nodes.map((node) => node.id));
  const normalizedEdges: GeneratedWorkflowEdge[] = [];
  const seenEdges = new Set<string>();

  for (const edgeValue of value) {
    if (!isPlainObject(edgeValue)) {
      continue;
    }

    const source = typeof edgeValue.source === "string" ? edgeValue.source.trim() : "";
    const target = typeof edgeValue.target === "string" ? edgeValue.target.trim() : "";

    if (!nodeIds.has(source) || !nodeIds.has(target) || source === target) {
      continue;
    }

    const label = normalizeBranchLabel(edgeValue.label);
    const edgeKey = `${source}-${label ?? "default"}-${target}`;

    if (seenEdges.has(edgeKey)) {
      continue;
    }

    seenEdges.add(edgeKey);
    normalizedEdges.push({ label, source, target });
  }

  return normalizedEdges;
}

function ensureWorkflowEndpoints(
  nodes: GeneratedWorkflowNode[],
): GeneratedWorkflowNode[] {
  const nextNodes = [...nodes];

  if (!nextNodes.some((node) => node.kind === "start")) {
    nextNodes[0] = {
      ...nextNodes[0],
      kind: "start",
      shape: getDefaultWorkflowNodeShape("start"),
    };
  }

  if (!nextNodes.some((node) => node.kind === "end")) {
    const lastNodeIndex = nextNodes.length - 1;
    nextNodes[lastNodeIndex] = {
      ...nextNodes[lastNodeIndex],
      kind: "end",
      shape: getDefaultWorkflowNodeShape("end"),
    };
  }

  return nextNodes.map((node) => ({
    ...node,
    shape: normalizeGeneratedShape(node.kind, node.shape),
  }));
}

function ensureConditionBranchLabels(
  nodes: GeneratedWorkflowNode[],
  edges: GeneratedWorkflowEdge[],
): GeneratedWorkflowEdge[] {
  const normalizedEdges = [...edges];

  for (const node of nodes) {
    if (node.kind !== "condition") {
      continue;
    }

    const outgoingEdges = normalizedEdges.filter((edge) => edge.source === node.id);

    if (outgoingEdges.length !== 2) {
      continue;
    }

    if (!outgoingEdges[0].label && !outgoingEdges[1].label) {
      outgoingEdges[0].label = "Yes";
      outgoingEdges[1].label = "No";
      continue;
    }

    if (!outgoingEdges[0].label && outgoingEdges[1].label === "No") {
      outgoingEdges[0].label = "Yes";
    }

    if (!outgoingEdges[1].label && outgoingEdges[0].label === "Yes") {
      outgoingEdges[1].label = "No";
    }
  }

  return normalizedEdges;
}

function buildNodeDepthMap(
  nodes: GeneratedWorkflowNode[],
  edges: GeneratedWorkflowEdge[],
): Map<string, number> {
  const depthMap = new Map<string, number>();
  const incomingCount = new Map<string, number>();
  const adjacencyMap = new Map<string, string[]>();

  nodes.forEach((node) => {
    incomingCount.set(node.id, 0);
    adjacencyMap.set(node.id, []);
  });

  edges.forEach((edge) => {
    adjacencyMap.get(edge.source)?.push(edge.target);
    incomingCount.set(edge.target, (incomingCount.get(edge.target) ?? 0) + 1);
  });

  const queue = nodes
    .filter((node) => (incomingCount.get(node.id) ?? 0) === 0)
    .map((node) => node.id);

  if (queue.length === 0 && nodes.length > 0) {
    queue.push(nodes[0].id);
  }

  queue.forEach((nodeId) => depthMap.set(nodeId, 0));

  while (queue.length > 0) {
    const activeNodeId = queue.shift();

    if (!activeNodeId) {
      continue;
    }

    const activeDepth = depthMap.get(activeNodeId) ?? 0;
    const nextNodeIds = adjacencyMap.get(activeNodeId) ?? [];

    for (const nextNodeId of nextNodeIds) {
      const nextDepth = activeDepth + 1;
      depthMap.set(nextNodeId, Math.max(depthMap.get(nextNodeId) ?? 0, nextDepth));
      incomingCount.set(nextNodeId, (incomingCount.get(nextNodeId) ?? 1) - 1);

      if ((incomingCount.get(nextNodeId) ?? 0) <= 0) {
        queue.push(nextNodeId);
      }
    }
  }

  nodes.forEach((node) => {
    if (!depthMap.has(node.id)) {
      depthMap.set(node.id, 0);
    }
  });

  return depthMap;
}

function buildNodeOrderMap(
  nodes: GeneratedWorkflowNode[],
  edges: GeneratedWorkflowEdge[],
  depthMap: Map<string, number>,
): Map<string, number> {
  const orderMap = new Map<string, number>();
  const parentOrderMap = new Map<string, number[]>();

  edges.forEach((edge) => {
    const sourceDepth = depthMap.get(edge.source) ?? 0;
    const targetDepth = depthMap.get(edge.target) ?? 0;

    if (targetDepth <= sourceDepth) {
      return;
    }

    const existingParentOrders = parentOrderMap.get(edge.target) ?? [];
    const branchWeight =
      edge.label === "Yes" ? -0.25 : edge.label === "No" ? 0.25 : 0;

    existingParentOrders.push((orderMap.get(edge.source) ?? 0) + branchWeight);
    parentOrderMap.set(edge.target, existingParentOrders);
  });

  const nodesByDepth = new Map<number, GeneratedWorkflowNode[]>();

  nodes.forEach((node) => {
    const nodeDepth = depthMap.get(node.id) ?? 0;
    const existingNodes = nodesByDepth.get(nodeDepth) ?? [];
    existingNodes.push(node);
    nodesByDepth.set(nodeDepth, existingNodes);
  });

  const sortedDepths = [...nodesByDepth.keys()].sort((firstDepth, secondDepth) => firstDepth - secondDepth);

  for (const depth of sortedDepths) {
    const nodesInDepth = nodesByDepth.get(depth) ?? [];

    nodesInDepth
      .sort((firstNode, secondNode) => {
        const firstParentAverage =
          (parentOrderMap.get(firstNode.id) ?? [Number.MAX_SAFE_INTEGER]).reduce(
            (sum, value) => sum + value,
            0,
          ) / (parentOrderMap.get(firstNode.id)?.length ?? 1);
        const secondParentAverage =
          (parentOrderMap.get(secondNode.id) ?? [Number.MAX_SAFE_INTEGER]).reduce(
            (sum, value) => sum + value,
            0,
          ) / (parentOrderMap.get(secondNode.id)?.length ?? 1);

        return firstParentAverage - secondParentAverage;
      })
      .forEach((node, index) => {
        orderMap.set(node.id, index);
      });
  }

  return orderMap;
}

export function parseGeneratedWorkflowDefinition(
  value: unknown,
): GeneratedWorkflowDefinition {
  if (!isPlainObject(value)) {
    throw new Error("The AI response was not a valid workflow object.");
  }

  const normalizedNodes = ensureWorkflowEndpoints(normalizeGeneratedNodes(value.nodes));
  const normalizedEdges = ensureConditionBranchLabels(
    normalizedNodes,
    normalizeGeneratedEdges(value.edges, normalizedNodes),
  );

  return {
    title: sanitizeText(value.title, "AI workflow"),
    description: sanitizeText(value.description, "Generated from your prompt."),
    nodes: normalizedNodes,
    edges: normalizedEdges,
  };
}

export function buildGeneratedWorkflowResult(
  workflowDefinition: GeneratedWorkflowDefinition,
): GeneratedWorkflowResult {
  const depthMap = buildNodeDepthMap(workflowDefinition.nodes, workflowDefinition.edges);
  const orderMap = buildNodeOrderMap(
    workflowDefinition.nodes,
    workflowDefinition.edges,
    depthMap,
  );

  const nodes: WorkflowGraphNode[] = normalizeWorkflowNodes(
    workflowDefinition.nodes.map((node) => ({
      id: node.id,
      type: "workflowNode",
      position: {
        x: initialCanvasX + (depthMap.get(node.id) ?? 0) * horizontalSpacingPx,
        y: initialCanvasY + (orderMap.get(node.id) ?? 0) * verticalSpacingPx,
      },
      selected: false,
      data: {
        title: node.title,
        subtitle: node.subtitle,
        kind: node.kind,
        shape: normalizeGeneratedShape(node.kind, node.shape),
        isLocked: false,
        color: node.color ?? null,
        groupId: null,
        groupLabel: null,
        groupColor: null,
        config: createDefaultNodeConfig(node.kind),
        status: "idle",
        output: null,
        lastError: null,
      },
    })),
  );

  const usedEdgeIds = new Set<string>();
  const edges: WorkflowGraphEdge[] = workflowDefinition.edges.map((edge) => {
    const label = normalizeBranchLabel(edge.label);
    const sourceHandle = getSourceHandleFromLabel(label);
    const edgeId = getUniqueEdgeId(
      `${edge.source}-${sourceHandle ?? "default"}-${edge.target}`,
      usedEdgeIds,
    );

    return {
      id: edgeId,
      source: edge.source,
      target: edge.target,
      selected: false,
      ...buildGeneratedEdgeAppearance(label),
    };
  });

  return {
    description: workflowDefinition.description,
    snapshot: {
      nodes,
      edges,
    },
    title: workflowDefinition.title,
  };
}
