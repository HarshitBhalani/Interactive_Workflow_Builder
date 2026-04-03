"use client";

import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  applyEdgeChanges,
  applyNodeChanges,
  getConnectedEdges,
  type EdgeChange,
  type NodeChange,
  type NodeTypes,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { workflowPreviewEdges, workflowPreviewNodes } from "../configs/workflowPreview.config";
import { WorkflowNode } from "./workflowNode.component";

const nodeTypes: NodeTypes = {
  workflowNode: WorkflowNode,
};

export function WorkflowCanvas() {
  const [nodes, setNodes] = useNodesState(workflowPreviewNodes);
  const [edges, setEdges] = useEdgesState(workflowPreviewEdges);

  function handleNodesChange(changes: NodeChange[]) {
    setNodes((currentNodes) => applyNodeChanges(changes, currentNodes));
  }

  function handleEdgesChange(changes: EdgeChange[]) {
    setEdges((currentEdges) => applyEdgeChanges(changes, currentEdges));
  }

  function handleNodesDelete(deletedNodes: typeof nodes) {
    setEdges((currentEdges) => {
      const connectedEdges = getConnectedEdges(deletedNodes, currentEdges);

      if (connectedEdges.length === 0) {
        return currentEdges;
      }

      const connectedIds = new Set(connectedEdges.map((edge) => edge.id));

      return currentEdges.filter((edge) => !connectedIds.has(edge.id));
    });
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onNodesDelete={handleNodesDelete}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        nodesDraggable
        nodesConnectable={false}
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
