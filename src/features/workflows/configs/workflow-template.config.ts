import { MarkerType } from "reactflow";
import type { WorkflowSnapshot, WorkflowGraphNode, WorkflowGraphEdge } from "@/app/modules/Home/types/workflow.type";

export type WorkflowTemplateId =
  | "blank"
  | "approval"
  | "hr-approval"
  | "leave-request"
  | "bug-triage"
  | "invoice-approval"
  | "onboarding-flow";

export type WorkflowTemplateCatalogItem = {
  id: WorkflowTemplateId;
  title: string;
  description: string;
  accentClassName: string;
  previewLabels: string[];
  status: "ready";
};

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

const hrApprovalSnapshot: WorkflowSnapshot = {
  nodes: [
    createNode("start", "start", "Start", "Employee request created", 40, 180),
    createNode("action-1", "action", "Action-1", "HR reviews request", 310, 180),
    createNode("condition-1", "condition", "Condition-1", "Manager approval required?", 610, 160),
    createNode("action-2", "action", "Action-2", "Manager signs off", 930, 60),
    createNode("end-1", "end", "End-1", "Approved and notified", 1230, 60),
    createNode("end-2", "end", "End-2", "Return to employee", 930, 290),
  ],
  edges: [
    createEdge("hr-start-review", "start", "action-1"),
    createEdge("hr-review-check", "action-1", "condition-1"),
    createEdge("hr-yes-manager", "condition-1", "action-2", "Yes"),
    createEdge("hr-manager-approved", "action-2", "end-1"),
    createEdge("hr-no-return", "condition-1", "end-2", "No"),
  ],
};

const leaveRequestSnapshot: WorkflowSnapshot = {
  nodes: [
    createNode("start", "start", "Start", "Leave request submitted", 40, 180),
    createNode("action-1", "action", "Action-1", "Manager reviews request", 320, 180),
    createNode("condition-1", "condition", "Condition-1", "Enough leave balance?", 620, 160),
    createNode("action-2", "action", "Action-2", "Update calendar and payroll", 940, 60),
    createNode("end-1", "end", "End-1", "Leave confirmed", 1240, 60),
    createNode("end-2", "end", "End-2", "Request sent back", 940, 290),
  ],
  edges: [
    createEdge("leave-start-review", "start", "action-1"),
    createEdge("leave-review-check", "action-1", "condition-1"),
    createEdge("leave-yes-handoff", "condition-1", "action-2", "Yes"),
    createEdge("leave-handoff-end", "action-2", "end-1"),
    createEdge("leave-no-revise", "condition-1", "end-2", "No"),
  ],
};

const bugTriageSnapshot: WorkflowSnapshot = {
  nodes: [
    createNode("start", "start", "Start", "Bug report created", 40, 180),
    createNode("action-1", "action", "Action-1", "Triage and reproduce issue", 330, 180),
    createNode("condition-1", "condition", "Condition-1", "High priority bug?", 650, 160),
    createNode("action-2", "action", "Action-2", "Assign urgent fix owner", 960, 60),
    createNode("end-1", "end", "End-1", "Move to active sprint", 1250, 60),
    createNode("end-2", "end", "End-2", "Send to backlog", 960, 300),
  ],
  edges: [
    createEdge("bug-start-triage", "start", "action-1"),
    createEdge("bug-triage-check", "action-1", "condition-1"),
    createEdge("bug-yes-assign", "condition-1", "action-2", "Yes"),
    createEdge("bug-assign-sprint", "action-2", "end-1"),
    createEdge("bug-no-backlog", "condition-1", "end-2", "No"),
  ],
};

const invoiceApprovalSnapshot: WorkflowSnapshot = {
  nodes: [
    createNode("start", "start", "Start", "Invoice received", 40, 180),
    createNode("action-1", "action", "Action-1", "Verify invoice details", 320, 180),
    createNode("condition-1", "condition", "Condition-1", "Amount above approval limit?", 650, 160),
    createNode("action-2", "action", "Action-2", "Finance approves payment", 980, 60),
    createNode("end-1", "end", "End-1", "Release payment", 1280, 60),
    createNode("end-2", "end", "End-2", "Return for correction", 980, 300),
  ],
  edges: [
    createEdge("invoice-start-verify", "start", "action-1"),
    createEdge("invoice-verify-check", "action-1", "condition-1"),
    createEdge("invoice-yes-finance", "condition-1", "action-2", "Yes"),
    createEdge("invoice-finance-release", "action-2", "end-1"),
    createEdge("invoice-no-return", "condition-1", "end-2", "No"),
  ],
};

