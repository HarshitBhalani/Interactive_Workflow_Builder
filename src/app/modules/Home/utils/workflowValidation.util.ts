import type { Edge, Node } from "reactflow";
import type {
  WorkflowGraphEdge,
  WorkflowGraphNode,
  WorkflowNodeData,
  WorkflowValidationSummary,
} from "../types/workflow.type";

type WorkflowNode = Node<WorkflowNodeData>;
type WorkflowConnection = {
  source: string | null;
  target: string | null;
  sourceHandle?: string | null;
};

function findNodeById(
  nodes: WorkflowNode[],
  nodeId: string | null | undefined
): WorkflowNode | undefined {
  if (!nodeId) {
    return undefined;
  }

  return nodes.find((node) => node.id === nodeId);
}

export function isValidWorkflowConnection(
  connection: WorkflowConnection,
  nodes: WorkflowNode[],
  edges: Edge[]
): boolean {
  const sourceNode = findNodeById(nodes, connection.source);
  const targetNode = findNodeById(nodes, connection.target);

  if (!sourceNode || !targetNode) {
    return false;
  }

  if (sourceNode.id === targetNode.id) {
    return false;
  }

  if (sourceNode.data.kind === "end") {
    return false;
  }

  if (targetNode.data.kind === "start") {
    if (sourceNode.data.kind !== "condition" || !connection.sourceHandle) {
      return false;
    }

    const startNodeHasIncomingEdge = edges.some(
      (edge) => edge.target === targetNode.id
    );

    if (startNodeHasIncomingEdge) {
      return false;
    }
  }

  const isDuplicateConnection = edges.some((edge) => {
    return (
      edge.source === connection.source &&
      edge.target === connection.target &&
      edge.sourceHandle === connection.sourceHandle
    );
  });

  if (isDuplicateConnection) {
    return false;
  }

  if (sourceNode.data.kind === "condition") {
    if (!connection.sourceHandle) {
      return false;
    }

    const branchAlreadyUsed = edges.some((edge) => {
      return (
        edge.source === sourceNode.id &&
        edge.sourceHandle === connection.sourceHandle
      );
    });

    if (branchAlreadyUsed) {
      return false;
    }
  } else {
    const alreadyHasOutgoingEdge = edges.some(
      (edge) => edge.source === sourceNode.id
    );

    if (alreadyHasOutgoingEdge) {
      return false;
    }
  }

  const endNodeHasIncomingEdge =
    targetNode.data.kind === "end" &&
    edges.some((edge) => edge.target === targetNode.id);

  if (endNodeHasIncomingEdge) {
    return false;
  }

  return true;
}

function hasConnection(nodeId: string, edges: WorkflowGraphEdge[]): boolean {
  return edges.some((edge) => edge.source === nodeId || edge.target === nodeId);
}

function getIncomingEdges(nodeId: string, edges: WorkflowGraphEdge[]): WorkflowGraphEdge[] {
  return edges.filter((edge) => edge.target === nodeId);
}

function getOutgoingEdges(nodeId: string, edges: WorkflowGraphEdge[]): WorkflowGraphEdge[] {
  return edges.filter((edge) => edge.source === nodeId);
}

export function validateWorkflowNode(
  node: WorkflowGraphNode,
  nodes: WorkflowGraphNode[],
  edges: WorkflowGraphEdge[],
): string[] {
  const errors: string[] = [];

  if (!node.data.title.trim()) {
    errors.push("Title is required.");
  }

  switch (node.data.kind) {
    case "start":
      {
        const incomingEdges = getIncomingEdges(node.id, edges);
        const incomingFromInvalidNode = incomingEdges.some((edge) => {
          const sourceNode = nodes.find((candidateNode) => candidateNode.id === edge.source);

          return sourceNode?.data.kind !== "condition" || !edge.sourceHandle;
        });

        if (incomingFromInvalidNode) {
          errors.push("Start node can only receive incoming connections from a condition branch.");
        }

        if (incomingEdges.length > 1) {
          errors.push("Start node can only have one incoming condition connection.");
        }
      }
      break;

    case "action":
      if ((node.data.config.delayMs ?? 0) <= 0) {
        errors.push("Action delay must be greater than 0.");
      }
      break;

    case "condition": {
      const outgoingEdges = getOutgoingEdges(node.id, edges);
      const hasYesBranch = outgoingEdges.some((edge) => edge.sourceHandle === "yes");
      const hasNoBranch = outgoingEdges.some((edge) => edge.sourceHandle === "no");

      if (!hasYesBranch) {
        errors.push("Condition node must have a Yes branch.");
      }

      if (!hasNoBranch) {
        errors.push("Condition node must have a No branch.");
      }
      break;
    }

    case "end":
      if (getOutgoingEdges(node.id, edges).length > 0) {
        errors.push("End node cannot have outgoing connections.");
      }
      break;

    default:
      break;
  }

  return errors;
}

export function validateWorkflow(
  nodes: WorkflowGraphNode[],
  edges: WorkflowGraphEdge[],
): WorkflowValidationSummary {
  const workflowErrors: string[] = [];
  const nodeErrors: Record<string, string[]> = {};

  if (nodes.length === 0) {
    workflowErrors.push("No nodes in the workflow.");
  }

  const startNodes = nodes.filter((node) => getIncomingEdges(node.id, edges).length === 0);

  if (nodes.length > 0 && startNodes.length === 0) {
    workflowErrors.push("No starting node found.");
  }

  nodes.forEach((node) => {
    const errors = validateWorkflowNode(node, nodes, edges);

    if (!hasConnection(node.id, edges) && nodes.length > 1) {
      errors.push("Node must be connected to the workflow.");
    }

    if (errors.length > 0) {
      nodeErrors[node.id] = errors;
    }
  });

  return {
    hasErrors: workflowErrors.length > 0 || Object.keys(nodeErrors).length > 0,
    workflowErrors,
    nodeErrors,
  };
}
