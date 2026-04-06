"use client";

import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  type Connection,
  type EdgeChange,
  type IsValidConnection,
  type NodeChange,
  type NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";
import type {
  WorkflowGraphEdge,
  WorkflowGraphNode,
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
};

export function WorkflowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onNodesDelete,
  onConnect,
  isValidConnection,
}: WorkflowCanvasProps) {

  return (
    <div className="h-full w-full">
      <ReactFlow
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
