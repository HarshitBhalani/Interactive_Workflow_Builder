import { MarkerType } from "reactflow";
import type {
  WorkflowGraphEdge,
  WorkflowGraphNode,
} from "../types/workflow.type";

export const workflowPreviewNodes: WorkflowGraphNode[] = [
  {
    id: "start",
    type: "workflowNode",
    position: { x: 40, y: 160 },
    data: {
      title: "Start",
      subtitle: "Request submitted",
      kind: "start",
    },
  },
  {
    id: "action",
    type: "workflowNode",
    position: { x: 320, y: 160 },
    data: {
      title: "Action",
      subtitle: "Assign reviewer",
      kind: "action",
    },
  },
  {
    id: "condition",
    type: "workflowNode",
    position: { x: 610, y: 140 },
    data: {
      title: "Condition",
      subtitle: "Is the request complete?",
      kind: "condition",
    },
  },
  {
    id: "endApproved",
    type: "workflowNode",
    position: { x: 920, y: 70 },
    data: {
      title: "End",
      subtitle: "Move to approval",
      kind: "end",
    },
  },
  {
    id: "endRejected",
    type: "workflowNode",
    position: { x: 920, y: 255 },
    data: {
      title: "End",
      subtitle: "Send back for update",
      kind: "end",
    },
  },
];

export const workflowPreviewEdges: WorkflowGraphEdge[] = [
  {
    id: "start-action",
    type: "workflowEdge",
    source: "start",
    target: "action",
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "#475569",
    },
    style: {
      stroke: "#475569",
      strokeWidth: 1.5,
    },
  },
  {
    id: "action-condition",
    type: "workflowEdge",
    source: "action",
    target: "condition",
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "#475569",
    },
    style: {
      stroke: "#475569",
      strokeWidth: 1.5,
    },
  },
  {
    id: "condition-yes",
    type: "workflowEdge",
    source: "condition",
    sourceHandle: "yes",
    target: "endApproved",
    label: "Yes",
    labelStyle: {
      fill: "#0f172a",
      fontWeight: 600,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "#16a34a",
    },
    style: {
      stroke: "#16a34a",
      strokeWidth: 1.5,
    },
  },
  {
    id: "condition-no",
    type: "workflowEdge",
    source: "condition",
    sourceHandle: "no",
    target: "endRejected",
    label: "No",
    labelStyle: {
      fill: "#0f172a",
      fontWeight: 600,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "#e11d48",
    },
    style: {
      stroke: "#e11d48",
      strokeWidth: 1.5,
    },
  },
];
