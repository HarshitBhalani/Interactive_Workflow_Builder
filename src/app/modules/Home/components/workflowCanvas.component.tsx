"use client";

import { useState } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  type Connection,
  type EdgeChange,
  type IsValidConnection,
  type NodeChange,
  type NodeTypes,
  type ReactFlowInstance,
  type XYPosition,
} from "reactflow";
import "reactflow/dist/style.css";
import type {
  WorkflowGraphEdge,
  WorkflowGraphNode,
  WorkflowNodeKind,
} from "../types/workflow.type";
import { WorkflowNode } from "./workflowNode.component";

const nodeTypes: NodeTypes = {
  workflowNode: WorkflowNode,
};

type WorkflowCanvasProps = {
  nodes: WorkflowGraphNode[];
  edges: WorkflowGraphEdge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onNodesDelete: (deletedNodes: WorkflowGraphNode[]) => void;
  onConnect: (connection: Connection) => void;
  isValidConnection: IsValidConnection;
  onDropNode: (kind: WorkflowNodeKind, position: XYPosition) => void;
};

export function WorkflowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onNodesDelete,
  onConnect,
  isValidConnection,
  onDropNode,
}: WorkflowCanvasProps) {
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance<WorkflowGraphNode, WorkflowGraphEdge> | null>(
      null
    );

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
    <div className="h-full w-full" onDragOver={handleDragOver} onDrop={handleDrop}>
      <ReactFlow
        onInit={setReactFlowInstance}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodesDelete={onNodesDelete}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        nodesDraggable
        nodesConnectable
        elementsSelectable
        deleteKeyCode={["Backspace", "Delete"]}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.1}
          color="#cbd5e1"
        />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
