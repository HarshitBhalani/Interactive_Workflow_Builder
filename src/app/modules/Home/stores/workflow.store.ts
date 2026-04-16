"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  MarkerType,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  getConnectedEdges,
  type NodeChange,
  type XYPosition,
} from "reactflow";
import {
  workflowPreviewEdges,
  workflowPreviewNodes,
} from "../configs/workflowPreview.config";
import type {
  WorkflowExecutionLog,
  WorkflowGraphEdge,
  WorkflowGraphNode,
  WorkflowNodeKind,
  WorkflowNodeOutput,
  WorkflowNodeShape,
  WorkflowSnapshot,
} from "../types/workflow.type";
import {
  executeWorkflowNode,
  getNextNodesForResult,
} from "../utils/workflowExecution.util";
import {
  createWorkflowSnapshot,
  normalizeWorkflowNodes,
} from "../utils/workflowPersistence.util";
import {
  createWorkflowNode,
  createWorkflowNodeCopy,
} from "../utils/workflowNodeFactory.util";
import {
  isValidWorkflowConnection,
  validateWorkflow,
} from "../utils/workflowValidation.util";

const MAX_HISTORY_LENGTH = 50;

type WorkflowStore = {
  nodes: WorkflowGraphNode[];
  edges: WorkflowGraphEdge[];
  past: WorkflowSnapshot[];
  future: WorkflowSnapshot[];
  dragSnapshot: WorkflowSnapshot | null;
  canUndo: boolean;
  canRedo: boolean;
  isRunning: boolean;
  logs: WorkflowExecutionLog[];
  handleNodesChange: (changes: NodeChange[]) => void;
  handleEdgesChange: (changes: EdgeChange[]) => void;
  handleNodesDelete: (deletedNodes: WorkflowGraphNode[]) => void;
  connectNodes: (connection: Connection) => void;
  addNode: (kind: WorkflowNodeKind, position?: XYPosition, shape?: WorkflowNodeShape) => void;
  pasteNode: (node: WorkflowGraphNode, position?: XYPosition) => void;
  updateNodeDetails: (
    nodeId: string,
    payload: { title: string; subtitle: string; color?: string | null },
  ) => void;
  loadWorkflowSnapshot: (snapshot: WorkflowSnapshot) =>void;
  resetWorkflow:() => void;
  resetExecution: () => void;
  runWorkflow: () => Promise<void>;
  undo: () => void;
  redo: () => void;
};

function buildEdgeAppearance(connection: Connection): Partial<WorkflowGraphEdge> {
  const label =
    connection.sourceHandle === "yes"
      ? "Yes"
      : connection.sourceHandle === "no"
        ? "No"
        : undefined;

  const strokeColor =
    connection.sourceHandle === "yes"
      ? "#16a34a"
      : connection.sourceHandle === "no"
        ? "#e11d48"
        : "#475569";

  return {
    type: "workflowEdge",
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
    style: {
      stroke: strokeColor,
      strokeWidth: 1.5,
    },
  };
}

function buildSnapshot(
  nodes: WorkflowGraphNode[],
  edges: WorkflowGraphEdge[],
): WorkflowSnapshot {
  return createWorkflowSnapshot(nodes, edges);
}

function trimPastHistory(past: WorkflowSnapshot[]): WorkflowSnapshot[] {
  if (past.length <= MAX_HISTORY_LENGTH) {
    return past;
  }

  return past.slice(past.length - MAX_HISTORY_LENGTH);
}

function buildPresentState(snapshot: WorkflowSnapshot): Pick<WorkflowStore, "nodes" | "edges"> {
  return {
    nodes: snapshot.nodes,
    edges: snapshot.edges,
  };
}

function buildHistoryState(
  previousSnapshot: WorkflowSnapshot,
  nextSnapshot: WorkflowSnapshot,
  past: WorkflowSnapshot[],
): Pick<WorkflowStore,"nodes" | "edges" | "past" | "future" | "dragSnapshot" | "canUndo" | "canRedo"> {
  const nextPast = trimPastHistory([...past, previousSnapshot]);

  return {
    ...buildPresentState(nextSnapshot),
    past: nextPast,
    future: [],
    dragSnapshot: null,
    canUndo: nextPast.length > 0,
    canRedo: false,
  };
}

function clearNodeSelection(nodes: WorkflowGraphNode[]): WorkflowGraphNode[] {
  return nodes.map((node) => ({
    ...node,
    selected: false,
  }));
}

function resetNodeRuntime(nodes: WorkflowGraphNode[]): WorkflowGraphNode[] {
  return nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      status: "idle",
      output: null,
      lastError: null,
    },
  }));
}

