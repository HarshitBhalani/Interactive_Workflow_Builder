import type {
  WorkflowConditionBranch,
  WorkflowExecutionResult,
  WorkflowGraphEdge,
  WorkflowGraphNode,
  WorkflowNodeKind,
  WorkflowNodeOutput,
} from "../types/workflow.type";

type WorkflowExecutorContext={
  input: WorkflowNodeOutput;
};

type WorkflowExecutor=(
  node: WorkflowGraphNode,
  context: WorkflowExecutorContext,
)=>Promise<WorkflowExecutionResult>;

const wait = (delayMs: number): Promise<void> =>

  new Promise((resolve) => {
    window.setTimeout(resolve, delayMs);
  });

function buildNodeLookup(nodes:WorkflowGraphNode[]): Map<string, WorkflowGraphNode> {
  return new Map(nodes.map((node)=>[node.id,node]));
}

function getOutgoingEdges(nodeId: string, edges: WorkflowGraphEdge[]): WorkflowGraphEdge[] {
  return edges.filter((edge) => edge.source === nodeId);
}

function getStartNode(nodes: WorkflowGraphNode[], edges: WorkflowGraphEdge[]): WorkflowGraphNode | null {
  const targetNodeIds = new Set(edges.map((edge) => edge.target));

  return nodes.find((node) => !targetNodeIds.has(node.id)) ?? nodes[0] ?? null;
}

function resolveNextNodeIds(
  node: WorkflowGraphNode,
  edges: WorkflowGraphEdge[],
  branches?: WorkflowConditionBranch[],
): string[] {

  const outgoingEdges = getOutgoingEdges(node.id, edges);

  switch (node.data.kind) {

    case "condition": {
      const activeBranches = branches ?? ["yes", "no"];
      const matchedEdges = outgoingEdges.filter((edge) =>
        activeBranches.includes(edge.sourceHandle as WorkflowConditionBranch),
      );

      return matchedEdges.map((edge) => edge.target);
    }

    case "end":
      return [];
    case "start":
    case "action":
      return outgoingEdges[0]?.target ? [outgoingEdges[0].target] : [];
    default:
      return [];

  }
}

const executeStartNode: WorkflowExecutor = async (node)=>({
  
  output: {
    nodeId: node.id,
    title: node.data.title,
    started: true,
  },

});

const executeActionNode:WorkflowExecutor=async (node,context) => {

  const delayMs = node.data.config.delayMs ?? 600;

  await wait(delayMs);

  return {

    output: {
      nodeId: node.id,
      title: node.data.title,
      message: node.data.subtitle,
      previousOutput: context.input,
    },

  };
};

const executeConditionNode:WorkflowExecutor =async (node,context) => {
  const nextBranches: WorkflowConditionBranch[] = ["yes", "no"];

  return {
    output: {
      nodeId: node.id,
      title: node.data.title,
      branchesChecked: nextBranches,
      previousOutput: context.input,
    },
    nextBranches,
  };
};

const executeEndNode: WorkflowExecutor =async(node, context) => ({
  output: {
    nodeId: node.id,
    title: node.data.title,
    completed: true,
    previousOutput: context.input,
  },
});

function getNodeExecutor(kind:WorkflowNodeKind): WorkflowExecutor {
  switch (kind) {
    case "start":
      return executeStartNode;
    case "action":
      return executeActionNode;
    case "condition":
      return executeConditionNode;
    case "end":
      return executeEndNode;
    default:
      return executeActionNode;
  }
}

export async function executeWorkflowNode(

  node: WorkflowGraphNode,
  input: WorkflowNodeOutput,
): Promise<WorkflowExecutionResult> {
  const executor = getNodeExecutor(node.data.kind);

  return executor(node, { input });
}

export function getExecutionOrder(
  nodes: WorkflowGraphNode[],
  edges: WorkflowGraphEdge[],): 
  
  WorkflowGraphNode[] {
  const startNode = getStartNode(nodes, edges);

  if (!startNode) {
    return [];
  }

  const nodeLookup = buildNodeLookup(nodes);
  const orderedNodes: WorkflowGraphNode[] = [];
  const visitedNodeIds = new Set<string>();
  let currentNode: WorkflowGraphNode | null = startNode;

  while (currentNode && !visitedNodeIds.has(currentNode.id)){
    orderedNodes.push(currentNode);
    visitedNodeIds.add(currentNode.id);

    const nextNodeId: string | undefined = resolveNextNodeIds(currentNode, edges)[0];
    currentNode = nextNodeId ? nodeLookup.get(nextNodeId) ?? null : null;
  }

  return orderedNodes;
}

export function getNextNodesForResult(
  currentNode: WorkflowGraphNode,
  nodes: WorkflowGraphNode[],
  edges: WorkflowGraphEdge[],
  result: WorkflowExecutionResult,
): WorkflowGraphNode[] {
  
  const nextNodeIds = resolveNextNodeIds(currentNode, edges, result.nextBranches);

  return nextNodeIds
    .map((nextNodeId) => nodes.find((node) => node.id === nextNodeId) ?? null)
    .filter((node): node is WorkflowGraphNode => node !== null);
}