const onboardingFlowSnapshot: WorkflowSnapshot = {
  nodes: [
    createNode("start", "start", "Start", "Candidate accepted offer", 40, 180),
    createNode("action-1", "action", "Action-1", "Create accounts and equipment tasks", 330, 180),
    createNode("action-2", "action", "Action-2", "Assign onboarding training", 650, 180),
    createNode("condition-1", "condition", "Condition-1", "All onboarding tasks complete?", 970, 160),
    createNode("end-1", "end", "End-1", "Ready for first week", 1290, 60),
    createNode("end-2", "end", "End-2", "Follow up on pending items", 1290, 300),
  ],
  edges: [
    createEdge("onboard-start-accounts", "start", "action-1"),
    createEdge("onboard-accounts-training", "action-1", "action-2"),
    createEdge("onboard-training-check", "action-2", "condition-1"),
    createEdge("onboard-yes-ready", "condition-1", "end-1", "Yes"),
    createEdge("onboard-no-followup", "condition-1", "end-2", "No"),
  ],
};

export const workflowTemplateSnapshots: Record<WorkflowTemplateId, WorkflowSnapshot> = {
  blank: blankSnapshot,
  approval: approvalSnapshot,
  "hr-approval": hrApprovalSnapshot,
  "leave-request": leaveRequestSnapshot,
  "bug-triage": bugTriageSnapshot,
  "invoice-approval": invoiceApprovalSnapshot,
  "onboarding-flow": onboardingFlowSnapshot,
};

export const workflowTemplateCatalog: WorkflowTemplateCatalogItem[] = [
  {
    id: "hr-approval",
    title: "HR approval",
    description: "Employee request, HR review, manager sign-off, and final update steps.",
    accentClassName: "border-emerald-200 bg-[linear-gradient(135deg,#f3fff8_0%,#ecfdf5_100%)]",
    previewLabels: ["Request", "Review", "Approve", "Notify"],
    status: "ready",
  },
  {
    id: "leave-request",
    title: "Leave request",
    description: "Leave submission with manager review, handoff checks, and final confirmation.",
    accentClassName: "border-sky-200 bg-[linear-gradient(135deg,#f4fbff_0%,#eff6ff_100%)]",
    previewLabels: ["Apply", "Manager", "Balance", "Confirm"],
    status: "ready",
  },
  {
    id: "bug-triage",
    title: "Bug triage",
    description: "Collect incoming issues, assign priority, route ownership, and close the loop.",
    accentClassName: "border-amber-200 bg-[linear-gradient(135deg,#fffaf0_0%,#fffbeb_100%)]",
    previewLabels: ["Report", "Priority", "Assign", "Fix"],
    status: "ready",
  },
  {
    id: "invoice-approval",
    title: "Invoice approval",
    description: "Invoice review with finance checks, amount validation, and release status.",
    accentClassName: "border-violet-200 bg-[linear-gradient(135deg,#faf7ff_0%,#f5f3ff_100%)]",
    previewLabels: ["Invoice", "Review", "Finance", "Release"],
    status: "ready",
  },
  {
    id: "onboarding-flow",
    title: "Onboarding flow",
    description: "New joiner onboarding with account setup, training, and milestone tracking.",
    accentClassName: "border-rose-200 bg-[linear-gradient(135deg,#fff7f7_0%,#fff1f2_100%)]",
    previewLabels: ["Welcome", "Accounts", "Training", "Done"],
    status: "ready",
  },
];

export const workflowQuickStartCatalog: WorkflowTemplateCatalogItem[] = [
  {
    id: "approval",
    title: "Approval starter",
    description: "Open the current approval-flow starter and begin editing right away.",
    accentClassName: "border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)]",
    previewLabels: ["Start", "Review", "Yes/No", "End"],
    status: "ready",
  },
  {
    id: "blank",
    title: "Blank canvas",
    description: "Start with an empty workflow and build every node from scratch.",
    accentClassName: "border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)]",
    previewLabels: ["Drop nodes", "Connect", "Save", "Run"],
    status: "ready",
  },
];
