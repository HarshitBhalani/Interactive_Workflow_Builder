"use client";

import type { JSX } from "react";
import { useEffect, useState } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
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
import { WorkflowEdge } from "./workflowEdge.component";
import { WorkflowNode } from "./workflowNode.component";

const nodeTypes: NodeTypes = {
  workflowNode: WorkflowNode,
};

const edgeTypes = {
  workflowEdge: WorkflowEdge,
};

const minimapNodeColorByKind: Record<WorkflowNodeKind, string> = {
  start: "#10b981",
  action: "#0ea5e9",
  condition: "#f59e0b",
  end: "#64748b",
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
};

type Props = WorkflowCanvasProps;

function getMiniMapNodeColor(node: WorkflowCanvasNode) {
  return minimapNodeColorByKind[node.data.kind] ?? "#64748b";
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
}: Props): JSX.Element {
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance<WorkflowCanvasNode, WorkflowGraphEdge> | null>(
      null
    );
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const canvasEdges = edges.map((edge) => ({
    ...edge,
    type: edge.type ?? "workflowEdge",
  }));

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const syncViewport = (event?: MediaQueryListEvent) => {
      setIsCompactViewport(event?.matches ?? mediaQuery.matches);
    };

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);

    return () => {
      mediaQuery.removeEventListener("change", syncViewport);
    };
  }, []);

  function handleInit(
    instance: ReactFlowInstance<WorkflowCanvasNode, WorkflowGraphEdge>
  ) {
    setReactFlowInstance(instance);
    onCanvasInit?.(instance);
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
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
        {!isCompactViewport ? <Controls showInteractive={false} /> : null}
        {!isCompactViewport ? (
          <MiniMap
            position="bottom-right"
            pannable
            zoomable
            nodeColor={getMiniMapNodeColor}
            maskColor="rgba(15, 23, 42, 0.10)"
            style={{ backgroundColor: "#f8fafc" }}
            nodeStrokeWidth={3}
            className="bottom-4! right-4! h-34! w-48! rounded-2xl! border! border-slate-200! bg-white! shadow-[0_10px_30px_rgba(15,23,42,0.12)]!"
          />
        ) : null}
      </ReactFlow>
    </div>
  );
}

export { WorkflowCanvas };
export default WorkflowCanvas;