function updateNodeRuntime(
  nodes: WorkflowGraphNode[],
  nodeId: string,
  payload: Partial<Pick<WorkflowGraphNode["data"], "status" | "output" | "lastError">>,
): WorkflowGraphNode[] {
  return nodes.map((node) =>
    node.id === nodeId
      ? {
          ...node,
          data: {
            ...node.data,
            ...payload,
          },
        }
      : node,
  );
}

function markNodesRunning(
  nodes: WorkflowGraphNode[],
  nodeIds: string[],
): WorkflowGraphNode[] {
  const runningNodeIds = new Set(nodeIds);

  return nodes.map((node) =>
    runningNodeIds.has(node.id)
      ? {
          ...node,
          data: {
            ...node.data,
            status: "running",
            output: null,
            lastError: null,
          },
        }
      : node,
  );
}

function createExecutionLog(
  message: string,
  status: WorkflowExecutionLog["status"],
  nodeId: string | null = null,
): WorkflowExecutionLog {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    nodeId,
    message,
    status,
    timestamp: new Date().toISOString(),
  };
}

function snapshotsMatch(
  firstSnapshot: WorkflowSnapshot,
  secondSnapshot: WorkflowSnapshot,
): boolean {
  return JSON.stringify(firstSnapshot) === JSON.stringify(secondSnapshot);
}

const initialSnapshot = buildSnapshot(workflowPreviewNodes, workflowPreviewEdges);
const workflowStorageKey = "interactive-workflow-builder-state";

