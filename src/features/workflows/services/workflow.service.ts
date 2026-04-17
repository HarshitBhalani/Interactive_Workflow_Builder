import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Timestamp,
} from "firebase/firestore";
import { parseWorkflowSnapshot } from "@/app/modules/Home/utils/workflowPersistence.util";
import { db } from "@/features/auth/config/firebase";
import type {
  CreateWorkflowInput,
  SavedWorkflowRecord,
  UpdateWorkflowInput,
} from "@/features/workflows/types/workflow-doc.type";
import type {
  WorkflowGraphEdge,
  WorkflowGraphNode,
  WorkflowSnapshot,
} from "@/app/modules/Home/types/workflow.type";

function removeUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => removeUndefinedDeep(item)) as T;
  }

  if (value && typeof value === "object") {
    const cleanedEntries = Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== undefined)
      .map(([entryKey, entryValue]) => [
        entryKey,
        removeUndefinedDeep(entryValue),
      ]);

    return Object.fromEntries(cleanedEntries) as T;
  }

  return value;
}

function removeNullDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => removeNullDeep(item)) as T;
  }

  if (value && typeof value === "object") {
    const cleanedEntries = Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== null)
      .map(([entryKey, entryValue]) => [
        entryKey,
        removeNullDeep(entryValue),
      ]);

    return Object.fromEntries(cleanedEntries) as T;
  }

  return value;
}

function serializeWorkflowNodeForFirestore(node: WorkflowGraphNode): WorkflowGraphNode {
  const serializedNode = {
    id: node.id,
    type: node.type,
    position: {
      x: node.position.x,
      y: node.position.y,
    },
    ...(typeof node.width === "number" ? { width: node.width } : {}),
    ...(typeof node.height === "number" ? { height: node.height } : {}),
    data: {
      title: node.data.title,
      subtitle: node.data.subtitle,
      kind: node.data.kind,
      shape: node.data.shape,
      ...(node.data.isLocked ? { isLocked: true } : {}),
      ...(typeof node.data.color === "string" && node.data.color.trim().length > 0
        ? { color: node.data.color }
        : {}),
      ...(typeof node.data.groupId === "string" && node.data.groupId.trim().length > 0
        ? { groupId: node.data.groupId }
        : {}),
      ...(typeof node.data.groupLabel === "string" && node.data.groupLabel.trim().length > 0
        ? { groupLabel: node.data.groupLabel }
        : {}),
      ...(typeof node.data.groupColor === "string" && node.data.groupColor.trim().length > 0
        ? { groupColor: node.data.groupColor }
        : {}),
      config: removeNullDeep(removeUndefinedDeep(node.data.config)),
    },
  };

  return serializedNode as WorkflowGraphNode;
}

function serializeWorkflowEdgeForFirestore(edge: WorkflowGraphEdge): WorkflowGraphEdge {
  const serializedEdge = {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    ...(typeof edge.type === "string" ? { type: edge.type } : {}),
    ...(typeof edge.sourceHandle === "string" ? { sourceHandle: edge.sourceHandle } : {}),
    ...(typeof edge.targetHandle === "string" ? { targetHandle: edge.targetHandle } : {}),
    ...(typeof edge.label === "string" ? { label: edge.label } : {}),
    ...(edge.markerEnd ? { markerEnd: removeNullDeep(removeUndefinedDeep(edge.markerEnd)) } : {}),
    ...(edge.style ? { style: removeNullDeep(removeUndefinedDeep(edge.style)) } : {}),
  };

  return serializedEdge as WorkflowGraphEdge;
}

function sanitizeWorkflowSnapshotForFirestore(snapshot: WorkflowSnapshot): WorkflowSnapshot {
  return {
    nodes: snapshot.nodes.map((node) => serializeWorkflowNodeForFirestore(node)),
    edges: snapshot.edges.map((edge) => serializeWorkflowEdgeForFirestore(edge)),
  };
}

function toIsoTimestamp(value: unknown): string | null {
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as Timestamp).toDate === "function"
  ) {
    return (value as Timestamp).toDate().toISOString();
  }

  return null;
}

