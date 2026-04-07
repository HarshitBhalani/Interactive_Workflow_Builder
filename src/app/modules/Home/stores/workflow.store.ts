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
import { createWorkflowNode } from "../utils/workflowNodeFactory.util";
import { isValidWorkflowConnection } from "../utils/workflowValidation.util";

type WorkflowStore = {
  nodes: WorkflowGraphNode[];
  edges: WorkflowGraphEdge[];
  handleNodesChange: (changes: NodeChange[]) => void;
  handleEdgesChange: (changes: EdgeChange[]) => void;
  handleNodesDelete: (deletedNodes: WorkflowGraphNode[]) => void;
  connectNodes: (connection: Connection) => void;
  addNode: (kind: WorkflowNodeKind, position?: XYPosition) => void;
  updateNodeDetails: (
    nodeId: string,
    payload: { title: string; subtitle: string }
  ) => void;
  loadWorkflowSnapshot: (snapshot: WorkflowSnapshot) => void;
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

function clearNodeSelection(nodes: WorkflowGraphNode[]) {
  return nodes.map((node) => ({ ...node, selected: false }));
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  nodes: workflowPreviewNodes,
  edges: workflowPreviewEdges,
  handleNodesChange: (changes) =>
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    })),
  handleEdgesChange: (changes) =>
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    })),
  handleNodesDelete: (deletedNodes) =>
    set((state) => {
      const connectedEdges = getConnectedEdges(deletedNodes, state.edges);

      if (connectedEdges.length === 0) {
        return { edges: state.edges };
      }

      const connectedIds = new Set(connectedEdges.map((edge) => edge.id));

      return {
        edges: state.edges.filter((edge) => !connectedIds.has(edge.id)),
      };
    }),
  connectNodes: (connection) => {
    const { nodes, edges } = get();

    if (!isValidWorkflowConnection(connection, nodes, edges)) {
      return;
    }

    set((state) => ({
      edges: addEdge(
        {
          ...connection,
          ...buildEdgeAppearance(connection),
        },
        state.edges
      ),
    }));
  },
  addNode: (kind, position) =>
    set((state) => {
      const nextNode = createWorkflowNode(kind, state.nodes, position);

      return {
        nodes: [
          ...clearNodeSelection(state.nodes),
          nextNode,
        ],
      };
    }),
  updateNodeDetails: (nodeId, payload) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                title: payload.title,
                subtitle: payload.subtitle,
              },
            }
          : node
      ),
    })),
  loadWorkflowSnapshot: (snapshot) =>
    set({
      nodes:clearNodeSelection(snapshot.nodes),
      edges:snapshot.edges,
    }),
}));