export const useWorkflowStore = create<WorkflowStore>()(
  persist(
    (set, get) => ({
  nodes: initialSnapshot.nodes,
  edges: initialSnapshot.edges,
  past: [],
  future: [],
  dragSnapshot: null,
  canUndo: false,
  canRedo: false,
  isRunning: false,
  logs: [],

  handleNodesChange: (changes): void => {
    set((state) => {
      const nextNodes = applyNodeChanges(
        changes.filter((change) => change.type !== "remove"),
        state.nodes,
      );

      const dragStarting = changes.some(
        (change) => change.type === "position" && change.dragging === true,
      );
      const dragFinished = changes.some(
        (change) => change.type === "position" && change.dragging === false,
      );

      const nextSnapshot = buildSnapshot(nextNodes, state.edges);

      if (
        dragStarting &&
        state.dragSnapshot === null &&
        !snapshotsMatch(nextSnapshot, buildSnapshot(state.nodes, state.edges))
      ) {
        return {
          nodes: nextNodes,
          dragSnapshot: buildSnapshot(state.nodes, state.edges),
        };
      }

      if (dragFinished) {
        const previousSnapshot =
          state.dragSnapshot ?? buildSnapshot(state.nodes, state.edges);

        if (snapshotsMatch(previousSnapshot,nextSnapshot)) {
          return {
            nodes: nextNodes,
            dragSnapshot: null,
          };
        }

        return buildHistoryState(previousSnapshot, nextSnapshot, state.past);
      }

      return {
        nodes: nextNodes,
      };
    });
  },

  handleEdgesChange: (changes): void => {
    set((state) => {
      const nextEdges = applyEdgeChanges(changes, state.edges);
      const nextSnapshot = buildSnapshot(state.nodes, nextEdges);
      const removedEdge = changes.some((change) => change.type === "remove");

      if (!removedEdge) {
        return {
          edges: nextEdges,
        };
      }

      return buildHistoryState(
        buildSnapshot(state.nodes, state.edges),
        nextSnapshot,
        state.past,
      );
    });
  },

  handleNodesDelete: (deletedNodes): void => {
    set((state) => {
      if (deletedNodes.length === 0) {
        return state;
      }

      const connectedEdges = getConnectedEdges(deletedNodes, state.edges);
      const deletedNodeIds = new Set(deletedNodes.map((node) => node.id));
      const deletedEdgeIds = new Set(connectedEdges.map((edge) => edge.id));
      const nextNodes = state.nodes.filter((node) => !deletedNodeIds.has(node.id));
      const nextEdges = state.edges.filter((edge) => !deletedEdgeIds.has(edge.id));

      return buildHistoryState(
        buildSnapshot(state.nodes, state.edges),
        buildSnapshot(nextNodes, nextEdges),
        state.past,
      );
    });
  },

  connectNodes: (connection): void => {
    const { nodes, edges } = get();

    if (!isValidWorkflowConnection(connection, nodes, edges)) {
      return;
    }

    set((state) => {
      const nextEdges = addEdge(
        {
          ...connection,
          ...buildEdgeAppearance(connection),
        },
        state.edges,
      );

      return buildHistoryState(
        buildSnapshot(state.nodes, state.edges),
        buildSnapshot(state.nodes, nextEdges),
        state.past,
      );
    });
  },

  addNode: (kind, position, shape): void => {
    set((state) => {
      const nextNode = createWorkflowNode(kind, state.nodes, position, shape);
      const nextNodes = [...clearNodeSelection(state.nodes), nextNode];

      return buildHistoryState(
        buildSnapshot(state.nodes, state.edges),
        buildSnapshot(nextNodes, state.edges),
        state.past,
      );
    });
  },

  pasteNode: (node, position): void => {
    set((state) => {



      const nextNode = createWorkflowNodeCopy(node, state.nodes, position);

      const nextNodes = [...clearNodeSelection(state.nodes), nextNode];

      return buildHistoryState(

        buildSnapshot(state.nodes, state.edges),
        buildSnapshot(nextNodes, state.edges),
        state.past,

      );
    });
  },

  updateNodeDetails: (nodeId, payload): void => {
    set((state) => {
      const nextNodes = state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                title: payload.title,
                subtitle: payload.subtitle,
                color: payload.color ?? node.data.color ?? null,
              },
            }
          : node,
      );

      const previousSnapshot = buildSnapshot(state.nodes, state.edges);
      const nextSnapshot = buildSnapshot(nextNodes, state.edges);

      if (snapshotsMatch(previousSnapshot, nextSnapshot)) {
        return state;
      }

      return buildHistoryState(previousSnapshot, nextSnapshot, state.past);
    });
  },

  loadWorkflowSnapshot: (snapshot): void => {
    set((state) => {
      const previousSnapshot = buildSnapshot(state.nodes, state.edges);
      const nextSnapshot = buildSnapshot(
        resetNodeRuntime(clearNodeSelection(snapshot.nodes)),
        snapshot.edges,
      );

      if (snapshotsMatch(previousSnapshot, nextSnapshot)) {
        return state;
      }

      return buildHistoryState(previousSnapshot, nextSnapshot, state.past);
    });
  },

  resetWorkflow: ():void => {
    set((state)=>{
      const previousSnapshot=buildSnapshot(state.nodes, state.edges);
      const nextSnapshot=buildSnapshot(
        resetNodeRuntime(clearNodeSelection(initialSnapshot.nodes)),
        initialSnapshot.edges,
      );

      if (snapshotsMatch(previousSnapshot, nextSnapshot)){
        
        return state;
      }

      return buildHistoryState(previousSnapshot,nextSnapshot,state.past);
    });
  },

  resetExecution: (): void => {
    set((state) => ({
      nodes: resetNodeRuntime(state.nodes),
      isRunning: false,
      logs: [],
    }));
  },

  runWorkflow: async (): Promise<void> => {
    const initialState = get();

    if (initialState.isRunning) {
      return;
    }

    const validationSummary = validateWorkflow(initialState.nodes, initialState.edges);

    if (validationSummary.hasErrors) {
      const validationMessages = [
        ...validationSummary.workflowErrors,
        ...Object.entries(validationSummary.nodeErrors).flatMap(([nodeId, messages]) =>
          messages.map((message) => `${nodeId}: ${message}`),
        ),
      ];

      set(() => ({
        isRunning: false,
        logs: [
          createExecutionLog("Workflow validation failed.", "error"),
          ...validationMessages.map((message) =>
            createExecutionLog(message, "error"),
          ),
        ],
      }));
      return;
    }

    const startNodeIds = new Set(initialState.edges.map((edge) => edge.target));
    const startNodes = initialState.nodes.filter((node) => !startNodeIds.has(node.id));

    if (startNodes.length === 0) {
      set((state) => ({
        ...state,
        logs: [createExecutionLog("No nodes available to run.", "error")],
      }));
      return;
    }

    set((state) => ({
      isRunning: true,
      logs: [createExecutionLog("Workflow execution started.", "info")],
      nodes: markNodesRunning(
        resetNodeRuntime(state.nodes),
        startNodes.map((node) => node.id),
      ),
    }));

    const executionQueue: Array<{
      node: WorkflowGraphNode;
      input: WorkflowNodeOutput;
    }> = startNodes.map((node) => ({
      node,
      input: null,
    }));
    const visitedNodeIds = new Set<string>();
    const queuedNodeIds = new Set(executionQueue.map((item) => item.node.id));

    while (executionQueue.length > 0) {
      const nextQueueItem = executionQueue.shift();

      if (!nextQueueItem) {
        break;
      }

      const activeNode = nextQueueItem.node;
      const currentInput = nextQueueItem.input;

      queuedNodeIds.delete(activeNode.id);

      if (visitedNodeIds.has(activeNode.id)) {
        continue;
      }

      visitedNodeIds.add(activeNode.id);

      set((state) => ({
        nodes: updateNodeRuntime(state.nodes, activeNode.id, {
          status: "running",
          lastError: null,
        }),
        logs: [
          ...state.logs,
          createExecutionLog(
            `Running ${activeNode.data.title}.`,
            "running",
            activeNode.id,
          ),
        ],
      }));

      try {
        const result = await executeWorkflowNode(activeNode, currentInput);
        const nextNodes = getNextNodesForResult(
          activeNode,
          get().nodes,
          get().edges,
          result,
        );

        set((state) => ({
          nodes: updateNodeRuntime(state.nodes, activeNode.id, {
            status: "success",
            output: result.output,
            lastError: null,
          }),
          logs: [
            ...state.logs,
            createExecutionLog(
              `${activeNode.data.title} completed successfully.`,
              "success",
              activeNode.id,
            ),
          ],
        }));

        if (nextNodes.length > 1) {
          set((state) => ({
            logs: [
              ...state.logs,
              createExecutionLog(
                `${activeNode.data.title} branched into ${nextNodes.length} paths.`,
                "info",
                activeNode.id,
              ),
            ],
          }));
        }

        const nextNodeIdsToRun = nextNodes
          .filter(
            (nextNode) =>
              !visitedNodeIds.has(nextNode.id) && !queuedNodeIds.has(nextNode.id),
          )
          .map((nextNode) => nextNode.id);

        if (nextNodeIdsToRun.length > 0) {
          set((state) => ({
            nodes: markNodesRunning(state.nodes, nextNodeIdsToRun),
          }));
        }

        nextNodes.forEach((nextNode) => {
          if (visitedNodeIds.has(nextNode.id) || queuedNodeIds.has(nextNode.id)) {
            return;
          }

          executionQueue.push({
            node: nextNode,
            input: result.output,
          });
          queuedNodeIds.add(nextNode.id);
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown execution error.";

        set((state) => ({
          isRunning: false,
          nodes: updateNodeRuntime(state.nodes, activeNode.id, {
            status: "error",
            lastError: errorMessage,
          }),
          logs: [
            ...state.logs,
            createExecutionLog(
              `${activeNode.data.title} failed: ${errorMessage}`,
              "error",
              activeNode.id,
            ),
          ],
        }));
        return;
      }
    }

    set((state) => ({
      isRunning: false,
      logs: [
        ...state.logs,
        createExecutionLog("Workflow execution finished.", "success"),
      ],
    }));
  },

  undo: (): void => {
    set((state) => {
      const previousSnapshot = state.past.at(-1);

      if (!previousSnapshot) {
        return state;
      }

      const nextPast = state.past.slice(0, -1);
      const nextFuture = [
        buildSnapshot(state.nodes, state.edges),
        ...state.future,
      ];

      return {
        ...buildPresentState({
          nodes: resetNodeRuntime(previousSnapshot.nodes),
          edges: previousSnapshot.edges,
        }),
        past: nextPast,
        future: nextFuture,
        dragSnapshot: null,
        canUndo: nextPast.length > 0,
        canRedo: nextFuture.length > 0,
      };
    });
  },

  redo: (): void => {
    set((state) => {
      const nextSnapshot = state.future[0];

      if (!nextSnapshot) {
        return state;
      }

      const nextFuture = state.future.slice(1);
      const nextPast = trimPastHistory([
        ...state.past,
        buildSnapshot(state.nodes, state.edges),
      ]);

      return {
        ...buildPresentState({
          nodes: resetNodeRuntime(nextSnapshot.nodes),
          edges: nextSnapshot.edges,
        }),
        past: nextPast,
        future: nextFuture,
        dragSnapshot: null,
        canUndo: nextPast.length > 0,
        canRedo: nextFuture.length > 0,
      };
    });
  },
}),
    {

      name: workflowStorageKey,
      storage: createJSONStorage(() => localStorage),
      merge: (persistedState, currentState) => {
        const typedPersistedState = persistedState as Partial<WorkflowStore> | undefined;

        return {
          ...currentState,
          ...typedPersistedState,
          nodes: typedPersistedState?.nodes
            ? normalizeWorkflowNodes(typedPersistedState.nodes)
            : currentState.nodes,
          edges: typedPersistedState?.edges ?? currentState.edges,
          past: [],
          future: [],
          dragSnapshot: null,
          canUndo: false,
          canRedo: false,
          isRunning: false,
          logs: [],
        };
      },
      partialize: (state) => ({
        nodes: clearNodeSelection(state.nodes),
        edges: state.edges,
      }),

    },
  ),
);