function mapWorkflowDocument(
  snapshot: QueryDocumentSnapshot<DocumentData> | { id: string; data: () => DocumentData | undefined },
): SavedWorkflowRecord | null {
  const rawData = snapshot.data();

  if (!rawData || typeof rawData.name !== "string" || typeof rawData.userId !== "string") {
    return null;
  }

  try {
    const normalizedSnapshot = parseWorkflowSnapshot(
      JSON.stringify({
        nodes: rawData.nodes ?? [],
        edges: rawData.edges ?? [],
      }),
    );

    return {
      id: snapshot.id,
      userId: rawData.userId,
      name: rawData.name,
      description:
        typeof rawData.description === "string" && rawData.description.trim().length > 0
          ? rawData.description
          : null,
      snapshot: normalizedSnapshot,
      createdAt: toIsoTimestamp(rawData.createdAt),
      updatedAt: toIsoTimestamp(rawData.updatedAt),
    };
  } catch {
    return null;
  }
}

export async function createWorkflowDocument(
  input: CreateWorkflowInput,
): Promise<{ success: true; workflowId: string } | { success: false; message: string }> {
  try {
    const workflowRef = doc(collection(db, "workflows"));
    const sanitizedSnapshot = sanitizeWorkflowSnapshotForFirestore(input.snapshot);

    await setDoc(workflowRef, {
      userId: input.userId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      nodes: sanitizedSnapshot.nodes,
      edges: sanitizedSnapshot.edges,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      success: true,
      workflowId: workflowRef.id,
    };
  } catch {
    return {
      success: false,
      message: "Workflow could not be saved. Please try again.",
    };
  }
}

export async function updateWorkflowDocument(
  input: UpdateWorkflowInput,
): Promise<{ success: true } | { success: false; message: string }> {
  try {
    const sanitizedSnapshot = sanitizeWorkflowSnapshotForFirestore(input.snapshot);

    await updateDoc(doc(db, "workflows", input.workflowId), {
      userId: input.userId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      nodes: sanitizedSnapshot.nodes,
      edges: sanitizedSnapshot.edges,
      updatedAt: serverTimestamp(),
    });

    return {
      success: true,
    };
  } catch {
    return {
      success: false,
      message: "Workflow could not be updated. Please try again.",
    };
  }
}

export async function deleteWorkflowDocument(input: {
  workflowId: string;
}): Promise<{ success: true } | { success: false; message: string }> {
  try {
    await deleteDoc(doc(db, "workflows", input.workflowId));

    return {
      success: true,
    };
  } catch {
    return {
      success: false,
      message: "Workflow could not be deleted. Please try again.",
    };
  }
}

export async function getWorkflowDocumentById(input: {
  workflowId: string;
  userId: string;
}): Promise<
  { success: true; workflow: SavedWorkflowRecord } | { success: false; message: string }
> {
  try {
    const workflowSnapshot = await getDoc(doc(db, "workflows", input.workflowId));

    if (!workflowSnapshot.exists()) {
      return {
        success: false,
        message: "Workflow not found.",
      };
    }

    const workflow = mapWorkflowDocument({
      id: workflowSnapshot.id,
      data: () => workflowSnapshot.data(),
    });

    if (!workflow || workflow.userId !== input.userId) {
      return {
        success: false,
        message: "You do not have access to this workflow.",
      };
    }

    return {
      success: true,
      workflow,
    };
  } catch {
    return {
      success: false,
      message: "Workflow could not be loaded. Please try again.",
    };
  }
}

export async function getUserWorkflowDocuments(
  userId: string,
): Promise<
  { success: true; workflows: SavedWorkflowRecord[] } | { success: false; message: string }
> {
  try {
    const workflowQuery = query(
      collection(db, "workflows"),
      where("userId", "==", userId),
    );

    const workflowSnapshot = await getDocs(workflowQuery);
    const workflows = workflowSnapshot.docs
      .map((documentSnapshot) => mapWorkflowDocument(documentSnapshot))
      .filter((workflow): workflow is SavedWorkflowRecord => workflow !== null)
      .sort((firstWorkflow, secondWorkflow) =>
        (secondWorkflow.updatedAt ?? "").localeCompare(firstWorkflow.updatedAt ?? ""),
      );

    return {
      success: true,
      workflows,
    };
  } catch {
    return {
      success: false,
      message: "Saved workflows could not be loaded. Please try again.",
    };
  }
}
