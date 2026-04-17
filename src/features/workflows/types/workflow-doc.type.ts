import type { WorkflowSnapshot } from "@/app/modules/Home/types/workflow.type";

export type SavedWorkflowRecord = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  snapshot: WorkflowSnapshot;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CreateWorkflowInput = {
  userId: string;
  name: string;
  description?: string | null;
  snapshot: WorkflowSnapshot;
};

export type UpdateWorkflowInput = {
  workflowId: string;
  userId: string;
  name: string;
  description?: string | null;
  snapshot: WorkflowSnapshot;
};
