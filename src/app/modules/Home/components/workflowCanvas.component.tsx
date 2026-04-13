"use client";

import type { JSX } from "react";
import { useEffect, useState } from "react";
import {
  Minus,
  PictureInPicture,
  PictureInPicture2,
  Plus,
  ScanSearch,
} from "lucide-react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  MiniMap,
  type Connection,
  type IsValidConnection,
  type OnEdgesChange,
  type OnNodesChange,
  type NodeTypes,
  type ReactFlowInstance,
  type XYPosition,
} from "reactflow";
import "reactflow/dist/style.css";
import type {
  WorkflowCanvasNode,
  WorkflowGraphEdge,
  WorkflowNodeKind,
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

export type WorkflowCanvasProps = {
  nodes: WorkflowCanvasNode[];
  edges: WorkflowGraphEdge[];
  onNodesChange:OnNodesChange;
  onEdgesChange:OnEdgesChange;
  onNodesDelete:(deletedNodes: WorkflowCanvasNode[])=>void;
  onConnect: (connection: Connection) => void;
  isValidConnection: IsValidConnection;
  onDropNode: (kind: WorkflowNodeKind, position: XYPosition) => void;
  onCanvasInit?: (
    instance: ReactFlowInstance<WorkflowCanvasNode, WorkflowGraphEdge>
  ) => void;
  viewportResetToken?: number;
};

type Props = WorkflowCanvasProps;

function getMiniMapNodeColor(node: WorkflowCanvasNode): string {
  return workflowNodeAppearanceByKind[node.data.kind]?.minimapColor ?? "#64748b";
}

function WorkflowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onNodesDelete,
  onConnect,
  isValidConnection,
  onDropNode,
  onCanvasInit,
  viewportResetToken = 0,
}: Props): JSX.Element {
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance<WorkflowCanvasNode, WorkflowGraphEdge> | null>(
      null
    );
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const [isMiniMapVisible, setIsMiniMapVisible] = useState(true);
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
    onCanvasInit?.(instance);
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>): void {
    event.preventDefault();

    const draggedNodeKind = event.dataTransfer.getData(
      "application/workflow-node-kind"
    ) as WorkflowNodeKind;

    if (!draggedNodeKind || !reactFlowInstance) {
      return;
    }

    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    onDropNode(draggedNodeKind, position);
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

  return (
    <div
      className="h-full w-full touch-none"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <ReactFlow
        onInit={handleInit}
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
        nodesDraggable
        nodesConnectable
        elementsSelectable
        panOnDrag
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
        <div className="absolute bottom-4 left-4 z-10 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_12px_24px_rgba(15,23,42,0.12)]">
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
        {!isCompactViewport ? (
          <>
            {isMiniMapVisible ? (
              <>
                <button
                  type="button"
                  aria-label="Hide minimap"
                  title="Hide minimap"
                  onClick={() => setIsMiniMapVisible(false)}
                  className="absolute bottom-[156px] right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-[0_12px_24px_rgba(15,23,42,0.12)] transition hover:border-slate-300 hover:text-slate-900"
                >
                  <PictureInPicture size={15} />
                </button>
                <MiniMap
                  position="bottom-right"
                  pannable
                  zoomable
                  nodeColor={getMiniMapNodeColor}
                  maskColor="rgba(226, 232, 240, 0.58)"
                  maskStrokeColor="rgba(59, 130, 246, 0.55)"
                  maskStrokeWidth={2}
                  style={{ width: 192, height: 136, backgroundColor: "#f8fafc" }}
                  nodeStrokeColor="#ffffff"
                  nodeBorderRadius={6}
                  nodeStrokeWidth={2}
                  className="workflow-minimap bottom-4! right-4! rounded-xl!"
                />
              </>
            ) : (
              <button
                type="button"
                aria-label="Show minimap"
                title="Show minimap"
                onClick={() => setIsMiniMapVisible(true)}
                className="absolute bottom-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-[0_12px_24px_rgba(15,23,42,0.12)] transition hover:border-slate-300 hover:text-slate-900"
              >
                <PictureInPicture2 size={15} />
              </button>
            )}
          </>
        ) : null}
      </ReactFlow>
    </div>
  );
}

export { WorkflowCanvas };
export default WorkflowCanvas;
