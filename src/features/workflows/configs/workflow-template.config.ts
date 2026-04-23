import { MarkerType } from "reactflow";
import type { WorkflowSnapshot, WorkflowGraphNode, WorkflowGraphEdge } from "@/app/modules/Home/types/workflow.type";

export type WorkflowTemplateId =
  | "blank"
  | "approval";

function createNode(
  id: string,
  kind: "start" | "action" | "condition" | "end",
  title: string,
  subtitle: string,
  x: number,
  y: number,
  shape?: WorkflowGraphNode["data"]["shape"],
): WorkflowGraphNode {
  const resolvedShape =
    shape ??
    (kind === "start"
      ? "terminator"
      : kind === "action"
        ? "rectangle"
        : kind === "condition"
          ? "diamond"
          : "terminator");

  return {
    id,
    type: "workflowNode",
    position: { x, y },
    data: {
      title,
      subtitle,
      kind,
      shape: resolvedShape,
      config:
        kind === "action"
          ? { delayMs: 600 }
          : kind === "condition"
            ? { preferredBranch: "yes" }
            : {},
      status: "idle",
      output: null,
      lastError: null,
    },
  };
}

function createEdge(
  id: string,
  source: string,
  target: string,
  label?: "Yes" | "No",
): WorkflowGraphEdge {
  const strokeColor =
    label === "Yes" ? "#16a34a" : label === "No" ? "#e11d48" : "#475569";

  return {
    id,
    type: "workflowEdge",
    source,
    target,
    ...(label ? { sourceHandle: label.toLowerCase() } : {}),
    ...(label ? { label } : {}),
    ...(label
      ? {
          labelStyle: {
            fill: "#0f172a",
            fontWeight: 600,
          },
        }
      : {}),
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

const blankSnapshot: WorkflowSnapshot = {
  nodes: [],
  edges: [],
};

const approvalSnapshot: WorkflowSnapshot = {
  nodes: [
    createNode("start", "start", "Start", "Request submitted", 40, 160),
    createNode("action", "action", "Action", "Assign reviewer", 320, 160),
    createNode("condition", "condition", "Condition", "Is the request complete?", 610, 140),
    createNode("endApproved", "end", "End", "Move to approval", 920, 70),
    createNode("endRejected", "end", "End", "Send back for update", 920, 255),
  ],
  edges: [
    createEdge("start-action", "start", "action"),
    createEdge("action-condition", "action", "condition"),
    createEdge("condition-yes", "condition", "endApproved", "Yes"),
    createEdge("condition-no", "condition", "endRejected", "No"),
  ],
};

export const workflowTemplateSnapshots: Record<WorkflowTemplateId, WorkflowSnapshot> = {
  blank: blankSnapshot,
  approval: approvalSnapshot,
};
