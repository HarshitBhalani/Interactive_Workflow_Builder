"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow"; //bcaz Zustand me object selector use karte time unnecessary re-render avoid karne ke liye
import type { JSX } from "react";
import {
  ChevronDown,
  ChevronUp,
  PanelLeftClose,
  PanelRightClose,
} from "lucide-react";
import type {
  Connection,
  IsValidConnection,
  ReactFlowInstance,
  XYPosition,
} from "reactflow";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/common/utils/cn.util";
import { useAuth } from "@/features/auth/context/auth.context";
import { WorkflowSaveDialog } from "@/features/workflows/components/workflow-save-dialog.component";
import {
  createWorkflowDocument,
  getWorkflowDocumentById,
  updateWorkflowDocument,
} from "@/features/workflows/services/workflow.service";
import { useWorkflowStore } from "../stores/workflow.store";
import { LogoutButton } from "@/features/auth/components/logout-button.component";
import {
  workflowPreviewEdges,
  workflowPreviewNodes,
} from "../configs/workflowPreview.config";
import type {
  WorkflowExecutionLog,
  WorkflowValidationSummary,
  WorkflowCanvasNode,
  WorkflowGraphEdge,
  WorkflowGroupFrame,
  WorkflowGraphNode,
  WorkflowNodeKind,
  WorkflowNodeShape,
  WorkflowNodeTemplate,
  WorkflowSnapshot,
} from "../types/workflow.type";
import {
  createWorkflowSnapshot,
  parseWorkflowSnapshot,
} from "../utils/workflowPersistence.util";
import {
  getDefaultWorkflowNodeShape,
  workflowNodeAppearanceByKind,
  workflowNodeCatalog,
} from "../utils/workflowNodeFactory.util";
import {
  isValidWorkflowConnection,
  validateWorkflow,
} from "../utils/workflowValidation.util";
import WorkflowCanvas from "./workflowCanvas.component";
import { WorkflowHeading } from "./workflowHeading.component";

type JsonModalMode = "export" | "import" | null;

type NodeEditorState ={
  editingNodeId:string | null;
  draftTitle:string;
  draftSubtitle:string;
  draftColor:string | null;
};

type JsonModalState={
  mode: JsonModalMode;
  workflowJson:string;
  jsonError:string;
};

type CanvasState ={
  reactFlowInstance:ReactFlowInstance<WorkflowCanvasNode, WorkflowGraphEdge> | null;
};

type MobileDragState = {
  kind: WorkflowNodeKind;
  shape: WorkflowNodeShape;
  touchId: number;
  clientX: number;
  clientY: number;
};

type ValidationIssueItem = {
  key: string;
  nodeId: string | null;
  message: string;
};

type ExecutionLogsToggleTone = "running" | "success" | "error";
type WorkflowClipboardSelection = {
  nodes: WorkflowGraphNode[];
  edges: WorkflowGraphEdge[];
};
type WorkflowShellProps = {
  workflowId?: string;
  template?: "blank" | "approval";
};

const dragDataKey="application/workflow-node-kind";
const workflowAutoSaveDelayMs = 1800;
const defaultEditorSnapshot = createWorkflowSnapshot(
  workflowPreviewNodes,
  workflowPreviewEdges,
);
const blankEditorSnapshot: WorkflowSnapshot = {
  nodes: [],
  edges: [],
};
const nodeColorOptions = [
  "#10b981",
  "#0ea5e9",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#64748b",
  "#0f172a",
] as const;

type DraggedWorkflowTemplate = {
  kind: WorkflowNodeKind;
  shape: WorkflowNodeShape;
};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase(); 

  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    target.isContentEditable
  );
}

function serializeDraggedWorkflowTemplate(
  template: DraggedWorkflowTemplate,
): string {
  return JSON.stringify(template);
}

function getWorkflowTemplateFeedbackKey(
  kind: WorkflowNodeKind,
  shape: WorkflowNodeShape,
): string {
  return `${kind}-${shape}`;
}

function getPaletteNodeLabel(kind: WorkflowNodeKind): string {
  switch (kind) {
    case "start":
      return "Start";
    case "action":
      return "Action";
    case "condition":
      return "Condition";
    case "end":
      return "End";
    default:
      return "Node";
  }
}

function getPaletteNodeSubtitle(kind: WorkflowNodeKind): string {
  switch (kind) {
    case "start":
      return "New entry point";
    case "action":
      return "Add next task";
    case "condition":
      return "Check decision rule";
    case "end":
      return "Finish this path";
    default:
      return "Add a short description";
  }
}

function getDefaultNodeColorPreview(kind: WorkflowNodeKind): {
  backgroundColor: string;
  borderColor: string;
  color: string;
} {
  switch (kind) {
    case "start":
      return {
        backgroundColor: "rgba(16, 185, 129, 0.12)",
        borderColor: "rgba(16, 185, 129, 0.28)",
        color: "#047857",
      };
    case "action":
      return {
        backgroundColor: "rgba(14, 165, 233, 0.12)",
        borderColor: "rgba(14, 165, 233, 0.28)",
        color: "#0369a1",
      };
    case "condition":
      return {
        backgroundColor: "rgba(245, 158, 11, 0.12)",
        borderColor: "rgba(245, 158, 11, 0.32)",
        color: "#b45309",
      };
    case "end":
    default:
      return {
        backgroundColor: "rgba(100, 116, 139, 0.12)",
        borderColor: "rgba(100, 116, 139, 0.26)",
        color: "#475569",
      };
  }
}

function getCanvasNodeBounds(
  node: WorkflowGraphNode,
): { x: number; y: number; width: number; height: number } {
  const fallbackDimensionsByShape: Record<
    WorkflowNodeShape,
    { width: number; height: number }
  > = {
    terminator: { width: 240, height: 132 },
    rectangle: { width: 240, height: 132 },
    square: { width: 192, height: 192 },
    diamond: { width: 240, height: 176 },
    parallelogram: { width: 240, height: 132 },
    hexagon: { width: 240, height: 136 },
    circle: { width: 192, height: 192 },
    document: { width: 240, height: 140 },
  };

  const fallbackDimensions = fallbackDimensionsByShape[node.data.shape];

  return {
    x: node.position.x,
    y: node.position.y,
    width: node.width ?? fallbackDimensions.width,
    height: node.height ?? fallbackDimensions.height,
  };
}

function formatRelativeSaveTime(savedAtIso: string, nowTimestamp: number): string {
  const savedAtTimestamp = new Date(savedAtIso).getTime();

  if (Number.isNaN(savedAtTimestamp)) {
    return "Saved";
  }

  const elapsedSeconds = Math.max(
    0,
    Math.floor((nowTimestamp - savedAtTimestamp) / 1000),
  );

  if (elapsedSeconds < 5) {
    return "Saved just now";
  }

  if (elapsedSeconds < 60) {
    return `Saved ${elapsedSeconds} seconds ago`;
  }

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);

  if (elapsedMinutes < 60) {
    return `Saved ${elapsedMinutes} minute${elapsedMinutes === 1 ? "" : "s"} ago`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);

  if (elapsedHours < 24) {
    return `Saved ${elapsedHours} hour${elapsedHours === 1 ? "" : "s"} ago`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);

  return `Saved ${elapsedDays} day${elapsedDays === 1 ? "" : "s"} ago`;
}

