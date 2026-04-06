import type { Edge, Node } from "reactflow";
import type { WorkflowNodeData } from "../types/workflow.type";

type WorkflowNode = Node<WorkflowNodeData>;
type WorkflowConnection = {
  source: string | null;
  target: string | null;
  sourceHandle?: string | null;
};

function findNodeById(nodes: WorkflowNode[], nodeId: string | null | undefined) {
  if (!nodeId) {
    return undefined;
  }

  return nodes.find((node) => node.id === nodeId);
}

export function isValidWorkflowConnection(
  connection: WorkflowConnection,
  nodes: WorkflowNode[],
  edges: Edge[]
) {
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
    return false;
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
