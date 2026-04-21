"use client";

import type { JSX } from "react";
import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpToLine,
  Edit3,
  Group,
  Hand,
  Lock,
  Minus,
  MousePointer2,
  PictureInPicture,
  PictureInPicture2,
  Plus,
  SearchCheck,
  Unlock,
  Ungroup,
  Redo,
  RotateCcw,
  ScanSearch,
  Undo,
} from "lucide-react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  MiniMap,
  useStore,
  type Connection,
  type IsValidConnection,
  type OnEdgesChange,
  type OnNodesChange,
  type NodeTypes,
  type ReactFlowInstance,
  type XYPosition,
} from "reactflow";
import "reactflow/dist/style.css";
import { cn } from "@/common/utils/cn.util";
import type {
  WorkflowCanvasNode,
  WorkflowGraphEdge,
  WorkflowGroupFrame,
  WorkflowNodeKind,
  WorkflowNodeShape,
} from "../types/workflow.type";
import { workflowNodeAppearanceByKind } from "../utils/workflowNodeFactory.util";
import { WorkflowEdge } from "./workflowEdge.component";
import { WorkflowNode } from "./workflowNode.component";

const nodeTypes: NodeTypes = {
  workflowNode: WorkflowNode,
};

const edgeTypes = {
  workflowEdge: WorkflowEdge,
};

const groupFrameHorizontalPadding = 28;
const groupFrameTopPadding = 72;
const groupFrameBottomPadding = 26;

