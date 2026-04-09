"use client";

import { create } from "zustand";
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
  WorkflowGraphEdge,
  WorkflowGraphNode,
  WorkflowNodeKind,
  WorkflowSnapshot,
} from "../types/workflow.type";
import { createWorkflowSnapshot } from "../utils/workflowPersistence.util";
import {
  createWorkflowNode,
  createWorkflowNodeCopy,
} from "../utils/workflowNodeFactory.util";
import { isValidWorkflowConnection } from "../utils/workflowValidation.util";

const MAX_HISTORY_LENGTH = 50;

type WorkflowStore = {
  nodes: WorkflowGraphNode[];
  edges: WorkflowGraphEdge[];
  past: WorkflowSnapshot[];
  future: WorkflowSnapshot[];
  dragSnapshot: WorkflowSnapshot | null;
  canUndo: boolean;
  canRedo: boolean;
  handleNodesChange: (changes: NodeChange[]) => void;
  handleEdgesChange: (changes: EdgeChange[]) => void;
  handleNodesDelete: (deletedNodes: WorkflowGraphNode[]) => void;
  connectNodes: (connection: Connection) => void;
  addNode: (kind: WorkflowNodeKind, position?: XYPosition) => void;
  pasteNode: (node: WorkflowGraphNode, position?: XYPosition) => void;
  updateNodeDetails: (
    nodeId: string,
    payload: { title: string; subtitle: string },
  ) => void;
  loadWorkflowSnapshot: (snapshot: WorkflowSnapshot) =>void;
  undo: () => void;
  redo: () => void;
};

function buildEdgeAppearance(connection: Connection) {
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

function trimPastHistory(past: WorkflowSnapshot[]) {
  if (past.length <= MAX_HISTORY_LENGTH) {
    return past;
  }

  return past.slice(past.length - MAX_HISTORY_LENGTH);
}

function buildPresentState(snapshot: WorkflowSnapshot) {
  return {
    nodes: snapshot.nodes,
    edges: snapshot.edges,
  };
}

function buildHistoryState(
  previousSnapshot: WorkflowSnapshot,
  nextSnapshot: WorkflowSnapshot,
  past: WorkflowSnapshot[],
) {
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

function clearNodeSelection(nodes: WorkflowGraphNode[]) {
  return nodes.map((node) => ({
    ...node,
    selected: false,
  }));
}

function snapshotsMatch(
  firstSnapshot: WorkflowSnapshot,
  secondSnapshot: WorkflowSnapshot,
) {
  return JSON.stringify(firstSnapshot) === JSON.stringify(secondSnapshot);
}

const initialSnapshot = buildSnapshot(workflowPreviewNodes, workflowPreviewEdges);

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  nodes: initialSnapshot.nodes,
  edges: initialSnapshot.edges,
  past: [],
  future: [],
  dragSnapshot: null,
  canUndo: false,
  canRedo: false,

  handleNodesChange: (changes) =>
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

        if (snapshotsMatch(previousSnapshot, nextSnapshot)) {
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
    }),

  handleEdgesChange: (changes) =>
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
    }),

  handleNodesDelete: (deletedNodes) =>
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
    }),

  connectNodes: (connection) => {
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

  addNode: (kind, position) =>
    set((state) => {
      const nextNode = createWorkflowNode(kind, state.nodes, position);
      const nextNodes = [...clearNodeSelection(state.nodes), nextNode];

      return buildHistoryState(
        buildSnapshot(state.nodes, state.edges),
        buildSnapshot(nextNodes, state.edges),
        state.past,
      );
    }),

  pasteNode: (node, position) =>
    set((state) => {



      const nextNode = createWorkflowNodeCopy(node, state.nodes, position);

      const nextNodes = [...clearNodeSelection(state.nodes), nextNode];

      return buildHistoryState(

        buildSnapshot(state.nodes, state.edges),
        buildSnapshot(nextNodes, state.edges),
        state.past,

      );
    }),

  updateNodeDetails: (nodeId, payload) =>
    set((state) => {
      const nextNodes = state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                title: payload.title,
                subtitle: payload.subtitle,
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
    }),

  loadWorkflowSnapshot: (snapshot) =>
    set((state) => {
      const previousSnapshot = buildSnapshot(state.nodes, state.edges);
      const nextSnapshot = buildSnapshot(
        clearNodeSelection(snapshot.nodes),
        snapshot.edges,
      );

      if (snapshotsMatch(previousSnapshot, nextSnapshot)) {
        return state;
      }

      return buildHistoryState(previousSnapshot, nextSnapshot, state.past);
    }),

  undo: () =>
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
        ...buildPresentState(previousSnapshot),
        past: nextPast,
        future: nextFuture,
        dragSnapshot: null,
        canUndo: nextPast.length > 0,
        canRedo: nextFuture.length > 0,
      };
    }),

  redo: () =>
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
        ...buildPresentState(nextSnapshot),
        past: nextPast,
        future: nextFuture,
        dragSnapshot: null,
        canUndo: nextPast.length > 0,
        canRedo: nextFuture.length > 0,
      };
    }),
}));