export function WorkflowShell({ workflowId, template = "approval" }: WorkflowShellProps): JSX.Element {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { toastError, toastSuccess } = useToast();
  const routeDefaultSnapshot =
    template === "blank" ? blankEditorSnapshot : defaultEditorSnapshot;


  const workflowStore = useWorkflowStore(

    useShallow((state) => ({
      nodes: state.nodes,
      edges: state.edges,
      handleNodesChange: state.handleNodesChange,
      handleEdgesChange: state.handleEdgesChange,
      handleNodesDelete: state.handleNodesDelete,
      addNode: state.addNode,
      pasteNode: state.pasteNode,
      pasteSelection: state.pasteSelection,
      bringSelectionToFront: state.bringSelectionToFront,
      sendSelectionBackward: state.sendSelectionBackward,
      groupSelection: state.groupSelection,
      ungroupSelection: state.ungroupSelection,
      toggleSelectionLock: state.toggleSelectionLock,
      moveGroupBy: state.moveGroupBy,
      updateGroupMeta: state.updateGroupMeta,
      connectNodes: state.connectNodes,
      updateNodeDetails: state.updateNodeDetails,
      loadWorkflowSnapshot: state.loadWorkflowSnapshot,
      resetExecution: state.resetExecution,
      runWorkflow: state.runWorkflow,
      undo: state.undo,
      redo: state.redo,
      canUndo: state.canUndo,
      canRedo: state.canRedo,
      isRunning: state.isRunning,
      logs: state.logs,

    })),

  );

  const {
    nodes,
    edges,
    handleNodesChange,
    handleEdgesChange,
    handleNodesDelete,
    addNode,
    pasteNode,
    pasteSelection,
    bringSelectionToFront,
    sendSelectionBackward,
    groupSelection,
    ungroupSelection,
    toggleSelectionLock,
    moveGroupBy,
    updateGroupMeta,
    connectNodes,
    updateNodeDetails,
    loadWorkflowSnapshot,
    resetExecution,
    runWorkflow,
    undo,
    redo,
    canUndo,
    canRedo,
    isRunning,
    logs,
  } = workflowStore;

  const [nodeEditor,setNodeEditor] = useState<NodeEditorState>({ 
    editingNodeId: null,
    draftTitle: "",
    draftSubtitle: "",
    draftColor: null,

  });

  const [jsonModal, setJsonModal] =useState<JsonModalState>({
    mode: null,
    workflowJson: "",
    jsonError: "",
  });

  const [canvasState, setCanvasState]= useState<CanvasState>({
    reactFlowInstance: null,
  });
  const [viewportResetToken, setViewportResetToken] = useState(0);
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const [mobileAddFeedback, setMobileAddFeedback] = useState<string | null>(null);
  const [isNodeSidebarOpen, setIsNodeSidebarOpen] = useState(true);
  const [isExecutionLogsOpen, setIsExecutionLogsOpen] = useState(true);
  const [executionLogsAttentionRunId, setExecutionLogsAttentionRunId] = useState(0);
  const [acknowledgedExecutionLogsRunId, setAcknowledgedExecutionLogsRunId] = useState(0);
  const [showValidationFeedback, setShowValidationFeedback] = useState(false);
  const [mobileDragState, setMobileDragState] = useState<MobileDragState | null>(null);
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(
    workflowId ?? null,
  );
  const [currentWorkflowName, setCurrentWorkflowName] = useState("");
  const [currentWorkflowDescription, setCurrentWorkflowDescription] = useState("");
  const [workflowResetSnapshot, setWorkflowResetSnapshot] =
    useState<WorkflowSnapshot>(routeDefaultSnapshot);
  const [isWorkflowLoading, setIsWorkflowLoading] = useState(true);
  const [workflowLoadError, setWorkflowLoadError] = useState("");
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isSavingWorkflow, setIsSavingWorkflow] = useState(false);
  const [workflowSaveError, setWorkflowSaveError] = useState("");
  const [workflowSaveStatus, setWorkflowSaveStatus] = useState<
    "unsaved" | "saving" | "saved" | "error"
  >("unsaved");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [saveTimeNow, setSaveTimeNow] = useState(() => Date.now());


  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const copiedNodeRef = useRef<WorkflowGraphNode | null>(null);
  const copiedSelectionRef = useRef<WorkflowClipboardSelection | null>(null);
  const pasteCountRef = useRef(0);
  const lastSavedSnapshotKeyRef = useRef(JSON.stringify(routeDefaultSnapshot));

  const selectedNode =nodeEditor.editingNodeId
    ? (nodes.find((node)=>node.id===nodeEditor.editingNodeId) ?? null) : null;
  const selectedCanvasNodes = nodes.filter((node) => node.selected);
  const selectedCanvasNodeIds = new Set(selectedCanvasNodes.map((node) => node.id));
  const selectedCanvasEdges = edges.filter(
    (edge) =>
      edge.selected ||
      (selectedCanvasNodeIds.has(edge.source) && selectedCanvasNodeIds.has(edge.target)),
  );
  const selectedGroupIds = new Set(
    selectedCanvasNodes
      .map((node) => node.data.groupId)
      .filter((value): value is string => Boolean(value)),
  );
  const lockTargets = selectedCanvasNodes;
  const hasSelectedLockTargets = lockTargets.length > 0;
  const areAllSelectedLockTargetsLocked =
    hasSelectedLockTargets && lockTargets.every((node) => node.data.isLocked);
  const canGroupSelection = selectedCanvasNodes.length > 1;
  const canUngroupSelection = selectedGroupIds.size > 0;
  const workflowGroupFrames: WorkflowGroupFrame[] = Array.from(
    nodes.reduce((groupMap, node) => {
      if (!node.data.groupId) {
        return groupMap;
      }

      const existingNodes = groupMap.get(node.data.groupId) ?? [];
      existingNodes.push(node);
      groupMap.set(node.data.groupId, existingNodes);

      return groupMap;
    }, new Map<string, WorkflowGraphNode[]>()),
  )
    .map(([groupId, groupedNodes]) => {
      const groupBounds = groupedNodes.map(getCanvasNodeBounds);
      const minX = Math.min(...groupBounds.map((bounds) => bounds.x));
      const minY = Math.min(...groupBounds.map((bounds) => bounds.y));
      const maxX = Math.max(
        ...groupBounds.map((bounds) => bounds.x + bounds.width),
      );
      const maxY = Math.max(
        ...groupBounds.map((bounds) => bounds.y + bounds.height),
      );
      const maxZIndex = Math.max(...groupedNodes.map((node) => node.zIndex ?? 0));
      const horizontalPadding = 28;
      const topPadding = 72;
      const bottomPadding = 26;

      return {
        id: groupId,
        label: groupedNodes[0]?.data.groupLabel ?? "Group",
        color: groupedNodes[0]?.data.groupColor ?? "#0ea5e9",
        isLocked: groupedNodes.every((node) => node.data.isLocked),
        x: minX - horizontalPadding,
        y: minY - topPadding,
        width: maxX - minX + horizontalPadding * 2,
        height: maxY - minY + topPadding + bottomPadding,
        zIndex: maxZIndex - 1,
      };
    })
    .sort((firstGroup, secondGroup) => firstGroup.zIndex - secondGroup.zIndex);
  const paletteNodeCatalog = workflowNodeCatalog.filter(
    (nodeItem) => nodeItem.shape === getDefaultWorkflowNodeShape(nodeItem.kind),
  );
  const validationSummary: WorkflowValidationSummary = validateWorkflow(nodes, edges);
  const firstValidationMessageByNodeId = Object.fromEntries(
    Object.entries(validationSummary.nodeErrors).map(([nodeId, messages]) => [
      nodeId,
      messages[0] ?? null,
    ]),
  );
  const validationIssueItems: ValidationIssueItem[] = [
    ...validationSummary.workflowErrors.map((message, index) => ({
      key: `workflow-${index}`,
      nodeId: null,
      message,
    })),
    ...Object.entries(validationSummary.nodeErrors).flatMap(([nodeId, messages]) =>
      messages.map((message, index) => ({
        key: `${nodeId}-${index}`,
        nodeId,
        message,
      })),
    ),
  ];

  const canvasNodes: WorkflowCanvasNode[]=nodes.map((node) => ({
    ...node,
    draggable: !node.data.isLocked,
    connectable: !node.data.isLocked,
    deletable: !node.data.isLocked,
    data: {
      ...node.data,
      validationMessage: showValidationFeedback
        ? (firstValidationMessageByNodeId[node.id] ?? null)
        : null,
      onEdit: openNodeEditor,
      onDelete: deleteNode,
    },
  }));

  const validateConnection: IsValidConnection = (connection) => isValidWorkflowConnection(connection, nodes, edges);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const syncViewport = (event?: MediaQueryListEvent): void => {
      setIsCompactViewport(event?.matches ?? mediaQuery.matches);
    };

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);

    return () => {
      mediaQuery.removeEventListener("change", syncViewport);
    };
  }, []);

  useEffect(() => {
    setIsNodeSidebarOpen(!isCompactViewport);
  }, [isCompactViewport]);

  useEffect(() => {
    setIsExecutionLogsOpen(!isCompactViewport);
  }, [isCompactViewport]);

  useEffect(() => {
    if (isExecutionLogsOpen) {
      setAcknowledgedExecutionLogsRunId(executionLogsAttentionRunId);
    }
  }, [executionLogsAttentionRunId, isExecutionLogsOpen]);

  useEffect(() => {
    if (!isCompactViewport || typeof document === "undefined") {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    if (isExecutionLogsOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isCompactViewport, isExecutionLogsOpen]);

  useEffect(() => {
    if (loading || !user) {
      return;
    }

    const activeUser = user;
    let isCancelled = false;

    async function syncWorkflowWithRoute(): Promise<void> {
      setWorkflowLoadError("");
      closeNodeEditor();
      closeJsonModal();
      resetExecution();

      if (!workflowId) {
        if (isCancelled) {
          return;
        }

        setCurrentWorkflowId(null);
        setCurrentWorkflowName("");
        setCurrentWorkflowDescription("");
        setWorkflowResetSnapshot(routeDefaultSnapshot);
        lastSavedSnapshotKeyRef.current = JSON.stringify(routeDefaultSnapshot);
        setWorkflowSaveStatus("unsaved");
        setLastSavedAt(null);
        loadWorkflowSnapshot(routeDefaultSnapshot);
        setViewportResetToken((currentToken) => currentToken + 1);
        setIsWorkflowLoading(false);
        return;
      }

      setIsWorkflowLoading(true);

      const result = await getWorkflowDocumentById({
        workflowId,
        userId: activeUser.uid,
      });

      if (isCancelled) {
        return;
      }

      if (!result.success) {
        setWorkflowLoadError(result.message);
        setIsWorkflowLoading(false);
        return;
      }

      setCurrentWorkflowId(result.workflow.id);
      setCurrentWorkflowName(result.workflow.name);
      setCurrentWorkflowDescription(result.workflow.description ?? "");
      setWorkflowResetSnapshot(result.workflow.snapshot);
      lastSavedSnapshotKeyRef.current = JSON.stringify(result.workflow.snapshot);
      setWorkflowSaveStatus("saved");
      setLastSavedAt(result.workflow.updatedAt ?? result.workflow.createdAt);
      loadWorkflowSnapshot(result.workflow.snapshot);
      setViewportResetToken((currentToken) => currentToken + 1);
      setIsWorkflowLoading(false);
    }

    void syncWorkflowWithRoute();

    return () => {
      isCancelled = true;
    };
  }, [workflowId, user, loading, loadWorkflowSnapshot, resetExecution, routeDefaultSnapshot]);

  useEffect(() => {
    if (!currentWorkflowId || !currentWorkflowName || !user || isWorkflowLoading) {
      return;
    }

    const snapshot = createWorkflowSnapshot(nodes, edges);
    const snapshotKey = JSON.stringify(snapshot);

    if (snapshotKey === lastSavedSnapshotKeyRef.current) {
      if (workflowSaveStatus !== "saved") {
        setWorkflowSaveStatus("saved");
      }
      return;
    }

    setWorkflowSaveStatus("unsaved");

    const timer = window.setTimeout(async () => {
      setIsSavingWorkflow(true);
      setWorkflowSaveStatus("saving");
      setWorkflowSaveError("");

      const result = await updateWorkflowDocument({
        workflowId: currentWorkflowId,
        userId: user.uid,
        name: currentWorkflowName,
        description: currentWorkflowDescription,
        snapshot,
      });

      if (!result.success) {
        setWorkflowSaveError(result.message);
        setWorkflowSaveStatus("error");
        toastError("Auto-save failed", result.message);
        setIsSavingWorkflow(false);
        return;
      }

      lastSavedSnapshotKeyRef.current = snapshotKey;
      setWorkflowResetSnapshot(snapshot);
      setWorkflowSaveStatus("saved");
      setLastSavedAt(new Date().toISOString());
      setIsSavingWorkflow(false);
    }, workflowAutoSaveDelayMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [currentWorkflowId, currentWorkflowName, currentWorkflowDescription, user, isWorkflowLoading, nodes, edges, workflowSaveStatus]);

  useEffect(() => {
    if (workflowSaveStatus !== "saved" || !lastSavedAt) {
      return;
    }

    setSaveTimeNow(Date.now());

    const interval = window.setInterval(() => {
      setSaveTimeNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [lastSavedAt, workflowSaveStatus]);

  useEffect(() => {
    if (!isCompactViewport) {
      return;
    }

    if (nodeEditor.editingNodeId !== null || jsonModal.mode !== null) {
      setIsExecutionLogsOpen(false);
      setIsNodeSidebarOpen(false);
    }
  }, [isCompactViewport, jsonModal.mode, nodeEditor.editingNodeId]);

  useEffect(() => {
    if (!isCompactViewport || !mobileAddFeedback) {
      return;
    }

    const timer = window.setTimeout(() => {
      setMobileAddFeedback(null);
    }, 700);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isCompactViewport, mobileAddFeedback]);

  function getViewportCenterPosition(): XYPosition | null {
    if (!canvasState.reactFlowInstance || !canvasContainerRef.current) {
      return null;
    }

    const { x, y, zoom } = canvasState.reactFlowInstance.getViewport();
    const bounds = canvasContainerRef.current.getBoundingClientRect();

    return {
      x: (bounds.width / 2 - x) / zoom,
      y: (bounds.height / 2 - y) / zoom,
    };
  }

  function handleCanvasNodesChange(changes: Parameters<typeof handleNodesChange>[0]): void {
    handleNodesChange(changes);
  }

  function handleCanvasEdgesChange(changes: Parameters<typeof handleEdgesChange>[0]): void {
    handleEdgesChange(changes);
  }

  function handleCanvasNodesDelete(deletedNodes: WorkflowCanvasNode[]): void{
    handleNodesDelete(deletedNodes);
  }

  function openNodeEditor(nodeId: string): void {
    const node = nodes.find((currentNode) => currentNode.id === nodeId);

    if (!node) {
      return;
    }

    setNodeEditor(
      {
      editingNodeId: nodeId,
      draftTitle: node.data.title,
      draftSubtitle: node.data.subtitle,
      draftColor: node.data.color ?? null,
    }
    );
  }

  function closeNodeEditor(): void{
    setNodeEditor({
      editingNodeId:null,
      draftTitle: "",
      draftSubtitle: "",
      draftColor: null,
    });
  }

  function deleteNode(nodeId:string): void {
    const node = nodes.find((currentNode) => currentNode.id===nodeId);

    if (!node){
      return;
    }

    if (nodeEditor.editingNodeId===nodeId) {
      closeNodeEditor();
    }

    handleNodesDelete([node]);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  function openExportModal(): void {
    const snapshot: WorkflowSnapshot = createWorkflowSnapshot(nodes, edges);


    setJsonModal({
      mode: "export",
      workflowJson: JSON.stringify(snapshot,null,2),
      jsonError: "",

    });
  }

  function openImportModal(): void {
    setJsonModal({

      mode: "import",
      workflowJson: "",
      jsonError: "",
    });
  }

  function closeJsonModal(): void{

    setJsonModal({
      mode: null,
      workflowJson: "",
      jsonError: "",
    });
  }

  function openSaveWorkflowDialog(): void {
    setWorkflowSaveError("");
    setIsSaveDialogOpen(true);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  function closeSaveWorkflowDialog(): void {
    if (isSavingWorkflow) {
      return;
    }

    setWorkflowSaveError("");
    setIsSaveDialogOpen(false);
  }

  function handleConnect(connection: Connection): void {
    connectNodes(connection);
  }

  function getLogCardClassName(log:WorkflowExecutionLog):string 
  {
    switch (log.status) {
      case "error":
        return "border-rose-200 bg-rose-50 text-rose-700";

      case "success":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";

      case "running":
        return "border-amber-200 bg-amber-50 text-amber-700";

      case "info":
        return "border-sky-200 bg-sky-50 text-sky-700";

      default:
        return "border-slate-200 bg-slate-50 text-slate-700";
    }

  }

  function getExecutionLogsToggleClassName(): string {
    if (logs.length === 0) {
      return "";
    }

    const hasErrorLog = logs.some((log) => log.status === "error");
    const hasSuccessLog = logs.some((log) => log.status === "success");
    const shouldHighlightExecutionLogsToggle =
      !isExecutionLogsOpen &&
      executionLogsAttentionRunId > acknowledgedExecutionLogsRunId;
    const animationClassName = shouldHighlightExecutionLogsToggle
      ? "animate-pulse"
      : "";

    let tone: ExecutionLogsToggleTone = "running";

    if (hasErrorLog) {
      tone = "error";
    } else if (!isRunning && hasSuccessLog) {
      tone = "success";
    }

    switch (tone) {
      case "success":
        return cn(
          "border-emerald-300 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-300/70",
          animationClassName,
        );
      case "error":
        return cn(
          "border-rose-300 bg-rose-50 text-rose-700 ring-2 ring-rose-300/70",
          animationClassName,
        );
      case "running":
      default:
        return cn(
          "border-amber-300 bg-amber-50 text-amber-700 ring-2 ring-amber-300/70",
          animationClassName,
        );
    }
  }

  function focusNodeById(nodeId: string): void {
    const targetNode = nodes.find((node) => node.id === nodeId);
    const reactFlowInstance = canvasState.reactFlowInstance;

    if (!targetNode || !reactFlowInstance) {
      return;
    }

    reactFlowInstance.setCenter(
      targetNode.position.x + 120,
      targetNode.position.y + 60,
      {
        zoom: Math.max(reactFlowInstance.getZoom(), 0.9),
        duration: 300,
      },
    );
  }

  function handleCanvasInit(
    instance:ReactFlowInstance<WorkflowCanvasNode,WorkflowGraphEdge>
  ): void {
    setCanvasState({ //because reactFlowInstance in handleAddNode function to calculate the position of new node based on canvas center
      reactFlowInstance:instance,
    });
  }

  const handleUndo= useCallback((): void => {
    closeNodeEditor();
    closeJsonModal();
    undo();
  },[undo]);

  const handleRedo=useCallback((): void =>{
    closeNodeEditor();
    closeJsonModal();
    redo();
  },[redo]);

  const handleReset = useCallback(():void=>{
    setShowValidationFeedback(false);
    closeNodeEditor();
    closeJsonModal();
    closeSaveWorkflowDialog();
    setWorkflowResetSnapshot(routeDefaultSnapshot);
    setWorkflowSaveError("");
    loadWorkflowSnapshot(routeDefaultSnapshot);
    setViewportResetToken((currentToken) => currentToken + 1);

    if (currentWorkflowId) {
      setWorkflowSaveStatus("unsaved");
    } else {
      setCurrentWorkflowId(null);
      setCurrentWorkflowName("");
      setCurrentWorkflowDescription("");
      lastSavedSnapshotKeyRef.current = JSON.stringify(routeDefaultSnapshot);
      setWorkflowSaveStatus("unsaved");
      router.replace(template === "blank" ? "/workflows/new?template=blank" : "/workflows/new");
    }

    if (isCompactViewport) {
      canvasContainerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  },[closeSaveWorkflowDialog, currentWorkflowId, isCompactViewport, loadWorkflowSnapshot, routeDefaultSnapshot, router, template]);

  const handleRunWorkflow=useCallback(():void=>{
    setShowValidationFeedback(true);
    setExecutionLogsAttentionRunId((currentRunId) => currentRunId + 1);
    if (isExecutionLogsOpen) {
      setAcknowledgedExecutionLogsRunId((currentRunId) => currentRunId + 1);
    }
    closeNodeEditor();
    closeJsonModal();
    void runWorkflow();
  },[isExecutionLogsOpen, runWorkflow]);

  const handleResetExecution=useCallback((): void => 
    {
    setExecutionLogsAttentionRunId(0);
    setAcknowledgedExecutionLogsRunId(0);
    resetExecution();
  },[resetExecution]);

  const handleSaveWorkflow = useCallback(
    async (name: string, description = currentWorkflowDescription): Promise<void> => {
      if (!user) {
        setWorkflowSaveError("You need to be signed in to save workflows.");
        setWorkflowSaveStatus("error");
        toastError("Save failed", "You need to be signed in to save workflows.");
        return;
      }

      const snapshot = createWorkflowSnapshot(nodes, edges);
      const snapshotKey = JSON.stringify(snapshot);

      setIsSavingWorkflow(true);
      setWorkflowSaveStatus("saving");
      setWorkflowSaveError("");

      if (!currentWorkflowId) {
        const result = await createWorkflowDocument({
          userId: user.uid,
          name,
          description,
          snapshot,
        });

        if (!result.success) {
          setWorkflowSaveError(result.message);
          setWorkflowSaveStatus("error");
          toastError("Save failed", result.message);
          setIsSavingWorkflow(false);
          return;
        }

        setCurrentWorkflowId(result.workflowId);
        setCurrentWorkflowName(name);
        setCurrentWorkflowDescription(description);
        setWorkflowResetSnapshot(snapshot);
        lastSavedSnapshotKeyRef.current = snapshotKey;
        setWorkflowSaveStatus("saved");
        setLastSavedAt(new Date().toISOString());
        setIsSavingWorkflow(false);
        setIsSaveDialogOpen(false);
        toastSuccess("Workflow saved", "Your workflow is now available on the dashboard.");
        router.replace(`/workflows/${result.workflowId}`);
        return;
      }

      const result = await updateWorkflowDocument({
        workflowId: currentWorkflowId,
        userId: user.uid,
        name,
        description,
        snapshot,
      });

      if (!result.success) {
        setWorkflowSaveError(result.message);
        setWorkflowSaveStatus("error");
        toastError("Save failed", result.message);
        setIsSavingWorkflow(false);
        return;
      }

      setCurrentWorkflowName(name);
      setCurrentWorkflowDescription(description);
      setWorkflowResetSnapshot(snapshot);
      lastSavedSnapshotKeyRef.current = snapshotKey;
      setWorkflowSaveStatus("saved");
      setLastSavedAt(new Date().toISOString());
      setIsSavingWorkflow(false);
      setIsSaveDialogOpen(false);
      toastSuccess("Changes saved");
    },
    [currentWorkflowDescription, currentWorkflowId, edges, nodes, router, toastError, toastSuccess, user],
  );

  const handlePrimarySaveAction = useCallback((): void => {
    if (currentWorkflowId && currentWorkflowName.trim().length > 0) {
      void handleSaveWorkflow(currentWorkflowName);
      return;
    }

    openSaveWorkflowDialog();
  }, [currentWorkflowId, currentWorkflowName, handleSaveWorkflow]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  function handleAddNode(kind: WorkflowNodeKind, shape?: WorkflowNodeShape): void {
    if(!canvasState.reactFlowInstance || !canvasContainerRef.current) {
      addNode(kind, undefined, shape);
      return;
    }

    const viewportPosition = isCompactViewport ? getViewportCenterPosition() : null;
    const canvasBounds = canvasContainerRef.current.getBoundingClientRect();
    const position = viewportPosition ?? canvasState.reactFlowInstance.screenToFlowPosition({
      x: canvasBounds.left +canvasBounds.width / 2,
      y: canvasBounds.top +canvasBounds.height / 2,
    });

  
    addNode(kind, position, shape);
  }

  function handleAddNodeFromButton(nodeTemplate: WorkflowNodeTemplate): void {
    
    if (isCompactViewport) {
      setMobileAddFeedback(getWorkflowTemplateFeedbackKey(nodeTemplate.kind, nodeTemplate.shape));
      canvasContainerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }

    handleAddNode(nodeTemplate.kind, nodeTemplate.shape);
  }

  function handleDropNode(
    kind: WorkflowNodeKind,
    position: XYPosition,
    shape?: WorkflowNodeShape,
  ): void {
    addNode(kind, position, shape);
  }

  function handleMobileNodeTouchStart(
    event: React.TouchEvent<HTMLDivElement>,
    nodeTemplate: WorkflowNodeTemplate,
  ): void {
    if (!isCompactViewport) {
      return;
    }

    event.preventDefault();

    const [touch] = Array.from(event.changedTouches);

    if (!touch) {
      return;
    }

    setMobileDragState({
      kind: nodeTemplate.kind,
      shape: nodeTemplate.shape,
      touchId: touch.identifier,
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
  }

  const handleCopySelection = useCallback((): void => {
    if (selectedCanvasNodes.length === 0) {
      copiedSelectionRef.current = null;
      copiedNodeRef.current = null;
      return;
    }

    copiedSelectionRef.current = {
      nodes: selectedCanvasNodes.map((node) => ({
        ...node,
        position: { ...node.position },
        data: {
          ...node.data,
          config: { ...node.data.config },
        },
      })),
      edges: selectedCanvasEdges.map((edge) => ({
        ...edge,
      })),
    };
    copiedNodeRef.current =
      selectedCanvasNodes.length === 1 ? copiedSelectionRef.current.nodes[0] : null;
    pasteCountRef.current = 0;
  }, [selectedCanvasEdges, selectedCanvasNodes]);

  const handlePasteNode = useCallback((): void => {
    if (copiedSelectionRef.current) {
      pasteCountRef.current += 1;
      pasteSelection(copiedSelectionRef.current, pasteCountRef.current);
      return;
    }

    const copiedNode = copiedNodeRef.current;

    if (!copiedNode) {
      return;
    }

    pasteCountRef.current += 1;

    const position = {
      x: copiedNode.position.x + pasteCountRef.current * 40,
      y: copiedNode.position.y + pasteCountRef.current * 40,
    };

    pasteNode(copiedNode, position);
  }, [pasteNode, pasteSelection]);

  function handleNodeTypeDragStart(
    event: React.DragEvent<HTMLDivElement>,
    nodeTemplate: WorkflowNodeTemplate,
  ): void {
    event.dataTransfer.setData(
      dragDataKey,
      serializeDraggedWorkflowTemplate({
        kind: nodeTemplate.kind,
        shape: nodeTemplate.shape,
      }),
    );
    event.dataTransfer.effectAllowed = "move";
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  function saveNodeDetails(): void {
    if (!nodeEditor.editingNodeId) {
      return;
    }

    updateNodeDetails(nodeEditor.editingNodeId, {
      title: nodeEditor.draftTitle.trim() || "Untitled node",
      subtitle: nodeEditor.draftSubtitle.trim() || "Add a short description",
      color: nodeEditor.draftColor,
    });

    closeNodeEditor();
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  function importWorkflow(): void {
    try {
      setShowValidationFeedback(false);
      const snapshot = parseWorkflowSnapshot(jsonModal.workflowJson);

      loadWorkflowSnapshot(snapshot);
      closeJsonModal();
      closeNodeEditor();
    } catch (error) {
      setJsonModal((currentModal) => (
        {
        ...currentModal,
        jsonError:
          error instanceof Error
            ? error.message
            : "Could not import the workflow JSON.",
        }
    ));
    }
  }

  useEffect(()=>{
    function handleKeyDown(event: KeyboardEvent): void {
      if (typeof event.key !== "string" || event.key.length === 0) {
        return;
      }

      const pressedKey = event.key.toLowerCase();
      const isPrimaryModifierPressed = event.ctrlKey || event.metaKey;
      const isEditorOpen = nodeEditor.editingNodeId !== null || jsonModal.mode !== null; //because both node editor and json modal are considered as "editor" in this context
      const isTyping = isTypingTarget(event.target);

      switch(pressedKey){
        case "escape":
          if (nodeEditor.editingNodeId !==null){
            closeNodeEditor();
          }

          if (jsonModal.mode !==null){
            closeJsonModal();
          }

          return;


        case "enter":
          if(isTyping  && isPrimaryModifierPressed){
            if(nodeEditor.editingNodeId !==null){

              event.preventDefault();
              saveNodeDetails();
            }

            if(jsonModal.mode==="import") {
              event.preventDefault();

              importWorkflow();
            }

          }

          if(isTyping){
            return;
          }


          break;

        default:
          if(isTyping) {
            return;
          }

      }

      if (isPrimaryModifierPressed) {
        switch (pressedKey) {
          case "z":
            event.preventDefault();

            if (event.shiftKey){
              handleRedo();
            } else {
              handleUndo();
            }


            return;

          case "y":

            event.preventDefault();
            handleRedo();
            return;


          case "s":
            event.preventDefault();
            openExportModal();
            return;


          case "c":
            if(selectedCanvasNodes.length > 0) {

              event.preventDefault();
              handleCopySelection();
            }

            return;

          case "v":
            if(copiedNodeRef.current || copiedSelectionRef.current) {
              event.preventDefault();

              handlePasteNode();
            }

            return;

          case "o":
            event.preventDefault();
            openImportModal();
            return;

          default:
            break;
        }


      }

      if(isEditorOpen) {
          return;
      }

      switch (pressedKey) {
        case "s":
          handleAddNode("start");
          return;

        case "a":
          handleAddNode("action");
          return;

        case "c":
          handleAddNode("condition");
          return;

        case "e":
          handleAddNode("end");
          return;

        default:
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, 
  
  [
    nodeEditor.editingNodeId,
    jsonModal.mode,
    nodes,
    edges,
    selectedCanvasNodes,
    saveNodeDetails,
    importWorkflow,
    openExportModal,
    handleAddNode,
    handleCopySelection,
    handlePasteNode,
    handleUndo,
    handleRedo,
  ]
);

  useEffect(() => {
    if (!isCompactViewport || !mobileDragState) {
      return;
    }

    const activeMobileDrag = mobileDragState;

    function findTrackedTouch(touchList: TouchList): Touch | null {
      return (
        Array.from(touchList).find(
          (touch) => touch.identifier === activeMobileDrag.touchId
        ) ?? null
      );
    }

    function handleTouchMove(event: TouchEvent): void {
      const trackedTouch = findTrackedTouch(event.touches);

      if (!trackedTouch) {
        return;
      }

      event.preventDefault();
      setMobileDragState((currentState) =>
        currentState
          ? {
              ...currentState,
              clientX: trackedTouch.clientX,
              clientY: trackedTouch.clientY,
            }
          : currentState
      );
    }

    function handleTouchEnd(event: TouchEvent): void {
      const trackedTouch = findTrackedTouch(event.changedTouches);

      if (!trackedTouch) {
        return;
      }

      event.preventDefault();

      const canvasBounds = canvasContainerRef.current?.getBoundingClientRect();
      const droppedInsideCanvas = canvasBounds
        ? trackedTouch.clientX >= canvasBounds.left &&
          trackedTouch.clientX <= canvasBounds.right &&
          trackedTouch.clientY >= canvasBounds.top &&
          trackedTouch.clientY <= canvasBounds.bottom
        : false;

      if (droppedInsideCanvas && canvasState.reactFlowInstance) {
        const position = canvasState.reactFlowInstance.screenToFlowPosition({
          x: trackedTouch.clientX,
          y: trackedTouch.clientY,
        });

        addNode(activeMobileDrag.kind, position, activeMobileDrag.shape);
        setMobileAddFeedback(getWorkflowTemplateFeedbackKey(activeMobileDrag.kind, activeMobileDrag.shape));
      }

      setMobileDragState(null);
    }

    function handleTouchCancel(): void {
      setMobileDragState(null);
    }

    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: false });
    window.addEventListener("touchcancel", handleTouchCancel);

    return () => {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, [addNode, canvasState.reactFlowInstance, isCompactViewport, mobileDragState]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.2),transparent_35%),linear-gradient(180deg,#f8fbff_0%,#eef6ff_100%)] px-3 py-3 sm:px-6 sm:py-4">
        <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-7xl flex-col rounded-[20px] border border-black/8 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.08)] lg:min-h-0">
          <div className="space-y-5 border-b border-black/8 px-4 py-4 sm:px-5 sm:py-5 lg:px-6">
            <Skeleton className="h-10 w-64 max-w-full" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-9 w-28 rounded-xl" />
              <Skeleton className="h-9 w-28 rounded-xl" />
              <Skeleton className="h-9 w-28 rounded-xl" />
            </div>
          </div>
          <div className="grid flex-1 gap-0 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
            <div className="hidden border-r border-black/8 bg-[#f6f8f9] p-5 lg:block">
              <div className="space-y-4">
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
              </div>
            </div>
            <div className="p-4 sm:p-5 lg:p-6">
              <Skeleton className="h-[60vh] rounded-3xl" />
            </div>
            <div className="hidden border-l border-black/8 bg-[#f6f8f9] p-5 lg:block">
              <div className="space-y-4">
                <Skeleton className="h-8 w-36" />
                <Skeleton className="h-32 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.2),transparent_35%),linear-gradient(180deg,#f8fbff_0%,#eef6ff_100%)] px-4">
        <Card className="w-full max-w-xl rounded-[28px] border-white/70 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.14)] backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle>Sign in required</CardTitle>
            <CardDescription className="mt-2">
              You need an account to access and edit workflows.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a
              href="/login"
              className={buttonVariants({ variant: "default" })}
            >
              Go to login
            </a>
            <a
              href="/signup"
              className={buttonVariants({ variant: "outline" })}
            >
              Create account
            </a>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (isWorkflowLoading) {
    return (
      <main className="min-h-screen bg-[#edf0f2] px-3 py-3 text-foreground sm:px-6 sm:py-4 lg:h-screen lg:overflow-hidden">
        <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-7xl flex-col rounded-[20px] border border-black/8 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.08)] lg:h-full lg:min-h-0 lg:overflow-hidden">
          <div className="space-y-5 border-b border-black/8 px-4 py-4 sm:px-5 sm:py-5 lg:px-6">
            <Skeleton className="h-10 w-64 max-w-full" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-8 w-32 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-full" />
            </div>
          </div>
          <div className="grid flex-1 gap-0 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
            <div className="hidden border-r border-black/8 bg-[#f6f8f9] p-5 lg:block">
              <div className="space-y-4">
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
              </div>
            </div>
            <div className="p-4 sm:p-5 lg:p-6">
              <Skeleton className="h-[60vh] rounded-[24px]" />
            </div>
            <div className="hidden border-l border-black/8 bg-[#f6f8f9] p-5 lg:block">
              <div className="space-y-4">
                <Skeleton className="h-8 w-36" />
                <Skeleton className="h-28 rounded-2xl" />
                <Skeleton className="h-28 rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (workflowLoadError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#edf0f2] px-4">
        <Card className="w-full max-w-xl rounded-[28px] border-white/70 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.14)] backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle>Workflow unavailable</CardTitle>
            <CardDescription className="mt-2">
              {workflowLoadError}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/dashboard"
              className={buttonVariants({ variant: "default" })}
            >
              Go to dashboard
            </Link>
            <Link
              href="/workflows/new"
              className={buttonVariants({ variant: "outline" })}
            >
              Create new workflow
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#edf0f2] px-3 py-3 text-foreground sm:px-6 sm:py-4 lg:h-screen lg:overflow-hidden">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-7xl flex-col rounded-[20px] border border-black/8 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.08)] lg:h-full lg:min-h-0 lg:overflow-hidden">
        <header className="flex flex-col gap-4 border-b border-black/8 px-4 py-4 sm:px-5 sm:py-5 lg:flex-row lg:items-end lg:justify-between lg:px-6">
          <div className="flex flex-col gap-4 flex-1">
            <WorkflowHeading />
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
              <Badge variant="outline">
                {currentWorkflowName || "Unsaved workflow"}
              </Badge>
              {currentWorkflowId ? (
                <Badge
                  variant="outline"
                  className={cn(
                    workflowSaveStatus === "saved"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "",
                    workflowSaveStatus === "saving"
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "",
                    workflowSaveStatus === "unsaved"
                      ? "border-sky-200 bg-sky-50 text-sky-700"
                      : "",
                    workflowSaveStatus === "error"
                      ? "border-rose-200 bg-rose-50 text-rose-700"
                      : "",
                  )}
                >
                  {workflowSaveStatus === "saved"
                    ? lastSavedAt
                      ? formatRelativeSaveTime(lastSavedAt, saveTimeNow)
                      : "Saved"
                    : workflowSaveStatus === "saving"
                      ? "Saving..."
                      : workflowSaveStatus === "error"
                        ? "Save failed"
                        : "Unsaved changes"}
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 lg:w-auto lg:items-end">
            <LogoutButton />
            
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end sm:items-start">
              <Link
                href="/dashboard"
                className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}
              >
                Dashboard
              </Link>

              <Button
                type="button"
                onClick={handlePrimarySaveAction}
                className="w-full sm:w-auto"
              >
                Save
              </Button>

              <Button
                variant="outline"
                type="button"
                onClick={openImportModal}
                className="w-full sm:w-auto"
              >
                Import JSON
              </Button>

              <Button
                variant="outline"
                type="button"
                onClick={openExportModal}
                className="w-full sm:w-auto"
              >
                Export JSON
              </Button>

              <div className="col-span-2 hidden flex-col gap-2 sm:col-span-1 sm:flex">
                <Button
                  type="button"
                  onClick={handleRunWorkflow}
                  className="w-full"
                  disabled={isRunning || nodes.length === 0}
                >
                  {isRunning ? "Running..." : "Run Workflow"}
                </Button>
              </div>
            </div>
          </div>
        </header>

        <section
          className={cn(
            "relative grid min-h-0 flex-1 gap-0",
            "lg:grid-cols-[auto_minmax(0,1fr)_auto]",
          )}
        >
          <aside
            className={cn(
              "relative h-full min-h-0 overflow-visible bg-[#f6f8f9] transition-[width,max-height,padding] duration-300 ease-out lg:border-r lg:border-b-0",
              isCompactViewport
                ? cn(
                    "border-b border-black/8",
                    isNodeSidebarOpen
                      ? "max-h-105 p-4 sm:p-5"
                      : "max-h-0 p-0"
                  )
                : cn(
                    "border-b border-black/8",
                    isNodeSidebarOpen
                      ? "w-full overflow-x-visible p-4 sm:p-5 lg:w-70"
                      : "w-0 overflow-visible p-0"
                  )
            )}
          >
            <div
              className={cn(
                "flex h-full min-h-0 flex-col transition-all duration-200",
                isNodeSidebarOpen
                  ? "pointer-events-auto opacity-100"
                  : "pointer-events-none opacity-0"
              )}
            >
              <Card className="flex h-full max-h-full min-h-0 flex-col rounded-2xl">
                <CardHeader className="p-4 pb-0">
                  <CardTitle className="text-base">Node state</CardTitle>
                </CardHeader>
                <CardContent className="node-state-scroll flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain p-4">
                  <div className="grid grid-cols-2 gap-3 pb-1 sm:grid-cols-2 lg:grid-cols-1">
                    {paletteNodeCatalog.map((nodeItem) => (
                      <div
                        key={nodeItem.key}
                        draggable={!isCompactViewport}
                        onDragStart={(event) =>
                          handleNodeTypeDragStart(event, nodeItem)
                        }
                        onTouchStart={(event) =>
                          handleMobileNodeTouchStart(event, nodeItem)
                        }
                        className={`workflow-node-palette-item flex min-w-0 cursor-grab flex-col items-center gap-3 rounded-xl border px-4 py-3 text-center transition active:cursor-grabbing sm:flex-row sm:items-start sm:justify-between sm:text-left ${workflowNodeAppearanceByKind[nodeItem.kind].sidebarClassName}`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900">
                            {getPaletteNodeLabel(nodeItem.kind)}
                          </p>
                          <p className="mt-1 text-[11px] leading-5 text-slate-500 sm:whitespace-nowrap">
                            {getPaletteNodeSubtitle(nodeItem.kind)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className={`w-full sm:w-auto sm:shrink-0 ${workflowNodeAppearanceByKind[nodeItem.kind].sidebarButtonClassName} ${isCompactViewport && mobileAddFeedback===getWorkflowTemplateFeedbackKey(nodeItem.kind, nodeItem.shape) ? "animate-pulse ring-2 ring-sky-400/60" : ""}`}
                          onClick={() => handleAddNodeFromButton(nodeItem)}
                        >
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <button
              type="button"
              aria-label={isNodeSidebarOpen ? "Collapse node sidebar" : "Expand node sidebar"}
              title={isNodeSidebarOpen ? "Collapse node sidebar" : "Expand node sidebar"}
              onClick={() => setIsNodeSidebarOpen((currentState) => !currentState)}
              className={cn(
                "absolute z-10 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition hover:border-slate-300 hover:text-slate-900",
                isCompactViewport
                  ? isNodeSidebarOpen
                    ? "right-4 -bottom-5"
                    : "right-4 top-3"
                  : isNodeSidebarOpen
                    ? "-right-5 top-5"
                    : "left-3 top-5"
              )}
            >
              {isCompactViewport ? (
                isNodeSidebarOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )
              ) : (
                <svg
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    isNodeSidebarOpen ? "" : "rotate-180"
                  )}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              )}
            </button>
          </aside>

          <div className="min-h-0 bg-[#f1f4f5] p-3 sm:p-5 lg:p-6">
            <Card className="flex h-full min-h-[65vh] flex-col rounded-[18px] sm:min-h-[70vh] lg:min-h-0">
              <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div>
                  <CardTitle>Workflow canvas</CardTitle>
                  <CardDescription className="mt-1">
                    Make a workflow
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                  <Badge variant="outline">{nodes.length} nodes</Badge>
                  <Badge variant="outline">{edges.length} links</Badge>
                </div>
              </div>

              <div
                ref={canvasContainerRef}
                className="relative flex min-h-[55vh] flex-1 overflow-hidden rounded-b-[18px] bg-[#fbfcfd] sm:min-h-[60vh] lg:min-h-0"
              >
                <WorkflowCanvas
                  key={viewportResetToken}
                  nodes={canvasNodes}
                  edges={edges}
                  groups={workflowGroupFrames}
                  onNodesChange={handleCanvasNodesChange}
                  onEdgesChange={handleCanvasEdgesChange}
                  onNodesDelete={handleCanvasNodesDelete}
                  onConnect={handleConnect}
                  isValidConnection={validateConnection}
                  onDropNode={handleDropNode}
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                  onReset={handleReset}
                  canUndo={canUndo}
                  canRedo={canRedo}
                  selectedNodeCount={selectedCanvasNodes.length}
                  canGroupSelection={canGroupSelection}
                  canUngroupSelection={canUngroupSelection}
                  canToggleLockSelection={hasSelectedLockTargets}
                  areAllSelectedLockTargetsLocked={areAllSelectedLockTargetsLocked}
                  onBringSelectionToFront={bringSelectionToFront}
                  onSendSelectionBackward={sendSelectionBackward}
                  onGroupSelection={groupSelection}
                  onUngroupSelection={ungroupSelection}
                  onToggleLockSelection={toggleSelectionLock}
                  onMoveGroupBy={moveGroupBy}
                  onUpdateGroupMeta={updateGroupMeta}
                  keepToolbarSingleRow={!isNodeSidebarOpen && !isExecutionLogsOpen}
                  hideCanvasActions={isCompactViewport && isExecutionLogsOpen}
                  onCanvasInit={handleCanvasInit}
                  viewportResetToken={viewportResetToken}
                />
              </div>

              <div className="border-t border-slate-200 px-4 py-3 sm:hidden">
                <Button
                  type="button"
                  onClick={handleRunWorkflow}
                  className="w-full"
                  disabled={isRunning || nodes.length === 0}
                >
                  {isRunning ? "Running..." : "Run Workflow"}
                </Button>
              </div>
            </Card>
          </div>

          {isCompactViewport && isExecutionLogsOpen ? (
            <button
              type="button"
              aria-label="Close execution logs overlay"
              title="Close execution logs overlay"
              onClick={() => setIsExecutionLogsOpen(false)}
              className="absolute inset-0 z-20 bg-slate-950/20"
            />
          ) : null}

          <aside
            className={cn(
              "relative min-h-0 border-t border-black/8 bg-[#f8fafb] p-3 sm:p-5 transition-[width,padding] duration-300 ease-out lg:border-l lg:border-t-0",
              isCompactViewport
                ? cn(
                    "fixed bottom-0 left-0 top-0 z-30 w-[min(88vw,24rem)] max-w-sm border-r border-black/8 shadow-[18px_0_36px_rgba(15,23,42,0.16)] transition-transform duration-300 ease-out",
                    isExecutionLogsOpen ? "translate-x-0" : "-translate-x-full",
                  )
                : isExecutionLogsOpen
                  ? "w-full lg:w-88 lg:p-6"
                  : "w-0 overflow-hidden p-0 lg:w-0 lg:p-0",
            )}
          >
            <div
              className={cn(
                "h-full transition-all duration-200",
                isCompactViewport
                  ? "opacity-100"
                  : isExecutionLogsOpen
                    ? "pointer-events-auto opacity-100"
                    : "pointer-events-none opacity-0",
              )}
            >
            <Card className="flex h-full min-h-0 flex-col rounded-[18px]">
              <CardHeader className="border-b border-slate-200 px-5 py-4">
                <div className="flex items-start gap-3">
                  <div>
                    <CardTitle>Execution logs</CardTitle>
                    <CardDescription className="mt-1">
                      Follow each workflow step as it runs.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex min-h-0 flex-1 flex-col gap-3 px-5 py-5">
                {showValidationFeedback && validationSummary.hasErrors ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    <div className="font-medium">Validation issues found</div>
                    <div
                      className={cn(
                        "mt-2 space-y-2",
                        validationIssueItems.length > 5 ? "max-h-64 overflow-y-auto pr-1" : "",
                      )}
                    >
                      {validationIssueItems.map((issue) =>
                        issue.nodeId ? (
                          <button
                            key={issue.key}
                            type="button"
                            onClick={() => {
                              if (issue.nodeId) {
                                focusNodeById(issue.nodeId);
                              }
                            }}
                            className="block w-full cursor-pointer rounded-lg border border-rose-200 bg-white px-3 py-2 text-left text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
                          >
                            <span className="font-medium">{issue.nodeId}</span>: {issue.message}
                          </button>
                        ) : (
                          <div
                            key={issue.key}
                            className="rounded-lg border border-rose-200 bg-white px-3 py-2"
                          >
                            {issue.message}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-slate-500">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{logs.length} logs</Badge>
                    <Badge variant="outline">{isRunning ? "Active run" : "Idle"}</Badge>
                    {showValidationFeedback && validationSummary.hasErrors ? (
                      <Badge variant="outline" className="border-rose-200 text-rose-700">
                        Validation errors
                      </Badge>
                    ) : null}
                  </div>

                  <Button
                    variant="outline"
                    type="button"
                    size="sm"
                    onClick={handleResetExecution}
                    disabled={isRunning}
                  >
                    Reset Execution
                  </Button>
                </div>

                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">

                  {logs.length === 0 ? (

                    <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
                      Run the workflow to see live execution updates.
                    </div>

                  ) : (
                    logs.map((log)=>(
                      <div
                        key={log.id}
                        className={cn(
                          "animate-[logFadeIn_220ms_ease-out] rounded-xl border px-4 py-3 text-sm",
                          getLogCardClassName(log),
                        )}>

                        <div className="font-medium">{log.message}</div>
                        
                        <div className="mt-1 text-[11px] uppercase tracking-[0.08em] opacity-75">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
            </div>

            {isCompactViewport ? (
              isExecutionLogsOpen ? (
                <button
                  type="button"
                  aria-label="Hide execution logs"
                  title="Hide execution logs"
                  onClick={() => setIsExecutionLogsOpen(false)}
                  className="absolute -right-5 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition hover:border-slate-300 hover:text-slate-900"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              ) : null
            ) : (
              isExecutionLogsOpen ? (
                <button
                  type="button"
                  aria-label="Hide execution logs"
                  title="Hide execution logs"
                  onClick={() => setIsExecutionLogsOpen(false)}
                  className="absolute z-10 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition hover:border-slate-300 hover:text-slate-900 lg:-left-5 lg:top-5"
                >
                  <PanelRightClose className="h-4 w-4" />
                </button>
              ) : null
            )}
          </aside>

          {(isCompactViewport || !isExecutionLogsOpen) ? (
            <button
              type="button"
              aria-label="Show execution logs"
              title="Show execution logs"
              onClick={() => setIsExecutionLogsOpen(true)}
              className={cn(
                "absolute z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition hover:border-slate-300 hover:text-slate-900",
                getExecutionLogsToggleClassName(),
                isCompactViewport
                  ? "-left-2 top-1/2 -translate-y-1/2"
                  : "right-4 top-5",
              )}
            >
              {isCompactViewport ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
          ) : null}
        </section>
      </div>

      {nodeEditor.editingNodeId ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/30 px-0 sm:items-center sm:px-4">
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.2)] sm:max-h-[calc(100vh-2rem)] sm:max-w-2xl sm:rounded-2xl">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-950">
                Node settings
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {selectedNode
                  ? `Manage details and logs for the ${selectedNode.data.kind} node.`
                  : "Manage the selected workflow node."}
              </p>
            </div>

            <div className="px-5 py-5">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="edit-node-title"
                    className="text-sm font-medium text-slate-700"
                  >
                    Title
                  </label>
                  <input
                    id="edit-node-title"
                    type="text"
                    value={nodeEditor.draftTitle}
                    onChange={(event) =>
                      setNodeEditor((currentEditor) => ({
                        ...currentEditor,
                        draftTitle: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="edit-node-subtitle"
                    className="text-sm font-medium text-slate-700"
                  >
                    Subtitle
                  </label>
                  <textarea
                    id="edit-node-subtitle"
                    value={nodeEditor.draftSubtitle}
                    onChange={(event) =>
                      setNodeEditor((currentEditor) => ({
                        ...currentEditor,
                        draftSubtitle: event.target.value,
                      }))
                    }
                    rows={4}
                    className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium text-slate-700">Node color</div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setNodeEditor((currentEditor) => ({
                          ...currentEditor,
                          draftColor: null,
                        }))
                      }
                      className={cn(
                        "h-9 rounded-full border px-3 text-xs font-medium transition",
                        nodeEditor.draftColor === null
                          ? "shadow-[0_0_0_3px_rgba(15,23,42,0.08)]"
                          : "hover:opacity-90",
                      )}
                      style={getDefaultNodeColorPreview(selectedNode?.data.kind ?? "action")}
                    >
                      Default
                    </button>
                    {nodeColorOptions.map((colorOption) => (
                      <button
                        key={colorOption}
                        type="button"
                        onClick={() =>
                          setNodeEditor((currentEditor) => ({
                            ...currentEditor,
                            draftColor: colorOption,
                          }))
                        }
                        className={cn(
                          "h-9 w-9 rounded-full border-2 transition",
                          nodeEditor.draftColor === colorOption
                            ? "scale-110 border-slate-900 shadow-[0_0_0_3px_rgba(15,23,42,0.08)]"
                            : "border-white hover:scale-105",
                        )}
                        style={{ backgroundColor: colorOption }}
                        aria-label={`Select ${colorOption} node color`}
                        title="Choose node color"
                      />
                    ))}
                    <label className="flex h-9 cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition hover:border-slate-300">
                      <span>Custom</span>
                      <span
                        className="h-5 w-5 rounded-md border border-slate-200"
                        style={{ backgroundColor: nodeEditor.draftColor ?? "#0ea5e9" }}
                      />
                      <input
                        type="color"
                        value={nodeEditor.draftColor ?? "#0ea5e9"}
                        onChange={(event) =>
                          setNodeEditor((currentEditor) => ({
                            ...currentEditor,
                            draftColor: event.target.value,
                          }))
                        }
                        className="sr-only"
                        aria-label="Choose custom node color"
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-medium text-slate-900">Node actions</div>
                  <p className="mt-1 text-sm text-slate-500">
                    Save your edits or remove this node from the workflow.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button type="button" onClick={saveNodeDetails}>
                      Save changes
                    </Button>
                    <Button
                      variant="outline"
                      type="button"
                      className="border-rose-200 text-rose-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-800"
                      onClick={() => {
                        if (selectedNode) {
                          deleteNode(selectedNode.id);
                        }
                      }}
                    >
                      Delete node
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
              <Button variant="outline" type="button" onClick={closeNodeEditor}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {jsonModal.mode ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/30 px-0 sm:items-center sm:px-4">
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.2)] sm:max-h-[calc(100vh-2rem)] sm:max-w-2xl sm:rounded-2xl">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-950">
                {jsonModal.mode === "export"
                  ? "Export workflow JSON"
                  : "Import workflow JSON"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {jsonModal.mode==="export"
                  ? "Copy this snapshot if you want to save or share the current flow."
                  : "Paste a saved workflow snapshot to load it into the canvas."}
              </p>
            </div>

            <div className="space-y-4 px-5 py-5">
              <textarea
                value={jsonModal.workflowJson}

                onChange={(event) =>
                  setJsonModal((currentModal) => ({
                    ...currentModal,
                    workflowJson: event.target.value,
                  }))
                  
                }
                readOnly={jsonModal.mode === "export"}
                rows={16}
                className="min-h-80 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-900 outline-none transition focus:border-slate-400 sm:resize-none"
              />

              {jsonModal.jsonError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {jsonModal.jsonError}
                </div>
              ) : null}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
              <Button variant="outline" type="button" onClick={closeJsonModal}>
                Close
              </Button>
              {jsonModal.mode === "import" ? (
                <Button type="button" onClick={importWorkflow}>
                  Load Workflow
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {mobileDragState ? (
        <div className="pointer-events-none fixed inset-0 z-50">
          <div
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 rounded-xl border px-3 py-2 text-sm font-medium text-slate-900 shadow-[0_18px_36px_rgba(15,23,42,0.18)]",
              workflowNodeAppearanceByKind[mobileDragState.kind].sidebarClassName
            )}
            style={{
              left: mobileDragState.clientX,
              top: mobileDragState.clientY,
            }}
          >
            {getPaletteNodeLabel(mobileDragState.kind)}
          </div>
        </div>
      ) : null}

      <WorkflowSaveDialog
        open={isSaveDialogOpen}
        defaultName={currentWorkflowName}
        defaultDescription={currentWorkflowDescription}
        mode={currentWorkflowId ? "update" : "create"}
        isSaving={isSavingWorkflow}
        error={workflowSaveError}
        onClose={closeSaveWorkflowDialog}
        onSubmit={(name, description) => {
          void handleSaveWorkflow(name, description);
        }}
      />
    </main>
  );
}