function GroupFramesOverlay({
  groups,
  isInteractive,
  canDragGroups,
  onMoveGroupBy,
  onUpdateGroupMeta,
}: {
  groups: WorkflowGroupFrame[];
  isInteractive: boolean;
  canDragGroups: boolean;
  onMoveGroupBy: (groupId: string, delta: XYPosition) => void;
  onUpdateGroupMeta: (
    groupId: string,
    payload: { label: string; color: string | null },
  ) => void;
}): JSX.Element | null {
  const [x, y, zoom] = useStore((state) => state.transform);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [draftLabel, setDraftLabel] = useState("");
  const [draftColor, setDraftColor] = useState("#0ea5e9");
  const dragStateRef = useRef<{
    groupId: string;
    clientX: number;
    clientY: number;
  } | null>(null);

  if (groups.length === 0) {
    return null;
  }

  function isGroupControlTarget(target: EventTarget | null): boolean {
    return target instanceof HTMLElement
      ? Boolean(target.closest("[data-group-control='true']"))
      : false;
  }

  function startGroupDrag(
    event: React.MouseEvent<HTMLElement>,
    group: WorkflowGroupFrame,
  ): void {
    if (!isInteractive || !canDragGroups || group.isLocked) {
      return;
    }

    if (isGroupControlTarget(event.target)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    dragStateRef.current = {
      groupId: group.id,
      clientX: event.clientX,
      clientY: event.clientY,
    };

    const handleMouseMove = (moveEvent: MouseEvent): void => {
      const currentDragState = dragStateRef.current;

      if (!currentDragState) {
        return;
      }

      const deltaX = (moveEvent.clientX - currentDragState.clientX) / zoom;
      const deltaY = (moveEvent.clientY - currentDragState.clientY) / zoom;

      if (deltaX === 0 && deltaY === 0) {
        return;
      }

      onMoveGroupBy(currentDragState.groupId, {
        x: deltaX,
        y: deltaY,
      });

      dragStateRef.current = {
        ...currentDragState,
        clientX: moveEvent.clientX,
        clientY: moveEvent.clientY,
      };
    };

    const handleMouseUp = (): void => {
      dragStateRef.current = null;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-[8] overflow-hidden">
      <div
        className="pointer-events-none"
        style={{
          transform: `translate(${x}px, ${y}px) scale(${zoom})`,
          transformOrigin: "0 0",
        }}
      >
        {groups.map((group) => (
          <div
            key={group.id}
            className={cn(
              "pointer-events-none absolute rounded-[30px] border shadow-[0_20px_40px_rgba(14,165,233,0.12)]",
              isInteractive && canDragGroups && !group.isLocked
                ? "cursor-grab"
                : "",
            )}
            style={{
              left: group.x,
              top: group.y,
              width: group.width,
              height: group.height,
              zIndex: group.zIndex,
              borderColor: `${group.color}66`,
              backgroundColor: `${group.color}1f`,
            }}
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-16 rounded-t-[30px]"
              style={{
                background: `linear-gradient(180deg, ${group.color}22 0%, transparent 100%)`,
              }}
            />
            <button
              type="button"
              aria-label={`Drag ${group.label}`}
              title={`Drag ${group.label}`}
              onMouseDown={(event) => startGroupDrag(event, group)}
              className={cn(
                "pointer-events-auto absolute inset-x-0 top-0 h-24 rounded-t-[30px]",
                isInteractive && canDragGroups && !group.isLocked
                  ? "cursor-grab active:cursor-grabbing"
                  : "pointer-events-none cursor-default",
              )}
            />
            <button
              type="button"
              aria-label={`Drag ${group.label} left edge`}
              title={`Drag ${group.label}`}
              onMouseDown={(event) => startGroupDrag(event, group)}
              className={cn(
                "pointer-events-auto absolute left-0 rounded-l-[30px]",
                isInteractive && canDragGroups && !group.isLocked
                  ? "cursor-grab active:cursor-grabbing"
                  : "pointer-events-none cursor-default",
              )}
              style={{
                top: groupFrameTopPadding,
                width: groupFrameHorizontalPadding,
                height: Math.max(
                  group.height - groupFrameTopPadding - groupFrameBottomPadding,
                  0,
                ),
              }}
            />
            <button
              type="button"
              aria-label={`Drag ${group.label} right edge`}
              title={`Drag ${group.label}`}
              onMouseDown={(event) => startGroupDrag(event, group)}
              className={cn(
                "pointer-events-auto absolute right-0 rounded-r-[30px]",
                isInteractive && canDragGroups && !group.isLocked
                  ? "cursor-grab active:cursor-grabbing"
                  : "pointer-events-none cursor-default",
              )}
              style={{
                top: groupFrameTopPadding,
                width: groupFrameHorizontalPadding,
                height: Math.max(
                  group.height - groupFrameTopPadding - groupFrameBottomPadding,
                  0,
                ),
              }}
            />
            <button
              type="button"
              aria-label={`Drag ${group.label} bottom area`}
              title={`Drag ${group.label}`}
              onMouseDown={(event) => startGroupDrag(event, group)}
              className={cn(
                "pointer-events-auto absolute inset-x-0 bottom-0 rounded-b-[30px]",
                isInteractive && canDragGroups && !group.isLocked
                  ? "cursor-grab active:cursor-grabbing"
                  : "pointer-events-none cursor-default",
              )}
              style={{
                height: groupFrameBottomPadding,
              }}
            />
            <div
              onMouseDown={(event) => startGroupDrag(event, group)}
              className={cn(
                "pointer-events-auto absolute left-4 right-4 top-4 z-10 flex items-center justify-between gap-3",
                isInteractive && canDragGroups && !group.isLocked
                  ? "cursor-grab active:cursor-grabbing"
                  : "",
              )}
            >
              <button
                type="button"
                data-group-control="true"
                className={cn(
                  "flex h-10 max-w-[calc(100%-3rem)] items-center gap-2 rounded-full border bg-white/95 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] shadow-sm",
                  isInteractive && canDragGroups && !group.isLocked
                    ? "cursor-grab active:cursor-grabbing"
                    : "pointer-events-none cursor-default",
                )}
                style={{
                  borderColor: `${group.color}66`,
                  color: group.color,
                }}
              >
                <span className="truncate">{group.label}</span>
              </button>
              <button
                type="button"
                aria-label={`Edit ${group.label}`}
                title={`Edit ${group.label}`}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setDraftLabel(group.label);
                  setDraftColor(group.color);
                  setEditingGroupId((currentGroupId) =>
                    currentGroupId === group.id ? null : group.id,
                  );
                }}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border bg-white/92 text-slate-600 shadow-sm transition hover:text-slate-900"
                style={{
                  borderColor: `${group.color}66`,
                }}
                data-group-control="true"
              >
                <Edit3 size={13} />
              </button>
            </div>
            {editingGroupId === group.id ? (
              <div
                data-group-control="true"
                className="pointer-events-auto absolute right-4 top-14 z-20 w-60 rounded-2xl border bg-white p-3 shadow-[0_18px_36px_rgba(15,23,42,0.16)]"
                style={{
                  borderColor: `${group.color}66`,
                }}
              >
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                  Group name
                </label>
                <input
                  type="text"
                  value={draftLabel}
                  onChange={(event) => setDraftLabel(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
                <label className="mt-3 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <span>Box color</span>
                  <input
                    type="color"
                    value={draftColor}
                    onChange={(event) => setDraftColor(event.target.value)}
                    className="h-8 w-10 cursor-pointer rounded-md border-0 bg-transparent p-0"
                  />
                </label>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingGroupId(null)}
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateGroupMeta(group.id, {
                        label: draftLabel,
                        color: draftColor,
                      });
                      setEditingGroupId(null);
                    }}
                    className="flex-1 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export type WorkflowCanvasProps = {
  nodes: WorkflowCanvasNode[];
  edges: WorkflowGraphEdge[];
  groups: WorkflowGroupFrame[];
  onNodesChange:OnNodesChange;
  onEdgesChange:OnEdgesChange;
  onNodesDelete:(deletedNodes: WorkflowCanvasNode[])=>void;
  onConnect: (connection: Connection) => void;
  isValidConnection: IsValidConnection;
  onDropNode: (
    kind: WorkflowNodeKind,
    position: XYPosition,
    shape?: WorkflowNodeShape,
  ) => void;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  canUndo: boolean;
  canRedo: boolean;
  selectedNodeCount: number;
  canGroupSelection: boolean;
  canUngroupSelection: boolean;
  canToggleLockSelection: boolean;
  areAllSelectedLockTargetsLocked: boolean;
  onBringSelectionToFront: () => void;
  onSendSelectionBackward: () => void;
  onGroupSelection: () => void;
  onUngroupSelection: () => void;
  onToggleLockSelection: () => void;
  onMoveGroupBy: (groupId: string, delta: XYPosition) => void;
  onUpdateGroupMeta: (
    groupId: string,
    payload: { label: string; color: string | null },
  ) => void;
  keepToolbarSingleRow?: boolean;
  hideCanvasActions?: boolean;
  onCanvasInit?: (
    instance: ReactFlowInstance<WorkflowCanvasNode, WorkflowGraphEdge>
  ) => void;
  viewportResetToken?: number;
};

type Props = WorkflowCanvasProps;
type CanvasInteractionMode = "select" | "pan";

function getCanvasNodeBounds(node: WorkflowCanvasNode): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
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

function getMiniMapNodeColor(node: WorkflowCanvasNode): string {
  return (
    node.data.color ??
    workflowNodeAppearanceByKind[node.data.kind]?.minimapColor ??
    "#64748b"
  );
}

function WorkflowMiniMapGroupsOverlay({
  nodes,
  groups,
  width,
  height,
}: {
  nodes: WorkflowCanvasNode[];
  groups: WorkflowGroupFrame[];
  width: number;
  height: number;
}): JSX.Element | null {
  const [translateX, translateY, zoom] = useStore((state) => state.transform);
  const viewportWidth = useStore((state) => state.width);
  const viewportHeight = useStore((state) => state.height);

  if (groups.length === 0 || nodes.length === 0) {
    return null;
  }

  const nodeBounds = nodes.map(getCanvasNodeBounds);
  const nodeMinX = Math.min(...nodeBounds.map((bounds) => bounds.x));
  const nodeMinY = Math.min(...nodeBounds.map((bounds) => bounds.y));
  const nodeMaxX = Math.max(...nodeBounds.map((bounds) => bounds.x + bounds.width));
  const nodeMaxY = Math.max(...nodeBounds.map((bounds) => bounds.y + bounds.height));
  const viewBounds = {
    x: -translateX / zoom,
    y: -translateY / zoom,
    width: viewportWidth / zoom,
    height: viewportHeight / zoom,
  };
  const boundingRect = {
    x: Math.min(nodeMinX, viewBounds.x),
    y: Math.min(nodeMinY, viewBounds.y),
    width: Math.max(nodeMaxX, viewBounds.x + viewBounds.width) - Math.min(nodeMinX, viewBounds.x),
    height: Math.max(nodeMaxY, viewBounds.y + viewBounds.height) - Math.min(nodeMinY, viewBounds.y),
  };
  const scale = Math.max(boundingRect.width / width, boundingRect.height / height);
  const scaledWidth = Math.max(scale * width, 1);
  const scaledHeight = Math.max(scale * height, 1);
  const offsetScale = 5;
  const padding = offsetScale * scale;
  const viewBoxX = boundingRect.x - (scaledWidth - boundingRect.width) / 2 - padding;
  const viewBoxY = boundingRect.y - (scaledHeight - boundingRect.height) / 2 - padding;
  const viewBoxWidth = scaledWidth + padding * 2;
  const viewBoxHeight = scaledHeight + padding * 2;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`}
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden rounded-[16px]"
      aria-hidden="true"
    >
      {groups.map((group) => (
        <rect
          key={group.id}
          x={group.x}
          y={group.y}
          width={group.width}
          height={group.height}
          rx={18}
          ry={18}
          fill={`${group.color}24`}
          stroke={`${group.color}99`}
          strokeWidth={Math.max(scale * 1.25, 1.5)}
        />
      ))}
    </svg>
  );
}

function WorkflowCanvas({
  nodes,
  edges,
  groups,
  onNodesChange,
  onEdgesChange,
  onNodesDelete,
  onConnect,
  isValidConnection,
  onDropNode,
  onUndo,
  onRedo,
  onReset,
  canUndo,
  canRedo,
  selectedNodeCount,
  canGroupSelection,
  canUngroupSelection,
  canToggleLockSelection,
  areAllSelectedLockTargetsLocked,
  onBringSelectionToFront,
  onSendSelectionBackward,
  onGroupSelection,
  onUngroupSelection,
  onToggleLockSelection,
  onMoveGroupBy,
  onUpdateGroupMeta,
  keepToolbarSingleRow = false,
  hideCanvasActions = false,
  onCanvasInit,
  viewportResetToken = 0,
}: Props): JSX.Element {
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance<WorkflowCanvasNode, WorkflowGraphEdge> | null>(
      null
    );
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const [isMiniMapVisible, setIsMiniMapVisible] = useState(true);
  const [interactionMode, setInteractionMode] =
    useState<CanvasInteractionMode>("select");
  const [viewportZoom, setViewportZoom] = useState(1);
  const miniMapWidth = 192;
  const miniMapHeight = 136;
  const canvasEdges = edges.map((edge) => ({
    ...edge,
    type: edge.type ?? "workflowEdge",
  }));

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
    if (!reactFlowInstance) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      reactFlowInstance.fitView({
        padding: isCompactViewport ? 0.12 : 0.18,
        duration: 350,
      });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [reactFlowInstance, isCompactViewport, viewportResetToken]);

  function handleInit(
    instance: ReactFlowInstance<WorkflowCanvasNode, WorkflowGraphEdge>
  ): void {
    setReactFlowInstance(instance);
    setViewportZoom(instance.getZoom());
    onCanvasInit?.(instance);
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>): void {
    event.preventDefault();

    const draggedNodeTemplate = event.dataTransfer.getData(
      "application/workflow-node-kind"
    );

    if (!draggedNodeTemplate || !reactFlowInstance) {
      return;
    }

    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    try {
      const parsedTemplate = JSON.parse(draggedNodeTemplate) as {
        kind?: WorkflowNodeKind;
        shape?: WorkflowNodeShape;
      };

      if (!parsedTemplate.kind) {
        return;
      }

      onDropNode(parsedTemplate.kind, position, parsedTemplate.shape);
    } catch {
      onDropNode(draggedNodeTemplate as WorkflowNodeKind, position);
    }
  }

  function handleZoomIn(): void {
    reactFlowInstance?.zoomIn({ duration: 180 });
  }

  function handleZoomOut(): void {
    reactFlowInstance?.zoomOut({ duration: 180 });
  }

  function handleFitView(): void {
    reactFlowInstance?.fitView({
      padding: isCompactViewport ? 0.12 : 0.18,
      duration: 260,
    });
  }

  function handleResetZoom(): void {
    reactFlowInstance?.setViewport(
      {
        x: reactFlowInstance.getViewport().x,
        y: reactFlowInstance.getViewport().y,
        zoom: 1,
      },
      { duration: 220 },
    );
  }

  const isSelectionMode = interactionMode === "select";
  const isSelectionEnabled = isSelectionMode;
  const isDragMode = interactionMode === "pan";
  const showSelectionTools = selectedNodeCount > 0;
  const shouldWrapToolbar = showSelectionTools && !keepToolbarSingleRow;
  const zoomLabel = `${Math.round(viewportZoom * 100)}%`;

  return (
    <div
      className={cn(
        "h-full w-full touch-none",
        isSelectionMode
          ? "workflow-canvas--select"
          : "workflow-canvas--pan",
      )}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <ReactFlow
        onInit={handleInit}
        onMove={(_, viewport) => setViewportZoom(viewport.zoom)}
        nodes={nodes}
        edges={canvasEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodesDelete={onNodesDelete}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        elevateEdgesOnSelect
        fitView
        fitViewOptions={{ padding: isCompactViewport ? 0.12 : 0.18 }}
        minZoom={0.2}
        maxZoom={2.5}
        nodesDraggable={isDragMode}
        nodesConnectable
        elementsSelectable
        panOnDrag={isDragMode}
        selectionOnDrag={isSelectionEnabled}
        selectionKeyCode={null}
        zoomOnPinch
        zoomOnScroll={!isCompactViewport}
        deleteKeyCode={["Backspace", "Delete"]}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.1}
          color="#cbd5e1"
        />
        <GroupFramesOverlay
          groups={groups}
          isInteractive
          canDragGroups={isDragMode}
          onMoveGroupBy={onMoveGroupBy}
          onUpdateGroupMeta={onUpdateGroupMeta}
        />
        {!isCompactViewport ? (
          <div
            data-export-exclude="true"
            className={cn(
              "absolute left-1/2 top-4 z-10 -translate-x-1/2 items-center gap-1 rounded-2xl border border-slate-200 bg-white/96 p-1 shadow-[0_12px_24px_rgba(15,23,42,0.12)] backdrop-blur",
              shouldWrapToolbar
                ? "flex w-[min(42rem,calc(100%-2rem))] flex-wrap justify-center"
                : "flex w-fit max-w-[calc(100%-2rem)] flex-nowrap justify-center",
            )}
          >
            <button
              type="button"
              aria-label="Selection mode"
              title="Selection mode"
              onClick={() => setInteractionMode("select")}
              className={cn(
                "flex h-10 min-w-[6.5rem] items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium transition sm:px-4",
                shouldWrapToolbar ? "flex-1 sm:flex-none" : "flex-none",
                isSelectionMode
                  ? "bg-sky-500 text-white shadow-[0_10px_18px_rgba(14,165,233,0.28)]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <MousePointer2 size={16} />
              <span>Cursor</span>
            </button>
            <button
              type="button"
              aria-label="Drag mode"
              title="Drag mode"
              onClick={() => setInteractionMode("pan")}
              className={cn(
                "flex h-10 min-w-[6.5rem] items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium transition sm:px-4",
                shouldWrapToolbar ? "flex-1 sm:flex-none" : "flex-none",
                !isSelectionMode
                  ? "bg-slate-900 text-white shadow-[0_10px_18px_rgba(15,23,42,0.18)]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <Hand size={16} />
              <span>Drag</span>
            </button>
            <button
              type="button"
              aria-label="Reset zoom to 100%"
              title="Reset zoom to 100%"
              onClick={handleResetZoom}
              className={cn(
                "flex h-10 min-w-[5.5rem] items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 sm:px-4",
                shouldWrapToolbar ? "flex-1 sm:flex-none" : "flex-none",
              )}
            >
              <SearchCheck size={16} />
              <span>{zoomLabel}</span>
            </button>
            <button
              type="button"
              aria-label={areAllSelectedLockTargetsLocked ? "Unlock selection" : "Lock selection"}
              title={areAllSelectedLockTargetsLocked ? "Unlock selection" : "Lock selection"}
              onClick={onToggleLockSelection}
              disabled={!canToggleLockSelection}
              className={cn(
                "flex h-10 min-w-[6.5rem] items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium transition sm:px-4",
                shouldWrapToolbar ? "flex-1 sm:flex-none" : "flex-none",
                areAllSelectedLockTargetsLocked
                  ? "bg-amber-100 text-amber-800 shadow-[0_10px_18px_rgba(245,158,11,0.18)]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                !canToggleLockSelection
                  ? "cursor-not-allowed text-slate-300 hover:bg-transparent hover:text-slate-300"
                  : "",
              )}
            >
              {areAllSelectedLockTargetsLocked ? <Unlock size={16} /> : <Lock size={16} />}
              <span>{areAllSelectedLockTargetsLocked ? "Unlock" : "Lock"}</span>
            </button>
            {showSelectionTools ? (
              <>
                <button
                  type="button"
                  aria-label="Bring selection to front"
                  title="Bring selection to front"
                  onClick={onBringSelectionToFront}
                  className="flex h-10 min-w-12 items-center justify-center rounded-xl px-3 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  <ArrowUpToLine size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Send selection backward"
                  title="Send selection backward"
                  onClick={onSendSelectionBackward}
                  className="flex h-10 min-w-12 items-center justify-center rounded-xl px-3 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  <ArrowDownToLine size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Group selection"
                  title="Group selection"
                  onClick={onGroupSelection}
                  disabled={!canGroupSelection}
                  className="flex h-10 min-w-[6rem] flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-300 sm:flex-none sm:px-4"
                >
                  <Group size={16} />
                  <span>Group</span>
                </button>
                <button
                  type="button"
                  aria-label="Ungroup selection"
                  title="Ungroup selection"
                  onClick={onUngroupSelection}
                  disabled={!canUngroupSelection}
                  className="flex h-10 min-w-[6.5rem] flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-300 sm:flex-none sm:px-4"
                >
                  <Ungroup size={16} />
                  <span>Ungroup</span>
                </button>
                <div className="flex h-10 min-w-[6rem] flex-1 items-center justify-center rounded-xl bg-slate-50 px-3 text-center text-xs font-semibold uppercase tracking-widest text-slate-500 sm:flex-none">
                  {selectedNodeCount} selected
                </div>
              </>
            ) : null}
          </div>
        ) : (
          <div
            data-export-exclude="true"
            className="absolute left-1/2 top-3 z-10 flex w-[min(calc(100%-1.25rem),16.5rem)] -translate-x-1/2 items-center gap-1 rounded-xl border border-slate-200 bg-white/96 p-1 shadow-[0_12px_24px_rgba(15,23,42,0.12)] backdrop-blur"
          >
            <button
              type="button"
              aria-label="Selection mode"
              title="Selection mode"
              onClick={() => setInteractionMode("select")}
              className={cn(
                "flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition",
                isSelectionMode
                  ? "bg-sky-500 text-white shadow-[0_10px_18px_rgba(14,165,233,0.28)]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <MousePointer2 size={14} />
              <span>Cursor</span>
            </button>
            <button
              type="button"
              aria-label="Drag mode"
              title="Drag mode"
              onClick={() => setInteractionMode("pan")}
              className={cn(
                "flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition",
                !isSelectionMode
                  ? "bg-slate-900 text-white shadow-[0_10px_18px_rgba(15,23,42,0.18)]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <Hand size={14} />
              <span>Drag</span>
            </button>
            <button
              type="button"
              aria-label="Reset zoom to 100%"
              title="Reset zoom to 100%"
              onClick={handleResetZoom}
              className="flex h-9 min-w-[4.25rem] items-center justify-center gap-1 rounded-lg px-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
            >
              <SearchCheck size={13} />
              <span>{zoomLabel}</span>
            </button>
          </div>
        )}
        <div
          data-export-exclude="true"
          className="absolute bottom-4 left-4 z-10 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_12px_24px_rgba(15,23,42,0.12)]"
        >
          <button
            type="button"
            aria-label="Zoom in"
            title="Zoom in"
            onClick={handleZoomIn}
            className="flex h-10 w-10 items-center justify-center border-b border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <Plus size={16} />
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            title="Zoom out"
            onClick={handleZoomOut}
            className="flex h-10 w-10 items-center justify-center border-b border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <Minus size={16} />
          </button>
          <button
            type="button"
            aria-label="Fit view"
            title="Fit view"
            onClick={handleFitView}
            className="flex h-10 w-10 items-center justify-center text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <ScanSearch size={16} />
          </button>
        </div>
        {!hideCanvasActions ? (
          <div
            data-export-exclude="true"
            className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_12px_24px_rgba(15,23,42,0.12)]"
          >
            <button
              type="button"
              aria-label="Undo"
              title="Undo"
              onClick={onUndo}
              disabled={!canUndo}
              className="flex h-10 w-10 items-center justify-center border-r border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-white"
            >
              <Undo size={16} />
            </button>
            <button
              type="button"
              aria-label="Redo"
              title="Redo"
              onClick={onRedo}
              disabled={!canRedo}
              className="flex h-10 w-10 items-center justify-center border-r border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-white"
            >
              <Redo size={16} />
            </button>
            <button
              type="button"
              aria-label="Reset workflow"
              title="Reset workflow"
              onClick={onReset}
              className="flex h-10 w-10 items-center justify-center text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        ) : null}
        {!isCompactViewport ? (
          <>
            <button
              data-export-exclude="true"
              type="button"
              aria-label={isMiniMapVisible ? "Hide minimap" : "Show minimap"}
              title={isMiniMapVisible ? "Hide minimap" : "Show minimap"}
              onClick={() => setIsMiniMapVisible((currentState) => !currentState)}
              className={isMiniMapVisible
                ? "absolute bottom-42 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-[0_12px_24px_rgba(15,23,42,0.12)] transition hover:border-slate-300 hover:text-slate-900"
                : "absolute bottom-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-[0_12px_24px_rgba(15,23,42,0.12)] transition hover:border-slate-300 hover:text-slate-900"
              }
            >
              {isMiniMapVisible ? (
                <PictureInPicture size={15} />
              ) : (
                <PictureInPicture2 size={15} />
              )}
            </button>
            {isMiniMapVisible ? (
              <div
                data-export-exclude="true"
                className="absolute bottom-4 right-4 overflow-hidden rounded-[16px]"
                style={{
                  width: miniMapWidth,
                  height: miniMapHeight,
                }}
              >
                <MiniMap
                  position="bottom-right"
                  pannable
                  zoomable
                  nodeColor={getMiniMapNodeColor}
                  maskColor="rgba(226, 232, 240, 0.4)"
                  maskStrokeColor="rgba(59, 130, 246, 0.55)"
                  maskStrokeWidth={2}
                  style={{
                    width: miniMapWidth,
                    height: miniMapHeight,
                    marginRight: 0,
                    marginBottom: 0,
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 16,
                    overflow: "hidden",
                    boxShadow: "0 12px 24px rgba(15,23,42,0.12)",
                  }}
                  nodeStrokeColor="#ffffff"
                  nodeBorderRadius={6}
                  nodeStrokeWidth={2}
                  className="workflow-minimap"
                />
                <WorkflowMiniMapGroupsOverlay
                  nodes={nodes}
                  groups={groups}
                  width={miniMapWidth}
                  height={miniMapHeight}
                />
              </div>
            ) : null}
          </>
        ) : null}
      </ReactFlow>
    </div>
  );
}

export { WorkflowCanvas };
export default WorkflowCanvas;
